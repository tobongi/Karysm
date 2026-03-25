import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import MapView from '../../src/components/MapView';

const SERVICE_CATEGORIES = [
  { slug: 'coiffure', name: 'Coiffure', icon: '💇‍♀️' },
  { slug: 'ongles', name: 'Ongles', icon: '💅' },
  { slug: 'maquillage', name: 'Maquillage', icon: '💄' },
  { slug: 'massage', name: 'Massage', icon: '💆‍♀️' },
  { slug: 'barber', name: 'Barbier', icon: '✂️' },
  { slug: 'spa', name: 'Spa', icon: '🧖‍♀️' },
];

const CATEGORY_ICONS: Record<string, string> = {
  'Coiffure': '💇‍♀️',
  'Ongles': '💅',
  'Maquillage': '💄',
  'Massage': '💆‍♀️',
  'Barber': '✂️',
  'Spa': '🧖‍♀️',
};

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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

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

  function onRefresh() {
    setRefreshing(true);
    fetchProviders();
  }

  function formatPrice(amount: number, currency: string) {
    const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  function getCategoryIcon(categoryName: string): string {
    return CATEGORY_ICONS[categoryName] || '✨';
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.webWrapper}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Tokoss</Text>
            <Text style={styles.headerSubtitle}>Beauté & bien-être en Afrique</Text>
          </View>
          <Pressable
            style={styles.viewToggle}
            onPress={() => setViewMode(v => v === 'list' ? 'map' : 'list')}
          >
            <Text style={styles.viewToggleText}>{viewMode === 'list' ? '🗺️' : '📋'}</Text>
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un service ou prestataire..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.categoriesRow}>
          {SERVICE_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.slug}
              style={[styles.chip, selectedCategory === cat.slug && styles.chipActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
            >
              <View style={[styles.chipIconCircle, selectedCategory === cat.slug && styles.chipIconCircleActive]}>
                <Text style={styles.chipEmoji}>{cat.icon}</Text>
              </View>
              <Text style={[styles.chipText, selectedCategory === cat.slug && styles.chipTextActive]}>{cat.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* Beauty Request CTA */}
        <Pressable
          style={styles.requestBanner}
          onPress={() => router.push('/request/create' as any)}
        >
          <View style={styles.requestBannerLeft}>
            <Text style={styles.requestBannerEmoji}>{'\u2728'}</Text>
            <View>
              <Text style={styles.requestBannerTitle}>Décrivez ce que vous voulez</Text>
              <Text style={styles.requestBannerSubtitle}>Recevez des propositions de pros</Text>
            </View>
          </View>
          <Text style={styles.requestBannerArrow}>{'\u203A'}</Text>
        </Pressable>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : viewMode === 'map' ? (
          <View style={styles.mapContainer}>
              <MapView
                pins={providers
                  .filter(p => p.services[0]?.category)
                  .map(p => ({
                    id: p.id,
                    slug: p.slug,
                    displayName: p.displayName,
                    lat: (p as any).lat || 0,
                    lng: (p as any).lng || 0,
                    avgRating: p.avgRating || 0,
                    category: p.services[0]?.category?.name,
                  }))
                  .filter(p => p.lat !== 0 && p.lng !== 0)
                }
                onPinPress={(slug) => router.push(`/provider/${slug}`)}
              />
            <Text style={styles.mapCount}>
              {providers.length} prestataire{providers.length !== 1 ? 's' : ''}
            </Text>
          </View>
        ) : (
          <FlatList
            data={providers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>Aucun résultat</Text>
                <Text style={styles.emptySubtitle}>Essayez une autre recherche ou catégorie</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/provider/${item.slug}`)}
              >
                {/* Mini gallery — 3 placeholder slots for portfolio photos */}
                <View style={styles.cardGallery}>
                  <View style={styles.galleryMain}>
                    <Text style={styles.galleryIcon}>{getCategoryIcon(item.services[0]?.category?.name)}</Text>
                  </View>
                  <View style={styles.gallerySide}>
                    <View style={styles.gallerySmall}>
                      <Text style={styles.gallerySmallIcon}>📸</Text>
                    </View>
                    <View style={styles.gallerySmall}>
                      <Text style={styles.gallerySmallIcon}>📸</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  {/* Row 1: Name + Rating */}
                  <View style={styles.cardRow}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.displayName}</Text>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingStar}>★</Text>
                      <Text style={styles.ratingText}>{(item.avgRating || 0).toFixed(1)}</Text>
                      <Text style={styles.reviewCount}>({item.totalReviews || 0})</Text>
                    </View>
                  </View>

                  {/* Row 2: Location */}
                  <Text style={styles.cardLocation}>
                    📍 {item.commune ? `${item.commune}, ` : ''}{item.city}
                    {item.distance != null ? ` · ${item.distance.toFixed(1)} km` : ''}
                  </Text>

                  {/* Row 3: Services with prices */}
                  <View style={styles.servicesPreview}>
                    {item.services.slice(0, 2).map((svc, i) => (
                      <View key={i} style={styles.serviceRow}>
                        <Text style={styles.serviceName} numberOfLines={1}>{svc.name}</Text>
                        <Text style={styles.servicePrice}>
                          {formatPrice(svc.priceMin, item.currency)}
                        </Text>
                      </View>
                    ))}
                    {item.services.length > 2 && (
                      <Text style={styles.moreServices}>+{item.services.length - 2} autres services</Text>
                    )}
                  </View>

                  {/* Row 4: Badges */}
                  <View style={styles.badges}>
                    {item.isMobile && (
                      <View style={styles.mobileBadge}>
                        <Text style={styles.mobileBadgeText}>🏠 Se déplace</Text>
                      </View>
                    )}
                    {item.minPrice != null && (
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>À partir de {formatPrice(item.minPrice, item.currency)}</Text>
                      </View>
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
  // Constrain width on web for mobile-like experience
  webWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
  },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.accent },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  clearIcon: { fontSize: 16, color: colors.textMuted, padding: 4 },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },
  chip: {
    alignItems: 'center',
    width: '33.33%',
    paddingVertical: 8,
  },
  chipActive: {},
  chipIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F0ECFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  chipIconCircleActive: {
    backgroundColor: colors.primary,
  },
  chipEmoji: { fontSize: 22 },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.text },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  list: { padding: 20, paddingTop: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardGallery: {
    height: 130,
    flexDirection: 'row',
  },
  galleryMain: {
    flex: 2,
    backgroundColor: '#F0ECFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIcon: { fontSize: 36 },
  gallerySide: {
    flex: 1,
    gap: 2,
  },
  gallerySmall: {
    flex: 1,
    backgroundColor: '#E8E0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gallerySmallIcon: { fontSize: 16, opacity: 0.4 },
  cardContent: { padding: 16 },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: { fontSize: 17, fontWeight: '700', color: colors.accent, flex: 1, marginRight: 8 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(224,122,95,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  ratingStar: { fontSize: 13, color: colors.terracotta, marginRight: 3 },
  ratingText: { fontSize: 13, fontWeight: '700', color: colors.terracotta, marginRight: 2 },
  reviewCount: { fontSize: 11, color: colors.textSecondary },
  cardLocation: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
  servicesPreview: { marginTop: 12 },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceName: { fontSize: 14, color: colors.text, flex: 1, marginRight: 12 },
  servicePrice: { fontSize: 14, fontWeight: '700', color: colors.terracotta },
  moreServices: { fontSize: 12, color: colors.primary, marginTop: 6, fontWeight: '500' },
  badges: { flexDirection: 'row', marginTop: 12, flexWrap: 'wrap' },
  mobileBadge: {
    backgroundColor: colors.primaryGhost,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    marginRight: 8,
  },
  mobileBadgeText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  priceBadge: {
    backgroundColor: 'rgba(224,122,95,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  priceBadgeText: { fontSize: 12, color: colors.terracotta, fontWeight: '500' },
  // Request banner
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    backgroundColor: colors.primaryGhost,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  requestBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  requestBannerEmoji: { fontSize: 24, marginRight: 12 },
  requestBannerTitle: { fontSize: 14, fontWeight: '700', color: colors.primary },
  requestBannerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  requestBannerArrow: { fontSize: 24, color: colors.primary, fontWeight: '700' },
  // View toggle
  viewToggle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primaryGhost, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  viewToggleText: { fontSize: 18 },
  // Map
  mapContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  mapCount: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});
