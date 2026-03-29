import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Image, Animated, Dimensions, Share,
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

const SKIN_PROVIDERS = [
  { id: '1', slug: 'soin-naturel', name: 'Soin Naturel', specialty: 'Soins hydratants peau foncée', rating: '4.8' },
  { id: '2', slug: 'glow-studio', name: 'Glow Studio', specialty: 'Traitement hyperpigmentation', rating: '4.9' },
  { id: '3', slug: 'dermapure', name: 'DermaPure', specialty: 'Soins anti-acné peaux mélanées', rating: '4.7' },
];

function getPersonalizedTips(analysis: any): Array<{icon: string, title: string, tip: string}> {
  const tips: Array<{icon: string, title: string, tip: string}> = [];
  if (analysis.hydration < 50) tips.push({ icon: '💧', title: 'Hydratation', tip: 'Applique un sérum à l\'acide hyaluronique matin et soir. Bois au moins 2L d\'eau par jour.' });
  if (analysis.sebum > 60) tips.push({ icon: '🧴', title: 'Excès de sébum', tip: 'Utilise un nettoyant doux sans sulfate. Évite les crèmes trop riches — privilégie les gels légers.' });
  if (analysis.hyperpigmentation > 40) tips.push({ icon: '✨', title: 'Hyperpigmentation', tip: 'Applique une protection solaire SPF30+ chaque jour, même sous les tropiques. La vitamine C aide à unifier le teint.' });
  if (analysis.acne > 30) tips.push({ icon: '🌿', title: 'Imperfections', tip: 'Nettoie ton visage 2x/jour avec un produit adapté. Ne perce jamais les boutons — ça aggrave les taches sur peau foncée.' });
  if (analysis.pores > 50) tips.push({ icon: '🔍', title: 'Pores dilatés', tip: 'Utilise un tonique à l\'acide salicylique après le nettoyage. Les masques à l\'argile 1x/semaine réduisent les pores.' });
  if (tips.length === 0) tips.push({ icon: '🌺', title: 'Belle peau !', tip: 'Tes résultats sont excellents. Continue ta routine actuelle et n\'oublie pas la protection solaire.' });
  return tips.slice(0, 3);
}

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
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: false }),
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

        {/* ── Recommandé pour toi ── */}
        <View style={styles.recoSection}>
          <Text style={styles.recoTitle}>Professionnelles pour toi</Text>
          <Text style={styles.recoSubtitle}>Spécialisées pour ton type de peau</Text>

          {SKIN_PROVIDERS.map(p => (
            <Pressable key={p.id} style={styles.recoProviderCard} onPress={() => router.push(`/provider/${p.slug}`)}>
              <View style={styles.recoProviderAvatar}>
                <Text style={styles.recoProviderInitial}>{p.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recoProviderName}>{p.name}</Text>
                <Text style={styles.recoProviderSpecialty}>{p.specialty}</Text>
              </View>
              <Text style={styles.recoProviderRating}>★ {p.rating}</Text>
            </Pressable>
          ))}

          <Pressable style={styles.recoSeeAll} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.recoSeeAllText}>Voir toutes les professionnelles →</Text>
          </Pressable>
        </View>

        <View style={styles.recoSection}>
          <Text style={styles.recoTitle}>Conseils pour toi</Text>
          {getPersonalizedTips(data).map((tip, i) => (
            <View key={i} style={styles.recoTipCard}>
              <Text style={styles.recoTipIcon}>{tip.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.recoTipTitle}>{tip.title}</Text>
                <Text style={styles.recoTipText}>{tip.tip}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={styles.recoCta} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.recoCtaText}>Réserver un soin professionnel</Text>
        </Pressable>

        {/* ── Bottom actions ── */}
        <View style={styles.bottomActions}>
          <Pressable
            style={styles.shareBtn}
            onPress={async () => {
              try {
                const monkLabel = data.monkTone != null ? (MONK_LABELS[data.monkTone] || '') : '';
                const undertoneLabel = data.undertone === 'WARM' ? 'Chaud' : data.undertone === 'COOL' ? 'Froid' : 'Neutre';
                const top3 = CONDITIONS
                  .map(c => ({ label: c.label, value: (data as any)[c.key] as number | null }))
                  .filter(c => c.value != null)
                  .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
                  .slice(0, 3)
                  .map(c => `${c.label} : ${c.value}%`)
                  .join('\n');
                const message = `🌸 Mon analyse de peau Tokoss\n\nTeint Monk : ${data.monkTone ?? '-'}/10 — ${monkLabel}\nSous-ton : ${undertoneLabel}\nScore global : ${data.overallScore ?? '-'}/100\n\n${top3}\n\nDécouvre ton type de peau sur Tokoss ! 👉 https://tokoss.app`;
                await Share.share({ message, title: 'Mon analyse de peau Tokoss' });
              } catch {}
            }}
          >
            <Text style={styles.shareBtnText}>Partager mes résultats</Text>
          </Pressable>
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
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  errorText: { fontSize: 16, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginBottom: 16 },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  backBtnText: { color: colors.white, fontFamily: 'Poppins_600SemiBold' },

  // Report header
  reportHeader: { marginBottom: 20 },
  reportTitle: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: colors.primary, letterSpacing: 3 },
  reportDate: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 4 },

  // Face map
  faceMapContainer: {
    width: FACE_SIZE, height: FACE_SIZE * 1.15, alignSelf: 'center',
    borderRadius: 24, overflow: 'visible', position: 'relative', marginBottom: 24,
  },
  faceImage: {
    width: '100%', height: '100%', borderRadius: 24,
  },

  // Face detection points
  facePoint: { position: 'absolute', flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  facePointDot: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)',
  },
  facePointCenter: { width: 6, height: 6, borderRadius: 3 },
  facePointLabel: {
    marginLeft: 4, backgroundColor: colors.card,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, flexDirection: 'row', gap: 4, alignItems: 'center',
    shadowColor: colors.n800, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  facePointLabelText: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted },
  facePointValue: { fontSize: 11, fontFamily: 'Poppins_700Bold' },

  // Monk + Score + Undertone row
  monkScoreRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },

  monkCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 24, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  monkCircleLarge: {
    width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(0,0,0,0.1)', marginBottom: 8,
  },
  monkNumber: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  monkCardTitle: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: colors.textMuted, letterSpacing: 1 },
  monkCardLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.accent, marginTop: 2 },

  scoreCardCompact: {
    flex: 1, backgroundColor: colors.primaryGhost, borderRadius: 24, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder,
  },
  scoreRing: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  scoreRingNumber: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.accent },
  scoreCardTitle: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: colors.textMuted, letterSpacing: 1 },
  scoreCardLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.primary, marginTop: 2 },

  undertoneCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 24, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  undertoneEmoji: { fontSize: 28, marginBottom: 4 },
  undertoneCardTitle: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: colors.textMuted, letterSpacing: 1 },
  undertoneCardLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.accent, marginTop: 2 },

  // Tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16,
    padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted },
  tabTextActive: { color: colors.white },

  // Conditions
  conditionsSection: { gap: 10 },
  conditionCard: {
    backgroundColor: colors.card, borderRadius: 24, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  conditionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  conditionIcon: { fontSize: 24 },
  conditionName: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.accent },
  conditionDesc: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 2, lineHeight: 15 },
  conditionScoreBox: { alignItems: 'flex-end' },
  conditionScoreValue: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  conditionScoreLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  conditionBar: {
    height: 6, backgroundColor: colors.n300, borderRadius: 3,
    overflow: 'visible', position: 'relative',
  },
  conditionBarFill: { height: '100%', borderRadius: 3 },
  conditionBarThumb: {
    position: 'absolute', top: -4, width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.card, borderWidth: 3, marginLeft: -7,
  },

  // Details
  detailsSection: { gap: 16 },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  techCard: {
    width: '47%', backgroundColor: colors.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  techLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, marginBottom: 6 },
  techValue: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.accent },

  // Monk scale visualization
  monkScale: {
    backgroundColor: colors.card, borderRadius: 24, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  monkScaleTitle: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: colors.textMuted, letterSpacing: 1, marginBottom: 14 },
  monkScaleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  monkScaleDot: {
    flex: 1, height: 28, borderRadius: 6,
    borderWidth: 2, borderColor: 'transparent',
  },
  monkScaleDotActive: { borderColor: colors.accent, transform: [{ scaleY: 1.3 }] },
  monkScaleCheck: { color: colors.accent, fontSize: 10, textAlign: 'center', marginTop: -14 },
  monkScaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  monkScaleLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: colors.textMuted },

  // Tips
  tipsSection: { gap: 10 },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.card, borderRadius: 24, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  tipNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  tipNumberText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.white },
  tipText: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text, lineHeight: 20 },

  // Provider CTA
  providerCta: {
    backgroundColor: colors.primaryGhost, borderRadius: 24, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder, marginTop: 8,
  },
  providerCtaEmoji: { fontSize: 36, marginBottom: 8 },
  providerCtaTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 4 },
  providerCtaDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  providerCtaButton: {
    backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20,
  },
  providerCtaButtonText: { color: colors.white, fontSize: 14, fontFamily: 'Poppins_700Bold' },

  // Share button
  shareBtn: {
    borderWidth: 1, borderColor: colors.primary, backgroundColor: 'transparent',
    borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginBottom: 10,
  },
  shareBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  // Bottom actions
  bottomActions: { marginTop: 24 },
  newAnalysisBtn: {
    backgroundColor: colors.card, paddingVertical: 14, borderRadius: 22,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  newAnalysisBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },

  // Recommendations
  recoSection: { marginTop: 28, paddingHorizontal: 0 },
  recoTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginBottom: 4 },
  recoSubtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginBottom: 14 },
  recoProviderCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    backgroundColor: colors.card, borderRadius: 16, marginBottom: 10, gap: 12,
  },
  recoProviderAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  recoProviderInitial: { fontSize: 18, color: colors.white, fontFamily: 'Poppins_700Bold' },
  recoProviderName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  recoProviderSpecialty: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },
  recoProviderRating: { fontSize: 12, color: colors.terracotta, fontFamily: 'Poppins_600SemiBold' },
  recoSeeAll: { paddingVertical: 8 },
  recoSeeAllText: { fontSize: 12, color: colors.primary, fontFamily: 'Poppins_600SemiBold' },
  recoTipCard: {
    flexDirection: 'row', padding: 14, backgroundColor: colors.card,
    borderRadius: 16, marginBottom: 10, gap: 12,
  },
  recoTipIcon: { fontSize: 24 },
  recoTipTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  recoTipText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 18, marginTop: 4 },
  recoCta: {
    backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', marginTop: 16, marginBottom: 8,
  },
  recoCtaText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
