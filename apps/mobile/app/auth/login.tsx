import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
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
  // Elegant concave curve — sweeps from lower-left to upper-right
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
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.webWrapper}>
            <HeaderCurve />

            {/* Form area */}
            <View style={styles.formArea}>
              {step === 'phone' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                    <View style={[styles.inputContainer, error ? styles.inputContainerError : null]}>
                      <TextInput
                        style={styles.input}
                        placeholder="+243 812 345 678"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={(t) => { setPhone(t); setError(''); }}
                        autoFocus
                      />
                    </View>
                    {error ? (
                      <Text style={styles.errorText}>{error}</Text>
                    ) : (
                      <Text style={styles.hintText}>
                        Entrez votre numéro avec l'indicatif pays
                      </Text>
                    )}
                  </View>

                  <PressableScale
                    onPress={handleSendOTP}
                    disabled={loading || phone.length < 3}
                    style={[styles.ctaButton, (loading || phone.length < 3) && styles.ctaDisabled]}
                  >
                    <Text style={styles.ctaText}>
                      {loading ? 'Envoi...' : 'Envoyer le code'}
                    </Text>
                  </PressableScale>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Code de vérification</Text>
                    <View style={[styles.inputContainer, error ? styles.inputContainerError : null]}>
                      <TextInput
                        style={styles.input}
                        placeholder="1234"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        value={otp}
                        onChangeText={(text) => { setOtp(text.slice(0, 4)); setError(''); }}
                        autoFocus
                        maxLength={4}
                      />
                    </View>
                    {error ? (
                      <Text style={styles.errorText}>{error}</Text>
                    ) : (
                      <Text style={styles.hintText}>
                        Code envoyé au {phone}
                      </Text>
                    )}
                  </View>

                  <PressableScale
                    onPress={handleVerifyOTP}
                    disabled={loading || otp.length !== 4}
                    style={[styles.ctaButton, (loading || otp.length !== 4) && styles.ctaDisabled]}
                  >
                    <Text style={styles.ctaText}>
                      {loading ? 'Vérification...' : 'Vérifier'}
                    </Text>
                  </PressableScale>

                  <PressableScale onPress={() => { setStep('phone'); setOtp(''); setError(''); }}>
                    <Text style={styles.changeLink}>Changer de numéro</Text>
                  </PressableScale>
                </>
              )}

              {/* Toggle to register — at bottom */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>
                  Pas encore membre ?{' '}
                </Text>
                <PressableScale onPress={() => router.push('/auth/register')}>
                  <Text style={styles.footerLink}>S'inscrire</Text>
                </PressableScale>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  webWrapper: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  // Form area
  formArea: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },

  // Card-style input container
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

  // CTA button — accent violet, rounded pill
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

  // Change number link
  changeLink: {
    fontFamily: 'Poppins_500Medium',
    color: colors.accent,
    textAlign: 'center',
    fontSize: 14,
  },

  // Footer register link
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
