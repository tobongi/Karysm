import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import IconHeart from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';
import IconMessageCircle from '@tabler/icons-react-native/dist/esm/icons/IconMessageCircle.mjs';
import { colors } from '../../../src/theme/colors';
import { showAlert } from '../../../src/lib/alert';
import { PressableScale } from '../../../src/components/animations';

const MOCK_PRODUCTS = [
  { id: '1', name: 'Huile de Coco Vierge', price: 8500, oldPrice: 12000, rating: 4.8, reviews: 24, category: 'Huiles', provider: 'Mama Beauty', weight: '250 ml', ingredients: 'Huile de coco vierge 100% pure, pressée à froid' },
  { id: '2', name: 'Shea Butter Pure', price: 5000, rating: 4.5, reviews: 18, category: 'Soins', provider: 'Mama Beauty', weight: '200 g', ingredients: 'Beurre de karité brut non raffiné' },
  { id: '3', name: 'Crème Hydratante Karité', price: 15000, rating: 4.9, reviews: 42, category: 'Soins', provider: 'Mama Beauty', weight: '150 ml', ingredients: 'Beurre de karité, huile d\'argan, vitamine E, aloe vera' },
  { id: '4', name: 'Peigne Afro en Bois', price: 3500, rating: 4.3, reviews: 8, category: 'Accessoires', provider: 'Mama Beauty', weight: '80 g', ingredients: 'Bois de santal naturel' },
  { id: '5', name: 'Huile de Ricin Noire', price: 7000, oldPrice: 9000, rating: 4.7, reviews: 31, category: 'Huiles', provider: 'Mama Beauty', weight: '200 ml', ingredients: 'Huile de ricin noire jamaïcaine, vitamine E' },
  { id: '6', name: 'Spray Démêlant Naturel', price: 12000, rating: 4.6, reviews: 15, category: 'Cheveux', provider: 'Mama Beauty', weight: '300 ml', ingredients: 'Eau florale de rose, huile de jojoba, protéines de soie, glycérine végétale' },
];

const DESCRIPTION = "Ce produit naturel a été soigneusement formulé pour sublimer la beauté des peaux et cheveux africains. Fabriqué à partir d'ingrédients biologiques sourcés localement, il nourrit en profondeur, protège et revitalise. Sa texture légère pénètre rapidement sans laisser de résidu gras. Idéal pour un usage quotidien, il convient à tous les types de peau et de cheveux. Testé dermatologiquement et approuvé par nos clientes les plus exigeantes.";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];

  const details = [
    { label: 'Catégorie', value: product.category },
    { label: 'Poids', value: product.weight },
    { label: 'Ingrédients', value: product.ingredients },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero image */}
        <View style={styles.heroImage}>
          <PressableScale style={[styles.circleButton, styles.backButton]} onPress={() => router.back()}>
            <IconArrowLeft size={22} color={colors.accent} />
          </PressableScale>
          <PressableScale style={[styles.circleButton, styles.heartBtn]}>
            <IconHeart size={22} color={colors.accent} fill={colors.accent} />
          </PressableScale>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.providerName}>{product.provider}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <IconStar size={16} color={colors.star} fill={colors.star} />
            <Text style={styles.ratingValue}>{product.rating}</Text>
            <Text style={styles.reviewCount}>({product.reviews} avis)</Text>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.currentPrice}>{product.price.toLocaleString()} FC</Text>
            {product.oldPrice && (
              <Text style={styles.oldPrice}>{product.oldPrice.toLocaleString()} FC</Text>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{DESCRIPTION}</Text>

          {/* Details */}
          <View style={styles.detailsSection}>
            {details.map((d, i) => (
              <View key={i} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Prix</Text>
          <Text style={styles.bottomPrice}>{product.price.toLocaleString()} FC</Text>
        </View>
        <PressableScale
          style={styles.ctaButton}
          onPress={() => showAlert('WhatsApp', `Connectez-vous à WhatsApp pour commander "${product.name}"`)}
        >
          <IconMessageCircle size={18} color={colors.white} />
          <Text style={styles.ctaButtonText}>Commander</Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.n300,
    position: 'relative',
  },
  circleButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    top: 16,
  },
  backButton: {
    left: 16,
  },
  heartBtn: {
    right: 16,
  },
  content: {
    padding: 24,
  },
  productName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: colors.accent,
  },
  providerName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  ratingValue: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.text,
  },
  reviewCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  currentPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: colors.terracotta,
  },
  oldPrice: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  divider: {
    height: 1,
    backgroundColor: colors.n300,
    marginVertical: 20,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: colors.accent,
  },
  descriptionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: 8,
  },
  detailsSection: {
    marginTop: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    flex: 1,
  },
  detailValue: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    flex: 2,
    textAlign: 'right',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomPriceLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  bottomPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.terracotta,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(139,105,82,0.2)' }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }
    ) as any,
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
});
