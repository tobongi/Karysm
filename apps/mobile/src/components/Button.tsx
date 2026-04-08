import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, { height: number; borderRadius: number; fontSize: number; paddingHorizontal: number }> = {
  sm: { height: 32, borderRadius: 16, fontSize: 12, paddingHorizontal: 16 },
  md: { height: 40, borderRadius: 20, fontSize: 14, paddingHorizontal: 20 },
  lg: { height: 54, borderRadius: 27, fontSize: 16, paddingHorizontal: 24 },
};

const variantColors = {
  primary: {
    bg: colors.primary,
    text: '#FFFFFF',
    active: colors.primaryDark,
    disabledBg: '#E9D2C2',
    disabledText: '#D5AC94',
  },
  secondary: {
    bg: '#FBF6F1',
    text: '#5F383C',
    active: '#E9D2C2',
    disabledBg: '#F2E4D9',
    disabledText: '#D5AC94',
  },
  accent: {
    bg: colors.secondaryGreen,
    text: '#FFFFFF',
    active: colors.secondaryGreenDark,
    disabledBg: '#D5D7D1',
    disabledText: '#A0A496',
  },
  outline: {
    bg: 'transparent',
    text: colors.headerDark,
    active: 'rgba(58,34,40,0.05)',
    disabledBg: 'transparent',
    disabledText: colors.textMuted,
  },
};

function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const sizeConfig = sizeStyles[size];
  const colorConfig = variantColors[variant];
  const isOutline = variant === 'outline';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => {
        const bg = disabled
          ? colorConfig.disabledBg
          : pressed
            ? colorConfig.active
            : colorConfig.bg;

        return [
          {
            height: isOutline ? undefined : sizeConfig.height,
            borderRadius: sizeConfig.borderRadius,
            paddingHorizontal: isOutline ? 0 : sizeConfig.paddingHorizontal,
            paddingVertical: isOutline ? 8 : 0,
            backgroundColor: bg,
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            alignSelf: fullWidth ? ('stretch' as const) : ('flex-start' as const),
            opacity: loading ? 0.85 : 1,
            ...(!isOutline && variant !== 'secondary' && !disabled ? shadows.card : {}),
          },
          style,
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={disabled ? colorConfig.disabledText : colorConfig.text}
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text
            style={{
              fontFamily: 'Poppins_600SemiBold',
              fontSize: sizeConfig.fontSize,
              color: disabled ? colorConfig.disabledText : colorConfig.text,
              letterSpacing: 0.3,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export default Button;
