import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../../src/theme/colors';
import { api } from '../../../src/lib/api';

const MONK_COLORS: Record<number, string> = {
  1: '#F6EDE4', 2: '#EEDAC4', 3: '#D9BC9D', 4: '#C4A584',
  5: '#AF8968', 6: '#967050', 7: '#78553A', 8: '#5A3C28',
  9: '#3C2819', 10: '#28190F',
};

const METRICS = [
  { key: 'hydration', label: 'Hydratation', icon: '💧', invert: false },
  { key: 'sebum', label: 'Sébum', icon: '🧴', invert: true },
  { key: 'pores', label: 'Pores', icon: '🔍', invert: true },
  { key: 'wrinkles', label: 'Rides', icon: '〰️', invert: true },
  { key: 'spots', label: 'Taches', icon: '🌸', invert: true },
  { key: 'acne', label: 'Acné', icon: '🌿', invert: true },
  { key: 'hyperpigmentation', label: 'Hyperpigmentation', icon: '✨', invert: true },
  { key: 'uniformity', label: 'Uniformité', icon: '🌺', invert: false },
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

export default function SkinResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<SkinData | null>(null);
  const [loading, setLoading] = useState(true);

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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Résultats</Text>
        <Text style={styles.date}>
          {new Date(data.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

        {/* Monk Tone + Undertone */}
        <View style={styles.toneCard}>
          {data.monkTone != null && (
            <View style={styles.monkRow}>
              <View style={[styles.monkCircle, { backgroundColor: MONK_COLORS[data.monkTone] || colors.textMuted }]} />
              <View>
                <Text style={styles.monkLabel}>Monk Tone {data.monkTone}</Text>
                <Text style={styles.monkSublabel}>Échelle de carnation</Text>
              </View>
            </View>
          )}
          {data.undertone && (
            <View style={styles.undertonePill}>
              <Text style={styles.undertonePillText}>
                {data.undertone === 'WARM' ? '🌅 Sous-ton Chaud' : data.undertone === 'COOL' ? '❄️ Sous-ton Froid' : '⚖️ Sous-ton Neutre'}
              </Text>
            </View>
          )}
        </View>

        {/* Overall Score */}
        {data.overallScore != null && (
          <View style={styles.scoreCard}>
            <View style={styles.scoreBig}>
              <Text style={styles.scoreBigNumber}>{data.overallScore}</Text>
              <Text style={styles.scoreBigLabel}>/100</Text>
            </View>
            <Text style={styles.scoreTitle}>Score global de santé de peau</Text>
          </View>
        )}

        {/* Metrics Grid */}
        <Text style={styles.sectionTitle}>Analyse détaillée</Text>
        <View style={styles.metricsGrid}>
          {METRICS.map((m) => {
            const value = (data as any)[m.key] as number | null;
            if (value == null) return null;
            const barColor = getScoreColor(value, m.invert);
            const label = getScoreLabel(value, m.invert);
            return (
              <View key={m.key} style={styles.metricCard}>
                <Text style={styles.metricIcon}>{m.icon}</Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <View style={styles.metricBar}>
                  <View style={[styles.metricBarFill, { width: `${value}%`, backgroundColor: barColor }]} />
                </View>
                <View style={styles.metricFooter}>
                  <Text style={[styles.metricValue, { color: barColor }]}>{value}</Text>
                  <Text style={[styles.metricStatus, { color: barColor }]}>{label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Technical data */}
        {(data.labL != null || data.itaAngle != null) && (
          <View style={styles.techSection}>
            <Text style={styles.techTitle}>Données techniques</Text>
            <View style={styles.techRow}>
              {data.labL != null && <Text style={styles.techItem}>L*: {data.labL.toFixed(1)}</Text>}
              {data.labA != null && <Text style={styles.techItem}>a*: {data.labA.toFixed(1)}</Text>}
              {data.labB != null && <Text style={styles.techItem}>b*: {data.labB.toFixed(1)}</Text>}
              {data.itaAngle != null && <Text style={styles.techItem}>ITA: {data.itaAngle.toFixed(1)}°</Text>}
              {data.melaninIndex != null && <Text style={styles.techItem}>Mélanine: {data.melaninIndex}</Text>}
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
          <Pressable style={styles.newAnalysisBtn} onPress={() => router.push('/ai/skin-capture')}>
            <Text style={styles.newAnalysisBtnText}>🔄 Nouvelle analyse</Text>
          </Pressable>
          <Pressable style={styles.findProviderBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.findProviderBtnText}>💆 Trouver un prestataire</Text>
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
  errorText: { fontSize: 16, color: colors.textMuted, marginBottom: 16 },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  backBtnText: { color: colors.white, fontWeight: '600' },

  title: { fontSize: 24, fontWeight: '700', color: colors.accent },
  date: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },

  // Monk Tone
  toneCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  monkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monkCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.border },
  monkLabel: { fontSize: 16, fontWeight: '700', color: colors.accent },
  monkSublabel: { fontSize: 11, color: colors.textMuted },
  undertonePill: {
    backgroundColor: colors.cardHover, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
  },
  undertonePillText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },

  // Score
  scoreCard: {
    backgroundColor: colors.primary, borderRadius: 14, padding: 24,
    alignItems: 'center', marginBottom: 24,
  },
  scoreBig: { flexDirection: 'row', alignItems: 'baseline' },
  scoreBigNumber: { fontSize: 48, fontWeight: '800', color: colors.white },
  scoreBigLabel: { fontSize: 18, color: 'rgba(255,255,255,0.6)', marginLeft: 4 },
  scoreTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  // Metrics
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.accent, marginBottom: 14 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metricCard: {
    width: '48%', backgroundColor: colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  metricIcon: { fontSize: 20, marginBottom: 6 },
  metricLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  metricBar: {
    height: 6, backgroundColor: colors.cardHover, borderRadius: 3, overflow: 'hidden', marginBottom: 6,
  },
  metricBarFill: { height: '100%', borderRadius: 3 },
  metricFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  metricValue: { fontSize: 16, fontWeight: '700' },
  metricStatus: { fontSize: 11, fontWeight: '500' },

  // Technical
  techSection: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 24,
  },
  techTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  techItem: { fontSize: 13, color: colors.textSecondary, fontFamily: 'monospace' },

  // Recommendations
  recsSection: { marginBottom: 24 },
  recRow: {
    backgroundColor: colors.card, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 6,
  },
  recText: { fontSize: 14, color: colors.text, lineHeight: 20 },

  // Actions
  actions: { gap: 10 },
  newAnalysisBtn: {
    backgroundColor: colors.primaryGhost, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder,
  },
  newAnalysisBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  findProviderBtn: {
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  findProviderBtnText: { fontSize: 15, fontWeight: '600', color: colors.white },
});
