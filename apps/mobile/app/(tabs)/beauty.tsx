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
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
import IconArrowRight from '@tabler/icons-react-native/dist/esm/icons/IconArrowRight.mjs';
import IconDroplet from '@tabler/icons-react-native/dist/esm/icons/IconDroplet.mjs';
import IconSun from '@tabler/icons-react-native/dist/esm/icons/IconSun.mjs';
import IconLeaf from '@tabler/icons-react-native/dist/esm/icons/IconLeaf.mjs';
import IconBottle from '@tabler/icons-react-native/dist/esm/icons/IconBottle.mjs';
import IconBook from '@tabler/icons-react-native/dist/esm/icons/IconBook.mjs';
import IconPalette from '@tabler/icons-react-native/dist/esm/icons/IconPalette.mjs';
import IconFlower from '@tabler/icons-react-native/dist/esm/icons/IconFlower.mjs';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles.mjs';
import IconScissors from '@tabler/icons-react-native/dist/esm/icons/IconScissors.mjs';
import IconCamera from '@tabler/icons-react-native/dist/esm/icons/IconCamera.mjs';
import React from 'react';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import Skeleton from '../../src/components/Skeleton';
import CurveHeader from '../../src/components/CurveHeader';
import { FadeInStagger, PressableScale } from '../../src/components/animations';
import { showAlert } from '../../src/lib/alert';

const BEAUTY_TIPS: { id: string; Icon: React.ComponentType<{ size: number; color: string }>; title: string; content: string }[] = [
  { id: '1', Icon: IconDroplet, title: 'Méthode LOC pour cheveux 4C', content: "Liquid, Oil, Cream — l'ordre d'application qui change tout pour l'hydratation des cheveux crépus." },
  { id: '2', Icon: IconSun, title: 'SPF et peau foncée : le mythe', content: "Les peaux riches en mélanine ont aussi besoin de protection solaire. L'hyperpigmentation est plus visible sans SPF." },
  { id: '3', Icon: IconLeaf, title: 'Beurre de karité : guide complet', content: 'Comment choisir, préparer et appliquer le karité pour cheveux et peau. Du brut au raffiné, tout savoir.' },
  { id: '4', Icon: IconBottle, title: 'Routine night-time pour braids', content: 'Protège tes tresses la nuit avec un bonnet en satin et un spray hydratant léger pour éviter la sécheresse.' },
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
          <IconSparkles size={48} color={colors.primary} />
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

  const handleLearnMore = () => {
    showAlert(
      'À votre image',
      'Notre IA comprend les peaux et cheveux africains — Monk Scale, undertone, porosité, densité, et 20+ métriques. Construite sur des datasets pensés pour vous.',
    );
  };

  return (
    <View style={styles.container}>
      <CurveHeader title="Beauté AI" subtitle="Analyses personnalisées pour votre peau et vos cheveux" height={160} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
      >
        {/* -- Hero Card -- */}
        <FadeInStagger index={0} style={styles.heroCard}>
          <Text style={styles.heroHeadline}>À votre image</Text>
          <Text style={styles.heroSubtitle}>Notre IA comprend les peaux et cheveux africains comme aucune autre app</Text>
          <Pressable onPress={handleLearnMore}>
            <Text style={styles.heroLink}>En savoir plus →</Text>
          </Pressable>
        </FadeInStagger>

        {/* -- Skin Analysis Card -- */}
        <FadeInStagger index={1} style={{ width: '100%' }}>
          <PressableScale
            onPress={() => lastSkin ? router.push(`/ai/skin-results/${lastSkin.id}`) : router.push('/ai/skin-capture')}
            style={styles.analysisCard}
          >
            <View style={styles.analysisCardHeader}>
              <View style={[styles.analysisCardIcon, { backgroundColor: colors.primaryGhost }]}>
                <IconSparkles size={32} color={colors.accent} />
              </View>
              <View style={styles.analysisCardText}>
                <Text style={styles.analysisCardTitle}>Analyse de peau</Text>
                <Text style={styles.analysisCardDesc}>
                  Détectez votre teint Monk Scale (1–10), undertone, hydratation, sébum, taches…
                </Text>
              </View>
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
                      {lastSkin.undertone === 'WARM' ? 'Chaud' : lastSkin.undertone === 'COOL' ? 'Froid' : 'Neutre'}
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
                Analyser ma peau →
              </Text>
            </Pressable>
          </PressableScale>
        </FadeInStagger>

        {/* -- Hair Analysis Card -- */}
        <FadeInStagger index={2} style={{ width: '100%' }}>
          <PressableScale
            onPress={() => lastHair ? router.push(`/ai/hair-results/${lastHair.id}`) : router.push('/ai/hair-capture')}
            style={styles.analysisCard}
          >
            <View style={styles.analysisCardHeader}>
              <View style={[styles.analysisCardIcon, { backgroundColor: colors.primaryGhost }]}>
                <IconScissors size={32} color={colors.primary} />
              </View>
              <View style={styles.analysisCardText}>
                <Text style={styles.analysisCardTitle}>Analyse cheveux</Text>
                <Text style={styles.analysisCardDesc}>
                  Identifiez votre type 4A–4C, porosité, densité, élasticité…
                </Text>
              </View>
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
                Analyser mes cheveux →
              </Text>
            </Pressable>
          </PressableScale>
        </FadeInStagger>

        {/* -- Virtual Mirror Card -- */}
        <FadeInStagger index={3} style={{ width: '100%' }}>
          <PressableScale
            onPress={() => router.push('/ai/virtual-tryon' as any)}
            style={styles.mirrorCard}
          >
            <View style={styles.mirrorContent}>
              <View style={styles.mirrorBadge}>
                <Text style={styles.mirrorBadgeText}>NOUVEAU</Text>
              </View>
              <Text style={styles.mirrorTitle}>Miroir Virtuel</Text>
              <Text style={styles.mirrorSubtitle}>
                Essayez rouge à lèvres, blush et fard — en temps réel sur votre visage
              </Text>
              <View style={styles.mirrorCta}>
                <Text style={styles.mirrorCtaText}>Essayer maintenant</Text>
                <IconArrowRight size={14} color={colors.white} />
              </View>
            </View>
            <View style={styles.mirrorIcons}>
              <IconPalette size={28} color={colors.accent} />
              <IconFlower size={28} color={colors.primary} style={{ marginTop: 8 }} />
              <IconSparkles size={28} color={colors.accent} style={{ marginTop: 8 }} />
            </View>
          </PressableScale>
        </FadeInStagger>

        {/* -- Recent Analyses -- */}
        {(skinHistory.length > 0 || hairHistory.length > 0) && (
          <FadeInStagger index={4} style={{ width: '100%' }}>
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Mes analyses récentes</Text>
              <View style={styles.recentGrid}>
                {[...skinHistory, ...hairHistory]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 4)
                  .map((analysis, i) => {
                    const isSkin = 'monkTone' in analysis;
                    return (
                      <PressableScale
                        key={analysis.id}
                        onPress={() => router.push(isSkin ? `/ai/skin-results/${analysis.id}` : `/ai/hair-results/${analysis.id}`)}
                        style={styles.recentCard}
                      >
                        <View style={[styles.recentIcon, { backgroundColor: isSkin ? colors.primaryGhost : colors.primaryGhost }]}>
                          {isSkin ? <IconDroplet size={20} color={colors.primary} /> : <IconScissors size={20} color={colors.primary} />}
                        </View>
                        <Text style={styles.recentType}>{isSkin ? 'Peau' : 'Cheveux'}</Text>
                        {isSkin ? (
                          <Text style={styles.recentMetric}>M{(analysis as SkinSummary).monkTone || '—'}</Text>
                        ) : (
                          <Text style={styles.recentMetric}>{(analysis as HairSummary).hairType || '—'}</Text>
                        )}
                        <Text style={styles.recentDate}>{new Date(analysis.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>
                      </PressableScale>
                    );
                  })}
              </View>
              {skinHistory.length === 0 && hairHistory.length === 0 && (
                <Text style={styles.emptyAnalysis}>Pas encore d'analyse — commencez maintenant !</Text>
              )}
            </View>
          </FadeInStagger>
        )}

        {/* -- Hair Journal Card -- */}
        <FadeInStagger index={5}>
          <PressableScale style={styles.journalCard} onPress={() => router.push('/hair-journal' as any)}>
            <View style={styles.journalIcon}>
              <IconBook size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.journalTitle}>Journal capillaire</Text>
              <Text style={styles.journalSubtitle}>Suivez votre parcours cheveux mois par mois</Text>
            </View>
            <IconChevronRight size={20} color={colors.textMuted} />
          </PressableScale>
        </FadeInStagger>

        {/* -- Learn Section -- */}
        <FadeInStagger index={6}>
          <Text style={styles.learnSectionTitle}>Apprendre</Text>
        </FadeInStagger>

        <View style={styles.tipGrid}>
          {BEAUTY_TIPS.map((tip, i) => (
            <FadeInStagger key={tip.id} index={7 + i} style={styles.tipCell}>
              <PressableScale
                onPress={() => router.push(`/learn/${tip.id}` as any)}
                style={styles.tipCard}
              >
                <View style={styles.tipIconWrap}>
                  <tip.Icon size={24} color={colors.primary} />
                </View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipPreview} numberOfLines={2}>{tip.content}</Text>
                <View style={styles.tipReadMore}>
                  <Text style={styles.tipReadMoreText}>Lire</Text>
                  <IconChevronRight size={12} color={colors.primary} />
                </View>
              </PressableScale>
            </FadeInStagger>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

  // Hero Card
  heroCard: {
    backgroundColor: colors.accent,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(91,33,182,0.15)' },
      default: { shadowColor: '#5B21B6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 5 },
    }) as any,
  },
  heroHeadline: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.white,
    marginBottom: 12,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
    marginBottom: 16,
  },
  heroLink: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.white,
    textDecorationLine: 'underline',
  },

  // Analysis cards
  analysisCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.08)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
    }) as any,
  },
  analysisCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  analysisCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  analysisCardText: {
    flex: 1,
  },
  analysisCardTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.accent,
    marginBottom: 6,
  },
  analysisCardDesc: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 18,
  },

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

  // Virtual Mirror card
  mirrorCard: {
    borderRadius: 24, padding: 24, marginBottom: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(91,33,182,0.10)' },
      default: { shadowColor: '#5B21B6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 20, elevation: 4 },
    }) as any,
  },
  mirrorContent: { flex: 1 },
  mirrorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 100, marginBottom: 10,
  },
  mirrorBadgeText: { color: colors.white, fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1 },
  mirrorTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: colors.text, marginBottom: 8 },
  mirrorSubtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  mirrorCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mirrorCtaText: { color: colors.white, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  mirrorIcons: { paddingLeft: 12, alignItems: 'center' },

  // Recent Analyses
  recentSection: { marginTop: 8, marginBottom: 20 },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recentCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(90,56,60,0.06)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
    }) as any,
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentType: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  recentMetric: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.accent,
    marginBottom: 6,
  },
  recentDate: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },
  emptyAnalysis: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  sectionTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginBottom: 14 },

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

  // Learn section
  learnSectionTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginTop: 28, marginBottom: 16 },
  tipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  // Cell sits the FadeInStagger wrapper at 48% so two tips share a row with the 12px gap
  tipCell: { width: '48%' },
  tipCard: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(90,56,60,0.06)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
    }) as any,
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 6 },
  tipPreview: { fontSize: 11, color: colors.textSecondary, fontFamily: 'Poppins_400Regular', lineHeight: 16, marginBottom: 10 },
  tipReadMore: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 'auto' as any },
  tipReadMoreText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.primary },

  // Empty/Auth
  emptyTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text, textAlign: 'center', marginBottom: 20 },
  loginButton: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 25 },
  loginButtonText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
