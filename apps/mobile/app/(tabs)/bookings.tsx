import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: 'En attente', color: colors.warning },
  CONFIRMED: { label: 'Confirmé', color: colors.success },
  DEPOSIT_PAID: { label: 'Acompte payé', color: '#8B5CF6' },
  IN_PROGRESS: { label: 'En cours', color: colors.primary },
  COMPLETED: { label: 'Terminé', color: colors.textMuted },
  CANCELLED: { label: 'Annulé', color: colors.error },
  NO_SHOW: { label: 'Absent', color: colors.error },
  DISPUTED: { label: 'Litige', color: colors.error },
};

interface BookingItem {
  id: string;
  ref: string;
  date: string;
  startTime: string;
  status: string;
  agreedPrice: number;
  currency: string;
  service: { name: string };
  provider: { displayName: string; user: { name: string; avatar?: string | null } };
  client: { name: string };
}

export default function BookingsTab() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const res: any = await api(`/bookings/mine?status=${tab}`);
      setBookings(res.data || []);
    } catch (e) {
      // console.error('Bookings fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, user]);

  useEffect(() => {
    setLoading(true);
    fetchBookings();
  }, [fetchBookings]);

  function onRefresh() {
    setRefreshing(true);
    fetchBookings();
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatPrice(amount: number, currency: string) {
    const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyText}>Connectez-vous pour voir vos réservations</Text>
          <Pressable style={styles.loginButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>À venir</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'past' && styles.tabActive]} onPress={() => setTab('past')}>
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Passées</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyText}>
                {tab === 'upcoming' ? 'Aucune réservation à venir' : 'Aucune réservation passée'}
              </Text>
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
                <Text style={styles.cardProvider}>{item.provider?.user?.name || item.provider?.displayName}</Text>
                <Text style={styles.cardService}>{item.service?.name}</Text>
                <View style={styles.cardBottom}>
                  <Text style={styles.cardDate}>📅 {formatDate(item.date)} à {item.startTime}</Text>
                  <Text style={styles.cardPrice}>{formatPrice(item.agreedPrice, item.currency)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: colors.card },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  list: { padding: 20, gap: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
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
  cardPrice: { fontSize: 16, fontWeight: '700', color: colors.terracotta },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  loginButton: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  loginButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
