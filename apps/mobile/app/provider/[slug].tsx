import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
  RefreshControl,
  Image,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import IconRosetteDiscountCheck from '@tabler/icons-react-native/dist/esm/icons/IconRosetteDiscountCheck.mjs';
import IconShare from '@tabler/icons-react-native/dist/esm/icons/IconShare.mjs';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import IconHome from '@tabler/icons-react-native/dist/esm/icons/IconHome.mjs';
import IconBrandWhatsapp from '@tabler/icons-react-native/dist/esm/icons/IconBrandWhatsapp.mjs';
import IconBrandInstagram from '@tabler/icons-react-native/dist/esm/icons/IconBrandInstagram.mjs';
import IconMoodSad from '@tabler/icons-react-native/dist/esm/icons/IconMoodSad.mjs';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';
import IconClock from '@tabler/icons-react-native/dist/esm/icons/IconClock.mjs';
import IconMapPin from '@tabler/icons-react-native/dist/esm/icons/IconMapPin.mjs';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { addRecentlyViewed } from '../../src/lib/recently-viewed';
import { showAlert } from '../../src/lib/alert';
import Skeleton from '../../src/components/Skeleton';
import BeforeAfter from '../../src/components/BeforeAfter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceCategory {
  name: string;
  icon: string;
}

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceMin: number;
  priceMax: number | null;
  category: ServiceCategory;
}

interface Availability {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Provider {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  status: string;
  city: string;
  commune: string | null;
  lat: number | null;
  lng: number | null;
  isMobile: boolean;
  mobileRadius: number | null;
  whatsappNumber: string | null;
  instagramHandle: string | null;
  currency: string;
  idVerified: boolean;
  avgRating: number;
  totalReviews: number;
  totalBookings: number;
  responseRate: number;
  services: Service[];
  availability: Availability[];
  portfolio: any[];
  user: { name: string; avatar: string | null };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number, currency: string): string {
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getMainCategory(services: Service[]): string | null {
  if (services.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const s of services) {
    const cat = s.category?.name ?? 'Autre';
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

const DAY_LABELS: Record<string, string> = {
  MON: 'Lun',
  TUE: 'Mar',
  WED: 'Mer',
  THU: 'Jeu',
  FRI: 'Ven',
  SAT: 'Sam',
  SUN: 'Dim',
};

const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MOCK_TRANSFORMATIONS = [
  { id: '1', service: 'Box Braids Jumbo', before: null, after: null },
  { id: '2', service: 'Twist Out Naturel', before: null, after: null },
  { id: '3', service: 'Soin Kératine', before: null, after: null },
];

// ---------------------------------------------------------------------------
// Star row helper
// ---------------------------------------------------------------------------

function StarRow({ rating, size = 13, color = colors.star }: { rating: number; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar
          key={i}
          size={size}
          color={color}
          fill={i <= Math.round(rating) ? color : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  tags: string[];
  createdAt: string;
  client: { name: string; avatar: string | null };
}

export default function ProviderProfile() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'avis' | 'about'>('services');

  const fetchProvider = useCallback(async () => {
    try {
      setError(null);
      const res: any = await api(`/search/providers/${slug}`);
      if (res.success && res.data) {
        setProvider(res.data);
        addRecentlyViewed({
          id: res.data.id,
          slug: res.data.slug,
          displayName: res.data.displayName,
          city: res.data.city,
          avgRating: res.data.avgRating,
        });
        try {
          const reviewsRes: any = await api(`/reviews/provider/${res.data.id}`);
          setReviews(reviewsRes.data || []);
        } catch {}
      } else {
        setError('Prestataire introuvable');
      }
    } catch (err: any) {
      setError(err.message || 'Impossible de charger le profil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProvider();
  }, [fetchProvider]);

  // --- Loading state ---
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={{ width: '100%', paddingHorizontal: 20, alignItems: 'center' }}>
          <Skeleton width="100%" height={200} borderRadius={0} />
          <View style={{ height: 16 }} />
          <Skeleton width={88} height={88} borderRadius={44} />
          <View style={{ height: 12 }} />
          <Skeleton width="50%" height={22} borderRadius={8} />
          <View style={{ height: 8 }} />
          <Skeleton width="35%" height={14} borderRadius={8} />
        </View>
      </SafeAreaView>
    );
  }

  // --- Error state ---
  if (error || !provider) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.errorIconWrap}>
          <IconMoodSad size={40} color={colors.textMuted} strokeWidth={1.5} />
        </View>
        <Text style={styles.errorTitle}>Prestataire introuvable</Text>
        <Text style={styles.errorSubtitle}>{error || "Ce profil n'existe pas ou a été supprimé."}</Text>
        <Pressable style={styles.retryButton} onPress={fetchProvider}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const specialty = getMainCategory(provider.services);
  const activeDays = new Set(
    provider.availability.filter((a) => a.isActive).map((a) => a.dayOfWeek),
  );
  const isTopPro = provider.avgRating >= 4.5 && provider.totalReviews >= 5;
  const locationLabel = provider.commune
    ? `${provider.commune}, ${provider.city}`
    : provider.city;

  const openWhatsApp = () => {
    if (provider.whatsappNumber) {
      const cleaned = provider.whatsappNumber.replace(/[^0-9+]/g, '');
      Linking.openURL(`https://wa.me/${cleaned.replace('+', '')}`);
    }
  };

  const openInstagram = () => {
    if (provider.instagramHandle) {
      const handle = provider.instagramHandle.replace('@', '');
      Linking.openURL(`https://instagram.com/${handle}`);
    }
  };

  const shareProfile = async () => {
    const url = `https://app.karysm.com/provider/${provider.slug}`;
    const rating = provider.avgRating != null ? `${Number(provider.avgRating).toFixed(1)}/5 · ` : '';
    const text = `${provider.displayName} sur Karysm — ${rating}${provider.city}\n\nRéserve ici : ${url}`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      if (navigator.share) {
        try {
          await navigator.share({ title: provider.displayName, text, url });
          return;
        } catch {}
      }
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        showAlert('Lien copié !', 'Le profil a été copié dans le presse-papiers.');
      } catch {
        showAlert('Partager', text);
      }
      return;
    }

    try {
      await Share.share({ message: text, title: `${provider.displayName} sur Karysm` });
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ── Hero band ── */}
        <View style={styles.hero}>
          {/* Header controls overlay */}
          <SafeAreaView edges={['top']} style={styles.heroControls}>
            <Pressable style={styles.heroBtn} onPress={() => router.back()} hitSlop={8}>
              <IconArrowLeft size={20} color={colors.white} strokeWidth={2} />
            </Pressable>
            <Pressable style={styles.heroBtn} onPress={shareProfile} hitSlop={8}>
              <IconShare size={18} color={colors.white} strokeWidth={2} />
            </Pressable>
          </SafeAreaView>

          {/* Avatar — centered, overlaps hero bottom */}
          <View style={styles.avatarWrap}>
            {provider.user.avatar ? (
              <Image source={{ uri: provider.user.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{getInitials(provider.displayName)}</Text>
              </View>
            )}
            {provider.idVerified && (
              <View style={styles.verifiedDot}>
                <IconRosetteDiscountCheck size={18} color={colors.success} fill={colors.success} strokeWidth={1.5} />
              </View>
            )}
          </View>
        </View>

        {/* ── Identity ── */}
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{provider.displayName}</Text>
            {isTopPro && (
              <View style={styles.topProBadge}>
                <Text style={styles.topProText}>TOP PRO</Text>
              </View>
            )}
          </View>

          {specialty && (
            <Text style={styles.specialty}>{specialty}</Text>
          )}

          <View style={styles.metaRow}>
            <StarRow rating={provider.avgRating} size={13} />
            <Text style={styles.metaText}>
              {provider.avgRating.toFixed(1)} ({provider.totalReviews})
            </Text>
            {locationLabel ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <IconMapPin size={13} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={styles.metaText}>{locationLabel}</Text>
              </>
            ) : null}
          </View>

          {provider.isMobile && (
            <View style={styles.mobileBadge}>
              <IconHome size={13} color={colors.primary} strokeWidth={1.8} />
              <Text style={styles.mobileBadgeText}>
                Se déplace{provider.mobileRadius ? ` · ${provider.mobileRadius} km` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.totalReviews}</Text>
            <Text style={styles.statLabel}>Avis</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.totalBookings}</Text>
            <Text style={styles.statLabel}>Réservations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(provider.responseRate * 100)}%</Text>
            <Text style={styles.statLabel}>Réponse</Text>
          </View>
        </View>

        {/* ── CTA Button ── */}
        <View style={styles.ctaWrap}>
          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
            onPress={() => router.push(`/booking/${provider.id}?slug=${provider.slug}`)}
          >
            <Text style={styles.ctaButtonText}>Réserver un rendez-vous</Text>
          </Pressable>
        </View>

        {/* ── Tab Bar ── */}
        <View style={styles.tabBar}>
          {([
            { key: 'services' as const, label: 'Services' },
            { key: 'portfolio' as const, label: 'Portfolio' },
            { key: 'avis' as const, label: 'Avis' },
            { key: 'about' as const, label: 'À propos' },
          ]).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.tabIndicator} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.body}>

          {/* ── Tab Content: Services ── */}
          {activeTab === 'services' && (
            <View>
              {provider.services.length === 0 ? (
                <Text style={styles.emptyTabText}>Aucun service renseigné</Text>
              ) : (
                <View style={styles.servicesList}>
                  {provider.services.map((service) => (
                    <View key={service.id} style={styles.serviceCard}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <View style={styles.serviceMeta}>
                          <IconClock size={12} color={colors.textMuted} strokeWidth={1.8} />
                          <Text style={styles.serviceDuration}>{service.durationMin} min</Text>
                        </View>
                      </View>
                      <View style={styles.serviceRight}>
                        <Text style={styles.servicePrice}>
                          {service.priceMax
                            ? `${formatPrice(service.priceMin, provider.currency)} — ${formatPrice(service.priceMax, provider.currency)}`
                            : formatPrice(service.priceMin, provider.currency)}
                        </Text>
                        <Pressable
                          style={({ pressed }) => [styles.serviceBookBtn, pressed && { opacity: 0.75 }]}
                          onPress={() => router.push(`/booking/${provider.id}?slug=${provider.slug}&serviceId=${service.id}`)}
                        >
                          <Text style={styles.serviceBookBtnText}>Réserver</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Tab Content: Portfolio ── */}
          {activeTab === 'portfolio' && (
            <View>
              <Text style={styles.sectionTitle}>Transformations</Text>
              <Text style={styles.sectionSubtitle}>Résultats sur de vraies clientes</Text>
              {MOCK_TRANSFORMATIONS.map((t) => (
                <BeforeAfter
                  key={t.id}
                  beforeImage={t.before}
                  afterImage={t.after}
                  serviceName={t.service}
                />
              ))}
            </View>
          )}

          {/* ── Tab Content: Avis ── */}
          {activeTab === 'avis' && (
            <View>
              {reviews.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Avis ({provider.totalReviews})</Text>

                  <View style={styles.ratingDistribution}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => r.rating === star).length;
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <View key={star} style={styles.ratingRow}>
                          <Text style={styles.ratingRowStar}>{star}</Text>
                          <IconStar size={11} color={colors.star} fill={colors.star} strokeWidth={1} />
                          <View style={styles.ratingBar}>
                            <View style={[styles.ratingBarFill, { width: `${pct}%` }]} />
                          </View>
                          <Text style={styles.ratingRowCount}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => {
                    const hasPhoto = review.photos.length > 0;
                    return (
                      <View key={review.id} style={[styles.reviewCard, hasPhoto && styles.reviewCardDark]}>
                        {hasPhoto && (
                          <>
                            <Image source={{ uri: review.photos[0] }} style={styles.reviewBgImage} resizeMode="cover" />
                            <View style={styles.reviewGradient} />
                          </>
                        )}
                        <View style={styles.reviewHeader}>
                          <View style={[styles.reviewAvatar, hasPhoto && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                            <Text style={[styles.reviewAvatarText, hasPhoto && { color: colors.white }]}>
                              {review.client.name[0]?.toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.reviewName, hasPhoto && { color: colors.white }]}>{review.client.name}</Text>
                            <Text style={[styles.reviewDate, hasPhoto && { color: 'rgba(255,255,255,0.6)' }]}>
                              {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </Text>
                          </View>
                          <StarRow rating={review.rating} size={12} color={hasPhoto ? '#FFD166' : colors.star} />
                        </View>
                        {review.comment && (
                          <Text style={[styles.reviewComment, hasPhoto && styles.reviewCommentDark]}>
                            {hasPhoto ? `"${review.comment}"` : review.comment}
                          </Text>
                        )}
                        {review.tags.length > 0 && (
                          <View style={styles.reviewTags}>
                            {review.tags.map((tag) => (
                              <View key={tag} style={[styles.reviewTag, hasPhoto && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                                <Text style={[styles.reviewTagText, hasPhoto && { color: 'rgba(255,255,255,0.85)' }]}>{tag.replace('_', ' ')}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {review.photos.length > 1 && (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotos}>
                            {review.photos.slice(1).map((url, i) => (
                              <Image key={i} source={{ uri: url }} style={styles.reviewPhoto} />
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    );
                  })}

                  {reviews.length > 3 && !showAllReviews && (
                    <Pressable style={styles.showAllButton} onPress={() => setShowAllReviews(true)}>
                      <Text style={styles.showAllText}>Voir tous les avis ({reviews.length})</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <Text style={styles.emptyTabText}>Aucun avis pour le moment</Text>
              )}
            </View>
          )}

          {/* ── Tab Content: À propos ── */}
          {activeTab === 'about' && (
            <View>
              {provider.bio ? (
                <View style={styles.aboutSection}>
                  <Text style={styles.sectionTitle}>{'À'} propos</Text>
                  <Text style={styles.bioText}>{provider.bio}</Text>
                </View>
              ) : null}

              {provider.availability.length > 0 && (
                <View style={styles.aboutSection}>
                  <Text style={styles.sectionTitle}>Disponibilités</Text>
                  <View style={styles.daysRow}>
                    {ALL_DAYS.map((day) => {
                      const isActive = activeDays.has(day);
                      return (
                        <View
                          key={day}
                          style={[styles.dayChip, isActive ? styles.dayChipActive : styles.dayChipInactive]}
                        >
                          <Text style={[styles.dayChipText, isActive ? styles.dayChipTextActive : styles.dayChipTextInactive]}>
                            {DAY_LABELS[day] || day}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  {provider.availability
                    .filter((a) => a.isActive)
                    .slice(0, 1)
                    .map((a) => (
                      <Text key={a.dayOfWeek} style={styles.availabilityTime}>
                        {a.startTime} — {a.endTime}
                      </Text>
                    ))}
                </View>
              )}

              {(provider.whatsappNumber || provider.instagramHandle) && (
                <View style={styles.aboutSection}>
                  <Text style={styles.sectionTitle}>Contact</Text>
                  <View style={styles.contactRow}>
                    {provider.whatsappNumber && (
                      <Pressable
                        style={({ pressed }) => [styles.whatsappButton, pressed && { opacity: 0.8 }]}
                        onPress={openWhatsApp}
                      >
                        <IconBrandWhatsapp size={18} color={colors.white} strokeWidth={1.8} />
                        <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                      </Pressable>
                    )}
                    {provider.instagramHandle && (
                      <Pressable
                        style={({ pressed }) => [styles.instagramButton, pressed && { opacity: 0.8 }]}
                        onPress={openInstagram}
                      >
                        <IconBrandInstagram size={18} color={colors.text} strokeWidth={1.8} />
                        <Text style={styles.instagramButtonText}>{provider.instagramHandle}</Text>
                      </Pressable>
                    )}
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.shareButton, pressed && { opacity: 0.8 }]}
                    onPress={shareProfile}
                  >
                    <IconShare size={16} color={colors.primary} strokeWidth={2} />
                    <Text style={styles.shareButtonText}>Partager ce profil</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const HERO_HEIGHT = 200;
const AVATAR_SIZE = 92;

const styles = StyleSheet.create({
  // --- States ---
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
  },

  // --- Hero ---
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: colors.headerDark,
    ...(Platform.OS === 'web'
      ? { background: `linear-gradient(160deg, ${colors.headerDark} 0%, ${colors.headerMedium} 100%)` } as any
      : {}),
  },
  heroControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'absolute',
    bottom: -(AVATAR_SIZE / 2),
    alignSelf: 'center',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.bg,
    overflow: 'visible',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(26,14,46,0.22)' },
      default: {
        shadowColor: '#1A0E2E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 32,
        elevation: 8,
      },
    }) as any,
  },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 30,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Identity ---
  identity: {
    alignItems: 'center',
    paddingTop: AVATAR_SIZE / 2 + 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
  },
  topProBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  topProText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  specialty: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
  metaDot: {
    fontSize: 13,
    color: colors.textMuted,
  },
  mobileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryGhost,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  mobileBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    color: colors.primary,
  },

  // --- Stats ---
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: 20,
    paddingVertical: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 16px rgba(90,56,60,0.08)' },
      default: {
        shadowColor: '#5A383C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
      },
    }) as any,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },

  // --- CTA ---
  ctaWrap: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: 27,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(91,33,182,0.30)' },
      default: {
        shadowColor: '#5B21B6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 20,
        elevation: 6,
      },
    }) as any,
  },
  ctaButtonPressed: {
    backgroundColor: colors.accent,
    opacity: 0.8,
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // --- Tab Bar ---
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabTextActive: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.accent,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '10%',
    right: '10%',
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },

  // --- Body / sections ---
  body: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
    marginTop: -8,
    fontFamily: 'Poppins_400Regular',
  },
  emptyTabText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 32,
  },

  // --- Services ---
  servicesList: {
    gap: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDuration: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },
  serviceRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  servicePrice: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.terracotta,
    textAlign: 'right',
  },
  serviceBookBtn: {
    backgroundColor: colors.primaryGhost,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceBookBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    color: colors.primary,
  },

  // --- About sections ---
  aboutSection: {
    marginBottom: 28,
  },
  bioText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // --- Availability ---
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
  },
  dayChipInactive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
  },
  dayChipTextActive: {
    color: colors.white,
  },
  dayChipTextInactive: {
    color: colors.textMuted,
  },
  availabilityTime: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 4,
  },

  // --- Contact ---
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 16,
  },
  whatsappButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
  },
  instagramButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instagramButtonText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 12,
  },
  shareButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    color: colors.primary,
  },

  // --- Reviews ---
  ratingDistribution: {
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 4,
  },
  ratingRowStar: {
    width: 14,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.star,
    fontWeight: '600',
    textAlign: 'right',
  },
  ratingBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.n300,
    borderRadius: 3,
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: colors.star,
    borderRadius: 3,
  },
  ratingRowCount: {
    width: 20,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewCardDark: {
    backgroundColor: '#1A0E2E',
    minHeight: 160,
    borderWidth: 0,
  },
  reviewBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%' as any,
    height: '100%' as any,
    opacity: 0.45,
  },
  reviewGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26,14,46,0.78)',
    ...(Platform.OS === 'web'
      ? { background: 'linear-gradient(160deg, rgba(26,14,46,0.55) 0%, rgba(26,14,46,0.92) 100%)' } as any
      : {}),
  },
  reviewCommentDark: {
    color: colors.white,
    fontFamily: 'PlayfairDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewAvatarText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  reviewName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    color: colors.text,
  },
  reviewDate: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },
  reviewComment: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reviewTag: {
    backgroundColor: colors.primaryGhost,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  reviewTagText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.primary,
    fontWeight: '500',
  },
  reviewPhotos: {
    marginTop: 4,
  },
  reviewPhoto: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 8,
  },
  showAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  showAllText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    color: colors.primary,
  },
});
