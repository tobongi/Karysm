import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, LayoutChangeEvent } from 'react-native';
import { Tabs } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import IconCompass from '@tabler/icons-react-native/dist/esm/icons/IconCompass.mjs';
import IconCalendarEvent from '@tabler/icons-react-native/dist/esm/icons/IconCalendarEvent.mjs';
import IconPhoto from '@tabler/icons-react-native/dist/esm/icons/IconPhoto.mjs';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles.mjs';
import IconUser from '@tabler/icons-react-native/dist/esm/icons/IconUser.mjs';
import IconClipboardList from '@tabler/icons-react-native/dist/esm/icons/IconClipboardList.mjs';
import IconCash from '@tabler/icons-react-native/dist/esm/icons/IconCash.mjs';

// ─── Tab config (keyed by route name) ───────────────────────────────────────

const TAB_CONFIG: Record<string, { icon: any; label: string }> = {
  index:      { icon: IconCompass,       label: 'Explorer' },
  bookings:   { icon: IconCalendarEvent, label: 'Rendez-vous' },
  lookbook:   { icon: IconPhoto,         label: 'Inspiration' },
  beauty:     { icon: IconSparkles,      label: 'Beauté AI' },
  requests:   { icon: IconClipboardList, label: 'Demandes' },
  earnings:   { icon: IconCash,          label: 'Revenus' },
  profile:    { icon: IconUser,          label: 'Profil' },
};

const CLIENT_TABS = ['index', 'bookings', 'lookbook', 'beauty', 'profile'];
const PROVIDER_TABS = ['index', 'bookings', 'requests', 'earnings', 'profile'];

const DOT_SIZE = 34;

// ─── Custom Tab Bar ─────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: any) {
  const { isProvider } = useAuth();
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useSharedValue(0);

  // Filter visible tabs by current role
  const allowedNames = isProvider ? PROVIDER_TABS : CLIENT_TABS;
  const visibleRoutes = state.routes.filter((route: any) => allowedNames.includes(route.name));
  const visibleIndex = visibleRoutes.findIndex((r: any) => r.key === state.routes[state.index]?.key);
  const tabCount = visibleRoutes.length;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    if (barWidth <= 0 || tabCount <= 0) return;
    const tabW = barWidth / tabCount;
    const idx = visibleIndex >= 0 ? visibleIndex : 0;
    const target = idx * tabW + (tabW - DOT_SIZE) / 2;
    indicatorX.value = withSpring(target, { damping: 16, stiffness: 200, mass: 0.7 });
  }, [visibleIndex, barWidth, tabCount]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={barStyles.outer}>
      <View style={barStyles.bar} onLayout={onLayout}>
        {/* Sliding dot */}
        {barWidth > 0 && (
          <Animated.View style={[barStyles.dot, dotStyle]} />
        )}

        {/* Tabs (only visible ones) */}
        {visibleRoutes.map((route: any) => {
          const isFocused = state.routes[state.index]?.key === route.key;
          const cfg = TAB_CONFIG[route.name];
          if (!cfg) return null;
          const Icon = cfg.icon;
          const label = cfg.label;

          return (
            <Pressable
              key={route.key}
              style={barStyles.tab}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
            >
              <View style={barStyles.iconWrap}>
                <Icon
                  size={18}
                  color={isFocused ? '#FFFFFF' : colors.textMuted}
                  strokeWidth={isFocused ? 2.2 : 1.5}
                />
              </View>
              <Text style={[barStyles.label, isFocused && barStyles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  outer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 480,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 6,
    height: Platform.OS === 'ios' ? 76 : 58,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: 5,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.accent,
    zIndex: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrap: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    fontFamily: 'Poppins_500Medium',
    color: colors.textMuted,
    marginTop: 1,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.accent,
    fontFamily: 'Poppins_600SemiBold',
  },
});

// ─── Tab Layout ─────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { isProvider, isLoading } = useAuth();

  // Don't render the tab bar until auth resolves — otherwise both client and provider tabs flash
  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  // Hide a tab from the bar by setting href: null (route remains reachable by URL)
  const hideForProvider = isProvider ? { href: null as any } : {};
  const hideForClient = isProvider ? {} : { href: null as any };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { fontFamily: 'Poppins_700Bold', fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ headerShown: false }} />
      <Tabs.Screen name="bookings" options={{ headerShown: false }} />
      {/* Client-only tabs */}
      <Tabs.Screen name="lookbook" options={{ headerShown: false, ...hideForProvider }} />
      <Tabs.Screen name="beauty" options={{ headerShown: false, ...hideForProvider }} />
      {/* Provider-only tabs (use tab navigator's header — these screens have no custom header) */}
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Demandes ouvertes',
          headerShown: true,
          headerTitleStyle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.accent, fontStyle: 'italic' },
          ...hideForClient,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Mes revenus',
          headerShown: true,
          headerTitleStyle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.accent, fontStyle: 'italic' },
          ...hideForClient,
        }}
      />
      <Tabs.Screen name="profile" options={{ headerShown: false }} />
    </Tabs>
  );
}
