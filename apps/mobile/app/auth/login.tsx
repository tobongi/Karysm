import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';
import { Button, Input } from '../../src/components';

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
        <Text style={styles.subtitle}>Beaute & bien-etre</Text>

        {step === 'phone' ? (
          <>
            <Input
              label="Numero de telephone"
              placeholder="+243 812 345 678"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              hint="Entrez votre numero avec l'indicatif pays (+243, +225, +221...)"
              error={error || undefined}
            />

            <Button
              title={loading ? 'Envoi...' : 'Recevoir le code'}
              onPress={handleSendOTP}
              disabled={loading || phone.length < 3}
              loading={loading}
              size="lg"
              fullWidth
            />
          </>
        ) : (
          <>
            <Input
              label="Code de verification"
              placeholder="1234"
              keyboardType="number-pad"
              value={otp}
              onChangeText={(text) => setOtp(text.slice(0, 4))}
              hint={`Code envoye au ${phone}`}
              error={error || undefined}
            />

            <Button
              title={loading ? 'Verification...' : 'Verifier'}
              onPress={handleVerifyOTP}
              disabled={loading || otp.length !== 4}
              loading={loading}
              size="lg"
              fullWidth
            />

            <Pressable onPress={() => { setStep('phone'); setOtp(''); setError(''); }}>
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
  logo: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32, color: colors.accent,
    textAlign: 'center', marginBottom: 8, fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12, color: colors.textMuted,
    textAlign: 'center', marginBottom: 48, letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  link: {
    fontFamily: 'Poppins_500Medium',
    color: colors.primaryDark, textAlign: 'center',
    marginTop: 16, fontSize: 14,
  },
});
