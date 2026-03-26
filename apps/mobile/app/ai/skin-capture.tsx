import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Image, Switch, Animated, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { pickImage } from '../../src/lib/upload';
import { showAlert } from '../../src/lib/alert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_SIZE = Math.min(SCREEN_WIDTH - 40, 340);

const TIPS = [
  { icon: '☀️', title: 'Lumière naturelle', desc: 'Face à une fenêtre' },
  { icon: '👁️', title: 'Regard caméra', desc: 'Visage droit, yeux ouverts' },
  { icon: '🧼', title: 'Peau nue', desc: 'Sans maquillage' },
];

// Scan line animation
function ScanLine({ active }: { active: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    } else {
      anim.setValue(0);
    }
  }, [active]);

  if (!active) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-SCAN_SIZE / 2 + 20, SCAN_SIZE / 2 - 20] });

  return (
    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
  );
}

// Floating detection badges that appear during/after scan
function DetectionBadge({ label, value, position, delay, visible }: {
  label: string; value: string; position: { top?: number; bottom?: number; left?: number; right?: number };
  delay: number; visible: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.5);
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.detectionBadge, position, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.detectionLabel}>{label}</Text>
      <Text style={styles.detectionValue}>{value}</Text>
    </Animated.View>
  );
}

export default function SkinCaptureScreen() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'detected'>('idle');
  const [consent, setConsent] = useState(false);

  // Pulse animation for the oval frame
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (scanPhase === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [scanPhase]);

  async function handleTakePhoto() {
    const base64 = await pickImage();
    if (base64) {
      setPhoto(base64);
      setPhotoUri(`data:image/jpeg;base64,${base64}`);
      // Simulate scanning effect
      setScanPhase('scanning');
      setTimeout(() => setScanPhase('detected'), 2500);
    }
  }

  async function handleAnalyze() {
    if (!photo) return;
    setAnalyzing(true);
    setScanPhase('scanning');
    try {
      const res: any = await api('/ai/skin-analysis', {
        method: 'POST',
        body: JSON.stringify({ data: photo, consentDataset: consent }),
      });
      router.replace(`/ai/skin-results/${res.data.id}`);
    } catch (err: any) {
      showAlert('Erreur', err.message || "Impossible d'analyser la photo");
      setAnalyzing(false);
      setScanPhase('detected');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Analyse de peau</Text>
        <Text style={styles.subtitle}>
          {scanPhase === 'idle'
            ? 'Prenez un selfie en bonne lumière pour analyser votre peau'
            : scanPhase === 'scanning'
            ? 'Analyse du visage en cours...'
            : 'Visage détecté — prête pour l\'analyse'}
        </Text>

        {/* Face scanner area */}
        <View style={styles.scannerContainer}>
          {photoUri ? (
            <View style={styles.scannerFrame}>
              <Image source={{ uri: photoUri }} style={styles.scannerImage} />

              {/* Oval face frame overlay */}
              <Animated.View style={[styles.ovalFrame, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.ovalBorder} />
              </Animated.View>

              {/* Corner brackets */}
              <View style={[styles.cornerBracket, styles.cornerTL]} />
              <View style={[styles.cornerBracket, styles.cornerTR]} />
              <View style={[styles.cornerBracket, styles.cornerBL]} />
              <View style={[styles.cornerBracket, styles.cornerBR]} />

              {/* Scan line */}
              <ScanLine active={scanPhase === 'scanning' || analyzing} />

              {/* Detection dots */}
              {scanPhase === 'detected' && !analyzing && (
                <>
                  <View style={[styles.detectionDot, { top: '25%', left: '35%' }]} />
                  <View style={[styles.detectionDot, { top: '25%', right: '35%' }]} />
                  <View style={[styles.detectionDot, { top: '45%', left: '28%' }]} />
                  <View style={[styles.detectionDot, { top: '45%', right: '28%' }]} />
                  <View style={[styles.detectionDot, { top: '65%', left: '42%' }]} />
                  <View style={[styles.detectionDot, { top: '75%', left: '50%' }]} />
                </>
              )}

              {/* Floating detection badges */}
              <DetectionBadge
                label="Type de peau" value="Détecté ✓"
                position={{ top: 10, right: -10 }} delay={300}
                visible={scanPhase === 'detected' && !analyzing}
              />
              <DetectionBadge
                label="Carnation" value="Analyse..."
                position={{ top: '40%', left: -10 }} delay={600}
                visible={scanPhase === 'detected' && !analyzing}
              />
              <DetectionBadge
                label="Hydratation" value="Analyse..."
                position={{ bottom: '20%', right: -10 }} delay={900}
                visible={scanPhase === 'detected' && !analyzing}
              />
            </View>
          ) : (
            <Pressable style={styles.captureZone} onPress={handleTakePhoto}>
              {/* Empty oval guide */}
              <View style={styles.ovalGuide}>
                <View style={styles.ovalGuideBorder} />
                <Text style={styles.ovalGuideIcon}>👤</Text>
              </View>
              <Text style={styles.captureText}>Touchez pour prendre un selfie</Text>
              <View style={styles.captureHint}>
                <Text style={styles.captureHintText}>Placez votre visage dans l'ovale</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Tips */}
        {!photoUri && (
          <View style={styles.tipsRow}>
            {TIPS.map((tip, i) => (
              <View key={i} style={styles.tipCard}>
                <Text style={styles.tipIcon}>{tip.icon}</Text>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions after photo */}
        {photoUri && scanPhase === 'detected' && !analyzing && (
          <>
            {/* Retake */}
            <Pressable style={styles.retakeButton} onPress={handleTakePhoto}>
              <Text style={styles.retakeText}>📷 Reprendre la photo</Text>
            </Pressable>

            {/* Consent */}
            <View style={styles.consentRow}>
              <Switch
                value={consent}
                onValueChange={setConsent}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={consent ? colors.primary : colors.textMuted}
              />
              <Text style={styles.consentText}>
                J'accepte que ma photo soit utilisée anonymement pour améliorer le service
              </Text>
            </View>

            {/* Analyze CTA */}
            <Pressable style={styles.analyzeButton} onPress={handleAnalyze}>
              <Text style={styles.analyzeText}>✨ Lancer l'analyse complète</Text>
            </Pressable>
          </>
        )}

        {/* Analyzing state */}
        {analyzing && (
          <View style={styles.analyzingContainer}>
            <View style={styles.analyzingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.analyzingTitle}>Analyse en cours</Text>
              <Text style={styles.analyzingDesc}>
                Détection de la carnation, hydratation,{'\n'}sébum, pores, taches, uniformité...
              </Text>
              <View style={styles.analyzingSteps}>
                <AnalysisStep label="Détection du visage" done />
                <AnalysisStep label="Analyse de la carnation" done={false} active />
                <AnalysisStep label="Évaluation des conditions" done={false} />
                <AnalysisStep label="Recommandations personnalisées" done={false} />
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AnalysisStep({ label, done, active }: { label: string; done: boolean; active?: boolean }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
        {done && <Text style={styles.stepCheck}>✓</Text>}
        {active && <ActivityIndicator size="small" color={colors.white} />}
      </View>
      <Text style={[styles.stepLabel, done && styles.stepLabelDone, active && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1 },
  content: { padding: 20 },

  title: { fontSize: 22, fontWeight: '700', color: colors.white, marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 20, marginBottom: 20 },

  // Scanner
  scannerContainer: { alignItems: 'center', marginBottom: 24 },
  scannerFrame: {
    width: SCAN_SIZE, height: SCAN_SIZE * 1.2,
    borderRadius: 20, overflow: 'visible', position: 'relative',
  },
  scannerImage: {
    width: '100%', height: '100%', borderRadius: 20,
  },

  // Oval frame
  ovalFrame: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
  },
  ovalBorder: {
    width: '70%', height: '80%', borderRadius: 999,
    borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed',
  },

  // Corner brackets
  cornerBracket: {
    position: 'absolute', width: 28, height: 28,
    borderColor: colors.white,
  },
  cornerTL: { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },

  // Scan line
  scanLine: {
    position: 'absolute', left: 20, right: 20, height: 2,
    backgroundColor: colors.primary, top: '50%',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 10,
  },

  // Detection dots
  detectionDot: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 6,
  },

  // Detection badges
  detectionBadge: {
    position: 'absolute', backgroundColor: 'rgba(10,10,10,0.85)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
    backdropFilter: 'blur(10px)',
  },
  detectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 0.5 },
  detectionValue: { fontSize: 13, color: colors.white, fontWeight: '700', marginTop: 2 },

  // Capture zone (empty state)
  captureZone: {
    width: SCAN_SIZE, height: SCAN_SIZE * 1.2,
    backgroundColor: 'rgba(124,58,237,0.06)', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  ovalGuide: {
    width: SCAN_SIZE * 0.6, height: SCAN_SIZE * 0.8,
    justifyContent: 'center', alignItems: 'center',
  },
  ovalGuideBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999, borderWidth: 2, borderColor: 'rgba(124,58,237,0.3)', borderStyle: 'dashed',
  },
  ovalGuideIcon: { fontSize: 48, opacity: 0.3 },
  captureText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginTop: 16 },
  captureHint: {
    marginTop: 8, backgroundColor: 'rgba(124,58,237,0.1)',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100,
  },
  captureHintText: { fontSize: 12, color: colors.primaryLight },

  // Tips
  tipsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tipCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tipIcon: { fontSize: 22, marginBottom: 6 },
  tipTitle: { fontSize: 11, fontWeight: '600', color: colors.white, textAlign: 'center' },
  tipDesc: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 2 },

  // Retake
  retakeButton: {
    alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 16,
  },
  retakeText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },

  // Consent
  consentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16,
  },
  consentText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 17 },

  // Analyze CTA
  analyzeButton: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  analyzeText: { color: colors.white, fontSize: 17, fontWeight: '700' },

  // Analyzing state
  analyzingContainer: { marginTop: 8 },
  analyzingCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  analyzingTitle: { fontSize: 18, fontWeight: '700', color: colors.white, marginTop: 16, marginBottom: 4 },
  analyzingDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  analyzingSteps: { width: '100%', gap: 12 },

  // Analysis steps
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  stepDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepCheck: { fontSize: 14, color: colors.white, fontWeight: '700' },
  stepLabel: { fontSize: 14, color: 'rgba(255,255,255,0.3)' },
  stepLabelDone: { color: 'rgba(255,255,255,0.7)' },
  stepLabelActive: { color: colors.white, fontWeight: '600' },
});
