import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../src/theme/colors';

// Mock provider data
const MOCK_PROVIDER = {
  id: 'p1',
  displayName: 'Marie Tresses',
  slug: 'marie-tresses',
  bio: 'Coiffeuse professionnelle avec 8 ans d\'experience. Specialisee en tresses africaines, tissages et soins capillaires.',
  city: 'Kinshasa',
  commune: 'Gombe',
  avgRating: 4.8,
  totalReviews: 24,
  totalBookings: 156,
  isMobile: true,
  mobileRadius: 15,
  services: [
    { id: 's1', name: 'Tresses collees', durationMin: 90, priceMin: 5000, priceMax: 8000, category: 'Coiffure' },
    { id: 's2', name: 'Tissage complet', durationMin: 120, priceMin: 12000, priceMax: 20000, category: 'Coiffure' },
    { id: 's3', name: 'Locs twist', durationMin: 60, priceMin: 4000, priceMax: null, category: 'Coiffure' },
    { id: 's4', name: 'Soin keratine', durationMin: 45, priceMin: 7000, priceMax: null, category: 'Coiffure' },
  ],
  reviews: [
    { id: 'r1', clientName: 'Sophie K.', rating: 5, comment: 'Excellent travail, tres professionnelle !', date: '2026-03-10' },
    { id: 'r2', clientName: 'Grace M.', rating: 4, comment: 'Bon resultat, ponctuelle.', date: '2026-03-05' },
  ],
};

export default function ProviderProfile() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const provider = MOCK_PROVIDER; // TODO: fetch from API
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'portfolio'>('services');

  return (
    <ScrollView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>💇‍♀️</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{provider.displayName}</Text>
            <Text style={styles.location}>📍 {provider.commune}, {provider.city}</Text>
          </View>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingNumber}>{provider.avgRating}</Text>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.reviewCount}>({provider.totalReviews})</Text>
          </View>
        </View>

        {provider.isMobile && (
          <View style={styles.mobileBanner}>
            <Text style={styles.mobileBannerText}>🏠 Se deplace dans un rayon de {provider.mobileRadius} km</Text>
          </View>
        )}

        <Text style={styles.bio}>{provider.bio}</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['services', 'reviews', 'portfolio'] as const).map(t => (
            <Pressable key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'services' ? 'Services' : t === 'reviews' ? 'Avis' : 'Photos'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Services */}
        {activeTab === 'services' && (
          <View style={styles.servicesList}>
            {provider.services.map(service => (
              <Pressable
                key={service.id}
                style={styles.serviceCard}
                onPress={() => router.push({ pathname: '/booking/[providerId]', params: { providerId: provider.id, serviceId: service.id } })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDuration}>{service.durationMin} min</Text>
                </View>
                <View style={styles.servicePriceBox}>
                  <Text style={styles.servicePrice}>
                    {service.priceMin.toLocaleString()}{service.priceMax ? ` - ${service.priceMax.toLocaleString()}` : ''} FC
                  </Text>
                  <Text style={styles.bookBtn}>Reserver →</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <View style={styles.reviewsList}>
            {provider.reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.clientName}</Text>
                  <Text style={styles.reviewStars}>{'⭐'.repeat(review.rating)}</Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Portfolio */}
        {activeTab === 'portfolio' && (
          <View style={styles.portfolioEmpty}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyText}>Photos a venir</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 200, backgroundColor: '#F0ECE8', justifyContent: 'center', alignItems: 'center' },
  heroEmoji: { fontSize: 60 },
  content: { padding: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  location: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingNumber: { fontSize: 18, fontWeight: '700', color: colors.text },
  ratingStar: { fontSize: 16 },
  reviewCount: { fontSize: 13, color: colors.textMuted },
  mobileBanner: {
    backgroundColor: 'rgba(224,122,95,0.08)', padding: 12, borderRadius: 10, marginBottom: 16,
  },
  mobileBannerText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  bio: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: colors.card },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  servicesList: { gap: 10 },
  serviceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  serviceName: { fontSize: 16, fontWeight: '600', color: colors.text },
  serviceDuration: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  servicePriceBox: { alignItems: 'flex-end' },
  servicePrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  bookBtn: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 4 },
  reviewsList: { gap: 12 },
  reviewCard: { backgroundColor: colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewAuthor: { fontSize: 15, fontWeight: '600', color: colors.text },
  reviewStars: { fontSize: 14 },
  reviewComment: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  reviewDate: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  portfolioEmpty: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted },
});
