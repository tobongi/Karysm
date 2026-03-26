import { View, Text as RNText, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';

// Minimal text-based icons — mature, no emoji
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <RNText style={[styles.iconText, focused && styles.iconTextActive]}>{label}</RNText>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 62,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 0, letterSpacing: 0.3 },
        tabBarItemStyle: { paddingVertical: 2 },
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
          tabBarIcon: ({ focused }) => <TabIcon label="◎" focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: ({ focused }) => <TabIcon label="▦" focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Activité',
          tabBarIcon: ({ focused }) => <TabIcon label="◉" focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="beauty"
        options={{
          title: 'Beauté AI',
          tabBarIcon: ({ focused }) => <TabIcon label="◇" focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon label="○" focused={focused} />,
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
  iconText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  iconTextActive: {
    color: colors.white,
  },
});
