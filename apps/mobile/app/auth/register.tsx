import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';
import { PressableScale } from '../../src/components/animations';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HEADER_HEIGHT = 220;
const CURVE_HEIGHT = 40;

function HeaderCurve() {
  const w = Math.min(SCREEN_WIDTH, 480);
  const h = HEADER_HEIGHT + CURVE_HEIGHT;
  const d = `M0,0 L0,${HEADER_HEIGHT - 20} Q${w * 0.25},${HEADER_HEIGHT + CURVE_HEIGHT} ${w * 0.5},${HEADER_HEIGHT - 5} Q${w * 0.75},${HEADER_HEIGHT - CURVE_HEIGHT + 10} ${w},${HEADER_HEIGHT - 40} L${w},0 Z`;

  return (
    <View style={headerStyles.container}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Path d={d} fill={colors.headerDark} />
      </Svg>
      <View style={headerStyles.content}>
        <Text style={headerStyles.wordmark}>Karysm</Text>
        <Text style={headerStyles.tagline}>La beauté à votre image</Text>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT + CURVE_HEIGHT,
    position: 'relative',
    width: '100%',
  },
  content: {
    position: 'absolute',
    bottom: CURVE_HEIGHT + 25,
    left: 28,
    right: 28,
  },
  wordmark: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 44,
    color: '#FFFFFF',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});

export default function Register() {
  const { phone, otp } = useLocalSearchParams<{ phone: string; otp: string }>();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    if (name.trim().length < 2) {
      setError('Nom requis (minimum 2 caractères)');
      return;
    }
    if (!otp) {
      showAlert('Erreur', 'Code OTP manquant. Veuillez recommencer la verification.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res: any = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ phone, name: name.trim(), otp }),
      });
      await login(res.token, res.refreshToken, res.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'inscription');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.webWrapper}>
        <HeaderCurve />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Phone display hint */}
          {phone ? (
            <View style={styles.phoneHintBox}>
              <Text style={styles.phoneHintLabel}>Numéro de téléphone</Text>
              <Text style={styles.phoneHintValue}>{phone}</Text>
            </View>
          ) : null}

          {/* Name input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Votre prénom</Text>
            <View style={[styles.inputContainer, error ? styles.inputContainerError : null]}>
              <TextInput
                style={styles.input}
                placeholder="Ex: Awa"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={(t) => { setName(t); setError(''); }}
                autoFocus
              />
            </View>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.hintText}>
                Nous utiliserons votre prénom dans vos réservations
              </Text>
            )}
          </View>

          {/* CTA button */}
          <PressableScale
            onPress={handleRegister}
            disabled={loading || name.trim().length < 2}
            style={[
              styles.ctaButton,
              (loading || name.trim().length < 2) && styles.ctaDisabled,
            ]}
          >
            <Text style={styles.ctaText}>
              {loading ? 'Création...' : 'Commencer'}
            </Text>
          </PressableScale>

          {/* Terms hint */}
          <Text style={styles.termsText}>
            En continuant, vous acceptez nos{' '}
            <Text style={styles.termsLink}>Conditions d'utilisation</Text>
          </Text>

          {/* Toggle to login */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Déjà membre ? </Text>
            <PressableScale onPress={() => router.back()}>
              <Text style={styles.footerLink}>Se connecter</Text>
            </PressableScale>
          </View>
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

  /* ── Form area ── */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
  },

  /* Phone hint box */
  phoneHintBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 28,
  },
  phoneHintLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  phoneHintValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.text,
  },

  /* Card-style input container */
  inputGroup: {
    marginBottom: 28,
  },
  inputLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: colors.text,
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  input: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  hintText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.error,
    marginTop: 8,
  },

  /* CTA pill — accent violet */
  ctaButton: {
    backgroundColor: colors.accent,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* Terms text */
  termsText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  termsLink: {
    fontFamily: 'Poppins_600SemiBold',
    color: colors.accent,
    textDecorationLine: 'underline',
  },

  /* Footer login link */
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: 'Poppins_600SemiBold',
    color: colors.accent,
    textDecorationLine: 'underline',
  },
});
