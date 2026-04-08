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
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { addRecentlyViewed } from '../../src/lib/recently-viewed';
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
  // Most common category
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
        // Track recently viewed
        addRecentlyViewed({
          id: res.data.id,
          slug: res.data.slug,
          displayName: res.data.displayName,
          city: res.data.city,
          avgRating: res.data.avgRating,
        });
        // Fetch reviews
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
          <Skeleton width="100%" height={240} borderRadius={24} />
          <View style={{ height: 16 }} />
          <Skeleton width="60%" height={22} borderRadius={8} />
          <View style={{ height: 10 }} />
          <Skeleton width="40%" height={16} borderRadius={8} />
          <View style={{ height: 10 }} />
          <Skeleton width="70%" height={14} borderRadius={8} />
        </View>
      </SafeAreaView>
    );
  }

  // --- Error state ---
  if (error || !provider) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Prestataire introuvable</Text>
        <Text style={styles.errorSubtitle}>{error || 'Ce profil n\'existe pas ou a été supprimé.'}</Text>
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
    try {
      const message = `Je te recommande ${provider.displayName} sur Tokoss ✨\n\n${provider.avgRating.toFixed(1)}⭐ (${provider.totalReviews} avis)\n📍 ${provider.city}\n\nRéserve ici 👉 https://tokoss.app/provider/${provider.slug}`;
      await Share.share({ message, title: `${provider.displayName} sur Tokoss` });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
        <IconArrowLeft size={20} color={colors.text} strokeWidth={2} />
      </Pressable>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
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
        {/* ── Avatar + Name ── */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(provider.displayName)}
              </Text>
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{provider.displayName}</Text>
            {provider.idVerified && (
              <View style={styles.verifiedBadge}>
                <IconRosetteDiscountCheck size={20} color="#00875A" fill="#00875A" strokeWidth={1.5} />
              </View>
            )}
          </View>

          {specialty && (
            <Text style={styles.specialty}>{specialty}</Text>
          )}

          <View style={styles.ratingLine}>
            <Text style={styles.ratingLineStar}>{'\u2605'}</Text>
            <Text style={styles.ratingLineText}>
              {provider.avgRating.toFixed(1)} ({provider.totalReviews})
              {provider.commune ? `  ·  ${provider.commune}, ${provider.city}` : `  ·  ${provider.city}`}
            </Text>
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.totalReviews}</Text>
            <Text style={styles.statLabel}>Avis</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.totalBookings}</Text>
            <Text style={styles.statLabel}>Réservations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(provider.responseRate * 100)}%
            </Text>
            <Text style={styles.statLabel}>Réponse</Text>
          </View>
        </View>

        {/* ── CTA Button ── */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
          onPress={() => router.push(`/booking/${provider.id}?slug=${provider.slug}`)}
        >
          <Text style={styles.ctaButtonText}>Réserver</Text>
        </Pressable>

        {/* ── Badges ── */}
        {provider.isMobile && (
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                🏠 Se déplace{provider.mobileRadius ? ` · ${provider.mobileRadius} km` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* ── Tab Bar ── */}
        <View style={styles.tabBar}>
          {([
            { key: 'services' as const, label: 'Services' },
            { key: 'portfolio' as const, label: 'Portfolio' },
            { key: 'avis' as const, label: 'Avis' },
            { key: 'about' as const, label: '\u00C0 propos' },
          ]).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Tab Content: Services ── */}
        {activeTab === 'services' && provider.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            <View style={styles.servicesList}>
              {provider.services.map((service) => (
                <View key={service.id} style={styles.serviceRow}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDuration}>
                      {service.durationMin} min
                    </Text>
                  </View>
                  <Text style={styles.servicePrice}>
                    {service.priceMax
                      ? `${formatPrice(service.priceMin, provider.currency)} - ${formatPrice(service.priceMax, provider.currency)}`
                      : formatPrice(service.priceMin, provider.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Tab Content: Portfolio ── */}
        {activeTab === 'portfolio' && (
          <View style={styles.section}>
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
          <View style={styles.section}>
            {reviews.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>
                  Avis ({provider.totalReviews})
                </Text>

                {/* Rating distribution */}
                <View style={styles.ratingDistribution}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter((r) => r.rating === star).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <View key={star} style={styles.ratingRow}>
                        <Text style={styles.ratingRowStar}>{star} ★</Text>
                        <View style={styles.ratingBar}>
                          <View style={[styles.ratingBarFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.ratingRowCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Review list */}
                {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                          {review.client.name[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewName}>{review.client.name}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.reviewStars}>
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </Text>
                    </View>
                    {review.comment && (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    )}
                    {review.tags.length > 0 && (
                      <View style={styles.reviewTags}>
                        {review.tags.map((tag) => (
                          <View key={tag} style={styles.reviewTag}>
                            <Text style={styles.reviewTagText}>{tag.replace('_', ' ')}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {review.photos.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotos}>
                        {review.photos.map((url, i) => (
                          <Image key={i} source={{ uri: url }} style={styles.reviewPhoto} />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ))}

                {reviews.length > 3 && !showAllReviews && (
                  <Pressable style={styles.showAllButton} onPress={() => setShowAllReviews(true)}>
                    <Text style={styles.showAllText}>
                      Voir tous les avis ({reviews.length})
                    </Text>
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
          <>
            {/* Bio */}
            {provider.bio ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{'\u00C0'} propos</Text>
                <Text style={styles.bioText}>{provider.bio}</Text>
              </View>
            ) : null}

            {/* Disponibilités */}
            {provider.availability.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Disponibilités</Text>
                <View style={styles.daysRow}>
                  {ALL_DAYS.map((day) => {
                    const isActive = activeDays.has(day);
                    return (
                      <View
                        key={day}
                        style={[
                          styles.dayChip,
                          isActive ? styles.dayChipActive : styles.dayChipInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            isActive
                              ? styles.dayChipTextActive
                              : styles.dayChipTextInactive,
                          ]}
                        >
                          {DAY_LABELS[day] || day}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                {/* Show time range for active days */}
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

            {/* Contact */}
            {(provider.whatsappNumber || provider.instagramHandle) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <View style={styles.contactRow}>
                  {provider.whatsappNumber && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.whatsappButton,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={openWhatsApp}
                    >
                      <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
                    </Pressable>
                  )}
                  {provider.instagramHandle && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.instagramButton,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={openInstagram}
                    >
                      <Text style={styles.instagramButtonText}>
                        📷 {provider.instagramHandle}
                      </Text>
                    </Pressable>
                  )}
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.shareButton,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={shareProfile}
                >
                  <IconShare size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.shareButtonText}>Partager ce profil</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // --- Centered states (loading / error) ---
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
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

  // --- Header ---
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 24px rgba(90,56,60,0.12)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 4 },
    }) as any,
  },
  avatarText: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    color: colors.accent,
  },
  verifiedBadge: {
    marginLeft: 6,
  },
  specialty: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  ratingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingLineStar: {
    fontSize: 14,
    color: '#A77366',
  },
  ratingLineText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },

  // --- Stats ---
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.08)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
    }) as any,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },

  // --- CTA ---
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 27,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ctaButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
  },

  // --- Badges ---
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: colors.primaryGhost,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.primary,
    fontWeight: '500',
  },

  // --- Tab Bar ---
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 24,
    paddingVertical: 4,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(90,56,60,0.06)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
    }) as any,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabTextActive: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  emptyTabText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 32,
  },

  // --- Sections ---
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 14,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  bioText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // --- Services ---
  servicesList: {
    gap: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.08)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
    }) as any,
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
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },
  servicePrice: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.terracotta,
  },

  // --- Availability ---
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
  },
  dayChipInactive: {
    backgroundColor: colors.card,
  },
  dayChipText: {
    fontSize: 13,
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
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  whatsappButtonText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
  },
  instagramButton: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(90,56,60,0.06)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
    }) as any,
  },
  instagramButtonText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 12,
    marginTop: 10,
  },
  shareButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
  },

  // --- Reviews ---
  ratingDistribution: {
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.08)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
    }) as any,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingRowStar: {
    width: 32,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.star,
    fontWeight: '600',
  },
  ratingBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.n300,
    borderRadius: 3,
    marginHorizontal: 8,
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
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.08)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
    }) as any,
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
  reviewStars: {
    fontSize: 14,
    color: colors.star,
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
