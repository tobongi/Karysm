import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import IconArrowUpRight from '@tabler/icons-react-native/dist/esm/icons/IconArrowUpRight.mjs';
import IconClockHour4 from '@tabler/icons-react-native/dist/esm/icons/IconClockHour4.mjs';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';
import CurveHeader from '../../src/components/CurveHeader';
import Skeleton from '../../src/components/Skeleton';
import { PressableScale, FadeInStagger } from '../../src/components/animations';

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
  client: { name: string; avatar?: string | null } | null;
}

const STATUS: Record<string, { label: string; color: string }> = {
  COMPLETED:    { label: 'Encaissé',  color: colors.success },
  IN_PROGRESS:  { label: 'En cours',  color: colors.primary },
  DEPOSIT_PAID: { label: 'Acompte',   color: colors.primaryDark },
  CONFIRMED:    { label: 'Confirmé',  color: colors.warning },
  REQUESTED:    { label: 'Demande',   color: colors.warning },
  CANCELLED:    { label: 'Annulé',    color: colors.error },
  NO_SHOW:      { label: 'Absent',    color: colors.error },
};

function fmtPrice(amount: number, currency: string) {
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, pastRes, upRes] = await Promise.allSettled([
        api('/provider/profile') as Promise<any>,
        api('/bookings/mine?role=provider&status=past') as Promise<any>,
        api('/bookings/mine?role=provider&status=upcoming') as Promise<any>,
      ]);
      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value?.data ?? profileRes.value;
        if (p?.wallet) {
          setWallet({
            availableBalance: p.wallet.availableBalance,
            pendingBalance: p.wallet.pendingBalance,
            currency: p.wallet.currency,
          });
        }
      }
      if (pastRes.status === 'fulfilled') setPastBookings(pastRes.value?.data ?? []);
      if (upRes.status === 'fulfilled') setUpcomingBookings(upRes.value?.data ?? []);
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de charger le portefeuille');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  const currency = wallet?.currency || 'CDF';

  const transactions = [...pastBookings, ...upcomingBookings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  const renderHeader = () => (
    <View>
      {/* Hero balance */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Solde disponible</Text>
            {loading ? (
              <Skeleton width={180} height={40} borderRadius={6} />
            ) : (
              <Text style={styles.heroAmount}>{fmtPrice(wallet?.availableBalance ?? 0, currency)}</Text>
            )}
          </View>
          <View style={styles.heroBadge}>
            <IconClockHour4 size={22} color="#FFFFFF" strokeWidth={1.8} />
          </View>
        </View>

        <View style={styles.heroPills}>
          <View style={styles.heroPill}>
            <IconClockHour4 size={12} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
            <Text style={styles.heroPillLabel}>En attente</Text>
            <Text style={styles.heroPillValue}>{fmtPrice(wallet?.pendingBalance ?? 0, currency)}</Text>
          </View>
        </View>

        <PressableScale
          style={styles.payoutBtn}
          onPress={() => showAlert('Bientôt disponible', 'Les retraits Mobile Money arrivent en Phase 2.')}
        >
          <Text style={styles.payoutText}>Demander un retrait</Text>
          <IconArrowUpRight size={16} color={colors.accent} strokeWidth={2.2} />
        </PressableScale>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        <Text style={styles.sectionCount}>{transactions.length}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <CurveHeader title="Portefeuille" showBack />
        <View style={{ padding: 20, gap: 16 }}>
          <Skeleton width="100%" height={180} borderRadius={24} />
          {[1,2,3].map(i => <Skeleton key={i} width="100%" height={64} borderRadius={16} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CurveHeader title="Portefeuille" showBack />
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucune transaction</Text>
            <Text style={styles.emptySub}>Vos revenus apparaîtront ici une fois les services complétés.</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const st = STATUS[item.status] ?? { label: item.status, color: colors.textMuted };
          const isEncaisse = item.status === 'COMPLETED';
          const isLoss = item.status === 'CANCELLED' || item.status === 'NO_SHOW';
          const amountColor = isEncaisse ? colors.success : isLoss ? colors.error : colors.text;
          const initial = item.client?.name?.charAt(0).toUpperCase() ?? '?';

          return (
            <FadeInStagger index={index} style={{ width: '100%' }}>
              <View style={styles.txRow}>
                <View style={styles.avatar}>
                  {item.client?.avatar ? (
                    <Image source={{ uri: item.client.avatar }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarText}>{initial}</Text>
                  )}
                </View>
                <View style={styles.txMid}>
                  <Text style={styles.txTitle} numberOfLines={1}>
                    {item.service?.name ?? 'Service'}
                  </Text>
                  <View style={styles.txMeta}>
                    <Text style={styles.txClient} numberOfLines={1}>
                      {item.client?.name ?? 'Cliente'}
                    </Text>
                    <Text style={styles.txDot}>·</Text>
                    <Text style={styles.txDate}>{fmtDate(item.date)}</Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: amountColor }]}>
                    {isEncaisse ? '+' : isLoss ? '' : ''}{fmtPrice(item.agreedPrice, item.currency || currency)}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: `${st.color}1A` }]}>
                    <Text style={[styles.statusPillText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
              </View>
            </FadeInStagger>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: 20, paddingBottom: 40 },

  // Hero balance
  heroCard: {
    backgroundColor: colors.headerDark,
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#3A2228',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.65)', marginBottom: 6, letterSpacing: 0.3 },
  heroAmount: { fontSize: 36, fontFamily: 'PlayfairDisplay_700Bold', color: '#FFFFFF', letterSpacing: -0.8, lineHeight: 42 },
  heroBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroPills: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 100,
  },
  heroPillLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.7)' },
  heroPillValue: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  payoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FFFFFF',
    paddingVertical: 13, borderRadius: 14,
  },
  payoutText: { color: colors.accent, fontSize: 14, fontFamily: 'Poppins_700Bold' },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCount: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textMuted },

  // Transaction row
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryGhost,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40 },
  avatarText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.primary },
  txMid: { flex: 1, gap: 2 },
  txTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txClient: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, flexShrink: 1 },
  txDot: { fontSize: 11, color: colors.textMuted },
  txDate: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 14, fontFamily: 'Poppins_700Bold', letterSpacing: -0.2 },
  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  statusPillText: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.3 },

  // Empty
  emptyState: { paddingVertical: 24, alignItems: 'center', gap: 4 },
  emptyTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  emptySub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
});
