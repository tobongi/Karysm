import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';

interface Wallet {
  availableBalance: number;
  pendingBalance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  bookingId: string | null;
  createdAt: string;
}

function formatPrice(amount: number, currency: string) {
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

export default function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        api('/wallet'),
        api('/wallet/transactions'),
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data || []);
    } catch (err: any) {
      console.error('Wallet error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currency = wallet?.currency || 'CDF';

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Portefeuille</Text>

            {/* Balance card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Solde disponible</Text>
              <Text style={styles.balanceAmount}>
                {wallet ? formatPrice(wallet.availableBalance, currency) : '0'}
              </Text>
              <View style={styles.pendingRow}>
                <Text style={styles.pendingLabel}>En attente</Text>
                <Text style={styles.pendingAmount}>
                  {wallet ? formatPrice(wallet.pendingBalance, currency) : '0'}
                </Text>
              </View>
              <Pressable
                style={styles.payoutButton}
                onPress={() => showAlert('Bientôt disponible', 'Les retraits mobile money seront disponibles dans la prochaine version.')}
              >
                <Text style={styles.payoutText}>Demander un retrait</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Historique</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyText}>Aucune transaction pour le moment</Text>
            <Text style={styles.emptySubtext}>Vos revenus apparaîtront ici</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={styles.txIcon}>
              <Text style={styles.txIconText}>
                {item.type === 'CREDIT' ? '💰' : item.type === 'PAYOUT' ? '📤' : '📝'}
              </Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txLabel}>{item.description || item.type}</Text>
              <Text style={styles.txDate}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
            <Text style={[styles.txAmount, item.amount >= 0 ? styles.txPositive : styles.txNegative]}>
              {item.amount >= 0 ? '+' : ''}{formatPrice(item.amount, currency)}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },

  title: { fontSize: 24, fontWeight: '700', color: colors.accent, marginBottom: 16 },

  // Balance
  balanceCard: {
    backgroundColor: colors.primary, padding: 24, borderRadius: 16,
    alignItems: 'center', marginBottom: 24,
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  balanceAmount: { fontSize: 34, fontWeight: '800', color: colors.white, marginBottom: 12 },
  pendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
  },
  pendingLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  pendingAmount: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  payoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100,
  },
  payoutText: { color: colors.white, fontSize: 14, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.accent, marginBottom: 14 },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptySubtext: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  // Transactions
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, padding: 16, borderRadius: 12,
    marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  txIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryGhost, justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  txDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txPositive: { color: colors.success },
  txNegative: { color: colors.error },
});
