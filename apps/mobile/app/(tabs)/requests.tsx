import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Platform, Image,
  RefreshControl, ScrollView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import IconMapPin from '@tabler/icons-react-native/dist/esm/icons/IconMapPin.mjs';
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import IconFlame from '@tabler/icons-react-native/dist/esm/icons/IconFlame.mjs';
import IconClipboardList from '@tabler/icons-react-native/dist/esm/icons/IconClipboardList.mjs';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck.mjs';
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX.mjs';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles.mjs';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';
import Skeleton from '../../src/components/Skeleton';
import { PressableScale, FadeInStagger } from '../../src/components/animations';

const DISMISSED_KEY = 'karysm_requests_dismissed';
const PROPOSED_KEY = 'karysm_requests_proposed';
const QUICK_MESSAGE = 'Bonjour, je suis disponible pour votre demande au budget proposé. À très vite !';
const QUICK_DURATION_MIN = 90;

interface BrowseRequest {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  preferredDate?: string | null;
  flexibleDate: boolean;
  locationType: string;
  city: string;
  status: string;
  proposalCount: number;
  createdAt: string;
  photos?: string[];
  client?: { name: string; avatar?: string | null };
}

interface Category { id: string; name: string; slug: string }
interface ProviderProfile { city?: string }
interface ProviderService { categoryId: string }

const NEW_WINDOW_HOURS = 6;

function fmtPrice(amount: number, currency: string) {
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

function timeAgo(iso: string) {
  const diffH = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (diffH < 1) return "à l'instant";
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'hier';
  return `il y a ${diffD}j`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function locationLabel(t: string) {
  return t === 'CLIENT' ? 'Chez la cliente' : t === 'PROVIDER' ? 'Chez le pro' : 'Flexible';
}

function competition(n: number): { label: string; color: string } {
  if (n === 0) return { label: 'Aucune offre',  color: colors.success };
  if (n <= 2) return { label: `${n} offre${n>1?'s':''}`, color: colors.warning };
  return { label: `${n} offres · compétitif`, color: colors.error };
}

export default function RequestsTab() {
  const [requests, setRequests] = useState<BrowseRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [myCategoryIds, setMyCategoryIds] = useState<Set<string>>(new Set());
  const [myCity, setMyCity] = useState<string | null>(null);
  const [mode, setMode] = useState<'mine' | 'all'>('mine');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [proposedIds, setProposedIds] = useState<Set<string>>(new Set());
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Hydrate dismissed + proposed sets once
  useEffect(() => {
    (async () => {
      try {
        const [dRaw, pRaw] = await Promise.all([
          AsyncStorage.getItem(DISMISSED_KEY),
          AsyncStorage.getItem(PROPOSED_KEY),
        ]);
        if (dRaw) setDismissedIds(new Set(JSON.parse(dRaw)));
        if (pRaw) setProposedIds(new Set(JSON.parse(pRaw)));
      } catch { /* ignore */ }
    })();
  }, []);

  async function persistSet(key: string, set: Set<string>) {
    try { await AsyncStorage.setItem(key, JSON.stringify([...set])); } catch { /* ignore */ }
  }

  const handleRefuser = useCallback((id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      persistSet(DISMISSED_KEY, next);
      return next;
    });
  }, []);

  const handleAccepter = useCallback(async (req: BrowseRequest) => {
    if (submittingId) return;
    setSubmittingId(req.id);
    try {
      await api(`/requests/${req.id}/proposals`, {
        method: 'POST',
        body: JSON.stringify({
          price: req.budgetMax || req.budgetMin,
          message: QUICK_MESSAGE,
          estimatedDuration: QUICK_DURATION_MIN,
        }),
      });
      setProposedIds(prev => {
        const next = new Set(prev);
        next.add(req.id);
        persistSet(PROPOSED_KEY, next);
        return next;
      });
    } catch (e: any) {
      showAlert('Impossible d\'envoyer', e.message || 'Réessayez dans un instant');
    } finally {
      setSubmittingId(null);
    }
  }, [submittingId]);

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, servicesRes, catRes, reqRes] = await Promise.allSettled([
        api('/provider/profile') as Promise<any>,
        api('/provider/services') as Promise<any>,
        api('/categories') as Promise<any>,
        api('/requests?pageSize=30') as Promise<any>,
      ]);
      if (profileRes.status === 'fulfilled') {
        const p: ProviderProfile = profileRes.value?.data ?? profileRes.value;
        setMyCity(p?.city ?? null);
      }
      if (servicesRes.status === 'fulfilled') {
        const services: ProviderService[] = servicesRes.value?.data ?? servicesRes.value ?? [];
        setMyCategoryIds(new Set(services.map(s => s.categoryId).filter(Boolean)));
      }
      if (catRes.status === 'fulfilled') setCategories(catRes.value?.data ?? []);
      if (reqRes.status === 'fulfilled') setRequests(reqRes.value?.data?.items ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const catMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of categories) m[c.id] = c.name;
    return m;
  }, [categories]);

  const activeRequests = useMemo(
    () => requests.filter(r => !dismissedIds.has(r.id)),
    [requests, dismissedIds],
  );

  const matchCount = useMemo(
    () => activeRequests.filter(r => myCategoryIds.has(r.categoryId) && (!myCity || r.city === myCity)).length,
    [activeRequests, myCategoryIds, myCity],
  );

  const visible = useMemo(() => {
    let list = requests.filter(r => !dismissedIds.has(r.id));
    if (mode === 'mine') {
      list = list.filter(r => myCategoryIds.has(r.categoryId) && (!myCity || r.city === myCity));
    } else if (activeCategory) {
      list = list.filter(r => r.categoryId === activeCategory);
    }
    return list;
  }, [requests, mode, activeCategory, myCategoryIds, myCity, dismissedIds]);

  // Categories the provider works in — shown first when "Toutes" is active
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const am = myCategoryIds.has(a.id) ? 0 : 1;
      const bm = myCategoryIds.has(b.id) ? 0 : 1;
      return am - bm;
    });
  }, [categories, myCategoryIds]);

  const renderHeader = () => (
    <View>
      {/* Hero stats */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroNum}>{activeRequests.length}</Text>
          <Text style={styles.heroLabel}>demande{activeRequests.length > 1 ? 's' : ''} ouverte{activeRequests.length > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroRight}>
          <View style={styles.heroMatchRow}>
            <IconSparkles size={14} color={colors.accent} strokeWidth={1.8} />
            <Text style={styles.heroMatchNum}>{matchCount}</Text>
          </View>
          <Text style={styles.heroLabel}>dans tes catégories</Text>
        </View>
      </View>

      {/* Segment toggle */}
      <View style={styles.segment}>
        <PressableScale
          style={[styles.segmentBtn, mode === 'mine' && styles.segmentBtnActive]}
          onPress={() => { setMode('mine'); setActiveCategory(null); }}
        >
          <Text style={[styles.segmentText, mode === 'mine' && styles.segmentTextActive]}>
            Pour moi
          </Text>
        </PressableScale>
        <PressableScale
          style={[styles.segmentBtn, mode === 'all' && styles.segmentBtnActive]}
          onPress={() => setMode('all')}
        >
          <Text style={[styles.segmentText, mode === 'all' && styles.segmentTextActive]}>
            Toutes
          </Text>
        </PressableScale>
      </View>

      {/* Category pills (only in "Toutes" mode) */}
      {mode === 'all' && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          <Pressable
            style={[styles.catChip, !activeCategory && styles.catChipActive]}
            onPress={() => setActiveCategory(null)}
          >
            <Text style={[styles.catText, !activeCategory && styles.catTextActive]}>Toutes</Text>
          </Pressable>
          {sortedCategories.map(cat => {
            const active = activeCategory === cat.id;
            const isMine = myCategoryIds.has(cat.id);
            return (
              <Pressable
                key={cat.id}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setActiveCategory(active ? null : cat.id)}
              >
                {isMine && <View style={styles.catDot} />}
                <Text style={[styles.catText, active && styles.catTextActive]}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.safe}>
        <View style={styles.skeletonHero}>
          <Skeleton width={140} height={36} borderRadius={6} />
          <Skeleton width={120} height={36} borderRadius={6} />
        </View>
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {[1,2,3].map(i => <Skeleton key={i} width="100%" height={160} borderRadius={20} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <FlatList
        data={visible}
        keyExtractor={r => r.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconClipboardList size={56} color={colors.textMuted} strokeWidth={1.4} />
            <Text style={styles.emptyTitle}>
              {mode === 'mine' ? 'Aucune demande pour toi' : 'Aucune demande ouverte'}
            </Text>
            <Text style={styles.emptySub}>
              {mode === 'mine'
                ? 'Aucune demande ouverte dans tes catégories à ' + (myCity ?? 'cette ville') + '. Élargis ta recherche.'
                : 'Les nouvelles demandes apparaîtront ici en temps réel.'}
            </Text>
            {mode === 'mine' && (
              <PressableScale style={styles.emptyCta} onPress={() => setMode('all')}>
                <Text style={styles.emptyCtaText}>Voir toutes les demandes</Text>
              </PressableScale>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const isNew = (Date.now() - new Date(item.createdAt).getTime()) < NEW_WINDOW_HOURS * 3600000;
          const isFit = myCategoryIds.has(item.categoryId);
          const comp = competition(item.proposalCount);
          const date = item.flexibleDate ? 'Flexible' : fmtDate(item.preferredDate);
          const photos = (item.photos ?? []).slice(0, 3);

          return (
            <FadeInStagger index={index}>
              <PressableScale
                style={styles.card}
                onPress={() => router.push(`/request/${item.id}` as any)}
              >
                {/* Top row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTopLeft}>
                    {isNew && (
                      <View style={styles.newBadge}>
                        <View style={styles.newDot} />
                        <Text style={styles.newText}>NOUVEAU</Text>
                      </View>
                    )}
                    <View style={[styles.categoryChip, isFit && styles.categoryChipFit]}>
                      <Text style={[styles.categoryChipText, isFit && styles.categoryChipTextFit]}>
                        {catMap[item.categoryId] ?? 'Beauté'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
                </View>

                {/* Title + description */}
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                ) : null}

                {/* Photos strip */}
                {photos.length > 0 && (
                  <View style={styles.photoRow}>
                    {photos.map((p, i) => (
                      <Image key={i} source={{ uri: p }} style={styles.photoThumb} />
                    ))}
                    {item.photos && item.photos.length > 3 && (
                      <View style={styles.photoMore}>
                        <Text style={styles.photoMoreText}>+{item.photos.length - 3}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Budget — prominent */}
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Budget</Text>
                  <Text style={styles.budgetValue}>
                    {item.budgetMax > item.budgetMin
                      ? `${fmtPrice(item.budgetMin, item.currency)} – ${fmtPrice(item.budgetMax, item.currency)}`
                      : fmtPrice(item.budgetMin, item.currency)}
                  </Text>
                </View>

                {/* Meta row */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <IconMapPin size={13} color={colors.textMuted} strokeWidth={1.8} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.city} · {locationLabel(item.locationType)}
                    </Text>
                  </View>
                  {date && (
                    <View style={styles.metaItem}>
                      <IconCalendar size={13} color={colors.textMuted} strokeWidth={1.8} />
                      <Text style={styles.metaText}>{date}</Text>
                    </View>
                  )}
                </View>

                {/* Competition meter */}
                <View style={styles.compRow}>
                  <View style={styles.compChip}>
                    <IconFlame size={12} color={comp.color} strokeWidth={1.8} />
                    <Text style={[styles.compText, { color: comp.color }]}>{comp.label}</Text>
                  </View>
                  <Pressable onPress={() => router.push(`/request/${item.id}` as any)} hitSlop={8}>
                    <Text style={styles.detailsLink}>Voir détails</Text>
                  </Pressable>
                </View>

                {/* Action row — proposed state OR Refuser/Accepter */}
                {proposedIds.has(item.id) ? (
                  <View style={styles.sentRow}>
                    <View style={styles.sentLeft}>
                      <View style={styles.sentIconCircle}>
                        <IconCheck size={14} color={colors.white} strokeWidth={2.5} />
                      </View>
                      <Text style={styles.sentText}>Proposition envoyée</Text>
                    </View>
                    <Pressable onPress={() => router.push(`/request/${item.id}` as any)} hitSlop={8}>
                      <Text style={styles.sentLink}>Suivi →</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.refuseBtn}
                      onPress={() => handleRefuser(item.id)}
                      disabled={submittingId === item.id}
                    >
                      <IconX size={14} color={colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.refuseText}>Refuser</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.acceptBtn, submittingId === item.id && styles.acceptBtnDisabled]}
                      onPress={() => handleAccepter(item)}
                      disabled={submittingId === item.id}
                    >
                      {submittingId === item.id ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <>
                          <IconCheck size={14} color={colors.white} strokeWidth={2.5} />
                          <Text style={styles.acceptText}>Accepter</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}
              </PressableScale>
            </FadeInStagger>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },

  // Hero stats
  hero: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(90,56,60,0.06)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
    }) as any,
  },
  heroLeft: { flex: 1, alignItems: 'flex-start' },
  heroRight: { flex: 1, alignItems: 'flex-start' },
  heroDivider: { width: 1, backgroundColor: colors.borderLight, marginHorizontal: 12 },
  heroNum: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, lineHeight: 32 },
  heroMatchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMatchNum: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, lineHeight: 32 },
  heroLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 2 },

  // Segment
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.primaryGhost,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  segmentBtnActive: {
    backgroundColor: colors.card,
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
    }) as any,
  },
  segmentText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  segmentTextActive: { color: colors.accent, fontFamily: 'Poppins_700Bold' },

  // Category pills
  catRow: { gap: 8, paddingRight: 8, marginBottom: 14 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  catTextActive: { color: colors.white, fontFamily: 'Poppins_600SemiBold' },
  catDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(90,56,60,0.07)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 3 },
    }) as any,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  newBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,135,90,0.12)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
  },
  newDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  newText: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: colors.success, letterSpacing: 0.5 },
  categoryChip: {
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.n300,
  },
  categoryChipFit: { backgroundColor: 'rgba(91,33,182,0.10)' },
  categoryChipText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary, letterSpacing: 0.3 },
  categoryChipTextFit: { color: colors.accent },
  timeText: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },

  cardTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay_700Bold', color: colors.text, lineHeight: 22, marginBottom: 6 },
  cardDescription: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 19, marginBottom: 12 },

  photoRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  photoThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: colors.n300 },
  photoMore: {
    width: 64, height: 64, borderRadius: 10,
    backgroundColor: colors.primaryGhost,
    alignItems: 'center', justifyContent: 'center',
  },
  photoMoreText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.primary },

  budgetRow: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingTop: 10, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  budgetLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  budgetValue: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.terracotta, letterSpacing: -0.3 },

  metaRow: { gap: 6, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, flexShrink: 1 },

  compRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  compChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  detailsLink: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.primary },

  // Action row (Refuser / Accepter)
  actionRow: { flexDirection: 'row', gap: 8 },
  refuseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: colors.border,
  },
  refuseText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  acceptBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 14,
    backgroundColor: colors.accent,
  },
  acceptBtnDisabled: { opacity: 0.6 },
  acceptText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.white },

  // Proposed state
  sentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: 'rgba(0,135,90,0.08)',
    borderRadius: 14,
  },
  sentLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sentIconCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  sentText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.success },
  sentLink: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.success },

  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay_700Bold', color: colors.text, marginTop: 8 },
  emptySub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  emptyCta: {
    marginTop: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCtaText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.white },

  skeletonHero: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
});
