import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, SectionList, FlatList, StyleSheet, RefreshControl, Image, TextInput } from 'react-native';
import IconClock from '@tabler/icons-react-native/dist/esm/icons/IconClock.mjs';
import IconLock from '@tabler/icons-react-native/dist/esm/icons/IconLock.mjs';
import IconCalendarOff from '@tabler/icons-react-native/dist/esm/icons/IconCalendarOff.mjs';
import IconUsersGroup from '@tabler/icons-react-native/dist/esm/icons/IconUsersGroup.mjs';
import IconSearch from '@tabler/icons-react-native/dist/esm/icons/IconSearch.mjs';
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import { showAlert } from '../../src/lib/alert';
import Skeleton from '../../src/components/Skeleton';
import CurveHeader from '../../src/components/CurveHeader';
import { PressableScale, FadeInStagger } from '../../src/components/animations';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  REQUESTED:    { label: 'En attente',   color: colors.warning },
  CONFIRMED:    { label: 'Confirmé',     color: colors.success },
  DEPOSIT_PAID: { label: 'Acompte payé', color: colors.primaryDark },
  IN_PROGRESS:  { label: 'En cours',     color: colors.primary },
  COMPLETED:    { label: 'Terminé',      color: colors.textMuted },
  CANCELLED:    { label: 'Annulé',       color: colors.error },
  NO_SHOW:      { label: 'Absent',       color: colors.error },
  DISPUTED:     { label: 'Litige',       color: colors.error },
};

interface BookingItem {
  id: string;
  ref: string;
  date: string;
  startTime: string;
  status: string;
  agreedPrice: number;
  currency: string;
  service: { name: string };
  provider: { displayName: string; user: { name: string; avatar?: string | null } };
  client: { id?: string; name: string; avatar?: string | null; phone?: string | null };
}

interface ClientAccount {
  id: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  totalBookings: number;
  completed: number;
  upcoming: number;
  totalSpent: number;
  currency: string;
  lastBookingDate: string;
  lastService: string;
  tier: 'VIP' | 'Régulière' | 'Nouvelle';
}

interface BookingSection {
  title: string;
  data: BookingItem[];
}

function getDateGroupLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString('fr-FR', { month: 'short' });
  const year = d.getFullYear();
  const formatted = `${dayNum} ${month} ${year}`;

  if (diffDays === 0) return `Aujourd'hui, ${formatted}`;
  if (diffDays === 1) return `Demain, ${formatted}`;
  if (diffDays === -1) return `Hier, ${formatted}`;
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${formatted}`;
}

export default function BookingsTab() {
  const { user } = useAuth();
  const isProviderUser = user?.role === 'PROVIDER';

  // For providers: 'provider' = aggregated client accounts view, 'client' = their own personal bookings as a client
  const [viewMode, setViewMode] = useState<'client' | 'provider'>('client');
  const [didInitViewMode, setDidInitViewMode] = useState(false);
  useEffect(() => {
    if (!didInitViewMode && isProviderUser) {
      setViewMode('provider');
      setDidInitViewMode(true);
    }
  }, [isProviderUser, didInitViewMode]);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      // Clientes mode: fetch all bookings (no status filter) — needed for aggregation
      const params = viewMode === 'provider'
        ? `role=provider`
        : `status=${tab}`;
      const res: any = await api(`/bookings/mine?${params}`);
      setBookings(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, user, viewMode]);

  useEffect(() => {
    setLoading(true);
    fetchBookings();
  }, [fetchBookings]);

  function onRefresh() {
    setRefreshing(true);
    fetchBookings();
  }

  function formatPrice(amount: number, currency: string) {
    const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  const sections: BookingSection[] = useMemo(() => {
    const groups: Record<string, BookingItem[]> = {};
    for (const b of bookings) {
      const label = getDateGroupLabel(b.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(b);
    }
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [bookings]);

  // Aggregate bookings into client accounts (provider view)
  const clientAccounts: ClientAccount[] = useMemo(() => {
    const byId: Record<string, ClientAccount> = {};
    for (const b of bookings) {
      // Prefer client.id when present (API returns it after redeploy); fall back to name
      const cid = b.client?.id || (b.client?.name ? `name:${b.client.name}` : null);
      if (!cid) continue;
      const isPaidStatus = b.status !== 'CANCELLED' && b.status !== 'NO_SHOW';
      const isUpcoming = ['REQUESTED', 'CONFIRMED', 'DEPOSIT_PAID', 'IN_PROGRESS'].includes(b.status);
      const isCompleted = b.status === 'COMPLETED';
      if (!byId[cid]) {
        byId[cid] = {
          id: cid,
          name: b.client.name,
          avatar: b.client.avatar,
          phone: b.client.phone,
          totalBookings: 0,
          completed: 0,
          upcoming: 0,
          totalSpent: 0,
          currency: b.currency,
          lastBookingDate: b.date,
          lastService: b.service?.name ?? '',
          tier: 'Nouvelle',
        };
      }
      const acc = byId[cid];
      acc.totalBookings++;
      if (isCompleted) acc.completed++;
      if (isUpcoming) acc.upcoming++;
      if (isPaidStatus) acc.totalSpent += b.agreedPrice;
      if (new Date(b.date) > new Date(acc.lastBookingDate)) {
        acc.lastBookingDate = b.date;
        acc.lastService = b.service?.name ?? '';
      }
    }
    const list = Object.values(byId).map(a => ({
      ...a,
      tier: (a.completed >= 5 ? 'VIP' : a.completed >= 2 ? 'Régulière' : 'Nouvelle') as ClientAccount['tier'],
    }));
    // Search filter
    const q = clientSearch.trim().toLowerCase();
    const filtered = q ? list.filter(c => c.name.toLowerCase().includes(q)) : list;
    // Sort: upcoming first, then most recent
    return filtered.sort((a, b) => {
      if (a.upcoming !== b.upcoming) return b.upcoming - a.upcoming;
      return new Date(b.lastBookingDate).getTime() - new Date(a.lastBookingDate).getTime();
    });
  }, [bookings, clientSearch]);

  const TIER_COLOR: Record<ClientAccount['tier'], string> = {
    VIP: colors.accent,
    'Régulière': colors.primary,
    Nouvelle: colors.success,
  };

  function formatRelativeDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const days = Math.round(diffMs / 86400000);
    if (days === 0) return "aujourd'hui";
    if (days === 1) return 'hier';
    if (days > 0 && days < 7) return `il y a ${days}j`;
    if (days < 0 && days > -7) return `dans ${-days}j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <IconLock size={48} color={colors.primary} />
          <Text style={styles.emptyText}>Connectez-vous pour voir vos réservations</Text>
          <Pressable style={styles.loginButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CurveHeader title="Rendez-vous" height={160} />

      {/* ── Role switcher (providers only) ── */}
      {isProviderUser && (
        <View style={styles.modeSwitcher}>
          <PressableScale
            style={[styles.modePill, viewMode === 'provider' && styles.modePillActive]}
            onPress={() => setViewMode('provider')}
          >
            <Text style={[styles.modePillText, viewMode === 'provider' && styles.modePillTextActive]}>
              Mes clientes
            </Text>
          </PressableScale>
          <PressableScale
            style={[styles.modePill, viewMode === 'client' && styles.modePillActive]}
            onPress={() => setViewMode('client')}
          >
            <Text style={[styles.modePillText, viewMode === 'client' && styles.modePillTextActive]}>
              Mes RDV
            </Text>
          </PressableScale>
        </View>
      )}

      {/* ── Upcoming / Past tabs (hidden in clientes mode) ── */}
      {viewMode !== 'provider' && (
        <View style={styles.tabBar}>
          <PressableScale
            style={[styles.tabPill, tab === 'upcoming' && styles.tabPillActive]}
            onPress={() => setTab('upcoming')}
          >
            <Text style={[styles.tabPillText, tab === 'upcoming' && styles.tabPillTextActive]}>À venir</Text>
          </PressableScale>
          <PressableScale
            style={[styles.tabPill, tab === 'past' && styles.tabPillActive]}
            onPress={() => setTab('past')}
          >
            <Text style={[styles.tabPillText, tab === 'past' && styles.tabPillTextActive]}>Passées</Text>
          </PressableScale>
        </View>
      )}

      {/* ── Search bar (clientes mode only) ── */}
      {viewMode === 'provider' && (
        <View style={styles.searchWrap}>
          <IconSearch size={16} color={colors.textMuted} strokeWidth={1.8} />
          <TextInput
            value={clientSearch}
            onChangeText={setClientSearch}
            placeholder="Chercher une cliente..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      )}

      {loading ? (
        <View style={{ padding: 20, gap: 20 }}>
          <Skeleton width={140} height={14} borderRadius={4} />
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Skeleton width={48} height={48} borderRadius={24} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={14} borderRadius={4} />
                <Skeleton width="40%" height={12} borderRadius={4} />
                <Skeleton width="50%" height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ) : viewMode === 'provider' ? (
        clientAccounts.length === 0 ? (
          <View style={styles.empty}>
            <IconUsersGroup size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {clientSearch ? 'Aucune cliente trouvée' : 'Aucune cliente pour l\'instant'}
            </Text>
            {!clientSearch && (
              <Text style={styles.emptySubtext}>
                Vos clientes apparaîtront ici après leur première réservation
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={clientAccounts}
            keyExtractor={c => c.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            renderItem={({ item, index }) => {
              const tierColor = TIER_COLOR[item.tier];
              return (
                <FadeInStagger index={index}>
                  <PressableScale
                    style={styles.clientCard}
                    onPress={() => router.push(`/clients/${encodeURIComponent(item.id)}` as any)}
                  >
                    <View style={styles.clientAvatar}>
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.clientAvatarImg} />
                      ) : (
                        <Text style={styles.clientAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                      )}
                      {item.upcoming > 0 && (
                        <View style={styles.upcomingDot} />
                      )}
                    </View>
                    <View style={styles.clientBody}>
                      <View style={styles.clientNameRow}>
                        <Text style={styles.clientName} numberOfLines={1}>{item.name}</Text>
                        <View style={[styles.tierBadge, { backgroundColor: `${tierColor}1A` }]}>
                          <Text style={[styles.tierBadgeText, { color: tierColor }]}>{item.tier}</Text>
                        </View>
                      </View>
                      <Text style={styles.clientService} numberOfLines={1}>
                        {item.lastService} · {formatRelativeDate(item.lastBookingDate)}
                      </Text>
                      <View style={styles.clientStatsRow}>
                        <Text style={styles.clientStat}>
                          <Text style={styles.clientStatNum}>{item.totalBookings}</Text>
                          {item.totalBookings > 1 ? ' RDV' : ' RDV'}
                        </Text>
                        <Text style={styles.clientStatDot}>·</Text>
                        <Text style={styles.clientStat}>
                          <Text style={styles.clientStatNum}>
                            {item.totalSpent.toLocaleString('fr-FR')}
                          </Text>{' '}
                          {item.currency === 'CDF' ? 'FC' : 'FCFA'}
                        </Text>
                        {item.upcoming > 0 && (
                          <>
                            <Text style={styles.clientStatDot}>·</Text>
                            <Text style={[styles.clientStat, { color: colors.success }]}>
                              {item.upcoming} à venir
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    <IconChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
                  </PressableScale>
                </FadeInStagger>
              );
            }}
          />
        )
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <IconCalendarOff size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            {tab === 'upcoming' ? 'Aucune réservation à venir' : 'Aucune réservation passée'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionDate}>{title}</Text>
          )}
          renderItem={({ item, index, section }) => {
            const status = STATUS_LABELS[item.status] || { label: item.status, color: colors.textMuted };
            const displayName = item.provider?.user?.name || item.provider?.displayName || '?';
            const avatarUri = item.provider?.user?.avatar;
            const initial = displayName.charAt(0).toUpperCase();
            const isLast = index === section.data.length - 1;

            return (
              <FadeInStagger index={index}>
                <PressableScale
                  style={[styles.row, !isLast && styles.rowBorder]}
                  onPress={() => router.push(`/booking/detail/${item.id}`)}
                >
                  <View style={styles.avatar}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{initial}</Text>
                    )}
                  </View>
                  <View style={styles.rowContent}>
                    <View style={styles.rowTop}>
                      <Text style={styles.providerName} numberOfLines={1}>{displayName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: status.color + '1A' }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.serviceName} numberOfLines={1}>{item.service?.name}</Text>
                    <View style={styles.rowBottom}>
                      <View style={styles.timeRow}>
                        <IconClock size={13} color={colors.textMuted} strokeWidth={1.8} />
                        <Text style={styles.timeText}>{item.startTime}</Text>
                      </View>
                      <Text style={styles.priceText}>{formatPrice(item.agreedPrice, item.currency)}</Text>
                    </View>
                  </View>
                </PressableScale>
              </FadeInStagger>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Mode switcher (provider toggle)
  modeSwitcher: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 2,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modePillActive: {
    backgroundColor: colors.headerDark,
    borderColor: colors.headerDark,
  },
  modePillText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
  },
  modePillTextActive: {
    color: colors.white,
  },

  // Tab pills
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  tabPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabPillText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabPillTextActive: {
    color: colors.white,
  },

  list: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionDate: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primaryLight,
    borderWidth: 2, borderColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.white },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  rowContent: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  providerName: {
    fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text,
    flex: 1, marginRight: 8,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  statusText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  serviceName: {
    fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginBottom: 4,
  },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  priceText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.terracotta },

  // Search bar (clientes mode)
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    padding: 0,
  },

  // Client account card (clientes mode)
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryGhost,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  clientAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  clientAvatarText: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.primary },
  upcomingDot: {
    position: 'absolute', top: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2, borderColor: colors.card,
  },
  clientBody: { flex: 1, gap: 4 },
  clientNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clientName: { flex: 1, fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tierBadgeText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.3 },
  clientService: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  clientStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  clientStat: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  clientStatNum: { fontFamily: 'Poppins_700Bold', color: colors.text },
  clientStatDot: { fontSize: 11, color: colors.textMuted, marginHorizontal: 2 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: {
    fontSize: 16, fontFamily: 'Poppins_400Regular', color: colors.textMuted,
    textAlign: 'center', paddingHorizontal: 40,
  },
  emptySubtext: {
    fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textMuted,
    textAlign: 'center', paddingHorizontal: 40, marginTop: -4,
  },
  loginButton: {
    marginTop: 16, backgroundColor: colors.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25,
  },
  loginButtonText: { color: colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
});
