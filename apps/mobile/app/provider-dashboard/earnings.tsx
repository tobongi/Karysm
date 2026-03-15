import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../src/theme/colors';

export default function EarningsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde disponible</Text>
        <Text style={styles.balanceAmount}>45 000 FC</Text>
        <Pressable style={styles.payoutButton}>
          <Text style={styles.payoutText}>Retirer via MoMo</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Historique</Text>
      {[
        { label: 'Tresses collees — Sophie K.', amount: '+5 000 FC', date: '15 mars' },
        { label: 'Tissage — Grace M.', amount: '+12 000 FC', date: '13 mars' },
        { label: 'Retrait MoMo', amount: '-30 000 FC', date: '10 mars' },
      ].map((item, i) => (
        <View key={i} style={styles.txRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.txLabel}>{item.label}</Text>
            <Text style={styles.txDate}>{item.date}</Text>
          </View>
          <Text style={[styles.txAmount, item.amount.startsWith('-') && styles.txNegative]}>
            {item.amount}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  balanceCard: {
    backgroundColor: colors.primary, padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 28,
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: colors.white, marginBottom: 16 },
  payoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100,
  },
  payoutText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  txRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  txLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  txDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', color: colors.success },
  txNegative: { color: colors.error },
});
