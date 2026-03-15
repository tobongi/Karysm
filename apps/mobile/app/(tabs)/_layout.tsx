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
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorer',
          tabBarIcon: () => <RNText style={{ fontSize: 22 }}>🔍</RNText>,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Reservations',
          tabBarIcon: () => <RNText style={{ fontSize: 22 }}>📅</RNText>,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Notifs',
          tabBarIcon: () => <RNText style={{ fontSize: 22 }}>🔔</RNText>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: () => <RNText style={{ fontSize: 22 }}>👤</RNText>,
        }}
      />
    </Tabs>
  );
}
