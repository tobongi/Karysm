import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import IconBook from '@tabler/icons-react-native/dist/esm/icons/IconBook.mjs';
import IconPhoto from '@tabler/icons-react-native/dist/esm/icons/IconPhoto.mjs';
import IconPlus from '@tabler/icons-react-native/dist/esm/icons/IconPlus.mjs';
import { colors } from '../src/theme/colors';
import { showAlert } from '../src/lib/alert';
import CurveHeader from '../src/components/CurveHeader';
import { PressableScale, FadeInStagger } from '../src/components/animations';

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

  const totalEntries = entries.length;
  const currentHairType = entries[0]?.hairType || '—';
  const lastEntryDate = entries[0]?.month || '—';

  return (
    <View style={styles.container}>
      <CurveHeader
        title="Journal Capillaire"
        subtitle="Votre parcours, mois par mois"
        showBack
      />

      {entries.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyState}>
          <IconBook size={56} color={colors.accent} />
          <Text style={styles.emptyTitle}>Commencez votre journal</Text>
          <Text style={styles.emptySubtitle}>
            Prenez une photo de vos cheveux chaque mois pour suivre votre progression
          </Text>
          <PressableScale style={styles.emptyButton} onPress={handleAddEntry}>
            <Text style={styles.emptyButtonText}>Première entrée</Text>
          </PressableScale>
        </View>
      ) : (
        <>
          {/* Stats card */}
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalEntries}</Text>
                <Text style={styles.statLabel}>Entrées</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>Type {currentHairType}</Text>
                <Text style={styles.statLabel}>Cheveux</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{lastEntryDate}</Text>
                <Text style={styles.statLabel}>Dernière</Text>
              </View>
            </View>
          </View>

          {/* Timeline */}
          <ScrollView
            contentContainerStyle={styles.timeline}
            showsVerticalScrollIndicator={false}
          >
            {entries.map((entry, idx) => (
              <FadeInStagger key={entry.id} index={idx} style={styles.entryCardWrapper}>
                <View style={styles.entryCard}>
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
                    {entry.products.map((product, i) => (
                      <View key={i} style={styles.productPill}>
                        <Text style={styles.productPillText}>{product}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </FadeInStagger>
            ))}
            <View style={{ height: 80 }} />
          </ScrollView>

          {/* FAB sticky button */}
          <PressableScale
            style={styles.fab}
            onPress={handleAddEntry}
          >
            <IconPlus size={24} color={colors.white} strokeWidth={2.2} />
            <Text style={styles.fabText}>Nouvelle entrée</Text>
          </PressableScale>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
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

  // Stats card
  statsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  statNumber: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.accent,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },

  // Timeline
  timeline: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Entry card
  entryCardWrapper: {
    marginBottom: 16,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#5A383C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
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
    backgroundColor: colors.terracotta,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  hairTypeBadgeText: {
    color: colors.white,
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
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
  },

  // Products
  productsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  productPill: {
    backgroundColor: colors.primaryGhost,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  productPillText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.primary,
  },

  // FAB button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 100,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  fabText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});
