import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import IconHeart from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
import IconHeartFilled from '@tabler/icons-react-native/dist/esm/icons/IconHeartFilled.mjs';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';
import IconMapPin from '@tabler/icons-react-native/dist/esm/icons/IconMapPin.mjs';
import { colors } from '../src/theme/colors';
import { api } from '../src/lib/api';
import { showAlert, showConfirm } from '../src/lib/alert';
import CurveHeader from '../src/components/CurveHeader';
import Skeleton, { ProviderCardSkeleton } from '../src/components/Skeleton';
import { PressableScale, BounceScale, FadeInStagger } from '../src/components/animations';

interface FavoriteProvider {
  id: string;
  displayName: string;
  slug: string;
  city: string;
  commune: string | null;
  avgRating: number;
  totalReviews: number;
  isMobile: boolean;
  currency: string;
  services: { name: string; priceMin: number }[];
  user: { name: string; avatar: string | null };
  imageUrl?: string;
}

function formatPrice(amount: number, currency: string) {
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

export default function FavoritesScreen() {
  const [providers, setProviders] = useState<FavoriteProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unfavoring, setUnfavoring] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      const res: any = await api('/favorites');
      setProviders(res.data || []);
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de charger les favoris');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  async function handleUnfavorite(providerId: string, name: string) {
    showConfirm('Retirer des favoris', `Retirer ${name} de vos favoris ?`, async () => {
      try {
        setUnfavoring(providerId);
        await api(`/favorites/${providerId}`, { method: 'POST' });
        setProviders((prev) => prev.filter((p) => p.id !== providerId));
      } catch (err: any) {
        showAlert('Erreur', err.message);
      } finally {
        setUnfavoring(null);
      }
    });
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <CurveHeader title="Favoris" showBack />
        <View style={styles.listContent}>
          {[1,2,3].map(i => <ProviderCardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CurveHeader title="Favoris" showBack />
      <FlatList
        data={providers}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFavorites(); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyFull}>
            <IconHeart size={56} color={colors.accent} />
            <Text style={styles.emptyTitle}>Aucun favori pour l'instant</Text>
            <Text style={styles.emptyText}>
              Touchez le ♥ sur le profil d'une prestataire pour l'enregistrer ici
            </Text>
            <PressableScale
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.exploreButtonText}>Explorer</Text>
            </PressableScale>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeInStagger index={index} style={styles.cardWrapper}>
            <PressableScale
              style={styles.card}
              onPress={() => router.push(`/provider/${item.slug}`)}
            >
              {/* Cover image */}
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              ) : (
                <View style={styles.cardImagePlaceholder} />
              )}

              {/* Heart button */}
              <BounceScale trigger={unfavoring === item.id}>
                <PressableScale
                  style={styles.heartBtn}
                  onPress={() => handleUnfavorite(item.id, item.displayName)}
                  hitSlop={12}
                >
                  <IconHeartFilled size={18} color={colors.error} />
                </PressableScale>
              </BounceScale>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={styles.providerName} numberOfLines={2}>
                  {item.displayName}
                </Text>

                <View style={styles.locationRow}>
                  <IconMapPin size={12} color={colors.textMuted} strokeWidth={1.5} />
                  <Text style={styles.location} numberOfLines={1}>
                    {item.commune ? `${item.commune}, ` : ''}{item.city}
                  </Text>
                </View>

                <View style={styles.ratingRow}>
                  <IconStar size={14} color={colors.terracotta} fill={colors.terracotta} />
                  <Text style={styles.rating}>
                    {item.avgRating.toFixed(1)}
                  </Text>
                </View>

                {item.services[0] && (
                  <Text style={styles.price} numberOfLines={1}>
                    dès {formatPrice(item.services[0].priceMin, item.currency)}
                  </Text>
                )}
              </View>
            </PressableScale>
          </FadeInStagger>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: 12, paddingBottom: 40 },
  columnWrapper: { gap: 12 },

  // Empty state
  emptyFull: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.accent, textAlign: 'center', marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  exploreButton: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 22 },
  exploreButtonText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  // Grid card
  cardWrapper: { flex: 1, minWidth: 'auto' },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImage: { width: '100%', height: 160 },
  cardImagePlaceholder: { width: '100%', height: 160, backgroundColor: colors.n300 },

  // Heart button
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Content
  cardContent: { padding: 12, gap: 6 },
  providerName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text, lineHeight: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.terracotta },
  price: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.primary, marginTop: 2 },
});
