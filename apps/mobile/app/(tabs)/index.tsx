import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';

const SERVICE_CATEGORIES = [
  { slug: 'coiffure', name: 'Coiffure', icon: '✂️' },
  { slug: 'ongles', name: 'Ongles', icon: '💅🏿' },
  { slug: 'maquillage', name: 'Maquillage', icon: '💄' },
  { slug: 'massage', name: 'Massage', icon: '🤲🏿' },
  { slug: 'barber', name: 'Barbier', icon: '💈' },
  { slug: 'spa', name: 'Spa', icon: '🧖🏿' },
];

interface ProviderResult {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  commune?: string;
  avgRating: number;
  totalReviews: number;
  isMobile: boolean;
  distance?: number | null;
  minPrice?: number | null;
  currency: string;
  services: Array<{
    name: string;
    priceMin: number;
    priceMax?: number;
    durationMin: number;
    category: { name: string; icon?: string };
  }>;
  user: { name: string; avatar?: string | null };
}

export default function ExplorerTab() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('sort', 'rating');
      params.set('pageSize', '20');
      const res: any = await api(`/search?${params.toString()}`);
      setProviders(res.data?.items || []);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchProviders, search ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [fetchProviders]);

  function formatPrice(amount: number, currency: string) {
    const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.webWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tokoss</Text>
          <Text style={styles.headerSubtitle}>Beauté & bien-être</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>×</Text>
            </Pressable>
          )}
        </View>

        {/* Categories — refined emoji grid 3x2 */}
        <View style={styles.categoriesGrid}>
          {SERVICE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <Pressable
                key={cat.slug}
                style={[styles.categoryCard, isActive && styles.categoryCardActive]}
                onPress={() => setSelectedCategory(isActive ? null : cat.slug)}
              >
                <View style={[styles.categoryIconWrap, isActive && styles.categoryIconWrapActive]}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                </View>
                <Text style={[styles.categoryName, isActive && styles.categoryNameActive]}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Beauty Request CTA */}
        <Pressable
          style={styles.requestBanner}
          onPress={() => router.push('/request/create' as any)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.requestTitle}>Décrivez ce que vous voulez</Text>
            <Text style={styles.requestSubtitle}>Recevez des propositions de professionnelles</Text>
          </View>
          <Text style={styles.requestArrow}>→</Text>
        </Pressable>

        {/* Provider list */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={providers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProviders(); }} tintColor={colors.accent} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Aucun résultat</Text>
                <Text style={styles.emptySubtitle}>Essayez une autre recherche</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => router.push(`/provider/${item.slug}`)}>
                {/* Gallery */}
                <View style={styles.cardGallery}>
                  <View style={styles.galleryMain}>
                    <Text style={styles.galleryInitial}>{item.displayName[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.gallerySide}>
                    <View style={styles.gallerySmall} />
                    <View style={styles.gallerySmall} />
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.displayName}</Text>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingStar}>★</Text>
                      <Text style={styles.ratingText}>{(item.avgRating || 0).toFixed(1)}</Text>
                      <Text style={styles.reviewCount}>({item.totalReviews})</Text>
                    </View>
                  </View>

                  <Text style={styles.cardLocation}>
                    📍 {item.commune ? `${item.commune}, ` : ''}{item.city}
                    {item.distance != null ? ` · ${item.distance.toFixed(1)} km` : ''}
                  </Text>

                  <View style={styles.servicesPreview}>
                    {item.services.slice(0, 2).map((svc, i) => (
                      <View key={i} style={styles.serviceRow}>
                        <Text style={styles.serviceName} numberOfLines={1}>{svc.name}</Text>
                        <Text style={styles.servicePrice}>{formatPrice(svc.priceMin, item.currency)}</Text>
                      </View>
                    ))}
                    {item.services.length > 2 && (
                      <Text style={styles.moreServices}>+{item.services.length - 2} autres</Text>
                    )}
                  </View>

                  <View style={styles.tags}>
                    {item.isMobile && (
                      <View style={styles.tag}><Text style={styles.tagText}>🏠 Se déplace</Text></View>
                    )}
                    {item.minPrice != null && (
                      <View style={styles.tagPrice}><Text style={styles.tagPriceText}>dès {formatPrice(item.minPrice, item.currency)}</Text></View>
                    )}
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
    flex: 1, width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
  },

  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: colors.accent, fontStyle: 'italic', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: colors.textMuted, letterSpacing: 0.5, marginTop: 1 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, marginHorizontal: 20,
    borderRadius: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 18, color: colors.textMuted, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  clearIcon: { fontSize: 20, color: colors.textMuted, padding: 4 },

  // Categories — 3x2 grid with refined emoji
  categoriesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, marginTop: 16, marginBottom: 4,
  },
  categoryCard: {
    width: '33.33%', alignItems: 'center', paddingVertical: 10,
  },
  categoryCardActive: {},
  categoryIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
    marginBottom: 6, borderWidth: 1, borderColor: colors.border,
  },
  categoryIconWrapActive: {
    backgroundColor: colors.accent, borderColor: colors.accent,
  },
  categoryIcon: { fontSize: 22 },
  categoryName: { fontSize: 12, fontWeight: '500', color: colors.text, letterSpacing: 0.2 },
  categoryNameActive: { color: colors.accent, fontWeight: '700' },

  // Request banner
  requestBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 12, marginBottom: 4,
    padding: 16, backgroundColor: colors.white,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 3, borderLeftColor: colors.accent,
  },
  requestTitle: { fontSize: 14, fontWeight: '600', color: colors.accent },
  requestSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  requestArrow: { fontSize: 18, color: colors.accent, fontWeight: '300' },

  // List
  list: { padding: 20, paddingTop: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  // Card
  card: {
    backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border, marginBottom: 14,
  },
  cardGallery: { height: 120, flexDirection: 'row' },
  galleryMain: {
    flex: 2, backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  galleryInitial: { fontSize: 32, fontWeight: '700', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },
  gallerySide: { flex: 1, gap: 1 },
  gallerySmall: { flex: 1, backgroundColor: '#E8E3F0' },

  cardContent: { padding: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '600', color: colors.accent, flex: 1, marginRight: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingStar: { fontSize: 13, color: colors.terracotta },
  ratingText: { fontSize: 14, fontWeight: '700', color: colors.terracotta },
  reviewCount: { fontSize: 11, color: colors.textMuted },

  cardLocation: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  servicesPreview: { marginTop: 12 },
  serviceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  serviceName: { fontSize: 14, color: colors.text, flex: 1, marginRight: 12 },
  servicePrice: { fontSize: 14, fontWeight: '600', color: colors.terracotta },
  moreServices: { fontSize: 12, color: colors.textMuted, marginTop: 6 },

  tags: { flexDirection: 'row', marginTop: 10, gap: 8 },
  tag: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
    borderWidth: 1, borderColor: colors.border,
  },
  tagText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  tagPrice: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(224,122,95,0.2)',
  },
  tagPriceText: { fontSize: 11, color: colors.terracotta, fontWeight: '500' },
});
