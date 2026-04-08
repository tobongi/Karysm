import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, LayoutChangeEvent } from 'react-native';
import { Tabs } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../src/theme/colors';
import IconCompass from '@tabler/icons-react-native/dist/esm/icons/IconCompass.mjs';
import IconCalendarEvent from '@tabler/icons-react-native/dist/esm/icons/IconCalendarEvent.mjs';
import IconPhoto from '@tabler/icons-react-native/dist/esm/icons/IconPhoto.mjs';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles.mjs';
import IconUser from '@tabler/icons-react-native/dist/esm/icons/IconUser.mjs';

// ─── Tab config ─────────────────────────────────────────────────────────────

const TAB_ICONS = [IconCompass, IconCalendarEvent, IconPhoto, IconSparkles, IconUser];
const TAB_LABELS = ['Explorer', 'Rendez-vous', 'Inspiration', 'Beauté AI', 'Profil'];
const DOT_SIZE = 34;

// ─── Custom Tab Bar ─────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: any) {
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const tabCount = state.routes.length;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    if (barWidth <= 0) return;
    const tabW = barWidth / tabCount;
    const target = state.index * tabW + (tabW - DOT_SIZE) / 2;
    indicatorX.value = withSpring(target, { damping: 16, stiffness: 200, mass: 0.7 });
  }, [state.index, barWidth, tabCount]);

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

        {/* Tabs */}
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const Icon = TAB_ICONS[index];
          const label = TAB_LABELS[index];
          if (!Icon) return null;

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
      <Tabs.Screen name="lookbook" options={{ headerShown: false }} />
      <Tabs.Screen name="beauty" options={{ headerShown: false }} />
      <Tabs.Screen name="profile" options={{ headerShown: false }} />
    </Tabs>
  );
}
