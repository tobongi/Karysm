import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconScissors, IconSparkles, IconBrush, IconHandGrab, IconRazor, IconDroplet, IconMapPin, IconArrowRight, IconSearch, IconX, IconMap, IconList, IconHeart } from '@tabler/icons-react-native';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { radius, spacing, screenPadding } from '../../src/theme/spacing';
import { shadows } from '../../src/theme/shadows';
import { api } from '../../src/lib/api';
import { SearchBar, CategoryIcon } from '../../src/components';
import MapView from '../../src/components/MapView';

const QUARTIERS = [
  { name: 'Matonge', lat: -4.331, lng: 15.313 },
  { name: 'Bandal', lat: -4.327, lng: 15.296 },
  { name: 'Gombe', lat: -4.310, lng: 15.312 },
  { name: 'Ma Campagne', lat: -4.338, lng: 15.298 },
  { name: 'Kitambo', lat: -4.325, lng: 15.290 },
  { name: 'Limete', lat: -4.329, lng: 15.339 },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  coiffure: <IconScissors size={28} color={colors.terracotta} strokeWidth={1.5} />,
  ongles: <IconSparkles size={28} color={colors.terracotta} strokeWidth={1.5} />,
  maquillage: <IconBrush size={28} color={colors.terracotta} strokeWidth={1.5} />,
  massage: <IconHandGrab size={28} color={colors.terracotta} strokeWidth={1.5} />,
  barber: <IconRazor size={28} color={colors.terracotta} strokeWidth={1.5} />,
  spa: <IconDroplet size={28} color={colors.terracotta} strokeWidth={1.5} />,
};

const CATEGORY_ICONS_ACTIVE: Record<string, React.ReactNode> = {
  coiffure: <IconScissors size={28} color={colors.white} strokeWidth={1.5} />,
  ongles: <IconSparkles size={28} color={colors.white} strokeWidth={1.5} />,
  maquillage: <IconBrush size={28} color={colors.white} strokeWidth={1.5} />,
  massage: <IconHandGrab size={28} color={colors.white} strokeWidth={1.5} />,
  barber: <IconRazor size={28} color={colors.white} strokeWidth={1.5} />,
  spa: <IconDroplet size={28} color={colors.white} strokeWidth={1.5} />,
};

const SERVICE_CATEGORIES = [
  { slug: 'coiffure', name: 'Coiffure' },
  { slug: 'ongles', name: 'Ongles' },
  { slug: 'maquillage', name: 'Maquillage' },
  { slug: 'massage', name: 'Massage' },
  { slug: 'barber', name: 'Barbier' },
  { slug: 'spa', name: 'Spa' },
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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedQuartier, setSelectedQuartier] = useState('Matonge');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const fetchProviders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('city', 'Kinshasa');
      params.set('sort', 'rating');
      params.set('pageSize', '20');
      const res: any = await api(`/search?${params.toString()}`);
      setProviders(res.data?.items || []);
    } catch (e) {
      // console.error('Search error:', e);
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

  const toggleFavorite = useCallback(async (providerId: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
    try {
      await api(`/favorites/${providerId}`, { method: 'POST' });
    } catch (_e) {
      // Revert on error
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (next.has(providerId)) next.delete(providerId);
        else next.add(providerId);
        return next;
      });
    }
  }, []);

  function formatPrice(amount: number, currency: string) {
    const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  const listHeader = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tokoss</Text>
          <Text style={styles.headerSubtitle}>Beauté & bien-être</Text>
        </View>
        <Pressable
          style={styles.viewToggle}
          onPress={() => setViewMode(v => v === 'list' ? 'map' : 'list')}
        >
          {viewMode === 'list' ? (
            <IconMap size={18} color={colors.white} strokeWidth={2} />
          ) : (
            <IconList size={18} color={colors.white} strokeWidth={2} />
          )}
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un service, un pro..."
        />
      </View>

      {/* City selector */}
      <View style={styles.cityRow}>
        {QUARTIERS.map((city) => (
          <Pressable
            key={city.name}
            style={[styles.cityChip, selectedQuartier === city.name && styles.cityChipActive]}
            onPress={() => setSelectedQuartier(city.name)}
          >
            {selectedQuartier === city.name && (
              <IconMapPin size={12} color={colors.white} strokeWidth={2} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.cityText, selectedQuartier === city.name && styles.cityTextActive]}>
              {city.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Section title: Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Catégories</Text>
      </View>

      {/* Categories — 3x2 grid with Tabler icons */}
      <View style={styles.categoriesGrid}>
        {SERVICE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.slug;
          return (
            <View key={cat.slug} style={styles.categoryCell}>
              <CategoryIcon
                label={cat.name}
                icon={isActive ? CATEGORY_ICONS_ACTIVE[cat.slug] : CATEGORY_ICONS[cat.slug]}
                isActive={isActive}
                onPress={() => setSelectedCategory(isActive ? null : cat.slug)}
              />
            </View>
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
        <View style={styles.requestArrowWrap}>
          <IconArrowRight size={18} color={colors.white} strokeWidth={2} />
        </View>
      </Pressable>

      {/* Section title: Providers */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recommandés</Text>
        <Pressable>
          <Text style={styles.seeAll}>Voir tout</Text>
        </Pressable>
      </View>

      {/* Map view inline */}
      {viewMode === 'map' && (
        <View style={styles.mapContainer}>
          {(() => {
            const cityProviders = providers;
            const cityCenter = QUARTIERS.find(c => c.name === selectedQuartier) || QUARTIERS[0];
            return (
              <>
                <MapView
                  pins={cityProviders
                    .map(p => ({
                      id: p.id, slug: p.slug, displayName: p.displayName,
                      lat: (p as any).lat || 0, lng: (p as any).lng || 0,
                      avgRating: p.avgRating || 0,
                    }))
                    .filter(p => p.lat !== 0 && p.lng !== 0)
                  }
                  onPinPress={(slug) => router.push(`/provider/${slug}`)}
                  center={{ lat: cityCenter.lat, lng: cityCenter.lng }}
                />
                <Text style={styles.mapCount}>
                  {cityProviders.length} prestataire{cityProviders.length !== 1 ? 's' : ''} à Kinshasa
                </Text>
              </>
            );
          })()}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.webWrapper}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={viewMode === 'map' ? [] : providers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={listHeader}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProviders(); }} tintColor={colors.primary} />}
            ListEmptyComponent={
              viewMode === 'map' ? null : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>Aucun résultat</Text>
                  <Text style={styles.emptySubtitle}>Essayez une autre recherche</Text>
                </View>
              )
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
                  {/* Favorite heart overlay */}
                  <Pressable
                    style={styles.heartOverlay}
                    onPress={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                    hitSlop={8}
                  >
                    <View style={styles.heartCircle}>
                      <IconHeart
                        size={22}
                        color={favoriteIds.has(item.id) ? colors.primary : colors.white}
                        fill={favoriteIds.has(item.id) ? colors.primary : 'none'}
                        strokeWidth={2}
                      />
                    </View>
                  </Pressable>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.displayName}</Text>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingStar}>{'\u2605'}</Text>
                      <Text style={styles.ratingText}>{(item.avgRating || 0).toFixed(1)}</Text>
                      <Text style={styles.reviewCount}>({item.totalReviews})</Text>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <IconMapPin size={13} color={colors.textSecondary} strokeWidth={1.5} />
                    <Text style={styles.cardLocation}>
                      {item.commune ? `${item.commune}, ` : ''}{item.city}
                      {item.distance != null ? ` · ${item.distance.toFixed(1)} km` : ''}
                    </Text>
                  </View>

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
                      <View style={styles.tag}><Text style={styles.tagText}>Se deplace</Text></View>
                    )}
                    {item.minPrice != null && (
                      <View style={styles.tagPrice}><Text style={styles.tagPriceText}>des {formatPrice(item.minPrice, item.currency)}</Text></View>
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

  // Header
  header: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Search
  searchContainer: {
    paddingHorizontal: screenPadding.horizontal,
  },

  // City selector
  cityRow: {
    flexDirection: 'row',
    paddingHorizontal: screenPadding.horizontal,
    marginTop: spacing.sm,
    gap: 8,
    flexWrap: 'wrap',
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cityText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  cityTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.white,
    fontWeight: '600',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenPadding.horizontal,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
  },
  seeAll: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Categories — 3x2 grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: screenPadding.horizontal,
    marginBottom: spacing.xs,
  },
  categoryCell: {
    width: '33.33%',
    paddingVertical: spacing.xs,
  },

  // Request banner
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: screenPadding.horizontal,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
  } as ViewStyle,
  requestTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  requestSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  requestArrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },

  // List
  list: { paddingHorizontal: screenPadding.horizontal, paddingTop: 0, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.card,
  } as ViewStyle,
  cardGallery: { height: 140, flexDirection: 'row' },
  galleryMain: {
    flex: 2,
    backgroundColor: colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryInitial: {
    fontFamily: fonts.displayBold,
    fontSize: 36,
    fontWeight: '700',
    color: 'rgba(167,115,102,0.3)',
    fontStyle: 'italic',
  },
  gallerySide: { flex: 1, gap: 2 },
  gallerySmall: { flex: 1, backgroundColor: colors.n200 },

  heartOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  heartCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardContent: { padding: spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
    flex: 1,
    marginRight: spacing.xs,
  },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingStar: { fontSize: 13, color: colors.terracotta },
  ratingText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.terracotta,
  },
  reviewCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  cardLocation: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },

  servicesPreview: { marginTop: spacing.sm },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceName: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  servicePrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.terracotta,
  },
  moreServices: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },

  tags: { flexDirection: 'row', marginTop: spacing.sm, gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryGhost,
  },
  tagText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
  tagPrice: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(167,115,102,0.08)',
  },
  tagPriceText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '500',
    color: colors.terracotta,
  },

  // View toggle
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Map
  mapContainer: { flex: 1, paddingHorizontal: screenPadding.horizontal, paddingBottom: screenPadding.horizontal },
  mapCount: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
