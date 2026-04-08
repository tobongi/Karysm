import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';
import Input from '../../src/components/Input';

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.webWrapper}>
        {/* Dark triangle header */}
        <View style={styles.headerBlock}>
          <View style={styles.triangleClip}>
            <View style={styles.triangleRect} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Inscription</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Toggle link */}
          <Pressable onPress={() => router.back()} style={styles.toggleRow}>
            <Text style={styles.toggleText}>
              Deja membre ?{' '}
              <Text style={styles.toggleLink}>Se connecter</Text>
            </Text>
          </Pressable>

          {/* Phone hint */}
          {phone ? (
            <Text style={styles.phoneHint}>{phone}</Text>
          ) : null}

          {/* Name input */}
          <Input
            label="Votre prenom"
            placeholder="Ex: Awa"
            value={name}
            onChangeText={setName}
            variant="underline"
          />

          {/* CTA button */}
          <Pressable
            onPress={handleRegister}
            disabled={loading || name.trim().length < 2}
            style={[
              styles.ctaButton,
              (loading || name.trim().length < 2) && styles.ctaButtonDisabled,
            ]}
          >
            <Text style={styles.ctaText}>
              {loading ? 'Creation...' : 'Commencer'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webWrapper: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  /* ── Dark triangle header ── */
  headerBlock: {
    height: 220,
    backgroundColor: colors.headerDark,
    overflow: 'hidden',
    position: 'relative',
  },
  triangleClip: {
    position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
    height: 120,
    overflow: 'hidden',
  },
  triangleRect: {
    width: '150%',
    height: 120,
    backgroundColor: colors.bg,
    transform: [{ rotate: '-6deg' }],
    position: 'absolute',
    bottom: 0,
    left: '-25%',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 36,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  /* ── Form area ── */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 40,
  },
  toggleRow: {
    alignItems: 'center',
    marginBottom: 32,
  },
  toggleText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  toggleLink: {
    fontFamily: 'Poppins_600SemiBold',
    color: colors.headerDark,
    textDecorationLine: 'underline',
  },
  phoneHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  /* ── CTA pill ── */
  ctaButton: {
    backgroundColor: colors.primaryLight,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
