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
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
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
  style,
  inputStyle,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const hasBorder = !!error || focused;
  const borderColor = error
    ? colors.error
    : focused
      ? 'rgba(124,58,237,0.4)'
      : 'transparent';

  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label && (
        <Text
          style={{
            fontFamily: 'Poppins_600SemiBold',
            fontSize: 13,
            color: colors.text,
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderWidth: hasBorder ? 1 : 0,
          borderColor,
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
          placeholderTextColor={colors.textMuted}
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
              fontSize: 14,
              color: colors.text,
              paddingVertical: 16,
            },
            inputStyle,
          ]}
        />
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
