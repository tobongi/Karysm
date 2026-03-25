import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
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
  HEALTHY: { label: 'Sain', icon: '✅' },
  DRY: { label: 'Sec', icon: '🏜️' },
  OILY: { label: 'Gras', icon: '💧' },
  FLAKY: { label: 'Pellicules', icon: '❄️' },
};

const STYLE_LABELS: Record<string, string> = {
  AFRO: 'Afro', BRAIDS: 'Tresses', CORNROWS: 'Cornrows', LOCS: 'Locks',
  TWA: 'TWA', BANTU_KNOTS: 'Bantu Knots', TWIST_OUT: 'Twist-out',
};

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
            <Text style={styles.typeEmoji}>💇‍♀️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.typeLabel}>Type {data.hairType}</Text>
              {hairInfo && <Text style={styles.typeName}>{hairInfo.label}</Text>}
              {hairInfo && <Text style={styles.typeDesc}>{hairInfo.desc}</Text>}
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
          {data.elasticity != null && (
            <MetricBar label="Élasticité" value={data.elasticity} icon="🔄" />
          )}
          {data.shrinkage != null && (
            <MetricBar label="Shrinkage" value={data.shrinkage} icon="📏" neutral />
          )}
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

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.newBtn} onPress={() => router.push('/ai/hair-capture')}>
            <Text style={styles.newBtnText}>🔄 Nouvelle analyse</Text>
          </Pressable>
          <Pressable style={styles.findBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.findBtnText}>💇 Trouver un coiffeur</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricBar({ label, value, icon, invert, neutral }: { label: string; value: number; icon: string; invert?: boolean; neutral?: boolean }) {
  let barColor = colors.success;
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
  errorText: { fontSize: 16, color: colors.textMuted, marginBottom: 16 },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  backBtnText: { color: colors.white, fontWeight: '600' },

  title: { fontSize: 24, fontWeight: '700', color: colors.accent },
  date: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },

  // Type card
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  typeEmoji: { fontSize: 36 },
  typeLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
  typeName: { fontSize: 20, fontWeight: '700', color: colors.accent },
  typeDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  // Score
  scoreCard: {
    backgroundColor: colors.primary, borderRadius: 14, padding: 24,
    alignItems: 'center', marginBottom: 24,
  },
  scoreBig: { flexDirection: 'row', alignItems: 'baseline' },
  scoreBigNumber: { fontSize: 48, fontWeight: '800', color: colors.white },
  scoreBigLabel: { fontSize: 18, color: 'rgba(255,255,255,0.6)', marginLeft: 4 },
  scoreTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  // Characteristics
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.accent, marginBottom: 14 },
  charsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  charCard: {
    width: '47%', backgroundColor: colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  charLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  charValue: { fontSize: 16, fontWeight: '700', color: colors.accent },

  // Metrics
  metricsSection: { marginBottom: 24 },
  metricRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.card, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  metricIcon: { fontSize: 18 },
  metricLabel: { width: 80, fontSize: 13, fontWeight: '500', color: colors.text },
  metricBar: {
    flex: 1, height: 6, backgroundColor: colors.cardHover, borderRadius: 3, overflow: 'hidden',
  },
  metricBarFill: { height: '100%', borderRadius: 3 },
  metricValue: { width: 40, fontSize: 13, fontWeight: '700', textAlign: 'right' },

  // Style
  styleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24,
  },
  styleLabel: { fontSize: 14, color: colors.textSecondary },
  styleBadge: {
    backgroundColor: colors.primaryGhost, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
  },
  styleBadgeText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  // Recommendations
  recsSection: { marginBottom: 24 },
  recRow: {
    backgroundColor: colors.card, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 6,
  },
  recText: { fontSize: 14, color: colors.text, lineHeight: 20 },

  // Actions
  actions: { gap: 10 },
  newBtn: {
    backgroundColor: colors.primaryGhost, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder,
  },
  newBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  findBtn: {
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  findBtnText: { fontSize: 15, fontWeight: '600', color: colors.white },
});
