import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import Skeleton from '../../src/components/Skeleton';
import CurveHeader from '../../src/components/CurveHeader';

const BEAUTY_TIPS = [
  { id: '1', icon: '\u{1F4A7}', title: 'Méthode LOC pour cheveux 4C', content: "Liquid, Oil, Cream \u2014 l'ordre d'application qui change tout pour l'hydratation des cheveux crépus." },
  { id: '2', icon: '\u2600\uFE0F', title: 'SPF et peau foncée : le mythe', content: "Les peaux riches en mélanine ont aussi besoin de protection solaire. L'hyperpigmentation est plus visible sans SPF." },
  { id: '3', icon: '\u{1F33F}', title: 'Beurre de karité : guide complet', content: 'Comment choisir, préparer et appliquer le karité pour cheveux et peau. Du brut au raffiné, tout savoir.' },
  { id: '4', icon: '\u{1F9F4}', title: 'Routine night-time pour braids', content: 'Protège tes tresses la nuit avec un bonnet en satin et un spray hydratant léger pour éviter la sécheresse.' },
];

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
        <CurveHeader title="Beauté AI" height={160} />
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
        <CurveHeader title="Beauté AI" height={160} />
        <View style={styles.content}>
          <Skeleton width="100%" height={160} borderRadius={24} />
          <View style={{ height: 20 }} />
          <Skeleton width="100%" height={160} borderRadius={24} />
        </View>
      </View>
    );
  }

  const lastSkin = skinHistory[0];
  const lastHair = hairHistory[0];

  return (
    <View style={styles.container}>
      <CurveHeader title="Beauté AI" subtitle="Analysez votre peau et vos cheveux" height={160} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
      >
        {/* -- Skin Analysis Card -- */}
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

        {/* -- Hair Analysis Card -- */}
        <Pressable
          style={styles.analysisCard}
          onPress={() => lastHair ? router.push(`/ai/hair-results/${lastHair.id}`) : router.push('/ai/hair-capture')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>💇🏿‍♀️</Text>
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

        {/* -- History -- */}
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
                <Text style={styles.historyIcon}>💇🏿‍♀️</Text>
                <Text style={styles.historyLabel}>Cheveux — {h.hairType || 'Score ' + (h.overallScore || '—')}</Text>
                <Text style={styles.historyDate}>{formatDate(h.createdAt)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* -- Hair Journal Card -- */}
        <Pressable style={styles.journalCard} onPress={() => router.push('/hair-journal' as any)}>
          <View style={styles.journalIcon}>
            <Text style={{ fontSize: 24 }}>{'\u{1F4D6}'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.journalTitle}>Journal capillaire</Text>
            <Text style={styles.journalSubtitle}>Suivez votre parcours cheveux mois par mois</Text>
          </View>
          <Text style={styles.journalArrow}>{'\u203A'}</Text>
        </Pressable>

        {/* -- Learn Section -- */}
        <Text style={styles.learnSectionTitle}>Apprendre</Text>

        {BEAUTY_TIPS.map((tip) => (
          <View key={tip.id} style={styles.tipCard}>
            <Text style={styles.tipEmoji}>{tip.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipPreview} numberOfLines={2}>{tip.content}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

  // Analysis cards
  analysisCard: {
    backgroundColor: colors.card, borderRadius: 24, padding: 20,
    marginBottom: 20,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.08)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
    }) as any,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardEmoji: { fontSize: 32, marginRight: 14 },
  cardTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.accent },
  cardDescription: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },
  scoreCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryGhost, justifyContent: 'center', alignItems: 'center',
  },
  scoreText: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.primary },
  scoreLabel: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: -2 },

  cardDetails: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  monkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.cardHover, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
  },
  monkDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  monkText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  undertoneBadge: {
    backgroundColor: colors.cardHover, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
  },
  undertoneText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  hairTypeBadge: {
    backgroundColor: colors.primaryGhost, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100,
  },
  hairTypeText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  cardCta: {
    backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 25, alignItems: 'center',
  },
  cardCtaText: { color: colors.white, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  // History
  historySection: { marginTop: 8 },
  sectionTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginBottom: 14 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, padding: 16, borderRadius: 16,
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(90,56,60,0.06)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
    }) as any,
  },
  historyIcon: { fontSize: 18, marginRight: 12 },
  historyLabel: { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text },
  historyDate: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },

  // Journal card
  journalCard: {
    flexDirection: 'row', alignItems: 'center', padding: 18,
    backgroundColor: colors.card, borderRadius: 20,
    marginHorizontal: 0, marginTop: 20, gap: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(90,56,60,0.06)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
    }) as any,
  },
  journalIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center', alignItems: 'center',
  },
  journalTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.accent },
  journalSubtitle: { fontSize: 11, color: colors.textSecondary, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  journalArrow: { fontSize: 22, color: colors.textMuted },

  // Learn section
  learnSectionTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginTop: 28, marginBottom: 12 },
  tipCard: {
    flexDirection: 'row', padding: 16,
    backgroundColor: colors.card, borderRadius: 16,
    marginBottom: 10, gap: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(90,56,60,0.06)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
    }) as any,
  },
  tipEmoji: { fontSize: 28 },
  tipTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  tipPreview: { fontSize: 12, color: colors.textSecondary, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 4 },

  // Empty/Auth
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text, textAlign: 'center', marginBottom: 20 },
  loginButton: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 25 },
  loginButtonText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
