import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fonts } from '../theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
  size?: BadgeSize;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.success, text: colors.success },
  warning: { bg: colors.warning, text: colors.warning },
  error: { bg: colors.error, text: colors.error },
  info: { bg: colors.primary, text: colors.terracottaDark },
  neutral: { bg: colors.n300, text: colors.textSecondary },
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function Badge({ label, variant, size = 'md' }: BadgeProps) {
  const { bg, text } = variantColors[variant];
  const sizeStyle = size === 'sm' ? styles.sm : styles.md;
  const textStyle = size === 'sm' ? styles.textSm : styles.textMd;

  return (
    <View style={[styles.badge, sizeStyle, { backgroundColor: hexToRgba(bg, 0.15) }]}>
      <Text style={[textStyle, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textSm: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
  },
  textMd: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
  },
});
