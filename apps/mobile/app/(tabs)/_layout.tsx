import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import {
  IconCompass,
  IconCalendarEvent,
  IconBell,
  IconSparkles,
  IconUser,
} from '@tabler/icons-react-native';

function TabIcon({ icon: Icon, focused, badge }: { icon: any; focused: boolean; badge?: number }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon
        size={20}
        color={focused ? colors.white : colors.textMuted}
        strokeWidth={focused ? 2 : 1.5}
      />
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    api('/notifications?pageSize=1').then((res: any) => {
      setUnreadCount(res.data?.unreadCount || 0);
    }).catch(() => {});
  }, [user]);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 62,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Poppins_500Medium',
          fontWeight: '500',
          marginTop: 0,
          letterSpacing: 0.3,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { fontFamily: 'Poppins_700Bold', fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ focused }) => <TabIcon icon={IconCompass} focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: ({ focused }) => <TabIcon icon={IconCalendarEvent} focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Activité',
          tabBarIcon: ({ focused }) => <TabIcon icon={IconBell} focused={focused} badge={unreadCount} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="beauty"
        options={{
          title: 'Beauté AI',
          tabBarIcon: ({ focused }) => <TabIcon icon={IconSparkles} focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon icon={IconUser} focused={focused} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accent,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    lineHeight: 14,
  },
});
