import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, SectionList, StyleSheet, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import Skeleton from '../../src/components/Skeleton';
import CurveHeader from '../../src/components/CurveHeader';
import { PressableScale, FadeInStagger } from '../../src/components/animations';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: 'En attente', color: colors.warning },
  CONFIRMED: { label: 'Confirmé', color: colors.success },
  DEPOSIT_PAID: { label: 'Acompte payé', color: colors.primaryDark },
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

interface BookingSection {
  title: string;
  data: BookingItem[];
}

function getDateGroupLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString('fr-FR', { month: 'short' });
  const year = d.getFullYear();
  const formatted = `${dayNum} ${month} ${year}`;

  if (diffDays === 0) return `Aujourd'hui, ${formatted}`;
  if (diffDays === 1) return `Demain, ${formatted}`;
  if (diffDays === -1) return `Hier, ${formatted}`;
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${formatted}`;
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

  function formatPrice(amount: number, currency: string) {
    const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  const sections: BookingSection[] = useMemo(() => {
    const groups: Record<string, BookingItem[]> = {};
    for (const b of bookings) {
      const label = getDateGroupLabel(b.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(b);
    }
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [bookings]);

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
      <CurveHeader title="Rendez-vous" height={160} />

      <View style={styles.tabBar}>
        <PressableScale
          style={[styles.tabPill, tab === 'upcoming' && styles.tabPillActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabPillText, tab === 'upcoming' && styles.tabPillTextActive]}>À venir</Text>
        </PressableScale>
        <PressableScale
          style={[styles.tabPill, tab === 'past' && styles.tabPillActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.tabPillText, tab === 'past' && styles.tabPillTextActive]}>Passées</Text>
        </PressableScale>
      </View>

      {loading ? (
        <View style={{ padding: 20, gap: 20 }}>
          <Skeleton width={140} height={14} borderRadius={4} />
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Skeleton width={48} height={48} borderRadius={24} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={14} borderRadius={4} />
                <Skeleton width="40%" height={12} borderRadius={4} />
                <Skeleton width="50%" height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>
            {tab === 'upcoming' ? 'Aucune réservation à venir' : 'Aucune réservation passée'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionDate}>{title}</Text>
          )}
          renderItem={({ item, index, section }) => {
            const status = STATUS_LABELS[item.status] || { label: item.status, color: colors.textMuted };
            const providerName = item.provider?.user?.name || item.provider?.displayName || '?';
            const initial = providerName.charAt(0).toUpperCase();
            const isLast = index === section.data.length - 1;

            return (
              <FadeInStagger index={index}>
                <PressableScale
                  style={[styles.row, !isLast && styles.rowBorder]}
                  onPress={() => router.push(`/booking/detail/${item.id}`)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                  <View style={styles.rowContent}>
                    <View style={styles.rowTop}>
                      <Text style={styles.providerName} numberOfLines={1}>{providerName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: status.color + '1A' }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.serviceName} numberOfLines={1}>{item.service?.name}</Text>
                    <View style={styles.rowBottom}>
                      <Text style={styles.timeText}>🕐 {item.startTime}</Text>
                      <Text style={styles.priceText}>{formatPrice(item.agreedPrice, item.currency)}</Text>
                    </View>
                  </View>
                </PressableScale>
              </FadeInStagger>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  tabPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabPillText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabPillTextActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionDate: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.white,
  },
  rowContent: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  providerName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  serviceName: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: colors.terracotta,
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  loginButton: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  loginButtonText: { color: colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
});
