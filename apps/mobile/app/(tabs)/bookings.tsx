import { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';

const MOCK_BOOKINGS = [
  {
    id: '1', ref: 'TKS-A3B7C2', providerName: 'Marie Tresses', serviceName: 'Tresses collees',
    date: '2026-03-20', startTime: '14:00', status: 'CONFIRMED', agreedPrice: 5000, currency: 'CDF',
  },
  {
    id: '2', ref: 'TKS-D8E4F1', providerName: 'Nails by Grace', serviceName: 'Pose gel UV',
    date: '2026-03-18', startTime: '10:00', status: 'COMPLETED', agreedPrice: 8000, currency: 'CDF',
  },
  {
    id: '3', ref: 'TKS-G5H9J3', providerName: 'Barber King', serviceName: 'Coupe homme',
    date: '2026-03-22', startTime: '09:30', status: 'REQUESTED', agreedPrice: 3000, currency: 'CDF',
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: 'En attente', color: colors.warning },
  CONFIRMED: { label: 'Confirme', color: colors.success },
  DEPOSIT_PAID: { label: 'Acompte paye', color: '#8B5CF6' },
  IN_PROGRESS: { label: 'En cours', color: colors.primary },
  COMPLETED: { label: 'Termine', color: colors.textMuted },
  CANCELLED: { label: 'Annule', color: colors.error },
  NO_SHOW: { label: 'Absent', color: colors.error },
};

export default function BookingsTab() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const filtered = MOCK_BOOKINGS.filter(b =>
    tab === 'upcoming'
      ? ['REQUESTED', 'CONFIRMED', 'DEPOSIT_PAID', 'IN_PROGRESS'].includes(b.status)
      : ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.status)
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>A venir</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'past' && styles.tabActive]} onPress={() => setTab('past')}>
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Passes</Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>Aucune reservation</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = STATUS_LABELS[item.status] || { label: item.status, color: colors.textMuted };
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/booking/detail/${item.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardRef}>{item.ref}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <Text style={styles.cardProvider}>{item.providerName}</Text>
              <Text style={styles.cardService}>{item.serviceName}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardDate}>📅 {item.date} a {item.startTime}</Text>
                <Text style={styles.cardPrice}>{item.agreedPrice.toLocaleString()} FC</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: colors.card },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardRef: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardProvider: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardService: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  cardDate: { fontSize: 13, color: colors.textSecondary },
  cardPrice: { fontSize: 16, fontWeight: '700', color: colors.primary },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textMuted },
});
