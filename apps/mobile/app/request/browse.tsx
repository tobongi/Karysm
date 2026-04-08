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

const CITIES = ['Kinshasa', 'Douala', 'Libreville'];

const CATEGORY_ICONS: Record<string, string> = {
  'Coiffure': '\uD83D\uDC87\u200D\u2640\uFE0F',
  'Ongles': '\uD83D\uDC85',
  'Maquillage': '\uD83D\uDC84',
  'Soins': '\uD83D\uDC86\u200D\u2640\uFE0F',
  'Barber': '\u2702\uFE0F',
  'Spa': '\uD83E\uDDD6\u200D\u2640\uFE0F',
};

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

  function timeAgo(dateStr: string): string {
    const now = new Date().getTime();
    const then = new Date(dateStr).getTime();
    const diffH = Math.floor((now - then) / 3600000);
    if (diffH < 1) return 'Il y a moins d\'1h';
    if (diffH < 24) return `Il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Hier';
    return `Il y a ${diffD}j`;
  }

  function getCategoryName(catId: string): string {
    const cat = categories.find((c) => c.id === catId);
    return cat?.name || '';
  }

  function getCategoryIcon(catId: string): string {
    const name = getCategoryName(catId);
    return CATEGORY_ICONS[name] || '\u2728';
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.webWrapper}>
        {/* City filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, !selectedCity && styles.filterChipActive]}
            onPress={() => setSelectedCity(null)}
          >
            <Text style={[styles.filterText, !selectedCity && styles.filterTextActive]}>Toutes</Text>
          </Pressable>
          {CITIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.filterChip, selectedCity === c && styles.filterChipActive]}
              onPress={() => setSelectedCity(selectedCity === c ? null : c)}
            >
              <Text style={[styles.filterText, selectedCity === c && styles.filterTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>Toutes</Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              <Text style={styles.filterIcon}>{CATEGORY_ICONS[cat.name] || '\u2728'}</Text>
              <Text style={[styles.filterText, selectedCategory === cat.id && styles.filterTextActive]}>{cat.name}</Text>
            </Pressable>
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
                <Text style={styles.emptyEmoji}>{'\uD83D\uDCCB'}</Text>
                <Text style={styles.emptyTitle}>Aucune demande ouverte</Text>
                <Text style={styles.emptySubtitle}>Revenez bientôt ou changez les filtres</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/request/${item.id}` as any)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeIcon}>{getCategoryIcon(item.categoryId)}</Text>
                    <Text style={styles.categoryBadgeText}>{getCategoryName(item.categoryId)}</Text>
                  </View>
                  <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>

                <View style={styles.cardMeta}>
                  <View style={styles.cardMetaItem}>
                    <Text style={styles.cardMetaIcon}>{'\uD83D\uDCB0'}</Text>
                    <Text style={styles.cardMetaText}>
                      {formatPrice(item.budgetMin, item.currency)} — {formatPrice(item.budgetMax, item.currency)}
                    </Text>
                  </View>
                  <View style={styles.cardMetaItem}>
                    <Text style={styles.cardMetaIcon}>{'\uD83D\uDCCD'}</Text>
                    <Text style={styles.cardMetaText}>{item.city}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.cardFooterLeft}>
                    <Text style={styles.cardMetaIcon}>{'\uD83D\uDCC5'}</Text>
                    <Text style={styles.cardFooterText}>
                      {item.flexibleDate ? 'Date flexible' : formatDate(item.preferredDate)}
                    </Text>
                    <Text style={styles.cardDot}>{'\u00B7'}</Text>
                    <Text style={styles.cardFooterText}>{locationLabel(item.locationType)}</Text>
                  </View>
                  <View style={styles.proposalCountBadge}>
                    <Text style={styles.proposalCountText}>
                      {item.proposalCount} proposition{item.proposalCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </Pressable>
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
  filterIcon: { fontSize: 14, marginRight: 4 },
  filterText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  filterTextActive: { color: colors.primary, fontFamily: 'Poppins_700Bold' },
  list: { padding: 16, paddingTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 4 },
  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryGhost,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryBadgeIcon: { fontSize: 12, marginRight: 4 },
  categoryBadgeText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  cardTime: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  cardTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 4 },
  cardDescription: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center' },
  cardMetaIcon: { fontSize: 13, marginRight: 4 },
  cardMetaText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardFooterLeft: { flexDirection: 'row', alignItems: 'center' },
  cardFooterText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  cardDot: { fontSize: 12, color: colors.textMuted, marginHorizontal: 6 },
  proposalCountBadge: {
    backgroundColor: colors.primaryGhost,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
  },
  proposalCountText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
});
