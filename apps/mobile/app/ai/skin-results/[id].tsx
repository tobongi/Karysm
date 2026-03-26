import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Image, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../../src/theme/colors';
import { api } from '../../../src/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FACE_SIZE = Math.min(SCREEN_WIDTH - 40, 340);

const MONK_COLORS: Record<number, string> = {
  1: '#F6EDE4', 2: '#EEDAC4', 3: '#D9BC9D', 4: '#C4A584',
  5: '#AF8968', 6: '#967050', 7: '#78553A', 8: '#5A3C28',
  9: '#3C2819', 10: '#28190F',
};

const MONK_LABELS: Record<number, string> = {
  1: 'Très clair', 2: 'Clair', 3: 'Clair moyen', 4: 'Moyen',
  5: 'Moyen foncé', 6: 'Foncé clair', 7: 'Foncé', 8: 'Foncé profond',
  9: 'Très foncé', 10: 'Ébène',
};

const CONDITIONS = [
  { key: 'hydration', label: 'Hydratation', icon: '💧', desc: 'Niveau d\'eau dans la peau — essentiel pour la souplesse et l\'éclat', invert: false },
  { key: 'sebum', label: 'Sébum', icon: '🧴', desc: 'Production de sébum — un excès peut causer brillance et imperfections', invert: true },
  { key: 'pores', label: 'Pores', icon: '🔍', desc: 'Visibilité des pores — influencée par le sébum et l\'âge', invert: true },
  { key: 'wrinkles', label: 'Rides', icon: '〰️', desc: 'Lignes fines et rides — liées à l\'hydratation et la protection solaire', invert: true },
  { key: 'spots', label: 'Taches', icon: '🌸', desc: 'Taches pigmentaires — causées par le soleil ou l\'inflammation', invert: true },
  { key: 'acne', label: 'Acné', icon: '🌿', desc: 'Imperfections actives — boutons, points noirs, inflammations', invert: true },
  { key: 'hyperpigmentation', label: 'Hyperpigmentation', icon: '✨', desc: 'Zones plus foncées — fréquent sur les peaux riches en mélanine', invert: true },
  { key: 'uniformity', label: 'Uniformité', icon: '🌺', desc: 'Régularité du teint — un teint uniforme reflète une peau saine', invert: false },
];

// Positions des points de détection sur le visage (relatifs)
const FACE_POINTS = [
  { key: 'hydration', top: '22%', left: '52%', label: 'Hydratation' },
  { key: 'sebum', top: '35%', left: '30%', label: 'Sébum' },
  { key: 'pores', top: '35%', right: '28%', label: 'Pores' },
  { key: 'acne', top: '50%', left: '35%', label: 'Acné' },
  { key: 'spots', top: '50%', right: '33%', label: 'Taches' },
  { key: 'hyperpigmentation', top: '68%', left: '45%', label: 'Hyperpigm.' },
];

function getScoreColor(value: number, invert: boolean): string {
  const effective = invert ? 100 - value : value;
  if (effective >= 70) return colors.success;
  if (effective >= 40) return colors.warning;
  return colors.error;
}

function getScoreLabel(value: number, invert: boolean): string {
  const effective = invert ? 100 - value : value;
  if (effective >= 70) return 'Bon';
  if (effective >= 40) return 'Moyen';
  return 'Attention';
}

interface SkinData {
  id: string;
  selfieUrl: string;
  monkTone: number | null;
  undertone: string | null;
  labL: number | null;
  labA: number | null;
  labB: number | null;
  itaAngle: number | null;
  melaninIndex: number | null;
  hydration: number | null;
  sebum: number | null;
  pores: number | null;
  wrinkles: number | null;
  spots: number | null;
  acne: number | null;
  hyperpigmentation: number | null;
  uniformity: number | null;
  overallScore: number | null;
  recommendations: string[] | null;
  createdAt: string;
}

// Animated face point component
function FacePoint({ position, label, value, color, delay }: {
  position: any; label: string; value: number; color: string; delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.facePoint, position, { opacity, transform: [{ scale }] }]}>
      <View style={[styles.facePointDot, { borderColor: color }]}>
        <View style={[styles.facePointCenter, { backgroundColor: color }]} />
      </View>
      <View style={[styles.facePointLabel, { borderColor: color }]}>
        <Text style={styles.facePointLabelText}>{label}</Text>
        <Text style={[styles.facePointValue, { color }]}>{value}%</Text>
      </View>
    </Animated.View>
  );
}

export default function SkinResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<SkinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'report' | 'details' | 'tips'>('report');

  useEffect(() => {
    (async () => {
      try {
        const res: any = await api(`/ai/skin-analysis/${id}`);
        setData(res.data);
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Analyse introuvable</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── SKIN REPORT Header ── */}
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>SKIN REPORT</Text>
          <Text style={styles.reportDate}>
            {new Date(data.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* ── Face Map with detection points ── */}
        <View style={styles.faceMapContainer}>
          <Image source={{ uri: data.selfieUrl }} style={styles.faceImage} />

          {/* Detection points on face */}
          {FACE_POINTS.map((point, i) => {
            const value = (data as any)[point.key] as number | null;
            if (value == null) return null;
            const condition = CONDITIONS.find(c => c.key === point.key);
            const color = getScoreColor(value, condition?.invert || false);
            const pos: any = {};
            if (point.top) pos.top = point.top;
            if (point.left) pos.left = point.left;
            if (point.right) pos.right = point.right;
            return (
              <FacePoint
                key={point.key}
                position={pos}
                label={point.label}
                value={value}
                color={color}
                delay={i * 200}
              />
            );
          })}
        </View>

        {/* ── Monk Tone + Score row ── */}
        <View style={styles.monkScoreRow}>
          {data.monkTone != null && (
            <View style={styles.monkCard}>
              <View style={[styles.monkCircleLarge, { backgroundColor: MONK_COLORS[data.monkTone] || '#888' }]}>
                <Text style={[styles.monkNumber, { color: data.monkTone >= 6 ? '#FFF' : '#1A1A1A' }]}>
                  {data.monkTone}
                </Text>
              </View>
              <Text style={styles.monkCardTitle}>Carnation</Text>
              <Text style={styles.monkCardLabel}>{MONK_LABELS[data.monkTone] || ''}</Text>
            </View>
          )}

          {data.overallScore != null && (
            <View style={styles.scoreCardCompact}>
              <View style={styles.scoreRing}>
                <Text style={styles.scoreRingNumber}>{data.overallScore}</Text>
              </View>
              <Text style={styles.scoreCardTitle}>Score santé</Text>
              <Text style={styles.scoreCardLabel}>
                {data.overallScore >= 70 ? 'Excellent' : data.overallScore >= 50 ? 'Bon' : 'À améliorer'}
              </Text>
            </View>
          )}

          {data.undertone && (
            <View style={styles.undertoneCard}>
              <Text style={styles.undertoneEmoji}>
                {data.undertone === 'WARM' ? '🌅' : data.undertone === 'COOL' ? '❄️' : '⚖️'}
              </Text>
              <Text style={styles.undertoneCardTitle}>Sous-ton</Text>
              <Text style={styles.undertoneCardLabel}>
                {data.undertone === 'WARM' ? 'Chaud' : data.undertone === 'COOL' ? 'Froid' : 'Neutre'}
              </Text>
            </View>
          )}
        </View>

        {/* ── Tab bar: Report / Details / Tips ── */}
        <View style={styles.tabBar}>
          {[
            { key: 'report', label: 'Rapport' },
            { key: 'details', label: 'Détails' },
            { key: 'tips', label: 'Conseils' },
          ].map(tab => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── REPORT TAB — Condition cards ── */}
        {activeTab === 'report' && (
          <View style={styles.conditionsSection}>
            {CONDITIONS.map((condition) => {
              const value = (data as any)[condition.key] as number | null;
              if (value == null) return null;
              const barColor = getScoreColor(value, condition.invert);
              const scoreLabel = getScoreLabel(value, condition.invert);

              return (
                <View key={condition.key} style={styles.conditionCard}>
                  <View style={styles.conditionHeader}>
                    <Text style={styles.conditionIcon}>{condition.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.conditionName}>{condition.label}</Text>
                      <Text style={styles.conditionDesc}>{condition.desc}</Text>
                    </View>
                    <View style={styles.conditionScoreBox}>
                      <Text style={[styles.conditionScoreValue, { color: barColor }]}>{value}%</Text>
                      <Text style={[styles.conditionScoreLabel, { color: barColor }]}>{scoreLabel}</Text>
                    </View>
                  </View>
                  <View style={styles.conditionBar}>
                    <View style={[styles.conditionBarFill, { width: `${value}%`, backgroundColor: barColor }]} />
                    <View style={[styles.conditionBarThumb, { left: `${value}%`, borderColor: barColor }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── DETAILS TAB — Technical data ── */}
        {activeTab === 'details' && (
          <View style={styles.detailsSection}>
            <View style={styles.techGrid}>
              {data.labL != null && (
                <View style={styles.techCard}>
                  <Text style={styles.techLabel}>Luminosité (L*)</Text>
                  <Text style={styles.techValue}>{data.labL.toFixed(1)}</Text>
                </View>
              )}
              {data.labA != null && (
                <View style={styles.techCard}>
                  <Text style={styles.techLabel}>Rouge-Vert (a*)</Text>
                  <Text style={styles.techValue}>{data.labA.toFixed(1)}</Text>
                </View>
              )}
              {data.labB != null && (
                <View style={styles.techCard}>
                  <Text style={styles.techLabel}>Jaune-Bleu (b*)</Text>
                  <Text style={styles.techValue}>{data.labB.toFixed(1)}</Text>
                </View>
              )}
              {data.itaAngle != null && (
                <View style={styles.techCard}>
                  <Text style={styles.techLabel}>Angle ITA</Text>
                  <Text style={styles.techValue}>{data.itaAngle.toFixed(1)}°</Text>
                </View>
              )}
              {data.melaninIndex != null && (
                <View style={styles.techCard}>
                  <Text style={styles.techLabel}>Indice mélanine</Text>
                  <Text style={styles.techValue}>{data.melaninIndex}/100</Text>
                </View>
              )}
            </View>

            {/* Monk Scale visualization */}
            {data.monkTone != null && (
              <View style={styles.monkScale}>
                <Text style={styles.monkScaleTitle}>Échelle Monk Skin Tone</Text>
                <View style={styles.monkScaleRow}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(tone => (
                    <View
                      key={tone}
                      style={[
                        styles.monkScaleDot,
                        { backgroundColor: MONK_COLORS[tone] },
                        data.monkTone === tone && styles.monkScaleDotActive,
                      ]}
                    >
                      {data.monkTone === tone && <Text style={styles.monkScaleCheck}>▼</Text>}
                    </View>
                  ))}
                </View>
                <View style={styles.monkScaleLabels}>
                  <Text style={styles.monkScaleLabel}>1</Text>
                  <Text style={styles.monkScaleLabel}>10</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── TIPS TAB — Recommendations ── */}
        {activeTab === 'tips' && (
          <View style={styles.tipsSection}>
            {recommendations.map((rec, i) => (
              <View key={i} style={styles.tipCard}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.tipText}>{rec}</Text>
              </View>
            ))}

            {/* Find provider CTA */}
            <View style={styles.providerCta}>
              <Text style={styles.providerCtaEmoji}>💆</Text>
              <Text style={styles.providerCtaTitle}>Besoin d'un soin professionnel ?</Text>
              <Text style={styles.providerCtaDesc}>Trouvez un spécialiste adapté à votre type de peau</Text>
              <Pressable style={styles.providerCtaButton} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.providerCtaButtonText}>Trouver un prestataire</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Bottom actions ── */}
        <View style={styles.bottomActions}>
          <Pressable style={styles.newAnalysisBtn} onPress={() => router.push('/ai/skin-capture')}>
            <Text style={styles.newAnalysisBtnText}>🔄 Nouvelle analyse</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1 },
  content: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  errorText: { fontSize: 16, color: colors.textMuted, marginBottom: 16 },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  backBtnText: { color: colors.white, fontWeight: '600' },

  // Report header
  reportHeader: { marginBottom: 20 },
  reportTitle: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 3 },
  reportDate: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  // Face map
  faceMapContainer: {
    width: FACE_SIZE, height: FACE_SIZE * 1.15, alignSelf: 'center',
    borderRadius: 20, overflow: 'visible', position: 'relative', marginBottom: 24,
  },
  faceImage: {
    width: '100%', height: '100%', borderRadius: 20,
  },

  // Face detection points
  facePoint: { position: 'absolute', flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  facePointDot: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)',
  },
  facePointCenter: { width: 6, height: 6, borderRadius: 3 },
  facePointLabel: {
    marginLeft: 4, backgroundColor: 'rgba(10,10,10,0.85)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    borderWidth: 1, flexDirection: 'row', gap: 4, alignItems: 'center',
  },
  facePointLabelText: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  facePointValue: { fontSize: 11, fontWeight: '800' },

  // Monk + Score + Undertone row
  monkScoreRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },

  monkCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  monkCircleLarge: {
    width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 8,
  },
  monkNumber: { fontSize: 20, fontWeight: '800' },
  monkCardTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  monkCardLabel: { fontSize: 12, fontWeight: '600', color: colors.white, marginTop: 2 },

  scoreCardCompact: {
    flex: 1, backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  scoreRing: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  scoreRingNumber: { fontSize: 18, fontWeight: '800', color: colors.white },
  scoreCardTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  scoreCardLabel: { fontSize: 12, fontWeight: '600', color: colors.primaryLight, marginTop: 2 },

  undertoneCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  undertoneEmoji: { fontSize: 28, marginBottom: 4 },
  undertoneCardTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  undertoneCardLabel: { fontSize: 12, fontWeight: '600', color: colors.white, marginTop: 2 },

  // Tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    padding: 4, marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  tabTextActive: { color: colors.white },

  // Conditions
  conditionsSection: { gap: 10 },
  conditionCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  conditionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  conditionIcon: { fontSize: 24 },
  conditionName: { fontSize: 15, fontWeight: '700', color: colors.white },
  conditionDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 15 },
  conditionScoreBox: { alignItems: 'flex-end' },
  conditionScoreValue: { fontSize: 20, fontWeight: '800' },
  conditionScoreLabel: { fontSize: 10, fontWeight: '600' },
  conditionBar: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3,
    overflow: 'visible', position: 'relative',
  },
  conditionBarFill: { height: '100%', borderRadius: 3 },
  conditionBarThumb: {
    position: 'absolute', top: -4, width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#0A0A0A', borderWidth: 3, marginLeft: -7,
  },

  // Details
  detailsSection: { gap: 16 },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  techCard: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  techLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  techValue: { fontSize: 22, fontWeight: '800', color: colors.white },

  // Monk scale visualization
  monkScale: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  monkScaleTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 14 },
  monkScaleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  monkScaleDot: {
    flex: 1, height: 28, borderRadius: 6,
    borderWidth: 2, borderColor: 'transparent',
  },
  monkScaleDotActive: { borderColor: colors.white, transform: [{ scaleY: 1.3 }] },
  monkScaleCheck: { color: colors.white, fontSize: 10, textAlign: 'center', marginTop: -14 },
  monkScaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  monkScaleLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },

  // Tips
  tipsSection: { gap: 10 },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  tipNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  tipNumberText: { fontSize: 13, fontWeight: '800', color: colors.white },
  tipText: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },

  // Provider CTA
  providerCta: {
    backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', marginTop: 8,
  },
  providerCtaEmoji: { fontSize: 36, marginBottom: 8 },
  providerCtaTitle: { fontSize: 16, fontWeight: '700', color: colors.white, marginBottom: 4 },
  providerCtaDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 16 },
  providerCtaButton: {
    backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  providerCtaButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },

  // Bottom actions
  bottomActions: { marginTop: 24 },
  newAnalysisBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  newAnalysisBtnText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
});
