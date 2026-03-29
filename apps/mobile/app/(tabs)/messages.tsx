import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';

// --- Types ---

interface DbNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: { bookingId?: string } | null;
  readAt: string | null;
  createdAt: string;
}

interface DisplayNotification {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  bookingId: string | null;
  isRead: boolean;
  dbId: string | null; // null if generated client-side
}

// --- Helpers ---

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const TYPE_ICONS: Record<string, string> = {
  BOOKING_REQUESTED: '📣',
  BOOKING_CONFIRMED: '✅',
  BOOKING_IN_PROGRESS: '▶️',
  BOOKING_COMPLETED: '🎉',
  BOOKING_CANCELLED: '❌',
  REVIEW_RECEIVED: '⭐',
  KYC_APPROVED: '✅',
  KYC_REJECTED: '❌',
};

function mapDbNotification(n: DbNotification): DisplayNotification {
  return {
    id: n.id,
    icon: TYPE_ICONS[n.type] || '🔔',
    title: n.title,
    description: n.body,
    time: timeAgo(n.createdAt),
    bookingId: n.data?.bookingId || null,
    isRead: !!n.readAt,
    dbId: n.id,
  };
}

// --- Component ---

export default function MessagesTab() {
  const { user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const res: any = await api('/notifications?limit=50');
      const dbNotifs: DbNotification[] = res.data || [];
      setNotifications(dbNotifs.map(mapDbNotification));
      setUnreadCount(res.unreadCount || 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  async function handleMarkAllRead() {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  async function handlePress(item: DisplayNotification) {
    // Mark as read
    if (!item.isRead && item.dbId) {
      api(`/notifications/${item.dbId}/read`, { method: 'PATCH' }).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    // Navigate to booking detail
    if (item.bookingId) {
      router.push(`/booking/detail/${item.bookingId}`);
    }
  }

  // --- Not logged in ---
  if (!authLoading && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activité</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyTitle}>Connectez-vous pour voir votre activité</Text>
          <Text style={styles.emptyText}>Vos notifications apparaîtront ici</Text>
          <Pressable style={styles.loginButton} onPress={() => router.push('/auth/login')}>
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
          <Text style={styles.headerTitle}>Activité</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // --- Notification item ---
  const renderItem = ({ item }: { item: DisplayNotification }) => (
    <Pressable
      style={({ pressed }) => [
        styles.notifCard,
        !item.isRead && styles.notifCardUnread,
        pressed && styles.notifCardPressed,
      ]}
      onPress={() => handlePress(item)}
    >
      <View style={[styles.notifIcon, !item.isRead && styles.notifIconUnread]}>
        <Text style={styles.notifIconText}>{item.icon}</Text>
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.notifDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.notifTime}>{item.time}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </Pressable>
  );

  // --- Empty state ---
  const renderEmpty = () => (
    <View style={styles.centerContent}>
      <Text style={styles.emptyEmoji}>🔔</Text>
      <Text style={styles.emptyTitle}>Aucune activité pour le moment</Text>
      <Text style={styles.emptyText}>Vos notifications apparaîtront ici</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Activité</Text>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Tout lire</Text>
            </Pressable>
          )}
        </View>
        {unreadCount > 0 && (
          <Text style={styles.unreadLabel}>
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </Text>
        )}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.accent,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: colors.primaryGhost,
  },
  markAllText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primaryDark,
  },
  unreadLabel: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: 'Poppins_500Medium',
    marginTop: 4,
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
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.08)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
    }) as any,
  },
  notifCardUnread: {
    backgroundColor: colors.n100,
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
  notifIconUnread: {
    backgroundColor: 'rgba(202,152,126,0.15)',
  },
  notifIconText: {
    fontSize: 20,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 3,
  },
  notifTitleUnread: {
    fontFamily: 'Poppins_700Bold',
  },
  notifDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
