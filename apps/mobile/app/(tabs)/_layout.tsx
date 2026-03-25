import { Text as RNText } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ focused }) => <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🔍</RNText>,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ focused }) => <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📅</RNText>,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Notifs',
          tabBarIcon: ({ focused }) => <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🔔</RNText>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <RNText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>👤</RNText>,
        }}
      />
    </Tabs>
  );
}
