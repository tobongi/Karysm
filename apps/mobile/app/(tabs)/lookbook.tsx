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
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { radius, spacing, screenPadding } from '../../src/theme/spacing';
import { shadows } from '../../src/theme/shadows';
import Skeleton from '../../src/components/Skeleton';
import CurveHeader from '../../src/components/CurveHeader';
import { PressableScale, BounceScale } from '../../src/components/animations';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import { imgUrl } from '../../src/lib/image';
import IconHeart from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';

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
        <Skeleton width="100%" height={h} borderRadius={0} style={{ borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md }} />
        <View style={{ padding: spacing.sm }}>
          <Skeleton width="80%" height={12} borderRadius={6} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
            <Skeleton width={20} height={20} borderRadius={10} />
            <Skeleton width="50%" height={11} borderRadius={6} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function LookbookTabScreen() {
  const { user } = useAuth();
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
  const [bounceId, setBounceId] = useState<string | null>(null);

  const fetchFeed = useCallback(
    async (pageNum = 1, append = false) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);
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
        // No more pages if we got fewer than a full page
        setHasMore(newItems.length === 20);
        setPage(pageNum);
      } catch {
        setHasMore(false);
        if (!append) setItems([]);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category]
  );

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
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

  // Pre-populate heart state on mount from DB
  useEffect(() => {
    if (!user) return;
    api('/feed/saved').then((res: any) => {
      const data: FeedItem[] = res.data || [];
      setSavedIds(new Set(data.map((d) => d.id)));
    }).catch(() => {});
  }, [user]);

  const toggleSave = useCallback(async (itemId: string) => {
    if (!user) {
      router.push('/auth/login' as any);
      return;
    }
    // Trigger bounce animation
    setBounceId(itemId);
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
  }, [user]);

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
      const imageHeight = index % 3 === 0 ? 260 : 200;
      const isSaved = savedIds.has(item.id);

      return (
        <View style={styles.cardWrapper}>
          <PressableScale
            style={styles.card}
            onPress={() => router.push(`/provider/${item.provider.slug}` as any)}
          >
            {/* Image container with overlays */}
            <View style={[styles.imageContainer, { height: imageHeight }]}>
              <Image
                source={{ uri: imgUrl(item.imageUrl, 400) || item.imageUrl || '' }}
                style={styles.lookImage}
                resizeMode="cover"
              />

              {/* TOP-LEFT: service tag badge */}
              {item.serviceTag && (
                <View style={styles.serviceTagBadge}>
                  <Text style={styles.serviceTagText}>{item.serviceTag}</Text>
                </View>
              )}

              {/* TOP-RIGHT: heart save button with bounce */}
              <BounceScale trigger={bounceId === item.id} style={styles.saveButtonWrapper}>
                <Pressable
                  style={styles.saveButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleSave(item.id);
                  }}
                  hitSlop={8}
                >
                  <IconHeart
                    size={16}
                    color={isSaved ? colors.error : colors.white}
                    fill={isSaved ? colors.error : 'none'}
                  />
                </Pressable>
              </BounceScale>

              {/* BOTTOM gradient overlay */}
              <View style={styles.lookInfoGradient} pointerEvents="none" />
            </View>

            {/* Info section below image */}
            <View style={styles.lookInfo}>
              {/* Star rating */}
              <View style={styles.ratingRow}>
                <IconStar size={11} color={colors.star} fill={colors.star} />
                <Text style={styles.ratingText}>
                  {item.provider.avgRating.toFixed(1)}
                </Text>
                <Text style={styles.savedCount}>({item.savedCount})</Text>
              </View>

              {/* Caption / title */}
              {item.caption && (
                <Text style={styles.lookCaption} numberOfLines={2}>
                  {item.caption}
                </Text>
              )}

              {/* Provider row */}
              <View style={styles.lookBottomRow}>
                <View style={styles.lookProviderAvatar}>
                  <Text style={styles.lookProviderInitial}>
                    {item.provider.displayName?.[0] || '?'}
                  </Text>
                </View>
                <Text style={styles.lookProviderName} numberOfLines={1}>
                  {item.provider.displayName}
                </Text>
              </View>

              {/* "Je veux ça" button */}
              <Pressable
                style={styles.wantButton}
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
        </View>
      );
    },
    [savedIds, toggleSave, bounceId]
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
      if (!user) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Connectez-vous pour sauvegarder</Text>
            <Text style={styles.emptySubtitle}>
              Créez un compte pour retrouver vos looks préférés à tout moment
            </Text>
            <Pressable style={styles.emptyCta} onPress={() => router.push('/auth/login' as any)}>
              <Text style={styles.emptyCtaText}>Se connecter</Text>
            </Pressable>
          </View>
        );
      }
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyHeartIcon}>
            <IconHeart size={32} color={colors.accent} stroke={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Aucun look sauvegardé</Text>
          <Text style={styles.emptySubtitle}>
            Touchez le ♥ sur un look pour le retrouver ici
          </Text>
          <Pressable style={styles.emptyCta} onPress={() => setTab('discover')}>
            <Text style={styles.emptyCtaText}>Explorer le feed</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
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
      {/* CurveHeader */}
      <CurveHeader
        title="Inspiration"
        subtitle="Les plus beaux looks à votre image"
        height={160}
      />

      {/* Segment control tab toggle */}
      <View style={styles.segmentContainer}>
        <View style={styles.segmentBackground}>
          <Pressable
            style={[styles.segmentButton, tab === 'discover' && styles.segmentButtonActive]}
            onPress={() => setTab('discover')}
          >
            <Text style={[styles.segmentText, tab === 'discover' && styles.segmentTextActive]}>
              Découvrir
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentButton, tab === 'saved' && styles.segmentButtonActive]}
            onPress={() => setTab('saved')}
          >
            <Text style={[styles.segmentText, tab === 'saved' && styles.segmentTextActive]}>
              Sauvegardés
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Category filter chips — only on discover tab */}
      {tab === 'discover' && (
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
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
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
          removeClippedSubviews
          maxToRenderPerBatch={6}
          windowSize={10}
          initialNumToRender={6}
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

  // Segment control tab toggle
  segmentContainer: {
    paddingHorizontal: screenPadding.horizontal,
    marginBottom: spacing.md,
  },
  segmentBackground: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...(shadows.card as any),
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.full - 4,
  },
  segmentButtonActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.white,
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
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...(shadows.card as any),
  },

  // Image container with overlays
  imageContainer: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },

  // Image fills container
  lookImage: {
    width: '100%',
    height: '100%',
  },

  // TOP-LEFT: service tag badge
  serviceTagBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  serviceTagText: {
    fontSize: 9,
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // TOP-RIGHT: heart save button with bounce wrapper
  saveButtonWrapper: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 3,
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // BOTTOM: gradient overlay for text readability
  lookInfoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(0,0,0,0)',
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.35))',
    } : {}),
  },

  // Info section below image (white card background)
  lookInfo: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    flexDirection: 'column',
  },

  // Star rating row
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 11,
    color: colors.text,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
  },
  savedCount: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },

  lookCaption: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 17,
  },

  lookBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  lookProviderAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookProviderInitial: {
    fontSize: 9,
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

  // "Je veux ça" button — full width at bottom of card
  wantButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 8,
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%' as any,
    marginTop: spacing.xs,
  },
  wantButtonText: {
    fontSize: 12,
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
  },
  emptyHeartIcon: {
    marginBottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
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
