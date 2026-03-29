import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';
import { Button, Input } from '../../src/components';

export default function Register() {
  const { phone, otp } = useLocalSearchParams<{ phone: string; otp: string }>();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (name.trim().length < 2) {
      showAlert('Nom requis', 'Veuillez entrer votre nom (minimum 2 caracteres).');
      return;
    }
    if (!otp) {
      showAlert('Erreur', 'Code OTP manquant. Veuillez recommencer la verification.');
      return;
    }
    setLoading(true);
    try {
      const res: any = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ phone, name: name.trim(), otp }),
      });
      await login(res.token, res.refreshToken, res.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      showAlert('Erreur', e.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>Comment vous appelez-vous ?</Text>

        <Input
          label="Votre nom"
          placeholder="Ex: Awa Diallo"
          value={name}
          onChangeText={setName}
          hint={phone || ''}
        />

        <Button
          title={loading ? 'Creation...' : 'Commencer'}
          onPress={handleRegister}
          disabled={loading || name.trim().length < 2}
          loading={loading}
          size="lg"
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28, color: colors.accent, marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16, color: colors.textSecondary, marginBottom: 32,
  },
});
