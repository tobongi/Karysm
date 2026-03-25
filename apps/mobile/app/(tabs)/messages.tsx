import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';

// --- Types ---

interface BookingItem {
  id: string;
  status: string;
  date: string;
  startTime?: string;
  service?: { name: string };
  provider?: { displayName: string };
  client?: { name: string };
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  sortDate: string;
  bookingId: string;
}

// --- Helpers ---

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(dateStr);
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
}

function buildNotificationsFromBookings(
  bookings: BookingItem[],
  role: 'client' | 'provider'
): Notification[] {
  const notifications: Notification[] = [];

  for (const b of bookings) {
    const serviceName = b.service?.name || 'Service';
    const providerName = b.provider?.displayName || 'Prestataire';
    const clientName = b.client?.name || 'Client';
    const timeStr = b.startTime ? ` a ${b.startTime}` : '';

    if (role === 'client') {
      switch (b.status) {
        case 'REQUESTED':
          notifications.push({
            id: `${b.id}-requested`,
            icon: '\uD83D\uDCC5',
            title: 'Nouvelle reservation',
            description: `Vous avez reserve ${serviceName} avec ${providerName}`,
            time: timeAgo(b.createdAt),
            sortDate: b.createdAt,
            bookingId: b.id,
          });
          break;
        case 'CONFIRMED':
        case 'DEPOSIT_PAID':
          notifications.push({
            id: `${b.id}-confirmed`,
            icon: '\u2705',
            title: 'Reservation confirmee',
            description: `${providerName} a confirme votre RDV`,
            time: timeAgo(b.updatedAt),
            sortDate: b.updatedAt,
            bookingId: b.id,
          });
          // Check if tomorrow for reminder
          if (isTomorrow(b.date)) {
            notifications.push({
              id: `${b.id}-reminder`,
              icon: '\u23F0',
              title: 'Rappel',
              description: `RDV demain: ${serviceName} avec ${providerName}${timeStr}`,
              time: timeAgo(b.updatedAt),
              sortDate: b.date,
              bookingId: b.id,
            });
          }
          break;
        case 'IN_PROGRESS':
          notifications.push({
            id: `${b.id}-inprogress`,
            icon: '\u2705',
            title: 'Reservation confirmee',
            description: `${providerName} a confirme votre RDV`,
            time: timeAgo(b.updatedAt),
            sortDate: b.updatedAt,
            bookingId: b.id,
          });
          break;
        case 'COMPLETED':
          notifications.push({
            id: `${b.id}-completed`,
            icon: '\uD83C\uDF89',
            title: 'Service termine',
            description: `${serviceName} avec ${providerName} termine`,
            time: timeAgo(b.updatedAt),
            sortDate: b.updatedAt,
            bookingId: b.id,
          });
          break;
        case 'CANCELLED':
          notifications.push({
            id: `${b.id}-cancelled`,
            icon: '\u274C',
            title: 'Annulation',
            description: `Reservation annulee`,
            time: timeAgo(b.updatedAt),
            sortDate: b.updatedAt,
            bookingId: b.id,
          });
          break;
      }
    } else {
      // Provider notifications
      switch (b.status) {
        case 'REQUESTED':
          notifications.push({
            id: `${b.id}-provider-new`,
            icon: '\uD83D\uDCE3',
            title: 'Nouvelle demande',
            description: `${clientName} a reserve ${serviceName}`,
            time: timeAgo(b.createdAt),
            sortDate: b.createdAt,
            bookingId: b.id,
          });
          break;
        case 'CONFIRMED':
        case 'DEPOSIT_PAID':
          notifications.push({
            id: `${b.id}-provider-confirmed`,
            icon: '\u2705',
            title: 'Reservation confirmee',
            description: `RDV avec ${clientName} pour ${serviceName}`,
            time: timeAgo(b.updatedAt),
            sortDate: b.updatedAt,
            bookingId: b.id,
          });
          if (isTomorrow(b.date)) {
            notifications.push({
              id: `${b.id}-provider-reminder`,
              icon: '\u23F0',
              title: 'Rappel',
              description: `RDV demain: ${serviceName} avec ${clientName}${timeStr}`,
              time: timeAgo(b.updatedAt),
              sortDate: b.date,
              bookingId: b.id,
            });
          }
          break;
        case 'COMPLETED':
          notifications.push({
            id: `${b.id}-provider-completed`,
            icon: '\uD83C\uDF89',
            title: 'Service termine',
            description: `${serviceName} avec ${clientName} termine`,
            time: timeAgo(b.updatedAt),
            sortDate: b.updatedAt,
            bookingId: b.id,
          });
          break;
        case 'CANCELLED':
          notifications.push({
            id: `${b.id}-provider-cancelled`,
            icon: '\u274C',
            title: 'Annulation',
            description: `Reservation avec ${clientName} annulee`,
            time: timeAgo(b.updatedAt),
            sortDate: b.updatedAt,
            bookingId: b.id,
          });
          break;
      }
    }
  }

  return notifications;
}

// --- Component ---

export default function MessagesTab() {
  const { user, isLoading: authLoading, isProvider } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const allNotifications: Notification[] = [];

      // Fetch client bookings (upcoming + past)
      const [upcomingRes, pastRes] = await Promise.all([
        api<{ bookings: BookingItem[] }>('/bookings/mine?status=upcoming').catch(() => ({ bookings: [] })),
        api<{ bookings: BookingItem[] }>('/bookings/mine?status=past').catch(() => ({ bookings: [] })),
      ]);

      const clientUpcoming = upcomingRes.bookings || [];
      const clientPast = pastRes.bookings || [];
      allNotifications.push(
        ...buildNotificationsFromBookings([...clientUpcoming, ...clientPast], 'client')
      );

      // If user is provider, also fetch provider bookings
      if (isProvider) {
        const [provUpcoming, provPast] = await Promise.all([
          api<{ bookings: BookingItem[] }>('/bookings/mine?role=provider&status=upcoming').catch(() => ({ bookings: [] })),
          api<{ bookings: BookingItem[] }>('/bookings/mine?role=provider&status=past').catch(() => ({ bookings: [] })),
        ]);

        const providerUpcoming = provUpcoming.bookings || [];
        const providerPast = provPast.bookings || [];
        allNotifications.push(
          ...buildNotificationsFromBookings([...providerUpcoming, ...providerPast], 'provider')
        );
      }

      // Sort newest first
      allNotifications.sort(
        (a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
      );

      setNotifications(allNotifications);
    } catch {
      // Silently fail — show empty state
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user, isProvider]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  // --- Not logged in ---
  if (!authLoading && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activite</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.emptyEmoji}>{'\uD83D\uDD12'}</Text>
          <Text style={styles.emptyTitle}>Connectez-vous pour voir votre activite</Text>
          <Text style={styles.emptyText}>
            Vos notifications apparaitront ici
          </Text>
          <Pressable
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // --- Loading ---
  if (loading || authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activite</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // --- Notification item ---
  const renderItem = ({ item }: { item: Notification }) => (
    <Pressable
      style={({ pressed }) => [
        styles.notifCard,
        pressed && styles.notifCardPressed,
      ]}
      onPress={() => router.push(`/booking/detail/${item.bookingId}`)}
    >
      <View style={styles.notifIcon}>
        <Text style={styles.notifIconText}>{item.icon}</Text>
      </View>
      <View style={styles.notifContent}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.notifTime}>{item.time}</Text>
      </View>
    </Pressable>
  );

  // --- Empty state ---
  const renderEmpty = () => (
    <View style={styles.centerContent}>
      <Text style={styles.emptyEmoji}>{'\uD83D\uDD14'}</Text>
      <Text style={styles.emptyTitle}>Aucune activite pour le moment</Text>
      <Text style={styles.emptyText}>
        Vos notifications apparaitront ici
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activite</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  emptyList: {
    flex: 1,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifCardPressed: {
    backgroundColor: colors.cardHover,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notifIconText: {
    fontSize: 20,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  notifDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
