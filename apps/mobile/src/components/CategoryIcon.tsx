import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, fonts } from '../theme';

interface CategoryIconProps {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onPress: () => void;
}

export default function CategoryIcon({
  label,
  icon,
  isActive = false,
  onPress,
}: CategoryIconProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={[
          styles.iconWrapper,
          isActive && styles.iconWrapperActive,
        ]}
      >
        {icon}
      </View>
      <Text
        style={[styles.label, isActive && styles.labelActive]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.accent,
    marginTop: 8,
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
  },
});
