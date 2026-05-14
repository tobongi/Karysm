import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import IconBook from '@tabler/icons-react-native/dist/esm/icons/IconBook.mjs';
import IconPhoto from '@tabler/icons-react-native/dist/esm/icons/IconPhoto.mjs';
import { colors } from '../src/theme/colors';
import { showAlert } from '../src/lib/alert';

interface JournalEntry {
  id: string;
  month: string;
  image: string | null;
  hairType: string | null;
  style: string;
  notes: string;
  products: string[];
}

const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    month: 'Mars 2026',
    image: null,
    hairType: '4C',
    style: 'Twist Out',
    notes: 'Bonne définition après deep conditioning. Moins de shrinkage ce mois-ci.',
    products: ['Huile de ricin', 'Leave-in conditioner', 'Gel aloe vera'],
  },
  {
    id: '2',
    month: 'Février 2026',
    image: null,
    hairType: '4C',
    style: 'Box Braids',
    notes: 'Protective style pendant 6 semaines. Cheveux bien reposés.',
    products: ['Beurre de karité', 'Spray hydratant'],
  },
  {
    id: '3',
    month: 'Janvier 2026',
    image: null,
    hairType: '4C',
    style: 'Wash & Go',
    notes: "Premier wash & go de l'année. Définition moyenne, besoin de plus d'hydratation.",
    products: ['Gel flaxseed', 'Huile de coco'],
  },
];

export default function HairJournalScreen() {
  const [entries] = useState<JournalEntry[]>(MOCK_ENTRIES);

  const handleAddEntry = () => {
    showAlert(
      'Bientôt disponible !',
      'Vous pourrez ajouter des photos et notes chaque mois pour suivre votre parcours cheveux.',
    );
  };

  const webWrapper = Platform.OS === 'web'
    ? { maxWidth: 480, width: '100%' as any, alignSelf: 'center' as any }
    : {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={[{ flex: 1 }, webWrapper]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Mon journal capillaire</Text>
            <Text style={styles.headerSubtitle}>Suivez votre parcours cheveux</Text>
          </View>
        </View>

        {/* Add entry CTA */}
        <View style={styles.ctaContainer}>
          <Pressable style={styles.addButton} onPress={handleAddEntry}>
            <Text style={styles.addButtonText}>+ Ajouter une entrée</Text>
          </Pressable>
        </View>

        {entries.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyState}>
            <IconBook size={56} color={colors.accent} />
            <Text style={styles.emptyTitle}>Commencez votre journal</Text>
            <Text style={styles.emptySubtitle}>
              Prenez une photo de vos cheveux chaque mois pour suivre votre progression
            </Text>
            <Pressable style={styles.emptyButton} onPress={handleAddEntry}>
              <Text style={styles.emptyButtonText}>Première entrée</Text>
            </Pressable>
          </View>
        ) : (
          /* Timeline */
          <ScrollView
            contentContainerStyle={styles.timeline}
            showsVerticalScrollIndicator={false}
          >
            {entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                {/* Month label */}
                <Text style={styles.monthLabel}>{entry.month.toUpperCase()}</Text>

                {/* Photo placeholder */}
                <View style={styles.imagePlaceholder}>
                  <IconPhoto size={32} color={colors.textMuted} />
                  <Text style={styles.imagePlaceholderText}>Photo à venir</Text>
                </View>

                {/* Badges row */}
                <View style={styles.badgesRow}>
                  <View style={styles.styleBadge}>
                    <Text style={styles.styleBadgeText}>{entry.style}</Text>
                  </View>
                  {entry.hairType && (
                    <View style={styles.hairTypeBadge}>
                      <Text style={styles.hairTypeBadgeText}>Type {entry.hairType}</Text>
                    </View>
                  )}
                </View>

                {/* Notes */}
                <Text style={styles.notes}>{entry.notes}</Text>

                {/* Products */}
                <View style={styles.productsRow}>
                  {entry.products.map((product, idx) => (
                    <View key={idx} style={styles.productPill}>
                      <Text style={styles.productPillText}>{product}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
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
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: colors.accent,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.accent,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  addButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Timeline
  timeline: {
    paddingHorizontal: 20,
  },

  // Entry card
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.08)' },
      default: {
        shadowColor: '#5A383C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 3,
      },
    }) as any,
  },
  monthLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  // Image placeholder
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  imagePlaceholderText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  styleBadge: {
    backgroundColor: colors.accent,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  styleBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  hairTypeBadge: {
    backgroundColor: colors.primaryGhost,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  hairTypeBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Notes
  notes: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    lineHeight: 20,
    marginTop: 2,
  },

  // Products
  productsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  productPill: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  productPillText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.primary,
  },
});
