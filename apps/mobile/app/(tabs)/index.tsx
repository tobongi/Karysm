import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';

// Fallback categories if @tokoss/shared is not yet available
const SERVICE_CATEGORIES = [
  { slug: 'coiffure', name: 'Coiffure', icon: '💇' },
  { slug: 'ongles', name: 'Ongles', icon: '💅' },
  { slug: 'maquillage', name: 'Maquillage', icon: '💄' },
  { slug: 'massage', name: 'Massage', icon: '💆' },
  { slug: 'barbier', name: 'Barbier', icon: '✂️' },
  { slug: 'soins', name: 'Soins', icon: '🧴' },
];

// Mock data for now
const MOCK_PROVIDERS = [
  {
    id: '1', slug: 'marie-tresses', displayName: 'Marie Tresses', city: 'Kinshasa', commune: 'Gombe',
    avgRating: 4.8, totalReviews: 24, isMobile: true,
    services: [{ name: 'Tresses collees', priceMin: 5000, durationMin: 90 }],
    distance: 2.3,
  },
  {
    id: '2', slug: 'nails-by-grace', displayName: 'Nails by Grace', city: 'Kinshasa', commune: 'Bandalungwa',
    avgRating: 4.5, totalReviews: 12, isMobile: true,
    services: [{ name: 'Pose gel UV', priceMin: 8000, durationMin: 60 }],
    distance: 4.1,
  },
  {
    id: '3', slug: 'barber-king', displayName: 'Barber King', city: 'Kinshasa', commune: 'Matonge',
    avgRating: 4.9, totalReviews: 56, isMobile: false,
    services: [{ name: 'Coupe homme', priceMin: 3000, durationMin: 30 }],
    distance: 1.8,
  },
  {
    id: '4', slug: 'spa-zen-home', displayName: 'Spa Zen Home', city: 'Kinshasa', commune: 'Gombe',
    avgRating: 4.7, totalReviews: 8, isMobile: true,
    services: [{ name: 'Massage relaxant', priceMin: 15000, durationMin: 60 }],
    distance: 5.6,
  },
];

export default function ExplorerTab() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = MOCK_PROVIDERS.filter(p => {
    if (search && !p.displayName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tokoss</Text>
        <Text style={styles.headerSubtitle}>Kinshasa</Text>
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
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={styles.categoriesContent}>
        {SERVICE_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.slug}
            style={[styles.chip, selectedCategory === cat.slug && styles.chipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
          >
            <Text style={styles.chipEmoji}>{cat.icon}</Text>
            <Text style={[styles.chipText, selectedCategory === cat.slug && styles.chipTextActive]}>{cat.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/provider/${item.slug}`)}
          >
            <View style={styles.cardImage}>
              <Text style={styles.cardImageText}>📷</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.displayName}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingText}>{item.avgRating}</Text>
                </View>
              </View>
              <Text style={styles.cardLocation}>{item.commune}, {item.city} · {item.distance} km</Text>
              {item.services[0] && (
                <View style={styles.cardFooter}>
                  <Text style={styles.serviceName}>{item.services[0].name}</Text>
                  <Text style={styles.servicePrice}>{item.services[0].priceMin.toLocaleString()} FC</Text>
                </View>
              )}
              {item.isMobile && (
                <View style={styles.mobileBadge}>
                  <Text style={styles.mobileBadgeText}>🏠 Se deplace</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.primary },
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
  categories: { marginTop: 16, maxHeight: 50 },
  categoriesContent: { paddingHorizontal: 20, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipEmoji: { fontSize: 14, marginRight: 6 },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.text },
  chipTextActive: { color: colors.white },
  list: { padding: 20, gap: 16, paddingTop: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImage: {
    height: 140,
    backgroundColor: '#F0ECE8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageText: { fontSize: 40 },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 18, fontWeight: '600', color: colors.text },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingStar: { fontSize: 14 },
  ratingText: { fontSize: 14, fontWeight: '600', color: colors.text },
  cardLocation: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  serviceName: { fontSize: 14, color: colors.textSecondary },
  servicePrice: { fontSize: 16, fontWeight: '700', color: colors.primary },
  mobileBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(224,122,95,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  mobileBadgeText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
});
