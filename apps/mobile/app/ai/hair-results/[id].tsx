import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../../src/theme/colors';
import { api } from '../../../src/lib/api';

const HAIR_TYPE_INFO: Record<string, { label: string; desc: string }> = {
  '3A': { label: 'Boucles larges', desc: 'Boucles lâches en forme de S, volume modéré' },
  '3B': { label: 'Boucles spiralées', desc: 'Boucles serrées en spirale, volume important' },
  '3C': { label: 'Tire-bouchon', desc: 'Boucles très serrées, texture dense' },
  '4A': { label: 'Coils serrés', desc: 'Petites boucles en S très serrées, patron visible' },
  '4B': { label: 'Zig-zag', desc: 'Patron en Z, très dense, shrinkage important' },
  '4C': { label: 'Ultra-coily', desc: 'Patron très serré, maximum de shrinkage, fragile' },
};

const POROSITY_INFO: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Faible', color: colors.success },
  MEDIUM: { label: 'Moyenne', color: colors.warning },
  HIGH: { label: 'Élevée', color: colors.terracotta },
};

const DENSITY_INFO: Record<string, string> = {
  LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Élevée',
};

const THICKNESS_INFO: Record<string, string> = {
  FINE: 'Fin', MEDIUM: 'Moyen', COARSE: 'Épais',
};

const SCALP_INFO: Record<string, { label: string; icon: string }> = {
  HEALTHY:  { label: 'Sain',       icon: '✅' },
  DRY:      { label: 'Sec',        icon: '🏜️' },
  OILY:     { label: 'Gras',       icon: '💧' },
  DANDRUFF: { label: 'Pellicules', icon: '❄️' },
  FLAKY:    { label: 'Pellicules', icon: '❄️' }, // legacy alias
  IRRITATED:{ label: 'Irrité',     icon: '🔴' },
};

const STYLE_LABELS: Record<string, string> = {
  AFRO:        'Afro naturel',
  WASH_N_GO:   'Wash & Go',
  TWA:         'TWA',
  BOX_BRAIDS:  'Box Braids',
  BRAIDS:      'Tresses',
  CORNROWS:    'Cornrows',
  LOCS:        'Locks',
  FAUX_LOCS:   'Faux Locks',
  TWISTS:      'Twists',
  TWIST_OUT:   'Twist-out',
  FLAT_TWIST:  'Flat Twist',
  BANTU_KNOTS: 'Bantu Knots',
  STRAIGHT:    'Lissé',
  WEAVE:       'Extension',
  WIG:         'Perruque',
  PROTECTIVE:  'Style protecteur',
  OTHER:       'Autre',
};

const LOC_STYLES = new Set(['LOCS', 'FAUX_LOCS']);
const isLocStyle = (style: string | null | undefined) => style != null && LOC_STYLES.has(style);

const HAIR_PROVIDERS = [
  { id: '1', slug: 'braids-queen', name: 'Braids Queen', specialty: 'Tresses protectrices 4A-4C', rating: '4.9' },
  { id: '2', slug: 'natural-hair-studio', name: 'Natural Hair Studio', specialty: 'Soins cheveux naturels crépus', rating: '4.8' },
  { id: '3', slug: 'loc-specialist', name: 'Loc Specialist', specialty: 'Locs & twists tous types', rating: '4.7' },
];

function getHairTips(analysis: any): Array<{icon: string, title: string, tip: string}> {
  const tips: Array<{icon: string, title: string, tip: string}> = [];

  if (isLocStyle(analysis.currentStyle)) {
    tips.push({ icon: '💧', title: 'Hydratation des locs', tip: 'Spray eau + aloe vera 3-4x/semaine. Les locs assèchent plus vite — les cuticules sont compressées et l\'humidité s\'échappe.' });
    if (analysis.porosity === 'HIGH') {
      tips.push({ icon: '🌿', title: 'Porosité élevée', tip: 'Tes locs absorbent vite mais perdent l\'hydratation. Scelle avec une huile légère (argan, jojoba) juste après avoir humidifié.' });
    } else {
      tips.push({ icon: '✂️', title: 'Retwist régulier', tip: 'Un retwist pro tous les 4-6 semaines maintient les locs nettes, prévient la fusion entre locs et favorise la croissance.' });
    }
    tips.push({ icon: '🌙', title: 'Protection nocturne', tip: 'Bonnet en satin obligatoire — il prévient la casse, le frisottis et l\'assèchement causé par les fibres des draps.' });
    return tips;
  }

  if (analysis.porosity === 'HIGH') tips.push({ icon: '💧', title: 'Porosité élevée', tip: 'Tes cheveux absorbent vite mais perdent l\'hydratation. Scelle avec une huile lourde (ricin, olive) après chaque hydratation.' });
  if (analysis.porosity === 'LOW') tips.push({ icon: '🔒', title: 'Porosité faible', tip: 'L\'eau a du mal à pénétrer tes cheveux. Utilise un bonnet chauffant ou de la vapeur pour ouvrir les cuticules.' });
  if (analysis.dryness != null && analysis.dryness > 50) tips.push({ icon: '🏜️', title: 'Sécheresse', tip: 'Hydrate avec la méthode LOC (Liquid-Oil-Cream). Dors avec un bonnet en satin pour préserver l\'hydratation.' });
  if (analysis.shrinkage != null && analysis.shrinkage > 60) tips.push({ icon: '🌀', title: 'Shrinkage important', tip: 'C\'est le signe de cheveux en bonne santé ! Pour étirer, essaie le twist-out ou les bantu knots sur cheveux humides.' });
  if (['4B', '4C'].includes(analysis.hairType)) tips.push({ icon: '👑', title: `Type ${analysis.hairType}`, tip: 'Démêle toujours sur cheveux mouillés avec un après-shampoing riche. Sectionne en 4 parts minimum.' });
  if (tips.length === 0) tips.push({ icon: '✨', title: 'Beaux cheveux !', tip: 'Tes cheveux sont en bonne santé. Continue ta routine et protège-les la nuit avec du satin.' });
  return tips.slice(0, 3);
}

interface HairData {
  id: string;
  photoUrl: string;
  hairType: string | null;
  porosity: string | null;
  density: string | null;
  thickness: string | null;
  dryness: number | null;
  elasticity: number | null;
  shrinkage: number | null;
  scalpCondition: string | null;
  currentStyle: string | null;
  overallScore: number | null;
  recommendations: string[] | null;
  createdAt: string;
}

export default function HairResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<HairData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await api(`/ai/hair-analysis/${id}`);
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

  const hairInfo = data.hairType ? HAIR_TYPE_INFO[data.hairType] : null;
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

  // Display-layer shrinkage calibration — corrects old DB records that under-estimated shrinkage
  // (GPT sees the expanded afro and guesses low; these ranges come from trichoscopy studies)
  const SHRINKAGE_RANGES: Record<string, [number, number]> = { '4C': [75, 90], '4B': [60, 75], '4A': [50, 65], '3C': [35, 50] };
  const displayShrinkage = (() => {
    if (isLocStyle(data.currentStyle) || data.shrinkage == null) return null;
    const range = data.hairType ? SHRINKAGE_RANGES[data.hairType] : null;
    if (!range) return data.shrinkage;
    return Math.max(range[0], Math.min(range[1], data.shrinkage));
  })();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Résultats cheveux</Text>
        <Text style={styles.date}>
          {new Date(data.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

        {/* Hair type badge */}
        {data.hairType && (
          <View style={styles.typeCard}>
            <Text style={styles.typeEmoji}>{isLocStyle(data.currentStyle) ? '🔒' : '💇🏿‍♀️'}</Text>
            <View style={{ flex: 1 }}>
              {isLocStyle(data.currentStyle) ? (
                <>
                  <Text style={styles.typeLabel}>{STYLE_LABELS[data.currentStyle!] || data.currentStyle}</Text>
                  <Text style={styles.typeName}>Type estimé : {data.hairType}</Text>
                  <Text style={styles.typeDesc}>D'après racines et pointes visibles — estimation</Text>
                </>
              ) : (
                <>
                  <Text style={styles.typeLabel}>Type {data.hairType}</Text>
                  {hairInfo && <Text style={styles.typeName}>{hairInfo.label}</Text>}
                  {hairInfo && <Text style={styles.typeDesc}>{hairInfo.desc}</Text>}
                </>
              )}
            </View>
          </View>
        )}

        {/* Overall Score */}
        {data.overallScore != null && (
          <View style={styles.scoreCard}>
            <View style={styles.scoreBig}>
              <Text style={styles.scoreBigNumber}>{data.overallScore}</Text>
              <Text style={styles.scoreBigLabel}>/100</Text>
            </View>
            <Text style={styles.scoreTitle}>Score de santé capillaire</Text>
          </View>
        )}

        {/* Locs information banner */}
        {isLocStyle(data.currentStyle) && (
          <View style={styles.locsBanner}>
            <Text style={styles.locsBannerIcon}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.locsBannerTitle}>Style protecteur détecté</Text>
              <Text style={styles.locsBannerText}>
                Le shrinkage n'est pas estimable sur des locs — la texture est verrouillée.
                Porosité et densité sont estimées depuis les racines visibles.
              </Text>
            </View>
          </View>
        )}

        {/* Characteristics */}
        <Text style={styles.sectionTitle}>Caractéristiques</Text>
        <View style={styles.charsGrid}>
          {data.porosity && (
            <View style={styles.charCard}>
              <Text style={styles.charLabel}>Porosité</Text>
              <Text style={[styles.charValue, { color: POROSITY_INFO[data.porosity]?.color || colors.text }]}>
                {POROSITY_INFO[data.porosity]?.label || data.porosity}
              </Text>
            </View>
          )}
          {data.density && (
            <View style={styles.charCard}>
              <Text style={styles.charLabel}>Densité</Text>
              <Text style={styles.charValue}>{DENSITY_INFO[data.density] || data.density}</Text>
            </View>
          )}
          {data.thickness && (
            <View style={styles.charCard}>
              <Text style={styles.charLabel}>Épaisseur</Text>
              <Text style={styles.charValue}>{THICKNESS_INFO[data.thickness] || data.thickness}</Text>
            </View>
          )}
          {data.scalpCondition && (
            <View style={styles.charCard}>
              <Text style={styles.charLabel}>Cuir chevelu</Text>
              <Text style={styles.charValue}>
                {SCALP_INFO[data.scalpCondition]?.icon} {SCALP_INFO[data.scalpCondition]?.label || data.scalpCondition}
              </Text>
            </View>
          )}
        </View>

        {/* Metrics bars */}
        <View style={styles.metricsSection}>
          {data.dryness != null && (
            <MetricBar label="Sécheresse" value={data.dryness} icon="🏜️" invert />
          )}
          {/* Elasticity: never measurable from a photo — requires physical wet strand stretch test */}
          <MetricBar
            label="Élasticité"
            value={null}
            icon="🔄"
            naText="Test physique requis"
          />
          <MetricBar
            label="Shrinkage"
            value={displayShrinkage}
            icon="📏"
            neutral
            naText="Non mesurable — locs"
          />
        </View>

        {/* Current style */}
        {data.currentStyle && (
          <View style={styles.styleRow}>
            <Text style={styles.styleLabel}>Coiffure détectée :</Text>
            <View style={styles.styleBadge}>
              <Text style={styles.styleBadgeText}>{STYLE_LABELS[data.currentStyle] || data.currentStyle}</Text>
            </View>
          </View>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recsSection}>
            <Text style={styles.sectionTitle}>Recommandations</Text>
            {recommendations.map((rec, i) => (
              <View key={i} style={styles.recRow}>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Recommandé pour toi ── */}
        <View style={styles.recoSection}>
          <Text style={styles.recoTitle}>Professionnelles pour toi</Text>
          <Text style={styles.recoSubtitle}>Spécialisées pour ton type de cheveux</Text>

          {HAIR_PROVIDERS.map(p => (
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
            <Text style={styles.recoSeeAllText}>Voir toutes les prestataires →</Text>
          </Pressable>
        </View>

        <View style={styles.recoSection}>
          <Text style={styles.recoTitle}>Conseils pour toi</Text>
          {getHairTips(data).map((tip, i) => (
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

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.shareBtn}
            onPress={async () => {
              try {
                const hairTypeLabel = data.hairType && HAIR_TYPE_INFO[data.hairType] ? HAIR_TYPE_INFO[data.hairType].label : '';
                const porosityLabel = data.porosity && POROSITY_INFO[data.porosity] ? POROSITY_INFO[data.porosity].label : (data.porosity || '');
                const densityLabel = data.density ? (DENSITY_INFO[data.density] || data.density) : '';
                const message = `💇🏿 Mon analyse capillaire Karysm\n\nType : ${data.hairType ?? '-'} — ${hairTypeLabel}\nPorosité : ${porosityLabel}\nDensité : ${densityLabel}\n\nDécouvre ton type de cheveux sur Karysm ! 👉 https://karysm.com`;
                await Share.share({ message, title: 'Mon analyse capillaire Karysm' });
              } catch {}
            }}
          >
            <Text style={styles.shareBtnText}>Partager mes résultats</Text>
          </Pressable>
          <Pressable style={styles.newBtn} onPress={() => router.push('/ai/hair-capture')}>
            <Text style={styles.newBtnText}>🔄 Nouvelle analyse</Text>
          </Pressable>
          <Pressable style={styles.findBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.findBtnText}>💇🏿 Trouver un coiffeur</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricBar({ label, value, icon, invert, neutral, naText }: { label: string; value: number | null; icon: string; invert?: boolean; neutral?: boolean; naText?: string }) {
  if (value === null) {
    return (
      <View style={styles.metricRow}>
        <Text style={styles.metricIcon}>{icon}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricNa}>{naText ?? 'Non mesurable'}</Text>
      </View>
    );
  }

  let barColor: string = colors.success;
  if (neutral) {
    barColor = colors.primary;
  } else {
    const effective = invert ? value : 100 - value;
    if (effective > 60) barColor = colors.error;
    else if (effective > 30) barColor = colors.warning;
  }

  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricBar}>
        <View style={[styles.metricBarFill, { width: `${value}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.metricValue, { color: barColor }]}>{value}%</Text>
    </View>
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

  title: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent },
  date: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginBottom: 20 },

  // Type card
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: 24, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  typeEmoji: { fontSize: 36 },
  typeLabel: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: colors.primary, letterSpacing: 1 },
  typeName: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.accent },
  typeDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },

  // Score
  scoreCard: {
    backgroundColor: colors.primary, borderRadius: 24, padding: 24,
    alignItems: 'center', marginBottom: 24,
  },
  scoreBig: { flexDirection: 'row', alignItems: 'baseline' },
  scoreBigNumber: { fontSize: 48, fontFamily: 'Poppins_700Bold', color: colors.white },
  scoreBigLabel: { fontSize: 18, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.6)', marginLeft: 4 },
  scoreTitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  // Characteristics
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 14 },
  charsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  charCard: {
    width: '47%', backgroundColor: colors.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  charLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  charValue: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.accent },

  // Locs banner
  locsBanner: {
    flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D',
    marginBottom: 24,
  },
  locsBannerIcon: { fontSize: 20 },
  locsBannerTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#92400E', marginBottom: 4 },
  locsBannerText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#78350F', lineHeight: 18 },

  // Metrics
  metricsSection: { marginBottom: 24 },
  metricRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.card, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  metricIcon: { fontSize: 18 },
  metricLabel: { width: 80, fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  metricBar: {
    flex: 1, height: 6, backgroundColor: colors.n300, borderRadius: 3, overflow: 'hidden',
  },
  metricBarFill: { height: '100%', borderRadius: 3 },
  metricValue: { width: 40, fontSize: 13, fontFamily: 'Poppins_700Bold', textAlign: 'right' },
  metricNa: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, fontStyle: 'italic' },

  // Style
  styleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24,
  },
  styleLabel: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  styleBadge: {
    backgroundColor: colors.primaryGhost, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
  },
  styleBadgeText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  // Recommendations
  recsSection: { marginBottom: 24 },
  recRow: {
    backgroundColor: colors.card, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 6,
  },
  recText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text, lineHeight: 20 },

  // Share button
  shareBtn: {
    borderWidth: 1, borderColor: colors.primary, backgroundColor: 'transparent',
    borderRadius: 16, paddingVertical: 12, alignItems: 'center',
  },
  shareBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  // Actions
  actions: { gap: 10 },
  newBtn: {
    backgroundColor: colors.primaryGhost, paddingVertical: 14, borderRadius: 22,
    alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder,
  },
  newBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  findBtn: {
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 22, alignItems: 'center',
  },
  findBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.white },

  // Recommendations
  recoSection: { marginTop: 28, marginBottom: 0 },
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
