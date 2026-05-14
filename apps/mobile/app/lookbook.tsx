import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Platform,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';
import { radius, spacing, screenPadding } from '../src/theme/spacing';
import { shadows } from '../src/theme/shadows';
import Skeleton from '../src/components/Skeleton';
import { PressableScale, FadeInStagger, BounceScale, TabCrossfade } from '../src/components/animations';
import { api } from '../src/lib/api';

interface FeedProvider {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  avgRating: number;
  avatar: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
}

interface FeedItem {
  id: string;
  imageUrl: string | null;
  caption: string | null;
  serviceTag: string | null;
  savedCount: number;
  createdAt: string;
  provider: FeedProvider;
}

const CATEGORY_FILTERS = [
  { key: null, label: 'Tout' },
  { key: 'coiffure', label: 'Coiffure' },
  { key: 'ongles', label: 'Ongles' },
  { key: 'maquillage', label: 'Maquillage' },
  { key: 'soins', label: 'Soins' },
  { key: 'barber', label: 'Barber' },
  { key: 'spa', label: 'Spa' },
];

function LookCardSkeleton({ index }: { index: number }) {
  const h = index % 3 === 0 ? 240 : 180;
  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <Skeleton width="100%" height={h} borderRadius={0} style={{ borderTopLeftRadius: 18, borderTopRightRadius: 18 }} />
        <View style={{ padding: 10 }}>
          <Skeleton width="80%" height={12} borderRadius={6} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Skeleton width={22} height={22} borderRadius={11} />
            <Skeleton width="50%" height={11} borderRadius={6} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function LookbookScreen() {
  const [tab, setTab] = useState<'discover' | 'saved'>('discover');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [savedItems, setSavedItems] = useState<FeedItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams();
        if (category) params.set('category', category);
        params.set('page', String(pageNum));
        params.set('pageSize', '20');

        const res: any = await api(`/feed?${params}`);
        const newItems: FeedItem[] = res.data?.items || [];

        if (append) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        setHasMore(newItems.length === 20);
        setPage(pageNum);
      } catch {
        // If API returns 404 (endpoint not deployed yet), show empty state
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category]
  );

  const fetchSaved = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await api('/feed/saved');
      const data: FeedItem[] = res.data || [];
      setSavedItems(data);
      setSavedIds(new Set(data.map((d) => d.id)));
    } catch {
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSave = useCallback(async (itemId: string) => {
    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

    try {
      await api(`/feed/${itemId}/save`, { method: 'POST' });
    } catch {
      // Revert on failure
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
    }
  }, []);

  // Fetch feed when category changes or tab switches to discover
  useEffect(() => {
    if (tab === 'discover') {
      fetchFeed(1, false);
    }
  }, [tab, category, fetchFeed]);

  // Fetch saved when tab switches to saved
  useEffect(() => {
    if (tab === 'saved') {
      fetchSaved();
    }
  }, [tab, fetchSaved]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (tab === 'discover') {
      await fetchFeed(1, false);
    } else {
      await fetchSaved();
    }
    setRefreshing(false);
  }, [tab, fetchFeed, fetchSaved]);

  const onEndReached = useCallback(() => {
    if (tab === 'discover' && hasMore && !loadingMore && !loading) {
      fetchFeed(page + 1, true);
    }
  }, [tab, hasMore, loadingMore, loading, page, fetchFeed]);

  const onCategoryChange = useCallback((key: string | null) => {
    setCategory(key);
    setPage(1);
    setHasMore(true);
  }, []);

  const currentData = tab === 'discover' ? items : savedItems;

  const renderCard = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => {
      const imageHeight = index % 3 === 0 ? 240 : 180;
      const isSaved = savedIds.has(item.id);

      return (
        <FadeInStagger index={index} style={styles.cardWrapper}>
          <PressableScale
            style={styles.card}
            onPress={() => router.push(`/provider/${item.provider.slug}` as any)}
          >
            {/* Image */}
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={[styles.lookImage, { height: imageHeight }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.lookImage, styles.lookPlaceholder, { height: imageHeight }]}>
                <Text style={styles.placeholderEmoji}>📸</Text>
              </View>
            )}

            {/* Save button overlay */}
            <Pressable
              style={styles.saveButton}
              onPress={(e) => {
                e.stopPropagation();
                toggleSave(item.id);
              }}
              hitSlop={8}
            >
              <BounceScale trigger={isSaved}>
                <Text style={styles.saveIcon}>{isSaved ? '🔖' : '☆'}</Text>
              </BounceScale>
            </Pressable>

            {/* Service tag overlay */}
            {item.serviceTag && (
              <View style={styles.serviceTagBadge}>
                <Text style={styles.serviceTagText}>{item.serviceTag}</Text>
              </View>
            )}

            {/* Bottom info */}
            <View style={styles.lookInfo}>
              {item.caption && (
                <Text style={styles.lookCaption} numberOfLines={2}>
                  {item.caption}
                </Text>
              )}
              <View style={styles.lookProviderRow}>
                <View style={styles.lookProviderAvatar}>
                  <Text style={styles.lookProviderInitial}>
                    {item.provider.displayName?.[0] || '?'}
                  </Text>
                </View>
                <Text style={styles.lookProviderName} numberOfLines={1}>
                  {item.provider.displayName}
                </Text>
              </View>
              <Pressable
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: 10,
                  paddingVertical: 7,
                  alignItems: 'center',
                  width: '100%',
                  marginTop: 6,
                }}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(
                    `/request/create?inspiration=${encodeURIComponent(item.caption || '')}&category=${item.serviceTag || ''}` as any
                  );
                }}
              >
                <Text style={styles.wantButtonText}>Je veux ça</Text>
              </Pressable>
            </View>
          </PressableScale>
        </FadeInStagger>
      );
    },
    [savedIds, toggleSave]
  );

  const renderSkeletons = () => (
    <View style={styles.skeletonGrid}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <LookCardSkeleton key={i} index={i} />
      ))}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return renderSkeletons();

    if (tab === 'saved') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔖</Text>
          <Text style={styles.emptyTitle}>Aucun look sauvegardé</Text>
          <Text style={styles.emptySubtitle}>
            Parcourez les réalisations et sauvegardez vos préférés
          </Text>
          <Pressable style={styles.emptyCta} onPress={() => setTab('discover')}>
            <Text style={styles.emptyCtaText}>Découvrir</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>✨</Text>
        <Text style={styles.emptyTitle}>Les réalisations arrivent bientôt</Text>
        <Text style={styles.emptySubtitle}>
          Nos prestataires ajoutent leurs meilleures créations. Revenez vite !
        </Text>
        <Pressable style={styles.emptyCta} onPress={() => router.push('/(tabs)' as any)}>
          <Text style={styles.emptyCtaText}>Explorer les prestataires</Text>
        </Pressable>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  };

  const listHeader = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <IconArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Inspiration</Text>
          <Text style={styles.headerSubtitle}>
            Les réalisations de la communauté
          </Text>
        </View>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabItem, tab === 'discover' && styles.tabItemActive]}
          onPress={() => setTab('discover')}
        >
          <Text style={[styles.tabText, tab === 'discover' && styles.tabTextActive]}>
            Découvrir
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, tab === 'saved' && styles.tabItemActive]}
          onPress={() => setTab('saved')}
        >
          <Text style={[styles.tabText, tab === 'saved' && styles.tabTextActive]}>
            Sauvegardés
          </Text>
        </Pressable>
      </View>

      {/* Category filter chips — only on discover tab */}
      <TabCrossfade active={tab === 'discover'}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          style={styles.filtersScroll}
        >
          {CATEGORY_FILTERS.map((f) => {
            const isActive = category === f.key;
            return (
              <Pressable
                key={f.label}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => onCategoryChange(isActive ? null : f.key)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </TabCrossfade>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.webWrapper}>
        <FlatList
          data={loading ? [] : currentData}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={currentData.length > 0 && !loading ? styles.columnWrapper : undefined}
          ListHeaderComponent={listHeader}
          renderItem={renderCard}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Tab toggle
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: screenPadding.horizontal,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
    color: colors.accent,
  },

  // Filters
  filtersScroll: {
    marginBottom: spacing.md,
  },
  filtersRow: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.white,
    fontWeight: '600',
  },

  // List
  list: {
    paddingHorizontal: screenPadding.horizontal,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },

  // Card wrapper
  cardWrapper: {
    flex: 1,
    maxWidth: '48%' as any,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    ...(shadows.card as any),
  },

  // Image
  lookImage: {
    width: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  lookPlaceholder: {
    backgroundColor: colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },

  // Save button overlay
  saveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveIcon: {
    fontSize: 16,
    color: colors.white,
  },

  // Service tag overlay
  serviceTagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(124,58,237,0.85)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  serviceTagText: {
    fontSize: 9,
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Look info
  lookInfo: {
    padding: 10,
  },
  lookCaption: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  lookProviderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lookProviderAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookProviderInitial: {
    fontSize: 10,
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
  },
  lookProviderName: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    flex: 1,
  },
  lookSocial: {
    fontSize: 12,
  },

  // "Je veux ça" button (now inline in lookInfo, style applied via inline object)
  wantButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 6,
  },
  wantButtonText: {
    fontSize: 9,
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: 24,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyCtaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },

  // Skeleton grid
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  // Footer loader
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
