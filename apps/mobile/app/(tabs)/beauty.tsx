import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';

interface SkinSummary {
  id: string;
  monkTone: number | null;
  undertone: string | null;
  overallScore: number | null;
  selfieUrl: string;
  createdAt: string;
}

interface HairSummary {
  id: string;
  hairType: string | null;
  overallScore: number | null;
  photoUrl: string;
  createdAt: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const MONK_COLORS: Record<number, string> = {
  1: '#F6EDE4', 2: '#EEDAC4', 3: '#D9BC9D', 4: '#C4A584',
  5: '#AF8968', 6: '#967050', 7: '#78553A', 8: '#5A3C28',
  9: '#3C2819', 10: '#28190F',
};

export default function BeautyTab() {
  const { user, isLoading: authLoading } = useAuth();
  const [skinHistory, setSkinHistory] = useState<SkinSummary[]>([]);
  const [hairHistory, setHairHistory] = useState<HairSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [skinRes, hairRes] = await Promise.all([
        api('/ai/skin-history?limit=5').catch(() => ({ data: [] })),
        api('/ai/hair-history').catch(() => ({ data: [] })),
      ]);
      setSkinHistory(skinRes.data || []);
      setHairHistory(hairRes.data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!authLoading && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Beauté AI</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyTitle}>Connectez-vous pour analyser votre peau et vos cheveux</Text>
          <Pressable style={styles.loginButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading || authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Beauté AI</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const lastSkin = skinHistory[0];
  const lastHair = hairHistory[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Beauté AI</Text>
        <Text style={styles.headerSubtitle}>Analysez votre peau et vos cheveux</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
      >
        {/* ── Skin Analysis Card ── */}
        <Pressable
          style={styles.analysisCard}
          onPress={() => lastSkin ? router.push(`/ai/skin-results/${lastSkin.id}`) : router.push('/ai/skin-capture')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🧴</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Analyse de peau</Text>
              <Text style={styles.cardDescription}>
                {lastSkin ? `Dernière analyse : ${formatDate(lastSkin.createdAt)}` : 'Découvrez votre type de peau'}
              </Text>
            </View>
            {lastSkin && lastSkin.overallScore != null && (
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{lastSkin.overallScore}</Text>
                <Text style={styles.scoreLabel}>score</Text>
              </View>
            )}
          </View>

          {lastSkin && (
            <View style={styles.cardDetails}>
              {lastSkin.monkTone != null && (
                <View style={styles.monkBadge}>
                  <View style={[styles.monkDot, { backgroundColor: MONK_COLORS[lastSkin.monkTone] || colors.textMuted }]} />
                  <Text style={styles.monkText}>Monk {lastSkin.monkTone}</Text>
                </View>
              )}
              {lastSkin.undertone && (
                <View style={styles.undertoneBadge}>
                  <Text style={styles.undertoneText}>
                    {lastSkin.undertone === 'WARM' ? '🌅 Chaud' : lastSkin.undertone === 'COOL' ? '❄️ Froid' : '⚖️ Neutre'}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Pressable
            style={styles.cardCta}
            onPress={() => router.push('/ai/skin-capture')}
          >
            <Text style={styles.cardCtaText}>
              {lastSkin ? 'Nouvelle analyse' : 'Analyser ma peau'}
            </Text>
          </Pressable>
        </Pressable>

        {/* ── Hair Analysis Card ── */}
        <Pressable
          style={styles.analysisCard}
          onPress={() => lastHair ? router.push(`/ai/hair-results/${lastHair.id}`) : router.push('/ai/hair-capture')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>💇‍♀️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Analyse cheveux</Text>
              <Text style={styles.cardDescription}>
                {lastHair ? `Dernière analyse : ${formatDate(lastHair.createdAt)}` : 'Découvrez votre type de cheveux'}
              </Text>
            </View>
            {lastHair && lastHair.overallScore != null && (
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{lastHair.overallScore}</Text>
                <Text style={styles.scoreLabel}>score</Text>
              </View>
            )}
          </View>

          {lastHair?.hairType && (
            <View style={styles.cardDetails}>
              <View style={styles.hairTypeBadge}>
                <Text style={styles.hairTypeText}>Type {lastHair.hairType}</Text>
              </View>
            </View>
          )}

          <Pressable
            style={styles.cardCta}
            onPress={() => router.push('/ai/hair-capture')}
          >
            <Text style={styles.cardCtaText}>
              {lastHair ? 'Nouvelle analyse' : 'Analyser mes cheveux'}
            </Text>
          </Pressable>
        </Pressable>

        {/* ── History ── */}
        {(skinHistory.length > 1 || hairHistory.length > 1) && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Historique</Text>
            {skinHistory.slice(1).map((s) => (
              <Pressable key={s.id} style={styles.historyRow} onPress={() => router.push(`/ai/skin-results/${s.id}`)}>
                <Text style={styles.historyIcon}>🧴</Text>
                <Text style={styles.historyLabel}>Peau — Score {s.overallScore || '—'}</Text>
                <Text style={styles.historyDate}>{formatDate(s.createdAt)}</Text>
              </Pressable>
            ))}
            {hairHistory.slice(1).map((h) => (
              <Pressable key={h.id} style={styles.historyRow} onPress={() => router.push(`/ai/hair-results/${h.id}`)}>
                <Text style={styles.historyIcon}>💇‍♀️</Text>
                <Text style={styles.historyLabel}>Cheveux — {h.hairType || 'Score ' + (h.overallScore || '—')}</Text>
                <Text style={styles.historyDate}>{formatDate(h.createdAt)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.accent },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  content: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

  // Analysis cards
  analysisCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardEmoji: { fontSize: 32, marginRight: 14 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.accent },
  cardDescription: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  scoreCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryGhost, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.primaryBorder,
  },
  scoreText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  scoreLabel: { fontSize: 9, color: colors.textMuted, marginTop: -2 },

  cardDetails: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  monkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.cardHover, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
  },
  monkDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  monkText: { fontSize: 12, fontWeight: '600', color: colors.text },
  undertoneBadge: {
    backgroundColor: colors.cardHover, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
  },
  undertoneText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  hairTypeBadge: {
    backgroundColor: colors.primaryGhost, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100,
  },
  hairTypeText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  cardCta: {
    backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  cardCtaText: { color: colors.white, fontSize: 14, fontWeight: '600' },

  // History
  historySection: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.accent, marginBottom: 12 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  historyIcon: { fontSize: 18, marginRight: 12 },
  historyLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text },
  historyDate: { fontSize: 12, color: colors.textMuted },

  // Empty/Auth
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 20 },
  loginButton: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  loginButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
