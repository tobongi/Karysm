import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl, Platform, ViewStyle, Image, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import IconScissors from '@tabler/icons-react-native/dist/esm/icons/IconScissors.mjs';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles.mjs';
import IconBrush from '@tabler/icons-react-native/dist/esm/icons/IconBrush.mjs';
import IconLeaf from '@tabler/icons-react-native/dist/esm/icons/IconLeaf.mjs';
import IconRazor from '@tabler/icons-react-native/dist/esm/icons/IconRazor.mjs';
import IconDroplet from '@tabler/icons-react-native/dist/esm/icons/IconDroplet.mjs';
import IconMapPin from '@tabler/icons-react-native/dist/esm/icons/IconMapPin.mjs';
import IconArrowRight from '@tabler/icons-react-native/dist/esm/icons/IconArrowRight.mjs';
import IconSearch from '@tabler/icons-react-native/dist/esm/icons/IconSearch.mjs';
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX.mjs';
import IconMap from '@tabler/icons-react-native/dist/esm/icons/IconMap.mjs';
import IconList from '@tabler/icons-react-native/dist/esm/icons/IconList.mjs';
import IconHeart from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';
import IconDiamond from '@tabler/icons-react-native/dist/esm/icons/IconDiamond.mjs';
import IconAward from '@tabler/icons-react-native/dist/esm/icons/IconAward.mjs';
import IconBell from '@tabler/icons-react-native/dist/esm/icons/IconBell.mjs';
import IconAdjustments from '@tabler/icons-react-native/dist/esm/icons/IconAdjustments.mjs';
import IconCar from '@tabler/icons-react-native/dist/esm/icons/IconCar.mjs';
import IconSortAscending from '@tabler/icons-react-native/dist/esm/icons/IconSortAscending.mjs';
import IconSortDescending from '@tabler/icons-react-native/dist/esm/icons/IconSortDescending.mjs';
import IconCalendarEvent from '@tabler/icons-react-native/dist/esm/icons/IconCalendarEvent.mjs';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck.mjs';
import IconCash from '@tabler/icons-react-native/dist/esm/icons/IconCash.mjs';
import IconClipboardList from '@tabler/icons-react-native/dist/esm/icons/IconClipboardList.mjs';
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
import IconPlus from '@tabler/icons-react-native/dist/esm/icons/IconPlus.mjs';
import IconRosetteDiscountCheck from '@tabler/icons-react-native/dist/esm/icons/IconRosetteDiscountCheck.mjs';
import IconTrendingUp from '@tabler/icons-react-native/dist/esm/icons/IconTrendingUp.mjs';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { radius, spacing, screenPadding } from '../../src/theme/spacing';
import { shadows } from '../../src/theme/shadows';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import { getRecentlyViewed, RecentProvider } from '../../src/lib/recently-viewed';
import { SearchBar, CategoryIcon, ProviderCardSkeleton, SectionHeader, SearchFilters } from '../../src/components';
import { PressableScale, FadeInStagger } from '../../src/components/animations';
import MapView from '../../src/components/MapView';

const PLACEHOLDER_IMAGES = [
  require('../../assets/images/providers/provider_1.jpg'),
  require('../../assets/images/providers/provider_2.jpg'),
  require('../../assets/images/providers/provider_3.jpg'),
  require('../../assets/images/providers/provider_4.jpg'),
  require('../../assets/images/providers/provider_5.jpg'),
  require('../../assets/images/providers/provider_6.jpg'),
  require('../../assets/images/providers/provider_7.jpg'),
];

const LOOKBOOK_THUMBS = [
  require('../../assets/images/lookbook/look_tresses.webp'),
  require('../../assets/images/lookbook/look_ongles.webp'),
  require('../../assets/images/lookbook/look_maq_smoky_violet.webp'),
  require('../../assets/images/lookbook/look_mariee.webp'),
];

const QUARTIERS = [
  { name: 'Matonge', lat: -4.331, lng: 15.313 },
  { name: 'Bandal', lat: -4.327, lng: 15.296 },
  { name: 'Gombe', lat: -4.310, lng: 15.312 },
  { name: 'Ma Campagne', lat: -4.338, lng: 15.298 },
  { name: 'Kitambo', lat: -4.325, lng: 15.290 },
  { name: 'Limete', lat: -4.329, lng: 15.339 },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  coiffure: <IconScissors size={28} color={colors.terracotta} strokeWidth={1.5} />,
  ongles: <IconDiamond size={28} color={colors.terracotta} strokeWidth={1.5} />,
  maquillage: <IconBrush size={28} color={colors.terracotta} strokeWidth={1.5} />,
  soins: <IconLeaf size={28} color={colors.terracotta} strokeWidth={1.5} />,
  barber: <IconRazor size={28} color={colors.terracotta} strokeWidth={1.5} />,
  spa: <IconDroplet size={28} color={colors.terracotta} strokeWidth={1.5} />,
};

const CATEGORY_ICONS_ACTIVE: Record<string, React.ReactNode> = {
  coiffure: <IconScissors size={28} color={colors.white} strokeWidth={1.5} />,
  ongles: <IconDiamond size={28} color={colors.white} strokeWidth={1.5} />,
  maquillage: <IconBrush size={28} color={colors.white} strokeWidth={1.5} />,
  soins: <IconLeaf size={28} color={colors.white} strokeWidth={1.5} />,
  barber: <IconRazor size={28} color={colors.white} strokeWidth={1.5} />,
  spa: <IconDroplet size={28} color={colors.white} strokeWidth={1.5} />,
};

const SERVICE_CATEGORIES = [
  { slug: 'coiffure', name: 'Coiffure' },
  { slug: 'ongles', name: 'Ongles' },
  { slug: 'maquillage', name: 'Maquillage' },
  { slug: 'soins', name: 'Soins' },
  { slug: 'barber', name: 'Barbier' },
  { slug: 'spa', name: 'Spa' },
];

const HERO_SLIDES = [
  { image: PLACEHOLDER_IMAGES[0], label: 'NOUVEAU', title: 'Votre beauté,\nsublimée', sub: 'Trouvez les meilleures prestataires près de chez vous' },
  { image: PLACEHOLDER_IMAGES[2], label: 'AI BEAUTÉ', title: 'Analysez\nvos cheveux', sub: 'Intelligence artificielle pour cheveux afro' },
  { image: PLACEHOLDER_IMAGES[4], label: 'TENDANCE', title: 'Inspirez-vous\ndu lookbook', sub: 'Portfolio des meilleures prestataires' },
];

const CATEGORY_BG: Record<string, string> = {
  coiffure:   'rgba(139,105,82,0.12)',
  ongles:     'rgba(167,80,148,0.10)',
  maquillage: 'rgba(91,33,182,0.10)',
  soins:      'rgba(0,135,90,0.08)',
  barber:     'rgba(40,50,80,0.08)',
  spa:        'rgba(20,140,180,0.08)',
};

const SUBCATEGORIES: Record<string, Array<{ name: string; slug: string }>> = {
  coiffure: [
    { name: 'Tresses', slug: 'tresses' },
    { name: 'Tissage', slug: 'tissage' },
    { name: 'Locks', slug: 'locks' },
    { name: 'Coupe', slug: 'coupe' },
    { name: 'Lissage', slug: 'lissage' },
    { name: 'Soins capillaires', slug: 'soins-capillaires' },
  ],
  ongles: [
    { name: 'Manucure', slug: 'manucure' },
    { name: 'Gel UV', slug: 'gel-uv' },
    { name: 'Extension', slug: 'extension-ongles' },
    { name: 'Nail art', slug: 'nail-art' },
    { name: 'Pédicure', slug: 'pedicure' },
  ],
  maquillage: [
    { name: 'Jour', slug: 'maquillage-jour' },
    { name: 'Soirée', slug: 'maquillage-soiree' },
    { name: 'Mariée', slug: 'maquillage-mariee' },
  ],
  soins: [
    { name: 'Visage', slug: 'soins-visage' },
    { name: 'Corps', slug: 'soins-corps' },
    { name: 'Massage relaxant', slug: 'massage-relaxant' },
    { name: 'Massage drainant', slug: 'massage-drainant' },
    { name: 'Pieds', slug: 'soins-pieds' },
  ],
  barber: [
    { name: 'Coupe homme', slug: 'coupe-homme' },
    { name: 'Barbe', slug: 'barbe' },
    { name: 'Rasage', slug: 'rasage' },
  ],
  spa: [
    { name: 'Hammam', slug: 'hammam' },
    { name: 'Sauna', slug: 'sauna' },
    { name: 'Soin complet', slug: 'soin-complet' },
  ],
};

interface ProviderResult {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  commune?: string;
  avgRating: number;
  totalReviews: number;
  isMobile: boolean;
  distance?: number | null;
  minPrice?: number | null;
  currency: string;
  services: Array<{
    name: string;
    priceMin: number;
    priceMax?: number;
    durationMin: number;
    category: { name: string; icon?: string };
  }>;
  user: { name: string; avatar?: string | null };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Salut';
  return 'Bonsoir';
}

function CardGallery({ images, cardWidth }: { images: any[]; cardWidth: number }) {
  const [idx, setIdx] = useState(0);
  return (
    <>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        onMomentumScrollEnd={e =>
          setIdx(Math.round(e.nativeEvent.contentOffset.x / cardWidth))
        }
        scrollEventThrottle={16}
      >
        {images.map((src, i) => (
          <Image key={i} source={src} style={{ width: cardWidth, height: 180 }} resizeMode="cover" />
        ))}
      </ScrollView>
      <View style={styles.galleryDots}>
        {images.map((_, i) => (
          <View key={i} style={[styles.galleryDot, i === idx && styles.galleryDotActive]} />
        ))}
      </View>
    </>
  );
}

function HeroBanner({ slides, currentIndex }: { slides: typeof HERO_SLIDES; currentIndex: number }) {
  const prevIndex = useRef(currentIndex);
  const fadeAnim = useSharedValue(1);

  useEffect(() => {
    if (prevIndex.current !== currentIndex) {
      fadeAnim.value = 0;
      fadeAnim.value = withTiming(1, { duration: 500 });
      prevIndex.current = currentIndex;
    }
  }, [currentIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const slide = slides[currentIndex];

  return (
    <View style={styles.heroBanner}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Image source={slide.image} style={styles.heroImage} resizeMode="cover" />
      </Animated.View>
      <View style={styles.heroOverlay} />
      <Animated.View style={[styles.heroContent, animatedStyle]}>
        <Text style={styles.heroLabel}>{slide.label}</Text>
        <Text style={styles.heroTitle}>{slide.title}</Text>
        <Text style={styles.heroSubtitle}>{slide.sub}</Text>
      </Animated.View>
      <View style={styles.heroDots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.heroDot, i === currentIndex && styles.heroDotActive]} />
        ))}
      </View>
    </View>
  );
}

// ─── Provider interfaces ────────────────────────────────────────────────────

interface ProviderBooking {
  id: string;
  ref: string;
  date: string;
  startTime: string;
  status: string;
  agreedPrice: number;
  currency: string;
  service: { name: string };
  client: { name: string; avatar?: string | null };
}

interface ProviderWallet {
  availableBalance: number;
  pendingBalance: number;
  currency: string;
}

interface OpenRequest {
  id: string;
  title: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  city: string;
  proposalCount: number;
  createdAt: string;
  client?: { name: string; avatar?: string | null };
}

// ─── ProviderHome ────────────────────────────────────────────────────────────

function ProviderHome({ user }: { user: any }) {
  const [wallet, setWallet] = useState<ProviderWallet | null>(null);
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [requests, setRequests] = useState<OpenRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const firstName = user?.name?.split(' ')[0];
  const greeting = getGreeting();

  const load = useCallback(async () => {
    try {
      const [wRes, bRes, rRes] = await Promise.allSettled([
        api('/wallet') as Promise<any>,
        api('/bookings/mine?role=provider&status=upcoming&pageSize=3') as Promise<any>,
        api('/requests?pageSize=4') as Promise<any>,
      ]);
      if (wRes.status === 'fulfilled') setWallet(wRes.value?.data ?? null);
      if (bRes.status === 'fulfilled') setBookings(bRes.value?.data?.items ?? []);
      if (rRes.status === 'fulfilled') setRequests(rRes.value?.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const fmtAmount = (n: number, currency: string) =>
    `${n.toLocaleString('fr-FR')} ${currency === 'CDF' ? 'FC' : 'FCFA'}`;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    REQUESTED:  { label: 'Demande',   color: colors.warning },
    CONFIRMED:  { label: 'Confirmé',  color: colors.primary },
    DEPOSIT_PAID: { label: 'Acompte', color: colors.success },
    IN_PROGRESS: { label: 'En cours', color: colors.accent },
    COMPLETED:  { label: 'Terminé',   color: colors.textMuted },
  };

  return (
    <SafeAreaView style={pStyles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={pStyles.scroll}>

        {/* ── Header ── */}
        <View style={pStyles.header}>
          <View style={pStyles.headerTop}>
            <View>
              <Text style={pStyles.greeting}>{greeting}</Text>
              <Text style={pStyles.name}>{firstName || 'Prestataire'}</Text>
            </View>
            <Pressable onPress={() => router.push('/notifications' as any)} style={pStyles.bellBtn}>
              <IconBell size={22} color={colors.white} strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>

        {/* ── Wallet card ── */}
        <Pressable style={pStyles.walletCard} onPress={() => router.push('/wallet/index' as any)}>
          <View style={pStyles.walletRow}>
            <View>
              <Text style={pStyles.walletLabel}>Solde disponible</Text>
              {loading ? (
                <View style={pStyles.walletSkeleton} />
              ) : (
                <Text style={pStyles.walletAmount}>
                  {wallet ? fmtAmount(wallet.availableBalance, wallet.currency) : '—'}
                </Text>
              )}
            </View>
            <View style={pStyles.walletIconCircle}>
              <IconCash size={26} color={colors.accent} strokeWidth={1.6} />
            </View>
          </View>
          {wallet && wallet.pendingBalance > 0 && (
            <View style={pStyles.walletPending}>
              <Text style={pStyles.walletPendingText}>
                {fmtAmount(wallet.pendingBalance, wallet.currency)} en attente de validation
              </Text>
            </View>
          )}
        </Pressable>

        {/* ── Quick actions ── */}
        <View style={pStyles.actionsRow}>
          {[
            { label: 'Services', icon: <IconPlus size={22} color={colors.accent} strokeWidth={1.8} />, route: '/provider-dashboard/services' },
            { label: 'Disponibilités', icon: <IconCalendarEvent size={22} color={colors.accent} strokeWidth={1.8} />, route: '/provider-dashboard/availability' },
            { label: 'Revenus', icon: <IconTrendingUp size={22} color={colors.accent} strokeWidth={1.8} />, route: '/provider-dashboard/earnings' },
            { label: 'Demandes', icon: <IconClipboardList size={22} color={colors.accent} strokeWidth={1.8} />, route: '/request/browse' },
          ].map(a => (
            <PressableScale key={a.label} style={pStyles.actionBtn} onPress={() => router.push(a.route as any)}>
              <View style={pStyles.actionIcon}>{a.icon}</View>
              <Text style={pStyles.actionLabel}>{a.label}</Text>
            </PressableScale>
          ))}
        </View>

        {/* ── Upcoming bookings ── */}
        <View style={pStyles.section}>
          <View style={pStyles.sectionRow}>
            <Text style={pStyles.sectionTitle}>Rendez-vous à venir</Text>
            <Pressable onPress={() => router.push('/(tabs)/bookings' as any)}>
              <Text style={pStyles.sectionLink}>Voir tout</Text>
            </Pressable>
          </View>

          {loading ? (
            [0, 1].map(i => <View key={i} style={pStyles.bookingSkeleton} />)
          ) : bookings.length === 0 ? (
            <View style={pStyles.emptyCard}>
              <IconCalendarEvent size={32} color={colors.textMuted} strokeWidth={1.4} />
              <Text style={pStyles.emptyText}>Aucun rendez-vous à venir</Text>
            </View>
          ) : (
            <View>
              {bookings.map((b, idx) => {
                const st = STATUS_LABEL[b.status] ?? { label: b.status, color: colors.textMuted };
                return (
                  <FadeInStagger key={b.id} index={idx}>
                    <PressableScale style={pStyles.bookingCard} onPress={() => router.push(`/booking/detail/${b.id}` as any)}>
                      <View style={pStyles.bookingLeft}>
                        <View style={pStyles.bookingAvatar}>
                          {b.client.avatar ? (
                            <Image source={{ uri: b.client.avatar }} style={pStyles.bookingAvatarImg} />
                          ) : (
                            <Text style={pStyles.bookingAvatarInit}>{b.client.name[0]?.toUpperCase()}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={pStyles.bookingClient} numberOfLines={1}>{b.client.name}</Text>
                          <Text style={pStyles.bookingService} numberOfLines={1}>{b.service.name}</Text>
                          <Text style={pStyles.bookingDate}>{fmtDate(b.date)} · {b.startTime.slice(0, 5)}</Text>
                        </View>
                      </View>
                      <View style={pStyles.bookingRight}>
                        <Text style={pStyles.bookingPrice}>{fmtAmount(b.agreedPrice, b.currency)}</Text>
                        <View style={[pStyles.statusPill, { backgroundColor: `${st.color}18` }]}>
                          <Text style={[pStyles.statusPillText, { color: st.color }]}>{st.label}</Text>
                        </View>
                      </View>
                    </PressableScale>
                  </FadeInStagger>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Open requests ── */}
        <View style={pStyles.section}>
          <View style={pStyles.sectionRow}>
            <Text style={pStyles.sectionTitle}>Demandes ouvertes</Text>
            <Pressable onPress={() => router.push('/request/browse' as any)}>
              <Text style={pStyles.sectionLink}>Voir tout</Text>
            </Pressable>
          </View>

          {loading ? (
            [0, 1].map(i => <View key={i} style={pStyles.requestSkeleton} />)
          ) : requests.length === 0 ? (
            <View style={pStyles.emptyCard}>
              <IconClipboardList size={32} color={colors.textMuted} strokeWidth={1.4} />
              <Text style={pStyles.emptyText}>Aucune demande ouverte pour l'instant</Text>
            </View>
          ) : (
            <View>
              {requests.map((r, idx) => (
                <FadeInStagger key={r.id} index={idx}>
                  <PressableScale style={pStyles.requestCard} onPress={() => router.push(`/request/${r.id}` as any)}>
                    <View style={{ flex: 1 }}>
                      <Text style={pStyles.requestTitle} numberOfLines={1}>{r.title}</Text>
                      <View style={pStyles.requestMeta}>
                        <IconMapPin size={12} color={colors.textMuted} strokeWidth={1.8} />
                        <Text style={pStyles.requestMetaText}>{r.city}</Text>
                        <Text style={pStyles.requestMetaDot}>·</Text>
                        <Text style={pStyles.requestMetaText}>
                          {fmtAmount(r.budgetMin, r.currency)}
                          {r.budgetMax > r.budgetMin ? ` – ${fmtAmount(r.budgetMax, r.currency)}` : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={pStyles.requestRight}>
                      <View style={pStyles.proposalBadge}>
                        <Text style={pStyles.proposalCount}>{r.proposalCount}</Text>
                        <Text style={pStyles.proposalLabel}>offres</Text>
                      </View>
                      <IconChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
                    </View>
                  </PressableScale>
                </FadeInStagger>
              ))}
            </View>
          )}
        </View>

        {/* ── KYC nudge ── */}
        {user && !user.idVerified && (
          <PressableScale style={pStyles.kycNudge} onPress={() => router.push('/kyc/index' as any)}>
            <IconRosetteDiscountCheck size={24} color={colors.warning} strokeWidth={1.6} />
            <View style={{ flex: 1 }}>
              <Text style={pStyles.kycNudgeTitle}>Obtenez le badge vérifié</Text>
              <Text style={pStyles.kycNudgeSub}>Soumettez vos documents pour rassurer vos clientes</Text>
            </View>
            <IconChevronRight size={16} color={colors.warning} strokeWidth={2} />
          </PressableScale>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const pStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 24 },

  header: {
    backgroundColor: colors.headerDark,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.65)', marginBottom: 2 },
  name: { fontSize: 26, fontFamily: 'PlayfairDisplay_700Bold', color: colors.white },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  walletCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.10)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 3 },
    }) as any,
  },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginBottom: 6 },
  walletAmount: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.accent, letterSpacing: -0.5 },
  walletSkeleton: { height: 30, width: 160, borderRadius: 8, backgroundColor: colors.n300, marginBottom: 4 },
  walletIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(91,33,182,0.10)', justifyContent: 'center', alignItems: 'center' },
  walletPending: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  walletPendingText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.warning },

  actionsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  actionBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionIcon: { marginBottom: 6 },
  actionLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.text, textAlign: 'center' },

  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.accent },
  sectionLink: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.primary },

  bookingCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  bookingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  bookingAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryGhost, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  bookingAvatarImg: { width: 44, height: 44 },
  bookingAvatarInit: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  bookingClient: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 2 },
  bookingService: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginBottom: 2 },
  bookingDate: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  bookingRight: { alignItems: 'flex-end', gap: 6 },
  bookingPrice: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.text },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  bookingSkeleton: { height: 72, borderRadius: 16, backgroundColor: colors.n300, marginBottom: 10 },

  requestCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  requestTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 6 },
  requestMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  requestMetaText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  requestMetaDot: { fontSize: 12, color: colors.textMuted },
  requestRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  proposalBadge: { alignItems: 'center', backgroundColor: colors.primaryGhost, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  proposalCount: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.primary },
  proposalLabel: { fontSize: 9, fontFamily: 'Poppins_400Regular', color: colors.primary },
  requestSkeleton: { height: 64, borderRadius: 16, backgroundColor: colors.n300, marginBottom: 10 },

  emptyCard: { backgroundColor: colors.card, borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: colors.border, gap: 10 },
  emptyText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'center' },

  kycNudge: {
    marginHorizontal: 20, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(230,138,0,0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(230,138,0,0.20)',
  },
  kycNudgeTitle: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.warning, marginBottom: 2 },
  kycNudgeSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
});

// ─── ExplorerTab (client home) ────────────────────────────────────────────────

export default function ExplorerTab() {
  const { user, isProvider } = useAuth();
  const { width: winWidth } = useWindowDimensions();
  const cardImgWidth = Math.min(winWidth, 480) - 40;
  const [heroIndex, setHeroIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedQuartier, setSelectedQuartier] = useState('Matonge');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentProvider[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterIsMobile, setFilterIsMobile] = useState(false);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | null>(null);
  const [filterMaxDistance, setFilterMaxDistance] = useState<number | null>(null);
  const [filterMinRating, setFilterMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % HERO_SLIDES.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!search) { setDebouncedSearch(''); return; }
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      getRecentlyViewed().then(setRecentlyViewed);
    }, [])
  );

  const fetchProviders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      const categoryParam = selectedSubcategory || selectedCategory;
      if (categoryParam) params.set('category', categoryParam);
      params.set('city', 'Kinshasa');
      params.set('sort', sortBy);
      params.set('pageSize', '20');
      if (filterIsMobile) params.set('isMobile', 'true');
      if (filterMaxPrice) params.set('maxPrice', String(filterMaxPrice));
      if (filterMinRating) params.set('minRating', String(filterMinRating));
      if (filterMaxDistance) params.set('radius', String(filterMaxDistance));
      const res: any = await api(`/search?${params.toString()}`);
      setProviders(res.data?.items || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, selectedCategory, selectedSubcategory, sortBy, filterIsMobile, filterMaxPrice, filterMinRating, filterMaxDistance]);

  const isInitialLoad = providers.length === 0 && loading;
  useEffect(() => {
    if (providers.length === 0) setLoading(true);
    fetchProviders();
  }, [fetchProviders]);

  const toggleFavorite = useCallback(async (providerId: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
    try {
      await api(`/favorites/${providerId}`, { method: 'POST' });
    } catch (_e) {
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (next.has(providerId)) next.delete(providerId);
        else next.add(providerId);
        return next;
      });
    }
  }, []);

  function formatPrice(amount: number, currency: string) {
    const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  const activeFilterCount = [filterIsMobile, filterMaxPrice, filterMaxDistance, filterMinRating, sortBy !== 'rating'].filter(Boolean).length;
  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0];

  if (isProvider) return <ProviderHome user={user} />;

  const listHeader = (
    <>
      {/* Greeting Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {firstName ? `${greeting}, ${firstName}` : greeting}
          </Text>
          <Text style={styles.headerSubtitle}>Kinshasa · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.bellButton}
            onPress={() => router.push('/notifications' as any)}
          >
            <IconBell size={22} color={colors.text} strokeWidth={1.8} />
          </Pressable>
          <Pressable
            style={styles.viewToggle}
            onPress={() => setViewMode(v => v === 'list' ? 'map' : 'list')}
          >
            {viewMode === 'list' ? (
              <IconMap size={18} color={colors.white} strokeWidth={2} />
            ) : (
              <IconList size={18} color={colors.white} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Hero Banner — animated crossfade carousel */}
      <HeroBanner slides={HERO_SLIDES} currentIndex={heroIndex} />

      {/* Vu récemment — horizontal avatar scroll */}
      {recentlyViewed.length > 0 && (
        <>
          <SectionHeader
            title="Vu récemment"
            onSeeAll={() => router.push('/favorites' as any)}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: screenPadding.horizontal, gap: 16 }}
            style={{ marginBottom: 8, marginTop: -8 }}
          >
            {recentlyViewed.slice(0, 8).map((item) => (
              <Pressable
                key={item.id}
                style={styles.favoriteAvatarCard}
                onPress={() => router.push(`/provider/${item.slug}`)}
              >
                <View style={styles.favoriteAvatarCircle}>
                  <Text style={styles.favoriteAvatarText}>{item.displayName[0]}</Text>
                </View>
                <Text style={styles.favoriteAvatarName} numberOfLines={1}>{item.displayName.split(' ')[0]}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* Search with smart suggestions */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Prestation, quartier, prestataire..."
        />
        {showSuggestions && (() => {
          const q = search.toLowerCase();
          const matchingQuartiers = q
            ? QUARTIERS.filter(item => item.name.toLowerCase().includes(q))
            : QUARTIERS;
          const allServices = SERVICE_CATEGORIES.flatMap(cat =>
            [{ name: cat.name, slug: cat.slug, type: 'category' as const },
             ...(SUBCATEGORIES[cat.slug] || []).map(sub => ({ name: sub.name, slug: sub.slug, type: 'subcategory' as const, parent: cat.slug }))]
          );
          const matchingServices = q
            ? allServices.filter(s => s.name.toLowerCase().includes(q))
            : allServices.filter(s => s.type === 'category');
          const hasResults = matchingQuartiers.length > 0 || matchingServices.length > 0;
          if (!hasResults && q) return null;
          return (
            <Pressable style={styles.suggestions} onPress={() => {}}>
              {matchingServices.length > 0 && (
                <>
                  <Text style={styles.suggestionsTitle}>Prestations</Text>
                  {matchingServices.slice(0, 5).map((svc) => (
                    <Pressable
                      key={svc.slug}
                      style={styles.suggestionRow}
                      onPress={() => {
                        if (svc.type === 'category') {
                          setSelectedCategory(svc.slug);
                          setSelectedSubcategory(null);
                        } else {
                          setSelectedCategory((svc as any).parent || null);
                          setSelectedSubcategory(svc.slug);
                        }
                        setSearch('');
                        setShowSuggestions(false);
                      }}
                    >
                      <IconScissors size={16} color={colors.primary} strokeWidth={1.5} />
                      <Text style={styles.suggestionText}>{svc.name}</Text>
                      {svc.type === 'subcategory' && (
                        <Text style={styles.suggestionHint}>
                          {SERVICE_CATEGORIES.find(c => c.slug === (svc as any).parent)?.name}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </>
              )}
              {matchingQuartiers.length > 0 && (
                <>
                  <Text style={styles.suggestionsTitle}>Quartiers</Text>
                  {matchingQuartiers.map((item) => (
                    <Pressable
                      key={item.name}
                      style={styles.suggestionRow}
                      onPress={() => {
                        setSelectedQuartier(item.name);
                        setSearch('');
                        setShowSuggestions(false);
                      }}
                    >
                      <IconMapPin size={16} color={colors.textMuted} strokeWidth={1.5} />
                      <Text style={styles.suggestionText}>{item.name}</Text>
                      {selectedQuartier === item.name && (
                        <IconCheck size={14} color={colors.white} strokeWidth={3} />
                      )}
                    </Pressable>
                  ))}
                </>
              )}
            </Pressable>
          );
        })()}
      </View>

      {/* Quick filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        <PressableScale
          scale={0.95}
          style={[styles.filterChip, styles.filterChipQuartier]}
          onPress={() => {
            const idx = QUARTIERS.findIndex(q => q.name === selectedQuartier);
            const next = QUARTIERS[(idx + 1) % QUARTIERS.length];
            setSelectedQuartier(next.name);
          }}
        >
          <IconMapPin size={13} color={colors.accent} strokeWidth={2} />
          <Text style={[styles.filterChipText, { color: colors.accent, fontFamily: fonts.bodySemiBold }]}>
            {selectedQuartier}
          </Text>
        </PressableScale>

        <PressableScale
          scale={0.95}
          style={[styles.filterChip, filterIsMobile && styles.filterChipActive]}
          onPress={() => setFilterIsMobile(v => !v)}
        >
          <IconCar size={14} color={filterIsMobile ? colors.white : colors.text} strokeWidth={1.8} />
          <Text style={[styles.filterChipText, filterIsMobile && styles.filterChipTextActive]}>
            Se déplace
          </Text>
        </PressableScale>

        <PressableScale
          scale={0.95}
          style={[styles.filterChip, sortBy.startsWith('price') && styles.filterChipActive]}
          onPress={() => {
            if (sortBy === 'price_asc') setSortBy('price_desc');
            else if (sortBy === 'price_desc') setSortBy('rating');
            else setSortBy('price_asc');
          }}
        >
          {sortBy === 'price_desc'
            ? <IconSortDescending size={14} color={colors.white} strokeWidth={1.8} />
            : <IconSortAscending size={14} color={sortBy === 'price_asc' ? colors.white : colors.text} strokeWidth={1.8} />
          }
          <Text style={[styles.filterChipText, sortBy.startsWith('price') && styles.filterChipTextActive]}>
            {sortBy === 'price_asc' ? 'Prix ↑' : sortBy === 'price_desc' ? 'Prix ↓' : 'Prix'}
          </Text>
        </PressableScale>

        {[3, 5, 10].map(km => (
          <PressableScale
            key={km}
            scale={0.95}
            style={[styles.filterChip, filterMaxDistance === km && styles.filterChipActive]}
            onPress={() => setFilterMaxDistance(v => v === km ? null : km)}
          >
            <Text style={[styles.filterChipText, filterMaxDistance === km && styles.filterChipTextActive]}>
              {km} km
            </Text>
          </PressableScale>
        ))}

        <PressableScale
          scale={0.95}
          style={[styles.filterChip, styles.filterChipOutline]}
          onPress={() => setShowFilters(true)}
        >
          <IconAdjustments size={14} color={colors.primary} strokeWidth={1.8} />
          <Text style={[styles.filterChipText, { color: colors.primary }]}>
            Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </PressableScale>
      </ScrollView>

      {/* Categories */}
      <SectionHeader title="Catégories" />

      <View style={styles.categoriesGrid}>
        {SERVICE_CATEGORIES.map((cat, catIndex) => {
          const isActive = selectedCategory === cat.slug;
          return (
            <FadeInStagger key={cat.slug} index={catIndex} style={styles.categoryCell}>
              <CategoryIcon
                label={cat.name}
                icon={isActive ? CATEGORY_ICONS_ACTIVE[cat.slug] : CATEGORY_ICONS[cat.slug]}
                isActive={isActive}
                bgColor={CATEGORY_BG[cat.slug]}
                onPress={() => {
                  setSelectedCategory(isActive ? null : cat.slug);
                  setSelectedSubcategory(null);
                }}
              />
            </FadeInStagger>
          );
        })}
      </View>

      {/* Subcategory pills */}
      {selectedCategory && SUBCATEGORIES[selectedCategory] && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subcategoryRow}
          contentContainerStyle={styles.subcategoryContent}
        >
          <Pressable
            style={[styles.subcategoryChip, !selectedSubcategory && styles.subcategoryChipActive]}
            onPress={() => setSelectedSubcategory(null)}
          >
            <Text style={[styles.subcategoryText, !selectedSubcategory && styles.subcategoryTextActive]}>
              Tout
            </Text>
          </Pressable>
          {SUBCATEGORIES[selectedCategory].map((sub) => (
            <Pressable
              key={sub.slug}
              style={[styles.subcategoryChip, selectedSubcategory === sub.slug && styles.subcategoryChipActive]}
              onPress={() => setSelectedSubcategory(selectedSubcategory === sub.slug ? null : sub.slug)}
            >
              <Text style={[styles.subcategoryText, selectedSubcategory === sub.slug && styles.subcategoryTextActive]}>
                {sub.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Inspiration banner — real lookbook thumbnails */}
      <Pressable
        style={styles.inspirationBanner}
        onPress={() => router.push('/lookbook' as any)}
      >
        <View style={styles.inspirationContent}>
          <Text style={styles.inspirationLabel}>INSPIRATION</Text>
          <Text style={styles.inspirationTitle}>{'Trouvez votre\nprochain look'}</Text>
          <Text style={styles.inspirationCta}>Explorer →</Text>
        </View>
        <View style={styles.inspirationImageGrid}>
          {LOOKBOOK_THUMBS.map((src, i) => (
            <Image
              key={i}
              source={src}
              style={styles.inspirationThumb}
              resizeMode="cover"
            />
          ))}
        </View>
      </Pressable>

      {/* Beauty Request CTA */}
      <Pressable
        style={styles.requestBanner}
        onPress={() => router.push('/request/create' as any)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.requestTitle}>Décrivez ce que vous voulez</Text>
          <Text style={styles.requestSubtitle}>Recevez des propositions de prestataires</Text>
        </View>
        <View style={styles.requestArrowWrap}>
          <IconArrowRight size={18} color={colors.white} strokeWidth={2} />
        </View>
      </Pressable>

      {/* Occasion Booking CTA */}
      <Pressable
        style={styles.occasionBanner}
        onPress={() => router.push('/booking/occasion' as any)}
      >
        <View style={styles.occasionIconWrap}>
          <IconCalendarEvent size={20} color={colors.accent} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.occasionTitle}>Un événement à préparer ?</Text>
          <Text style={styles.occasionSubtitle}>Mariage, fête, shooting — planifiez tout en une fois</Text>
        </View>
        <Text style={styles.occasionArrow}>›</Text>
      </Pressable>

      {/* Providers section title */}
      <SectionHeader title="Recommandées" />

      {/* Map view inline */}
      {viewMode === 'map' && (
        <View style={styles.mapContainer}>
          {(() => {
            const cityProviders = providers;
            const cityCenter = QUARTIERS.find(c => c.name === selectedQuartier) || QUARTIERS[0];
            return (
              <>
                <MapView
                  pins={cityProviders
                    .map(p => ({
                      id: p.id, slug: p.slug, displayName: p.displayName,
                      lat: (p as any).lat || 0, lng: (p as any).lng || 0,
                      avgRating: p.avgRating || 0,
                    }))
                    .filter(p => p.lat !== 0 && p.lng !== 0)
                  }
                  onPinPress={(slug) => router.push(`/provider/${slug}`)}
                  center={{ lat: cityCenter.lat, lng: cityCenter.lng }}
                />
                <Text style={styles.mapCount}>
                  {cityProviders.length} prestataire{cityProviders.length !== 1 ? 's' : ''} à Kinshasa
                </Text>
              </>
            );
          })()}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.webWrapper}>
        {(
          <FlatList
            data={loading ? [] : (viewMode === 'map' ? [] : providers)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={listHeader}
            onScrollBeginDrag={() => setShowSuggestions(false)}
            removeClippedSubviews
            maxToRenderPerBatch={5}
            windowSize={10}
            initialNumToRender={5}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProviders(); }} tintColor={colors.primary} />}
            ListEmptyComponent={
              loading ? (
                <View style={{ paddingHorizontal: screenPadding.horizontal, paddingTop: 8 }}>
                  <ProviderCardSkeleton />
                  <ProviderCardSkeleton />
                  <ProviderCardSkeleton />
                </View>
              ) : viewMode === 'map' ? null : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>Aucun résultat</Text>
                  <Text style={styles.emptySubtitle}>Essayez une autre recherche</Text>
                </View>
              )
            }
            renderItem={({ item, index }) => (
              <FadeInStagger index={index}>
                <PressableScale style={styles.card} onPress={() => router.push(`/provider/${item.slug}`)}>
                  {/* Gallery */}
                  <View style={styles.cardGallery}>
                    <CardGallery
                      images={[PLACEHOLDER_IMAGES[index % 7], PLACEHOLDER_IMAGES[(index + 2) % 7]]}
                      cardWidth={cardImgWidth}
                    />
                    {item.avgRating >= 4.5 && (
                      <View style={styles.topProBadge}>
                        <IconAward size={12} color="#FFFFFF" strokeWidth={2} />
                        <Text style={styles.topProText}>TOP PRO</Text>
                      </View>
                    )}
                    <Pressable
                      style={styles.heartOverlay}
                      onPress={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                      hitSlop={8}
                    >
                      <View style={styles.heartCircle}>
                        <IconHeart
                          size={22}
                          color={favoriteIds.has(item.id) ? colors.primary : colors.white}
                          fill={favoriteIds.has(item.id) ? colors.primary : 'none'}
                          strokeWidth={2}
                        />
                      </View>
                    </Pressable>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardName} numberOfLines={1}>{item.displayName}</Text>
                      <View style={styles.ratingBadge}>
                        <IconStar size={13} color={colors.star} fill={colors.star} />
                        <Text style={styles.ratingText}>{(item.avgRating || 0).toFixed(1)}</Text>
                        <Text style={styles.reviewCount}>({item.totalReviews})</Text>
                      </View>
                    </View>

                    <View style={styles.locationRow}>
                      <IconMapPin size={13} color={colors.textSecondary} strokeWidth={1.5} />
                      <Text style={styles.cardLocation}>
                        {item.commune ? `${item.commune}, ` : ''}{item.city}
                        {item.distance != null ? ` · ${item.distance.toFixed(1)} km` : ''}
                      </Text>
                    </View>

                    <View style={styles.servicesPreview}>
                      {item.services.slice(0, 2).map((svc, i) => (
                        <View key={i} style={styles.serviceRow}>
                          <Text style={styles.serviceName} numberOfLines={1}>{svc.name}</Text>
                          <Text style={styles.servicePrice}>{formatPrice(svc.priceMin, item.currency)}</Text>
                        </View>
                      ))}
                      {item.services.length > 2 && (
                        <Text style={styles.moreServices}>+{item.services.length - 2} autres</Text>
                      )}
                    </View>

                    <View style={styles.tags}>
                      {item.isMobile && (
                        <View style={styles.tag}><Text style={styles.tagText}>Se déplace</Text></View>
                      )}
                      {item.minPrice != null && (
                        <View style={styles.tagPrice}><Text style={styles.tagPriceText}>dès {formatPrice(item.minPrice, item.currency)}</Text></View>
                      )}
                    </View>

                    <Pressable
                      style={styles.reserverButton}
                      onPress={(e) => { e.stopPropagation(); router.push({ pathname: '/booking/[providerId]', params: { providerId: item.id, slug: item.slug } } as any); }}
                    >
                      <Text style={styles.reserverButtonText}>Réserver</Text>
                    </Pressable>
                  </View>
                </PressableScale>
              </FadeInStagger>
            )}
          />
        )}
      </View>

      <SearchFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        initialFilters={{
          minRating: filterMinRating,
          maxPrice: filterMaxPrice,
          maxDistance: filterMaxDistance,
          sortBy,
          isMobile: filterIsMobile,
        }}
        onApply={(filters) => {
          setFilterMinRating(filters.minRating);
          setFilterMaxPrice(filters.maxPrice);
          setFilterMaxDistance(filters.maxDistance);
          setSortBy(filters.sortBy);
          setFilterIsMobile(filters.isMobile);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  webWrapper: {
    flex: 1, width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
  },

  // Header
  header: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Favorites / recently viewed horizontal avatars
  favoriteAvatarCard: {
    alignItems: 'center',
    width: 64,
  } as ViewStyle,
  favoriteAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(91,33,182,0.2)',
  } as ViewStyle,
  favoriteAvatarText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: fonts.displayBold,
    fontWeight: '700' as const,
  },
  favoriteAvatarName: {
    fontSize: 11,
    color: colors.text,
    fontFamily: 'Poppins_500Medium',
    marginTop: 6,
    textAlign: 'center' as const,
  },

  // Hero Banner
  heroBanner: {
    marginHorizontal: screenPadding.horizontal,
    marginBottom: spacing.md,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  heroImage: {
    width: '100%' as any,
    height: 180,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(45,27,105,0.55)',
    ...(Platform.OS === 'web'
      ? { background: 'linear-gradient(to top, rgba(45,27,105,0.75) 0%, rgba(45,27,105,0.35) 50%, transparent 100%)' } as any
      : {}),
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
    fontWeight: '600',
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: colors.white,
    letterSpacing: -0.5,
    fontWeight: '700',
    lineHeight: 30,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },

  // Search
  searchContainer: {
    paddingHorizontal: screenPadding.horizontal,
    marginTop: 8,
    zIndex: 10,
  },
  suggestions: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
    paddingVertical: 8,
    ...({ boxShadow: '0 4px 16px rgba(167,115,102,0.12)' } as any),
  },
  suggestionsTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 14,
    paddingVertical: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  suggestionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  suggestionHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },

  // Quick filter bar
  filterBar: {
    marginTop: spacing.sm,
    maxWidth: '100%',
    overflow: 'hidden' as any,
  },
  filterBarContent: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 8,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 0 3px rgba(139,105,82,0.25)' } as any : {}),
  },
  filterChipOutline: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139,105,82,0.06)',
  },
  filterChipQuartier: {
    borderColor: 'rgba(91,33,182,0.2)',
    backgroundColor: 'rgba(91,33,182,0.06)',
  },
  filterChipText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
  },

  // Categories — 3x2 grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: screenPadding.horizontal,
    marginBottom: spacing.xs,
  },
  categoryCell: {
    width: '33.33%',
    paddingVertical: spacing.xs,
    marginBottom: 8,
  },

  // Subcategory pills
  subcategoryRow: {
    marginTop: 4,
    marginBottom: spacing.sm,
    maxWidth: '100%',
    overflow: 'hidden' as any,
  },
  subcategoryContent: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 8,
    flexWrap: 'nowrap' as any,
  },
  subcategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subcategoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subcategoryText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
  },
  subcategoryTextActive: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
  },

  // Request banner
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: screenPadding.horizontal,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: 20,
    backgroundColor: colors.accent,
    borderRadius: 28,
  } as ViewStyle,
  requestTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  requestSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
    opacity: 0.8,
  },
  requestArrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },

  // Occasion banner
  occasionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: screenPadding.horizontal,
    marginTop: 10,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(91,33,182,0.15)',
  } as ViewStyle,
  occasionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(91,33,182,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  occasionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  occasionSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  occasionArrow: {
    fontSize: 22,
    color: colors.textMuted,
  },

  // List
  list: { paddingHorizontal: screenPadding.horizontal, paddingTop: 0, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 20px rgba(90,56,60,0.08), 0 1px 4px rgba(90,56,60,0.04)' } as any
      : { shadowColor: '#5F383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 }),
  } as ViewStyle,
  cardGallery: { height: 180, position: 'relative' as const },
  galleryImage: {
    width: '100%' as any,
    height: 180,
  },

  topProBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topProText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  heartOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  heartCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardContent: { padding: spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    fontWeight: '600',
    color: colors.accent,
    flex: 1,
    marginRight: spacing.xs,
    letterSpacing: -0.3,
  },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.terracotta,
  },
  reviewCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  cardLocation: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  servicesPreview: { marginTop: spacing.sm },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceName: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  servicePrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.terracotta,
  },
  moreServices: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },

  tags: { flexDirection: 'row', marginTop: spacing.sm, gap: 10 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryGhost,
  },
  tagText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
  tagPrice: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(167,115,102,0.08)',
  },
  tagPriceText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '500',
    color: colors.terracotta,
  },

  // Réserver CTA button on provider card
  reserverButton: {
    marginTop: spacing.sm,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  reserverButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.2,
  },

  // View toggle — accent violet
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Map
  mapContainer: { flex: 1, paddingHorizontal: screenPadding.horizontal, paddingBottom: screenPadding.horizontal },
  mapCount: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Hero carousel dots
  heroDots: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    gap: 5,
  },
  heroDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  heroDotActive: {
    width: 16,
    backgroundColor: colors.white,
  },

  // Card gallery dots
  galleryDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    pointerEvents: 'none' as any,
  },
  galleryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  galleryDotActive: {
    width: 14,
    backgroundColor: colors.white,
  },

  // Inspiration banner — real thumbnails
  inspirationBanner: {
    flexDirection: 'row',
    marginHorizontal: screenPadding.horizontal,
    marginTop: spacing.sm,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 4px 20px rgba(90,56,60,0.08), 0 1px 4px rgba(90,56,60,0.04)' } as any)
      : { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 }),
  } as ViewStyle,
  inspirationContent: {
    flex: 1,
  },
  inspirationLabel: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: colors.textMuted,
    fontFamily: fonts.body,
    marginBottom: 6,
  },
  inspirationTitle: {
    fontSize: 20,
    fontFamily: fonts.displayBold,
    color: colors.accent,
    lineHeight: 26,
    letterSpacing: -0.5,
    fontWeight: '700',
  },
  inspirationCta: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
    marginTop: 8,
  },
  inspirationImageGrid: {
    width: 80,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignSelf: 'center',
  },
  inspirationThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
});
