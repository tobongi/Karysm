import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

interface SkeletonProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width, height, borderRadius = 24, style }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: colors.n300,
        },
        animStyle,
        style,
      ]}
    />
  );
}

export function ProviderCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton width="100%" height={160} borderRadius={0} style={skeletonStyles.image} />
      <View style={skeletonStyles.content}>
        <Skeleton width="60%" height={18} borderRadius={8} />
        <Skeleton width="80%" height={14} borderRadius={8} style={skeletonStyles.addressLine} />
        <Skeleton width="40%" height={14} borderRadius={8} style={skeletonStyles.ratingLine} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 14,
  },
  image: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    padding: 12,
  },
  addressLine: {
    marginTop: 8,
  },
  ratingLine: {
    marginTop: 8,
  },
});
