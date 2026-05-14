import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Linking, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import IconBrandWhatsapp from '@tabler/icons-react-native/dist/esm/icons/IconBrandWhatsapp.mjs';
import IconPhone from '@tabler/icons-react-native/dist/esm/icons/IconPhone.mjs';
import IconCalendarEvent from '@tabler/icons-react-native/dist/esm/icons/IconCalendarEvent.mjs';
import IconClock from '@tabler/icons-react-native/dist/esm/icons/IconClock.mjs';
import IconCash from '@tabler/icons-react-native/dist/esm/icons/IconCash.mjs';
import IconCalendarOff from '@tabler/icons-react-native/dist/esm/icons/IconCalendarOff.mjs';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { PressableScale, FadeInStagger } from '../../src/components/animations';
import Skeleton from '../../src/components/Skeleton';

interface BookingRow {
  id: string;
  ref: string;
  date: string;
  startTime: string;
  status: string;
  agreedPrice: number;
  currency: string;
  service: { name: string };
  client: { id?: string; name: string; avatar?: string | null; phone?: string | null };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  REQUESTED:    { label: 'En attente',   color: colors.warning },
  CONFIRMED:    { label: 'Confirmé',     color: colors.success },
  DEPOSIT_PAID: { label: 'Acompte payé', color: colors.primaryDark },
  IN_PROGRESS:  { label: 'En cours',     color: colors.primary },
  COMPLETED:    { label: 'Terminé',      color: colors.textMuted },
  CANCELLED:    { label: 'Annulé',       color: colors.error },
  NO_SHOW:      { label: 'Absent',       color: colors.error },
  DISPUTED:     { label: 'Litige',       color: colors.error },
};

function formatPrice(amount: number, currency: string) {
  return `${amount.toLocaleString('fr-FR')} ${currency === 'CDF' ? 'FC' : 'FCFA'}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res: any = await api('/bookings/mine?role=provider');
      const all: BookingRow[] = res.data || [];
      // Match by client.id when available, fall back to name-prefixed key
      const isNameKey = id?.startsWith('name:');
      const nameKey = isNameKey ? id!.slice(5) : null;
      setBookings(all.filter(b => {
        if (isNameKey) return b.client?.name === nameKey;
        return b.client?.id === id;
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const client = bookings[0]?.client;
  const total = bookings.reduce((s, b) => s + (b.status === 'CANCELLED' || b.status === 'NO_SHOW' ? 0 : b.agreedPrice), 0);
  const completed = bookings.filter(b => b.status === 'COMPLETED').length;
  const upcoming = bookings.filter(b => ['REQUESTED', 'CONFIRMED', 'DEPOSIT_PAID', 'IN_PROGRESS'].includes(b.status)).length;
  const lastVisit = bookings.find(b => b.status === 'COMPLETED');
  const initial = client?.name?.charAt(0).toUpperCase() ?? '?';
  const currency = bookings[0]?.currency ?? 'CDF';

  const tier =
    completed >= 5 ? { label: 'VIP', color: colors.accent } :
    completed >= 2 ? { label: 'Régulière', color: colors.primary } :
    { label: 'Nouvelle', color: colors.success };

  const handleBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/bookings');
  const handleWhatsapp = () => {
    if (!client?.phone) return;
    const num = client.phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${num}`);
  };
  const handleCall = () => {
    if (!client?.phone) return;
    Linking.openURL(`tel:${client.phone}`);
  };

  const renderHeader = () => (
    <View>
      {/* Curved header */}
      <View style={styles.header}>
        <PressableScale onPress={handleBack} style={styles.backBtn} hitSlop={12}>
          <IconArrowLeft size={22} color={colors.white} strokeWidth={1.8} />
        </PressableScale>
        <View style={styles.headerContent}>
          <View style={styles.avatarLg}>
            {client?.avatar ? (
              <Image source={{ uri: client.avatar }} style={styles.avatarLgImg} />
            ) : (
              <Text style={styles.avatarLgText}>{initial}</Text>
            )}
          </View>
          <Text style={styles.clientName}>{client?.name || 'Cliente'}</Text>
          <View style={[styles.tierPill, { backgroundColor: `${tier.color}26` }]}>
            <Text style={[styles.tierPillText, { color: tier.color }]}>{tier.label}</Text>
          </View>
        </View>
      </View>

      {/* Stats card */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statValue}>{completed}</Text>
          <Text style={styles.statLabel}>Terminés</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statValue}>{upcoming}</Text>
          <Text style={styles.statLabel}>À venir</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={[styles.statValue, styles.statValueAccent]} numberOfLines={1} adjustsFontSizeToFit>
            {formatPrice(total, currency)}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Contact actions */}
      {client?.phone && (
        <View style={styles.contactRow}>
          <PressableScale style={[styles.contactBtn, styles.whatsappBtn]} onPress={handleWhatsapp}>
            <IconBrandWhatsapp size={18} color={colors.white} strokeWidth={2} />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
          </PressableScale>
          <PressableScale style={[styles.contactBtn, styles.callBtn]} onPress={handleCall}>
            <IconPhone size={18} color={colors.accent} strokeWidth={2} />
            <Text style={[styles.contactBtnText, { color: colors.accent }]}>Appeler</Text>
          </PressableScale>
        </View>
      )}

      {lastVisit && (
        <View style={styles.lastVisitBox}>
          <IconCalendarEvent size={16} color={colors.textMuted} strokeWidth={1.8} />
          <Text style={styles.lastVisitText}>
            Dernière visite: {formatDate(lastVisit.date)} · {lastVisit.service?.name}
          </Text>
        </View>
      )}

      <Text style={styles.historyTitle}>Historique des rendez-vous</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <PressableScale onPress={handleBack} style={styles.backBtn} hitSlop={12}>
            <IconArrowLeft size={22} color={colors.white} strokeWidth={1.8} />
          </PressableScale>
        </View>
        <View style={{ padding: 20, gap: 16 }}>
          <Skeleton width="60%" height={20} borderRadius={6} />
          <Skeleton width="100%" height={80} borderRadius={16} />
          {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={72} borderRadius={16} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <PressableScale onPress={handleBack} style={styles.backBtn} hitSlop={12}>
            <IconArrowLeft size={22} color={colors.white} strokeWidth={1.8} />
          </PressableScale>
        </View>
        <View style={styles.empty}>
          <IconCalendarOff size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Cliente introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={bookings}
        keyExtractor={b => b.id}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetch(); }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item, index }) => {
          const st = STATUS_LABELS[item.status] ?? { label: item.status, color: colors.textMuted };
          return (
            <FadeInStagger index={index}>
              <PressableScale
                style={styles.bookingRow}
                onPress={() => router.push(`/booking/detail/${item.id}` as any)}
              >
                <View style={styles.bookingDateCol}>
                  <Text style={styles.bookingDay}>{new Date(item.date).getDate()}</Text>
                  <Text style={styles.bookingMonth}>
                    {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short' })}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingService} numberOfLines={1}>{item.service?.name}</Text>
                  <View style={styles.bookingMeta}>
                    <IconClock size={11} color={colors.textMuted} strokeWidth={1.8} />
                    <Text style={styles.bookingMetaText}>{item.startTime?.slice(0, 5)}</Text>
                    <Text style={styles.bookingMetaDot}>·</Text>
                    <IconCash size={11} color={colors.textMuted} strokeWidth={1.8} />
                    <Text style={styles.bookingMetaText}>{formatPrice(item.agreedPrice, item.currency)}</Text>
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: `${st.color}1A` }]}>
                  <Text style={[styles.statusPillText, { color: st.color }]}>{st.label}</Text>
                </View>
              </PressableScale>
            </FadeInStagger>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    backgroundColor: colors.headerDark,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: { alignItems: 'center', gap: 10 },
  avatarLg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  avatarLgImg: { width: 80, height: 80 },
  avatarLgText: { fontSize: 32, fontFamily: 'Poppins_700Bold', color: colors.white },
  clientName: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: colors.white, fontStyle: 'italic' },
  tierPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tierPillText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: -22,
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.10)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 4 },
    }) as any,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  statValue: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 2 },
  statValueAccent: { fontSize: 14, color: colors.accent },
  statLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },

  contactRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 16 },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 16,
  },
  whatsappBtn: { backgroundColor: '#25D366' },
  callBtn: { backgroundColor: 'rgba(91,33,182,0.10)', borderWidth: 1, borderColor: 'rgba(91,33,182,0.25)' },
  contactBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.white },

  lastVisitBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 16, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: colors.primaryGhost, borderRadius: 12,
  },
  lastVisitText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, flex: 1 },

  historyTitle: {
    fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.accent,
    paddingHorizontal: 20, marginTop: 24, marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  bookingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginBottom: 10,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  bookingDateCol: { width: 44, alignItems: 'center' },
  bookingDay: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.accent, lineHeight: 22 },
  bookingMonth: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, textTransform: 'uppercase' },
  bookingService: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 4 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookingMetaText: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  bookingMetaDot: { fontSize: 11, color: colors.textMuted, marginHorizontal: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center' },
});
