import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';

export default function Register() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (name.length < 2) return;
    setLoading(true);
    try {
      // Send a new OTP for registration
      await api('/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) });

      const res: any = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ phone, name, otp: otp || '1234' }),
      });
      await login(res.token, res.refreshToken, res.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={styles.title}>Creer un compte</Text>
        <Text style={styles.subtitle}>Bienvenue sur Tokoss !</Text>

        <Text style={styles.label}>Votre nom</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Marie Kabila"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Code OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="1234"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={4}
          value={otp}
          onChangeText={setOtp}
        />

        <Text style={styles.phoneText}>Numero: {phone}</Text>

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creation...' : 'Creer mon compte'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  phoneText: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
