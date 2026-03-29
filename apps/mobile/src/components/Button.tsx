import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';

type ButtonVariant = 'primary' | 'secondary';
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
    bg: colors.primary,        // #CA987E
    text: '#FFFFFF',
    active: colors.primaryDark, // #A77366
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
  const fontFamily = size === 'sm' ? 'Poppins_600SemiBold' : 'Poppins_400Regular';

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
            height: sizeConfig.height,
            borderRadius: sizeConfig.borderRadius,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            backgroundColor: bg,
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            alignSelf: fullWidth ? ('stretch' as const) : ('flex-start' as const),
            opacity: loading ? 0.85 : 1,
            ...(variant === 'primary' && !disabled ? shadows.card : {}),
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
              fontFamily,
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
