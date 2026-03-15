import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';

export default function Login() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  async function handleSendOTP() {
    if (phone.length < 9) return;
    setLoading(true);
    try {
      await api('/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) });
      setStep('otp');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
    setLoading(false);
  }

  async function handleVerifyOTP() {
    if (otp.length !== 4) return;
    setLoading(true);
    try {
      const res: any = await api('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, otp }) });
      if (res.isNewUser) {
        router.push({ pathname: '/auth/register', params: { phone } });
      } else {
        await login(res.token, res.refreshToken, res.user);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={styles.logo}>Tokoss</Text>
        <Text style={styles.subtitle}>Beaute & bien-etre a domicile</Text>

        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Numero de telephone</Text>
            <TextInput
              style={styles.input}
              placeholder="081 234 5678"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendOTP} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Envoi...' : 'Recevoir le code'}</Text>
            </Pressable>
          </>
        ) : (
          <>
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
            <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerifyOTP} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Verification...' : 'Verifier'}</Text>
            </Pressable>
            <Pressable onPress={() => setStep('phone')}>
              <Text style={styles.link}>Changer de numero</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 40, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 48 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  link: { color: colors.primary, textAlign: 'center', marginTop: 16, fontSize: 14 },
});
