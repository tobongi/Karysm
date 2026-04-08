import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HEADER_HEIGHT = 240;
const CURVE_HEIGHT = 50;

function HeaderCurve() {
  const w = Math.min(SCREEN_WIDTH, 480);
  const h = HEADER_HEIGHT + CURVE_HEIGHT;
  // Elegant concave curve like Beauty Master — sweeps from lower-left to upper-right
  const d = `M0,0 L0,${HEADER_HEIGHT - 20} Q${w * 0.25},${HEADER_HEIGHT + CURVE_HEIGHT} ${w * 0.5},${HEADER_HEIGHT - 5} Q${w * 0.75},${HEADER_HEIGHT - CURVE_HEIGHT + 10} ${w},${HEADER_HEIGHT - 40} L${w},0 Z`;

  return (
    <View style={headerStyles.container}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Path d={d} fill={colors.headerDark} />
      </Svg>
      <Text style={headerStyles.title}>Connexion</Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT + CURVE_HEIGHT,
    position: 'relative',
    width: '100%',
  },
  title: {
    position: 'absolute',
    bottom: CURVE_HEIGHT + 30,
    left: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 34,
    color: '#FFFFFF',
    fontStyle: 'italic',
    letterSpacing: -0.3,
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
              {/* Toggle to register */}
              <Pressable onPress={() => router.push('/auth/register')} style={styles.toggleRow}>
                <Text style={styles.toggleText}>
                  Pas encore membre ?{' '}
                  <Text style={styles.toggleLink}>S'inscrire</Text>
                </Text>
              </Pressable>

              {step === 'phone' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                    <TextInput
                      style={[styles.underlineInput, error ? styles.underlineError : null]}
                      placeholder="+243 812 345 678"
                      placeholderTextColor={colors.primaryLight}
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={(t) => { setPhone(t); setError(''); }}
                      autoFocus
                    />
                    {error ? (
                      <Text style={styles.errorText}>{error}</Text>
                    ) : (
                      <Text style={styles.hintText}>
                        Entrez votre numéro avec l'indicatif pays (+243, +225, +221...)
                      </Text>
                    )}
                  </View>

                  <Pressable
                    style={[styles.ctaButton, (loading || phone.length < 3) && styles.ctaDisabled]}
                    onPress={handleSendOTP}
                    disabled={loading || phone.length < 3}
                  >
                    <Text style={styles.ctaText}>
                      {loading ? 'Envoi...' : 'Recevoir le code'}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Code de vérification</Text>
                    <TextInput
                      style={[styles.underlineInput, error ? styles.underlineError : null]}
                      placeholder="1234"
                      placeholderTextColor={colors.primaryLight}
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={(text) => { setOtp(text.slice(0, 4)); setError(''); }}
                      autoFocus
                      maxLength={4}
                    />
                    {error ? (
                      <Text style={styles.errorText}>{error}</Text>
                    ) : (
                      <Text style={styles.hintText}>
                        Code envoyé au {phone}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    style={[styles.ctaButton, (loading || otp.length !== 4) && styles.ctaDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={loading || otp.length !== 4}
                  >
                    <Text style={styles.ctaText}>
                      {loading ? 'Vérification...' : 'Vérifier'}
                    </Text>
                  </Pressable>

                  <Pressable onPress={() => { setStep('phone'); setOtp(''); setError(''); }}>
                    <Text style={styles.changeLink}>Changer de numéro</Text>
                  </Pressable>
                </>
              )}
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
    paddingTop: 8,
  },
  toggleRow: {
    marginBottom: 36,
  },
  toggleText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleLink: {
    fontFamily: 'Poppins_600SemiBold',
    color: colors.headerDark,
    textDecorationLine: 'underline',
  },

  // Underline inputs (Beauty Master style)
  inputGroup: {
    marginBottom: 32,
  },
  inputLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  underlineInput: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 17,
    color: colors.headerDark,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.n300,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  underlineError: {
    borderBottomColor: colors.error,
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

  // CTA button (warm rounded like reference)
  ctaButton: {
    backgroundColor: colors.primaryLight,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Change number link
  changeLink: {
    fontFamily: 'Poppins_500Medium',
    color: colors.headerDark,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});
