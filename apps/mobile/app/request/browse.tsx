import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import CurveHeader from '../../src/components/CurveHeader';
import { PressableScale } from '../../src/components/animations';
import IconMapPin from '@tabler/icons-react-native/dist/esm/icons/IconMapPin.mjs';
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import IconClipboardList from '@tabler/icons-react-native/dist/esm/icons/IconClipboardList.mjs';
import IconFlame from '@tabler/icons-react-native/dist/esm/icons/IconFlame.mjs';
import IconCurrencyDollar from '@tabler/icons-react-native/dist/esm/icons/IconCurrencyDollar.mjs';

const CITIES = ['Kinshasa', 'Douala', 'Libreville'];


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
  client?: { name: string; avatar?: string | null };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BrowseRequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BrowseRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCity) params.set('city', selectedCity);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('pageSize', '30');

      const res: any = await api(`/requests?${params.toString()}`);
      setRequests(res.data?.items || []);
    } catch (e) {
      // console.error('Browse requests error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity, selectedCategory]);

  async function fetchCategories() {
    try {
      const res: any = await api('/categories');
      setCategories(res.data || []);
    } catch {}
  }

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  function onRefresh() {
    setRefreshing(true);
    fetchRequests();
  }

  function formatPrice(amount: number | null | undefined, currency?: string): string {
    if (amount == null) return '';
    const symbol = (currency || 'CDF') === 'CDF' ? 'FC' : 'FCFA';
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Flexible';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  }

  function locationLabel(type: string): string {
    switch (type) {
      case 'CLIENT': return 'Chez le client';
      case 'PROVIDER': return 'Chez le pro';
      case 'FLEXIBLE': return 'Flexible';
      default: return type;
    }
  }

  const NEW_WINDOW_HOURS = 6;

  function timeAgo(dateStr: string): string {
    const now = new Date().getTime();
    const then = new Date(dateStr).getTime();
    const diffH = Math.floor((now - then) / 3600000);
    if (diffH < 1) return "à l'instant";
    if (diffH < 24) return `il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'hier';
    return `il y a ${diffD}j`;
  }

  function getCategoryName(catId: string): string {
    const cat = categories.find((c) => c.id === catId);
    return cat?.name || '';
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CurveHeader title="Demandes ouvertes" showBack />
      <View style={styles.webWrapper}>
        {/* City filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <PressableScale
            style={[styles.filterChip, !selectedCity && styles.filterChipActive]}
            onPress={() => setSelectedCity(null)}
          >
            <Text style={[styles.filterText, !selectedCity && styles.filterTextActive]}>Toutes</Text>
          </PressableScale>
          {CITIES.map((c) => (
            <PressableScale
              key={c}
              style={[styles.filterChip, selectedCity === c && styles.filterChipActive]}
              onPress={() => setSelectedCity(selectedCity === c ? null : c)}
            >
              <Text style={[styles.filterText, selectedCity === c && styles.filterTextActive]}>{c}</Text>
            </PressableScale>
          ))}
        </ScrollView>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <PressableScale
            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>Toutes</Text>
          </PressableScale>
          {categories.map((cat) => (
            <PressableScale
              key={cat.id}
              style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              <Text style={[styles.filterText, selectedCategory === cat.id && styles.filterTextActive]}>{cat.name}</Text>
            </PressableScale>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <IconClipboardList size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Aucune demande ouverte</Text>
                <Text style={styles.emptySubtitle}>Revenez bientôt ou changez les filtres</Text>
              </View>
            }
            renderItem={({ item }) => (
              <PressableScale
                style={styles.card}
                onPress={() => router.push(`/request/${item.id}` as any)}
              >
                {/* Top row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTopLeft}>
                    {(() => {
                      const isNew = (Date.now() - new Date(item.createdAt).getTime()) < NEW_WINDOW_HOURS * 3600000;
                      return isNew ? (
                        <View style={styles.newBadge}>
                          <View style={styles.newDot} />
                          <Text style={styles.newText}>NOUVEAU</Text>
                        </View>
                      ) : null;
                    })()}
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>{getCategoryName(item.categoryId)}</Text>
                    </View>
                  </View>
                  <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
                </View>

                {/* Title + description */}
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                ) : null}

                {/* Budget — prominent */}
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Budget</Text>
                  <Text style={styles.budgetValue}>
                    {item.budgetMax > item.budgetMin
                      ? `${formatPrice(item.budgetMin, item.currency)} – ${formatPrice(item.budgetMax, item.currency)}`
                      : formatPrice(item.budgetMin, item.currency)}
                  </Text>
                </View>

                {/* Meta row */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <IconMapPin size={13} color={colors.textMuted} strokeWidth={1.8} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.city} \u00B7 {locationLabel(item.locationType)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <IconCalendar size={13} color={colors.textMuted} strokeWidth={1.8} />
                    <Text style={styles.metaText}>
                      {item.flexibleDate ? 'Flexible' : formatDate(item.preferredDate)}
                    </Text>
                  </View>
                </View>

                {/* Competition meter */}
                {(() => {
                  const comp = (() => {
                    const n = item.proposalCount;
                    if (n === 0) return { label: 'Aucune offre', color: colors.success };
                    if (n <= 2) return { label: `${n} offre${n>1?'s':''}`, color: colors.warning };
                    return { label: `${n} offres \u00B7 comp\u00E9titif`, color: colors.error };
                  })();
                  return (
                    <View style={styles.compRow}>
                      <View style={styles.compChip}>
                        <IconFlame size={12} color={comp.color} strokeWidth={1.8} />
                        <Text style={[styles.compText, { color: comp.color }]}>{comp.label}</Text>
                      </View>
                      <Pressable onPress={() => router.push(`/request/${item.id}` as any)} hitSlop={8}>
                        <Text style={styles.detailsLink}>Voir d\u00E9tails</Text>
                      </Pressable>
                    </View>
                  );
                })()}
              </PressableScale>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  webWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primaryGhost,
    borderColor: colors.primary,
  },
  filterText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  filterTextActive: { color: colors.primary, fontFamily: 'Poppins_700Bold' },
  list: { padding: 16, paddingTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 4 },
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
  categoryChipText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary, letterSpacing: 0.3 },
  timeText: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  cardTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay_700Bold', color: colors.text, lineHeight: 22, marginBottom: 6 },
  cardDescription: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 19, marginBottom: 12 },
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
});
