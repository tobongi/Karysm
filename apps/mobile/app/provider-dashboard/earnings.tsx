import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';

interface Wallet {
  availableBalance: number;
  pendingBalance: number;
  currency: string;
}

interface Booking {
  id: string;
  ref: string;
  date: string;
  agreedPrice: number;
  currency: string;
  status: string;
  service: { name: string } | null;
  client: { name: string } | null;
}

function formatPrice(amount: number, currency: string) {
  if (amount == null) return '';
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EarningsScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        api<{ success: boolean; data: any }>('/provider/profile'),
        api<{ success: boolean; data: Booking[] }>('/bookings/mine?role=provider&status=past'),
      ]);

      const provider = profileRes.data;
      if (provider.wallet) {
        setWallet({
          availableBalance: provider.wallet.availableBalance,
          pendingBalance: provider.wallet.pendingBalance,
          currency: provider.wallet.currency,
        });
      }
      if (provider.avgRating != null) {
        setAvgRating(provider.avgRating);
      }

      setBookings(bookingsRes.data || []);
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de charger les données');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    })();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const currency = wallet?.currency || 'CDF';
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const totalEarned = completedBookings.reduce((sum, b) => sum + (b.agreedPrice || 0), 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const headerComponent = (
    <>
      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde disponible</Text>
        <Text style={styles.balanceAmount}>
          {wallet ? formatPrice(wallet.availableBalance, currency) : '—'}
        </Text>
        <View style={styles.pendingRow}>
          <Text style={styles.pendingLabel}>En attente</Text>
          <Text style={styles.pendingAmount}>
            {wallet ? formatPrice(wallet.pendingBalance, currency) : '—'}
          </Text>
        </View>
        <Pressable
          style={styles.payoutButton}
          onPress={() => showAlert('Bientôt disponible', 'Les retraits seront disponibles prochainement.')}
        >
          <Text style={styles.payoutText}>Demander un retrait</Text>
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedBookings.length}</Text>
          <Text style={styles.statLabel}>Réservations</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatPrice(totalEarned, currency)}</Text>
          <Text style={styles.statLabel}>Total gagné</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {avgRating != null ? `${avgRating.toFixed(1)} ⭐` : '—'}
          </Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </View>
      </View>

      {/* Section title */}
      <Text style={styles.sectionTitle}>Dernières réservations</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={completedBookings.slice(0, 20)}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune réservation terminée pour le moment.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={styles.txInfo}>
              <Text style={styles.txLabel}>
                {item.service?.name || 'Service'}{item.client ? ` — ${item.client.name}` : ''}
              </Text>
              <Text style={styles.txDate}>{formatDate(item.date)}</Text>
            </View>
            <Text style={styles.txAmount}>
              +{formatPrice(item.agreedPrice, item.currency || currency)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  listContent: { padding: 20, paddingBottom: 40 },

  // Balance card
  balanceCard: {
    backgroundColor: colors.primary,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  balanceAmount: {
    fontSize: 34,
    fontFamily: 'Poppins_700Bold',
    color: colors.white,
    marginBottom: 12,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  pendingLabel: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.6)' },
  pendingAmount: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.9)' },
  payoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
  },
  payoutText: { color: colors.white, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.terracotta, marginBottom: 4 },
  statLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center' },

  // Section
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 14 },

  // Booking rows
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text },
  txDate: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.success },

  // Empty
  emptyState: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center' },
});
