import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleProp,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';

type InputVariant = 'bordered' | 'underline';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  variant?: InputVariant;
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  secureTextEntry,
  keyboardType,
  multiline = false,
  icon,
  rightIcon,
  style,
  inputStyle,
  variant = 'bordered',
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const isUnderline = variant === 'underline';

  const borderColor = error
    ? colors.error
    : focused
      ? (isUnderline ? colors.headerDark : 'rgba(91,33,182,0.5)')
      : colors.border;

  return (
    <View style={[{ marginBottom: isUnderline ? 20 : 16 }, style]}>
      {label && (
        <Text
          style={{
            fontFamily: 'Poppins_600SemiBold',
            fontSize: isUnderline ? 12 : 13,
            color: isUnderline ? colors.textMuted : colors.text,
            marginBottom: isUnderline ? 4 : 8,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={isUnderline ? {
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
          paddingBottom: 8,
        } : {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: (error || focused) ? borderColor : colors.border,
          borderRadius: 24,
          paddingHorizontal: 16,
          minHeight: multiline ? 100 : 48,
          ...shadows.card,
        }}
      >
        {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isUnderline ? colors.primaryLight : colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            {
              flex: 1,
              fontFamily: 'Poppins_400Regular',
              fontSize: isUnderline ? 16 : 14,
              color: colors.text,
              paddingVertical: isUnderline ? 4 : 16,
            },
            inputStyle,
          ]}
        />
        {rightIcon && <View style={{ marginLeft: 10 }}>{rightIcon}</View>}
      </View>

      {error ? (
        <Text
          style={{
            fontFamily: 'Poppins_400Regular',
            fontSize: 13,
            color: colors.error,
            marginTop: 6,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          style={{
            fontFamily: 'Poppins_400Regular',
            fontSize: 12,
            color: colors.textMuted,
            marginTop: 6,
            marginLeft: 4,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export default Input;
