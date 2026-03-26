import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';

export default function Login() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendOTP() {
    if (phone.length < 3) return;
    setLoading(true);
    setError('');
    try {
      await api('/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) });
      setStep('otp');
    } catch (e: any) {
      setError(e.message || 'Impossible d\'envoyer le code');
    }
    setLoading(false);
  }

  async function handleVerifyOTP() {
    if (otp.length !== 4) return;
    setLoading(true);
    setError('');
    try {
      const res: any = await api('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, otp }) });
      if (res.isNewUser) {
        router.push({ pathname: '/auth/register', params: { phone, otp } });
      } else {
        await login(res.token, res.refreshToken, res.user);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setError(e.message || 'Code invalide');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={styles.logo}>Tokoss</Text>
        <Text style={styles.subtitle}>Beauté & bien-être</Text>

        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="+243 812 345 678"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
            <Text style={styles.hint}>Entrez votre numéro avec l'indicatif pays (+243, +225, +221...)</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.button, (loading || phone.length < 3) && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading || phone.length < 3}
            >
              <Text style={styles.buttonText}>{loading ? 'Envoi...' : 'Recevoir le code'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Code de vérification</Text>
            <TextInput
              style={styles.input}
              placeholder="1234"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
              autoFocus
            />
            <Text style={styles.hint}>Code envoyé au {phone}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.button, (loading || otp.length !== 4) && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading || otp.length !== 4}
            >
              <Text style={styles.buttonText}>{loading ? 'Vérification...' : 'Vérifier'}</Text>
            </Pressable>

            <Pressable onPress={() => { setStep('phone'); setOtp(''); setError(''); }}>
              <Text style={styles.link}>Changer de numéro</Text>
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
  logo: {
    fontSize: 36, fontWeight: '700', color: colors.accent,
    textAlign: 'center', marginBottom: 4, fontStyle: 'italic',
  },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 48, letterSpacing: 0.5 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8, letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 18, color: colors.text, marginBottom: 8,
  },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  error: {
    fontSize: 13, color: colors.error, marginBottom: 8,
    backgroundColor: 'rgba(239,68,68,0.08)', padding: 10, borderRadius: 8,
  },
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  link: { color: colors.primary, textAlign: 'center', marginTop: 16, fontSize: 14 },
});
