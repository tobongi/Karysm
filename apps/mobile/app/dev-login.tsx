import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';
import { useAuth } from '../src/lib/auth-context';
import { api } from '../src/lib/api';

const DEV_PHONE = '+243812340000';
const DEV_OTP = '1234';

export default function DevLogin() {
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    autoLogin();
  }, []);

  async function autoLogin() {
    setStatus('loading');
    setErrorMsg('');
    try {
      // Single call — no prior send needed when DEMO_OTP is set on the API
      const res = await api<any>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: DEV_PHONE, otp: DEV_OTP }),
      });

      await login(res.token, res.refreshToken, res.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Connexion impossible');
    }
  }

  if (status === 'loading') {
    return (
      <View style={styles.screen}>
        <Text style={styles.logo}>Karysm</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        <Text style={styles.hint}>Connexion dev…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>Karysm</Text>
      <Text style={styles.errorTitle}>Échec connexion dev</Text>
      <Text style={styles.errorMsg}>{errorMsg}</Text>
      <Pressable style={styles.btn} onPress={autoLogin}>
        <Text style={styles.btnText}>Réessayer</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/auth/login')}>
        <Text style={styles.fallbackLink}>Connexion normale →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logo: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontStyle: 'italic',
    fontSize: 42,
    color: colors.accent,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  hint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 16,
  },
  errorTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.error,
    marginTop: 24,
    marginBottom: 8,
  },
  errorMsg: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 27,
    marginTop: 24,
  },
  btnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  fallbackLink: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.headerDark,
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});
