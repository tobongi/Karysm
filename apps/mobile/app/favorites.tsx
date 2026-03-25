import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';
import { api } from '../src/lib/api';
import { showAlert, showConfirm } from '../src/lib/alert';

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
}

export default function FavoritesScreen() {
  const [providers, setProviders] = useState<FavoriteProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    try {
      const res: any = await api('/favorites');
      setProviders(res.data || []);
    } catch (err: any) {
      console.error('Fetch favorites error:', err);
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
        await api(`/favorites/${providerId}`, { method: 'POST' });
        setProviders((prev) => prev.filter((p) => p.id !== providerId));
      } catch (err: any) {
        showAlert('Erreur', err.message);
      }
    });
  }

  function formatPrice(amount: number, currency: string) {
    const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFavorites(); }} tintColor={colors.primary} />
        }
      >
        <Text style={styles.title}>Favoris</Text>
        <Text style={styles.subtitle}>{providers.length} prestataire{providers.length !== 1 ? 's' : ''}</Text>

        {providers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyTitle}>Aucun favori</Text>
            <Text style={styles.emptyText}>
              Ajoutez des prestataires en favoris pour les retrouver facilement.
            </Text>
            <Pressable style={styles.exploreButton} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.exploreButtonText}>Explorer</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {providers.map((provider) => (
              <Pressable
                key={provider.id}
                style={styles.card}
                onPress={() => router.push(`/provider/${provider.slug}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {provider.displayName[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.providerName}>{provider.displayName}</Text>
                    <Text style={styles.location}>
                      📍 {provider.commune ? `${provider.commune}, ` : ''}{provider.city}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.heartButton}
                    onPress={() => handleUnfavorite(provider.id, provider.displayName)}
                  >
                    <Text style={styles.heartIcon}>❤️</Text>
                  </Pressable>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.rating}>
                    ⭐ {provider.avgRating.toFixed(1)} ({provider.totalReviews})
                  </Text>
                  {provider.services[0] && (
                    <Text style={styles.price}>
                      dès {formatPrice(provider.services[0].priceMin, provider.currency)}
                    </Text>
                  )}
                </View>

                {provider.services.length > 0 && (
                  <Text style={styles.servicesList}>
                    {provider.services.map((s) => s.name).join(' · ')}
                  </Text>
                )}

                {provider.isMobile && (
                  <View style={styles.mobileBadge}>
                    <Text style={styles.mobileBadgeText}>🏠 Se déplace</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },

  title: { fontSize: 24, fontWeight: '700', color: colors.accent },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.accent, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 20 },
  exploreButton: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  exploreButtonText: { color: colors.white, fontSize: 15, fontWeight: '600' },

  // List
  list: { gap: 12 },

  // Card
  card: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryGhost, justifyContent: 'center', alignItems: 'center',
    marginRight: 12, borderWidth: 2, borderColor: colors.primaryBorder,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  providerName: { fontSize: 16, fontWeight: '600', color: colors.accent },
  location: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  heartButton: { padding: 8 },
  heartIcon: { fontSize: 20 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rating: { fontSize: 13, color: colors.textSecondary },
  price: { fontSize: 14, fontWeight: '700', color: colors.terracotta },

  servicesList: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },

  mobileBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.primaryGhost,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  mobileBadgeText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
});
