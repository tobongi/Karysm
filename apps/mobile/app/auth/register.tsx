import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';

export default function Register() {
  const { phone, otp } = useLocalSearchParams<{ phone: string; otp: string }>();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (name.trim().length < 2) {
      showAlert('Nom requis', 'Veuillez entrer votre nom (minimum 2 caractères).');
      return;
    }
    if (!otp) {
      showAlert('Erreur', 'Code OTP manquant. Veuillez recommencer la vérification.');
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

        <TextInput
          style={styles.input}
          placeholder="Votre nom"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
        />

        <Text style={styles.phoneText}>{phone}</Text>

        <Pressable
          style={[styles.button, (loading || name.trim().length < 2) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading || name.trim().length < 2}
        >
          <Text style={styles.buttonText}>{loading ? 'Création...' : 'Commencer'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: '700', color: colors.accent, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  phoneText: { fontSize: 13, color: colors.textMuted, marginBottom: 24 },
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
