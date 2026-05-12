import React, { useEffect, useCallback } from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── PressableScale ─────────────────────────────────────────────────────────
// Tactile press feedback — card/button scales down slightly on press

interface PressableScaleProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scale?: number;
  disabled?: boolean;
  hitSlop?: number;
}

export function PressableScale({
  onPress,
  style,
  children,
  scale = 0.97,
  disabled,
  hitSlop,
}: PressableScaleProps) {
  const pressed = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { pressed.value = withSpring(scale, { damping: 15, stiffness: 200 }); }}
      onPressOut={() => { pressed.value = withSpring(1, { damping: 12, stiffness: 180 }); }}
      onPress={onPress}
      style={[animStyle, style]}
      disabled={disabled}
      hitSlop={hitSlop}
    >
      {children}
    </AnimatedPressable>
  );
}

// ─── FadeInStagger ──────────────────────────────────────────────────────────
// Staggered fade-in for list items

interface FadeInStaggerProps {
  index: number;
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FadeInStagger({
  index,
  delay = 40,
  duration = 280,
  children,
  style,
}: FadeInStaggerProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    const staggerDelay = Math.min(index * delay, 600); // cap at 600ms
    opacity.value = withDelay(staggerDelay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(staggerDelay, withTiming(0, { duration, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── TabCrossfade ───────────────────────────────────────────────────────────
// Crossfade wrapper for tab content

interface TabCrossfadeProps {
  active: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TabCrossfade({ active, children, style }: TabCrossfadeProps) {
  const opacity = useSharedValue(active ? 1 : 0);
  const translateX = useSharedValue(active ? 0 : 20);

  useEffect(() => {
    opacity.value = withTiming(active ? 1 : 0, { duration: 250, easing: Easing.out(Easing.cubic) });
    translateX.value = withTiming(active ? 0 : 20, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  if (!active) return null;

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── BounceScale ────────────────────────────────────────────────────────────
// Bounce animation for save/like buttons

interface BounceScaleProps {
  trigger: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function BounceScale({ trigger, children, style }: BounceScaleProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (trigger) {
      scale.value = withSpring(1.15, { damping: 10, stiffness: 300 }, () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      });
    }
  }, [trigger]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── Shimmer ────────────────────────────────────────────────────────────────
// Shimmer effect for skeleton loaders

interface ShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Shimmer({ width, height, borderRadius = 8, style }: ShimmerProps) {
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    shimmerX.value = withDelay(
      Math.random() * 300,
      withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    width: width as number,
    height,
    borderRadius,
    backgroundColor: '#E9D2C2',
    overflow: 'hidden' as const,
  }));

  const shimmerOverlay = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: '40%' as any,
    left: interpolate(shimmerX.value, [-1, 1], [-40, 140], 'clamp') + '%' as any,
    backgroundColor: 'rgba(255,255,255,0.35)',
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      <Animated.View style={shimmerOverlay} />
    </Animated.View>
  );
}

// Re-export Reanimated presets for convenience
export { FadeIn, FadeInDown, FadeInUp, Layout };
