import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl, Platform, ViewStyle, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import IconScissors from '@tabler/icons-react-native/dist/esm/icons/IconScissors.mjs';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles.mjs';
import IconBrush from '@tabler/icons-react-native/dist/esm/icons/IconBrush.mjs';
import IconHandGrab from '@tabler/icons-react-native/dist/esm/icons/IconHandGrab.mjs';
import IconRazor from '@tabler/icons-react-native/dist/esm/icons/IconRazor.mjs';
import IconDroplet from '@tabler/icons-react-native/dist/esm/icons/IconDroplet.mjs';
import IconMapPin from '@tabler/icons-react-native/dist/esm/icons/IconMapPin.mjs';
import IconArrowRight from '@tabler/icons-react-native/dist/esm/icons/IconArrowRight.mjs';
import IconSearch from '@tabler/icons-react-native/dist/esm/icons/IconSearch.mjs';
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX.mjs';
import IconMap from '@tabler/icons-react-native/dist/esm/icons/IconMap.mjs';
import IconList from '@tabler/icons-react-native/dist/esm/icons/IconList.mjs';
import IconHeart from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
import IconDiamond from '@tabler/icons-react-native/dist/esm/icons/IconDiamond.mjs';
import IconAward from '@tabler/icons-react-native/dist/esm/icons/IconAward.mjs';
import IconBell from '@tabler/icons-react-native/dist/esm/icons/IconBell.mjs';
import IconAdjustments from '@tabler/icons-react-native/dist/esm/icons/IconAdjustments.mjs';
import IconCar from '@tabler/icons-react-native/dist/esm/icons/IconCar.mjs';
import IconSortAscending from '@tabler/icons-react-native/dist/esm/icons/IconSortAscending.mjs';
import IconSortDescending from '@tabler/icons-react-native/dist/esm/icons/IconSortDescending.mjs';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { radius, spacing, screenPadding } from '../../src/theme/spacing';
import { shadows } from '../../src/theme/shadows';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import { getRecentlyViewed, RecentProvider } from '../../src/lib/recently-viewed';
import { SearchBar, CategoryIcon, ProviderCardSkeleton, SectionHeader, SearchFilters } from '../../src/components';
import { PressableScale, FadeInStagger } from '../../src/components/animations';
import MapView from '../../src/components/MapView';

const PLACEHOLDER_IMAGES = [
  require('../../assets/images/providers/provider_1.jpg'),
  require('../../assets/images/providers/provider_2.jpg'),
  require('../../assets/images/providers/provider_3.jpg'),
  require('../../assets/images/providers/provider_4.jpg'),
  require('../../assets/images/providers/provider_5.jpg'),
  require('../../assets/images/providers/provider_6.jpg'),
  require('../../assets/images/providers/provider_7.jpg'),
];

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
  ongles: <IconDiamond size={28} color={colors.terracotta} strokeWidth={1.5} />,
  maquillage: <IconBrush size={28} color={colors.terracotta} strokeWidth={1.5} />,
  soins: <IconHandGrab size={28} color={colors.terracotta} strokeWidth={1.5} />,
  barber: <IconRazor size={28} color={colors.terracotta} strokeWidth={1.5} />,
  spa: <IconDroplet size={28} color={colors.terracotta} strokeWidth={1.5} />,
};

const CATEGORY_ICONS_ACTIVE: Record<string, React.ReactNode> = {
  coiffure: <IconScissors size={28} color={colors.white} strokeWidth={1.5} />,
  ongles: <IconDiamond size={28} color={colors.white} strokeWidth={1.5} />,
  maquillage: <IconBrush size={28} color={colors.white} strokeWidth={1.5} />,
  soins: <IconHandGrab size={28} color={colors.white} strokeWidth={1.5} />,
  barber: <IconRazor size={28} color={colors.white} strokeWidth={1.5} />,
  spa: <IconDroplet size={28} color={colors.white} strokeWidth={1.5} />,
};

const SERVICE_CATEGORIES = [
  { slug: 'coiffure', name: 'Coiffure' },
  { slug: 'ongles', name: 'Ongles' },
  { slug: 'maquillage', name: 'Maquillage' },
  { slug: 'soins', name: 'Soins' },
  { slug: 'barber', name: 'Barbier' },
  { slug: 'spa', name: 'Spa' },
];

const SUBCATEGORIES: Record<string, Array<{ name: string; slug: string }>> = {
  coiffure: [
    { name: 'Tresses', slug: 'tresses' },
    { name: 'Tissage', slug: 'tissage' },
    { name: 'Locks', slug: 'locks' },
    { name: 'Coupe', slug: 'coupe' },
    { name: 'Lissage', slug: 'lissage' },
    { name: 'Soins capillaires', slug: 'soins-capillaires' },
  ],
  ongles: [
    { name: 'Manucure', slug: 'manucure' },
    { name: 'Gel UV', slug: 'gel-uv' },
    { name: 'Extension', slug: 'extension-ongles' },
    { name: 'Nail art', slug: 'nail-art' },
    { name: 'Pédicure', slug: 'pedicure' },
  ],
  maquillage: [
    { name: 'Jour', slug: 'maquillage-jour' },
    { name: 'Soirée', slug: 'maquillage-soiree' },
    { name: 'Mariée', slug: 'maquillage-mariee' },
  ],
  soins: [
    { name: 'Visage', slug: 'soins-visage' },
    { name: 'Corps', slug: 'soins-corps' },
    { name: 'Massage relaxant', slug: 'massage-relaxant' },
    { name: 'Massage drainant', slug: 'massage-drainant' },
    { name: 'Pieds', slug: 'soins-pieds' },
  ],
  barber: [
    { name: 'Coupe homme', slug: 'coupe-homme' },
    { name: 'Barbe', slug: 'barbe' },
    { name: 'Rasage', slug: 'rasage' },
  ],
  spa: [
    { name: 'Hammam', slug: 'hammam' },
    { name: 'Sauna', slug: 'sauna' },
    { name: 'Soin complet', slug: 'soin-complet' },
  ],
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
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedQuartier, setSelectedQuartier] = useState('Matonge');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentProvider[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterIsMobile, setFilterIsMobile] = useState(false);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | null>(null);
  const [filterMaxDistance, setFilterMaxDistance] = useState<number | null>(null);
  const [filterMinRating, setFilterMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('rating');

  // Debounce search input — only update API query after 500ms idle
  useEffect(() => {
    if (!search) { setDebouncedSearch(''); return; }
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      getRecentlyViewed().then(setRecentlyViewed);
    }, [])
  );

  const fetchProviders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      const categoryParam = selectedSubcategory || selectedCategory;
      if (categoryParam) params.set('category', categoryParam);
      params.set('city', 'Kinshasa');
      params.set('sort', sortBy);
      params.set('pageSize', '20');
      if (filterIsMobile) params.set('isMobile', 'true');
      if (filterMaxPrice) params.set('maxPrice', String(filterMaxPrice));
      if (filterMinRating) params.set('minRating', String(filterMinRating));
      if (filterMaxDistance) params.set('radius', String(filterMaxDistance));
      const res: any = await api(`/search?${params.toString()}`);
      setProviders(res.data?.items || []);
    } catch (e) {
      // console.error('Search error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, selectedCategory, selectedSubcategory, sortBy, filterIsMobile, filterMaxPrice, filterMinRating, filterMaxDistance]);

  const isInitialLoad = providers.length === 0 && loading;
  useEffect(() => {
    if (providers.length === 0) setLoading(true);
    fetchProviders();
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

  const activeFilterCount = [filterIsMobile, filterMaxPrice, filterMaxDistance, filterMinRating, sortBy !== 'rating'].filter(Boolean).length;

  const listHeader = (
    <>
      {/* Greeting Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {user?.name ? `Salut, ${user.name.split(' ')[0]}` : 'Salut'} {'\uD83D\uDC4B'}
          </Text>
          <Text style={styles.headerSubtitle}>Kinshasa</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.bellButton}
            onPress={() => router.push('/(tabs)/messages' as any)}
          >
            <IconBell size={22} color={colors.text} strokeWidth={1.8} />
          </Pressable>
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
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Image
          source={PLACEHOLDER_IMAGES[0]}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>NOUVEAU</Text>
          <Text style={styles.heroTitle}>{'Votre beauté,\nsublimée'}</Text>
          <Text style={styles.heroSubtitle}>Trouvez les meilleures prestataires près de chez vous</Text>
        </View>
      </View>

      {/* Scanner strip */}
      <PressableScale onPress={() => router.push('/scan' as any)}>
        <View style={styles.scannerStrip}>
          <Text style={styles.scannerStripIcon}>🔬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.scannerStripTitle}>Scanner un produit</Text>
            <Text style={styles.scannerStripSub}>Ingrédients INCI · Open Beauty Facts</Text>
          </View>
          <Text style={styles.scannerStripArrow}>›</Text>
        </View>
      </PressableScale>

      {/* Mes Favorites — horizontal avatar scroll */}
      {recentlyViewed.length > 0 && (
        <>
          <SectionHeader
            title="Mes Favorites"
            onSeeAll={() => router.push('/favorites' as any)}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: screenPadding.horizontal, gap: 16 }}
            style={{ marginBottom: 8, marginTop: -8 }}
          >
            {recentlyViewed.slice(0, 8).map((item) => (
              <Pressable
                key={item.id}
                style={styles.favoriteAvatarCard}
                onPress={() => router.push(`/provider/${item.slug}`)}
              >
                <View style={styles.favoriteAvatarCircle}>
                  <Text style={styles.favoriteAvatarText}>{item.displayName[0]}</Text>
                </View>
                <Text style={styles.favoriteAvatarName} numberOfLines={1}>{item.displayName.split(' ')[0]}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* Search with smart suggestions */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Prestation, quartier, prestataire..."
        />
        {showSuggestions && (() => {
          const q = search.toLowerCase();
          const matchingQuartiers = q
            ? QUARTIERS.filter(item => item.name.toLowerCase().includes(q))
            : QUARTIERS;
          // Flatten all services for suggestions
          const allServices = SERVICE_CATEGORIES.flatMap(cat =>
            [{ name: cat.name, slug: cat.slug, type: 'category' as const },
             ...(SUBCATEGORIES[cat.slug] || []).map(sub => ({ name: sub.name, slug: sub.slug, type: 'subcategory' as const, parent: cat.slug }))]
          );
          const matchingServices = q
            ? allServices.filter(s => s.name.toLowerCase().includes(q))
            : allServices.filter(s => s.type === 'category');
          const hasResults = matchingQuartiers.length > 0 || matchingServices.length > 0;
          if (!hasResults && q) return null;
          return (
            <Pressable style={styles.suggestions} onPress={() => {}}>
              {/* Service suggestions */}
              {matchingServices.length > 0 && (
                <>
                  <Text style={styles.suggestionsTitle}>Prestations</Text>
                  {matchingServices.slice(0, 5).map((svc) => (
                    <Pressable
                      key={svc.slug}
                      style={styles.suggestionRow}
                      onPress={() => {
                        if (svc.type === 'category') {
                          setSelectedCategory(svc.slug);
                          setSelectedSubcategory(null);
                        } else {
                          setSelectedCategory((svc as any).parent || null);
                          setSelectedSubcategory(svc.slug);
                        }
                        setSearch('');
                        setShowSuggestions(false);
                      }}
                    >
                      <IconScissors size={16} color={colors.primary} strokeWidth={1.5} />
                      <Text style={styles.suggestionText}>{svc.name}</Text>
                      {svc.type === 'subcategory' && (
                        <Text style={styles.suggestionHint}>
                          {SERVICE_CATEGORIES.find(c => c.slug === (svc as any).parent)?.name}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </>
              )}
              {/* Quartier suggestions */}
              {matchingQuartiers.length > 0 && (
                <>
                  <Text style={styles.suggestionsTitle}>Quartiers</Text>
                  {matchingQuartiers.map((item) => (
                    <Pressable
                      key={item.name}
                      style={styles.suggestionRow}
                      onPress={() => {
                        setSelectedQuartier(item.name);
                        setSearch('');
                        setShowSuggestions(false);
                      }}
                    >
                      <IconMapPin size={16} color={colors.textMuted} strokeWidth={1.5} />
                      <Text style={styles.suggestionText}>{item.name}</Text>
                      {selectedQuartier === item.name && (
                        <Text style={styles.suggestionActive}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </>
              )}
            </Pressable>
          );
        })()}
      </View>

      {/* Quick filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {/* Quartier selector (inline) */}
        <PressableScale
          scale={0.95}
          style={[styles.filterChip, styles.filterChipQuartier]}
          onPress={() => {
            const idx = QUARTIERS.findIndex(q => q.name === selectedQuartier);
            const next = QUARTIERS[(idx + 1) % QUARTIERS.length];
            setSelectedQuartier(next.name);
          }}
        >
          <IconMapPin size={13} color={colors.accent} strokeWidth={2} />
          <Text style={[styles.filterChipText, { color: colors.accent, fontFamily: fonts.bodySemiBold }]}>
            {selectedQuartier}
          </Text>
        </PressableScale>

        {/* Se déplace toggle */}
        <PressableScale
          scale={0.95}
          style={[styles.filterChip, filterIsMobile && styles.filterChipActive]}
          onPress={() => setFilterIsMobile(v => !v)}
        >
          <IconCar size={14} color={filterIsMobile ? colors.white : colors.text} strokeWidth={1.8} />
          <Text style={[styles.filterChipText, filterIsMobile && styles.filterChipTextActive]}>
            Se déplace
          </Text>
        </PressableScale>

        {/* Sort toggle */}
        <PressableScale
          scale={0.95}
          style={[styles.filterChip, sortBy.startsWith('price') && styles.filterChipActive]}
          onPress={() => {
            if (sortBy === 'price_asc') setSortBy('price_desc');
            else if (sortBy === 'price_desc') setSortBy('rating');
            else setSortBy('price_asc');
          }}
        >
          {sortBy === 'price_desc'
            ? <IconSortDescending size={14} color={colors.white} strokeWidth={1.8} />
            : <IconSortAscending size={14} color={sortBy === 'price_asc' ? colors.white : colors.text} strokeWidth={1.8} />
          }
          <Text style={[styles.filterChipText, sortBy.startsWith('price') && styles.filterChipTextActive]}>
            {sortBy === 'price_asc' ? 'Prix ↑' : sortBy === 'price_desc' ? 'Prix ↓' : 'Prix'}
          </Text>
        </PressableScale>

        {/* Distance chips */}
        {[3, 5, 10].map(km => (
          <PressableScale
            key={km}
            scale={0.95}
            style={[styles.filterChip, filterMaxDistance === km && styles.filterChipActive]}
            onPress={() => setFilterMaxDistance(v => v === km ? null : km)}
          >
            <Text style={[styles.filterChipText, filterMaxDistance === km && styles.filterChipTextActive]}>
              {km} km
            </Text>
          </PressableScale>
        ))}

        {/* All filters button */}
        <PressableScale
          scale={0.95}
          style={[styles.filterChip, styles.filterChipOutline]}
          onPress={() => setShowFilters(true)}
        >
          <IconAdjustments size={14} color={colors.primary} strokeWidth={1.8} />
          <Text style={[styles.filterChipText, { color: colors.primary }]}>
            Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </PressableScale>
      </ScrollView>

      {/* Section title: Categories */}
      <SectionHeader title="Catégories" />

      {/* Categories — 3x2 grid with Tabler icons */}
      <View style={styles.categoriesGrid}>
        {SERVICE_CATEGORIES.map((cat, catIndex) => {
          const isActive = selectedCategory === cat.slug;
          return (
            <FadeInStagger key={cat.slug} index={catIndex} style={styles.categoryCell}>
              <CategoryIcon
                label={cat.name}
                icon={isActive ? CATEGORY_ICONS_ACTIVE[cat.slug] : CATEGORY_ICONS[cat.slug]}
                isActive={isActive}
                onPress={() => {
                  setSelectedCategory(isActive ? null : cat.slug);
                  setSelectedSubcategory(null);
                }}
              />
            </FadeInStagger>
          );
        })}
      </View>

      {/* Subcategory pills */}
      {selectedCategory && SUBCATEGORIES[selectedCategory] && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subcategoryRow}
          contentContainerStyle={styles.subcategoryContent}
        >
          <Pressable
            style={[styles.subcategoryChip, !selectedSubcategory && styles.subcategoryChipActive]}
            onPress={() => setSelectedSubcategory(null)}
          >
            <Text style={[styles.subcategoryText, !selectedSubcategory && styles.subcategoryTextActive]}>
              Tout
            </Text>
          </Pressable>
          {SUBCATEGORIES[selectedCategory].map((sub) => (
            <Pressable
              key={sub.slug}
              style={[styles.subcategoryChip, selectedSubcategory === sub.slug && styles.subcategoryChipActive]}
              onPress={() => setSelectedSubcategory(selectedSubcategory === sub.slug ? null : sub.slug)}
            >
              <Text style={[styles.subcategoryText, selectedSubcategory === sub.slug && styles.subcategoryTextActive]}>
                {sub.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Inspiration banner */}
      <Pressable
        style={styles.inspirationBanner}
        onPress={() => router.push('/lookbook' as any)}
      >
        <View style={styles.inspirationContent}>
          <Text style={styles.inspirationLabel}>INSPIRATION</Text>
          <Text style={styles.inspirationTitle}>{'Trouvez votre\nprochain look'}</Text>
          <Text style={styles.inspirationCta}>Explorer →</Text>
        </View>
        <View style={styles.inspirationImageGrid}>
          <View style={[styles.inspirationThumb, { backgroundColor: colors.primary }]} />
          <View style={[styles.inspirationThumb, { backgroundColor: colors.accent }]} />
          <View style={[styles.inspirationThumb, { backgroundColor: colors.terracotta }]} />
          <View style={[styles.inspirationThumb, { backgroundColor: colors.primaryLight }]} />
        </View>
      </Pressable>

      {/* Beauty Request CTA */}
      <Pressable
        style={styles.requestBanner}
        onPress={() => router.push('/request/create' as any)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.requestTitle}>Décrivez ce que vous voulez</Text>
          <Text style={styles.requestSubtitle}>Recevez des propositions de prestataires</Text>
        </View>
        <View style={styles.requestArrowWrap}>
          <IconArrowRight size={18} color={colors.white} strokeWidth={2} />
        </View>
      </Pressable>

      {/* Occasion Booking CTA */}
      <Pressable
        style={styles.occasionBanner}
        onPress={() => router.push('/booking/occasion' as any)}
      >
        <Text style={styles.occasionEmoji}>💒</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.occasionTitle}>Un événement à préparer ?</Text>
          <Text style={styles.occasionSubtitle}>Mariage, fête, shooting — planifiez tout en une fois</Text>
        </View>
        <Text style={styles.occasionArrow}>›</Text>
      </Pressable>

      {/* Recently viewed */}
      {recentlyViewed.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vu récemment</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: screenPadding.horizontal, gap: 12 }}
            style={{ marginBottom: 8 }}
          >
            {recentlyViewed.slice(0, 5).map((p) => (
              <Pressable
                key={p.id}
                style={styles.recentCard}
                onPress={() => router.push(`/provider/${p.slug}`)}
              >
                <View style={styles.recentAvatar}>
                  <Text style={styles.recentAvatarText}>{p.displayName[0]}</Text>
                </View>
                <Text style={styles.recentName} numberOfLines={1}>{p.displayName}</Text>
                <Text style={styles.recentRating}>{'\u2605'} {p.avgRating.toFixed(1)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* Section title: Providers */}
      <SectionHeader title="Recommandées" />

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
        {(
          <FlatList
            data={loading ? [] : (viewMode === 'map' ? [] : providers)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={listHeader}
            onScrollBeginDrag={() => setShowSuggestions(false)}
            removeClippedSubviews
            maxToRenderPerBatch={5}
            windowSize={10}
            initialNumToRender={5}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProviders(); }} tintColor={colors.primary} />}
            ListEmptyComponent={
              loading ? (
                <View style={{ paddingHorizontal: screenPadding.horizontal, paddingTop: 8 }}>
                  <ProviderCardSkeleton />
                  <ProviderCardSkeleton />
                  <ProviderCardSkeleton />
                </View>
              ) : viewMode === 'map' ? null : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>Aucun résultat</Text>
                  <Text style={styles.emptySubtitle}>Essayez une autre recherche</Text>
                </View>
              )
            }
            renderItem={({ item, index }) => (
              <FadeInStagger index={index}>
                <PressableScale style={styles.card} onPress={() => router.push(`/provider/${item.slug}`)}>
                  {/* Gallery */}
                  <View style={styles.cardGallery}>
                    <Image
                      source={PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                    {/* TOP PRO badge */}
                    {item.avgRating >= 4.5 && (
                      <View style={styles.topProBadge}>
                        <IconAward size={12} color="#FFFFFF" strokeWidth={2} />
                        <Text style={styles.topProText}>TOP PRO</Text>
                      </View>
                    )}
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
                        <View style={styles.tag}><Text style={styles.tagText}>Se déplace</Text></View>
                      )}
                      {item.minPrice != null && (
                        <View style={styles.tagPrice}><Text style={styles.tagPriceText}>des {formatPrice(item.minPrice, item.currency)}</Text></View>
                      )}
                    </View>
                  </View>
                </PressableScale>
              </FadeInStagger>
            )}
          />
        )}
      </View>

      <SearchFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        initialFilters={{
          minRating: filterMinRating,
          maxPrice: filterMaxPrice,
          maxDistance: filterMaxDistance,
          sortBy,
          isMobile: filterIsMobile,
        }}
        onApply={(filters) => {
          setFilterMinRating(filters.minRating);
          setFilterMaxPrice(filters.maxPrice);
          setFilterMaxDistance(filters.maxDistance);
          setSortBy(filters.sortBy);
          setFilterIsMobile(filters.isMobile);
        }}
      />
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
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Favorites horizontal avatars
  favoriteAvatarCard: {
    alignItems: 'center',
    width: 64,
  } as ViewStyle,
  favoriteAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(91,33,182,0.2)',
  } as ViewStyle,
  favoriteAvatarText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
    fontWeight: '700' as const,
  },
  favoriteAvatarName: {
    fontSize: 11,
    color: colors.text,
    fontFamily: 'Poppins_500Medium',
    marginTop: 6,
    textAlign: 'center' as const,
  },

  // Hero Banner
  heroBanner: {
    marginHorizontal: screenPadding.horizontal,
    marginBottom: spacing.md,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  heroImage: {
    width: '100%' as any,
    height: 180,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(45,27,105,0.55)',
    ...(Platform.OS === 'web'
      ? { background: 'linear-gradient(to top, rgba(45,27,105,0.75) 0%, rgba(45,27,105,0.35) 50%, transparent 100%)' } as any
      : {}),
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
    fontWeight: '600',
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: colors.white,
    letterSpacing: -0.5,
    fontWeight: '700',
    lineHeight: 30,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },

  // Scanner strip
  scannerStrip: {
    marginHorizontal: screenPadding.horizontal,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scannerStripIcon: { fontSize: 22 },
  scannerStripTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.accent },
  scannerStripSub: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 1 },
  scannerStripArrow: { fontSize: 20, color: colors.textMuted },

  // Search
  searchContainer: {
    paddingHorizontal: screenPadding.horizontal,
    marginTop: 8,
    zIndex: 10,
  },
  suggestions: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
    paddingVertical: 8,
    ...({ boxShadow: '0 4px 16px rgba(167,115,102,0.12)' } as any),
  },
  suggestionsTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 14,
    paddingVertical: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  suggestionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  suggestionActive: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
  suggestionHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },

  // Quick filter bar
  filterBar: {
    marginTop: spacing.sm,
    maxWidth: '100%',
    overflow: 'hidden' as any,
  },
  filterBarContent: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipOutline: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139,105,82,0.06)',
  },
  filterChipQuartier: {
    borderColor: 'rgba(91,33,182,0.2)',
    backgroundColor: 'rgba(91,33,182,0.06)',
  },
  filterChipText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenPadding.horizontal,
    marginTop: 28,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  seeAll: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
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
    marginBottom: 8,
  },

  // Subcategory pills
  subcategoryRow: {
    marginTop: 4,
    marginBottom: spacing.sm,
    maxWidth: '100%',
    overflow: 'hidden' as any,
  },
  subcategoryContent: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 8,
    flexWrap: 'nowrap' as any,
  },
  subcategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subcategoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subcategoryText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
  },
  subcategoryTextActive: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
  },

  // Request banner
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: screenPadding.horizontal,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: 20,
    backgroundColor: colors.accent,
    borderRadius: 28,
  } as ViewStyle,
  requestTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  requestSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
    opacity: 0.8,
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

  // Occasion banner
  occasionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: screenPadding.horizontal,
    marginTop: 10,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.15)',
  } as ViewStyle,
  occasionEmoji: {
    fontSize: 28,
  },
  occasionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  occasionSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  occasionArrow: {
    fontSize: 22,
    color: colors.textMuted,
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
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 20px rgba(90,56,60,0.08), 0 1px 4px rgba(90,56,60,0.04)' } as any
      : { shadowColor: '#5F383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 }),
  } as ViewStyle,
  cardGallery: { height: 180, position: 'relative' as const },
  galleryImage: {
    width: '100%' as any,
    height: 180,
  },

  topProBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topProText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
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
    fontSize: 17,
    fontWeight: '600',
    color: colors.accent,
    flex: 1,
    marginRight: spacing.xs,
    letterSpacing: -0.3,
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
    marginTop: 4,
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

  tags: { flexDirection: 'row', marginTop: spacing.sm, gap: 10 },
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

  // Recently viewed
  recentCard: {
    width: 90,
    alignItems: 'center',
    paddingVertical: 8,
  } as ViewStyle,
  recentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  recentAvatarText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
    fontWeight: '700' as const,
  },
  recentName: {
    fontSize: 11,
    color: colors.text,
    fontFamily: 'Poppins_500Medium',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  recentRating: {
    fontSize: 10,
    color: colors.terracotta,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600' as const,
    marginTop: 2,
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

  // Inspiration banner
  inspirationBanner: {
    flexDirection: 'row',
    marginHorizontal: screenPadding.horizontal,
    marginTop: spacing.sm,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 4px 20px rgba(90,56,60,0.08), 0 1px 4px rgba(90,56,60,0.04)' } as any)
      : { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 }),
  } as ViewStyle,
  inspirationContent: {
    flex: 1,
  },
  inspirationLabel: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: colors.textMuted,
    fontFamily: fonts.body,
    marginBottom: 6,
  },
  inspirationTitle: {
    fontSize: 20,
    fontFamily: fonts.displayBold,
    color: colors.accent,
    lineHeight: 26,
    letterSpacing: -0.5,
    fontWeight: '700',
  },
  inspirationCta: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
    marginTop: 8,
  },
  inspirationImageGrid: {
    width: 80,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignSelf: 'center',
  },
  inspirationThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
});
