import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import IconSearch from '@tabler/icons-react-native/dist/esm/icons/IconSearch.mjs';
import IconHeart from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';
import { colors } from '../../src/theme/colors';
import { PressableScale } from '../../src/components/animations';

const CATEGORIES = ['Tout', 'Soins', 'Cheveux', 'Huiles', 'Accessoires'];

const MOCK_PRODUCTS = [
  { id: '1', name: 'Huile de Coco Vierge', price: 8500, oldPrice: 12000, rating: 4.8, reviews: 24, category: 'Huiles', provider: 'Mama Beauty' },
  { id: '2', name: 'Shea Butter Pure', price: 5000, rating: 4.5, reviews: 18, category: 'Soins', provider: 'Mama Beauty' },
  { id: '3', name: 'Crème Hydratante Karité', price: 15000, rating: 4.9, reviews: 42, category: 'Soins', provider: 'Mama Beauty' },
  { id: '4', name: 'Peigne Afro en Bois', price: 3500, rating: 4.3, reviews: 8, category: 'Accessoires', provider: 'Mama Beauty' },
  { id: '5', name: 'Huile de Ricin Noire', price: 7000, oldPrice: 9000, rating: 4.7, reviews: 31, category: 'Huiles', provider: 'Mama Beauty' },
  { id: '6', name: 'Spray Démêlant Naturel', price: 12000, rating: 4.6, reviews: 15, category: 'Cheveux', provider: 'Mama Beauty' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 20 * 2 - CARD_GAP) / 2;

export default function StoreScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tout');

  const filtered = useMemo(() => {
    let list = MOCK_PRODUCTS;
    if (activeCategory !== 'Tout') {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, search]);

  const renderProduct = ({ item, index }: { item: typeof MOCK_PRODUCTS[0]; index: number }) => (
    <PressableScale
      style={[styles.productCard, index % 2 === 0 ? { marginRight: CARD_GAP } : null]}
      onPress={() => router.push(`/store/product/${item.id}`)}
    >
      {/* Image placeholder */}
      <View style={styles.productImage}>
        <PressableScale style={styles.heartButton}>
          <IconHeart size={20} color={colors.accent} fill={colors.accent} />
        </PressableScale>
      </View>

      {/* Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{item.price.toLocaleString()} FC</Text>
          {item.oldPrice && (
            <Text style={styles.oldPrice}>{item.oldPrice.toLocaleString()} FC</Text>
          )}
        </View>
        <View style={styles.ratingRow}>
          <IconStar size={13} color={colors.star} fill={colors.star} />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewCount}>({item.reviews})</Text>
        </View>
      </View>
    </PressableScale>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} hitSlop={8}>
          <IconArrowLeft size={24} color={colors.accent} />
        </PressableScale>
        <Text style={styles.headerTitle}>Boutique</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <IconSearch size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {CATEGORIES.map((cat) => (
          <PressableScale
            key={cat}
            style={[
              styles.chip,
              activeCategory === cat ? styles.chipActive : styles.chipInactive,
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.chipText,
                activeCategory === cat ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              {cat}
            </Text>
          </PressableScale>
        ))}
      </ScrollView>

      {/* Product grid */}
      <FlatList
        data={filtered}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.accent,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.text,
    marginLeft: 10,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipInactive: {
    backgroundColor: colors.card,
  },
  chipText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.white,
  },
  chipTextInactive: {
    color: colors.textSecondary,
  },
  grid: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
  },
  productImage: {
    height: 150,
    backgroundColor: colors.n300,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'relative',
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 13,
    color: colors.accent,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  productPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: colors.terracotta,
  },
  oldPrice: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  ratingText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.text,
  },
  reviewCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
});
