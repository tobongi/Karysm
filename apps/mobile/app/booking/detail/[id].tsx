import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '../../../src/theme/colors';

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.ref}>TKS-A3B7C2</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Confirme</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestataire</Text>
        <Text style={styles.value}>Marie Tresses</Text>
        <Text style={styles.subvalue}>Coiffure · Gombe, Kinshasa</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service</Text>
        <Text style={styles.value}>Tresses collees</Text>
        <Text style={styles.subvalue}>90 min</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date & Heure</Text>
        <Text style={styles.value}>📅 20 mars 2026 a 14:00</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lieu</Text>
        <Text style={styles.value}>🏠 A domicile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prix</Text>
        <Text style={styles.priceValue}>5 000 FC</Text>
        <Text style={styles.subvalue}>Acompte: 1 500 FC (30%)</Text>
      </View>

      <Pressable style={styles.cancelButton}>
        <Text style={styles.cancelText}>Annuler la reservation</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20 },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, padding: 16, borderRadius: 14, marginBottom: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  ref: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  statusBadge: { backgroundColor: '#10B98120', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  statusText: { fontSize: 13, fontWeight: '600', color: colors.success },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  value: { fontSize: 16, fontWeight: '600', color: colors.text },
  subvalue: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  priceValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
  cancelButton: {
    marginTop: 20, paddingVertical: 14, alignItems: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: colors.error,
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: colors.error },
});
