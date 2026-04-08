import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Linking, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth-context';
import { showAlert, showConfirm } from '../../../src/lib/alert';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  REQUESTED:    { label: 'En attente',    color: colors.warning, bg: 'rgba(245,158,11,0.1)' },
  CONFIRMED:    { label: 'Confirmée',     color: colors.success, bg: 'rgba(0,135,90,0.1)' },
  DEPOSIT_PAID: { label: 'Acompte payé',  color: colors.primary, bg: colors.primaryGhost },
  IN_PROGRESS:  { label: 'En cours',      color: colors.primaryDark, bg: colors.primaryGhost },
  COMPLETED:    { label: 'Terminée',      color: colors.textMuted, bg: 'rgba(160,164,150,0.1)' },
  CANCELLED:    { label: 'Annulée',       color: colors.error,   bg: 'rgba(222,53,11,0.1)' },
  NO_SHOW:      { label: 'Absent',        color: colors.error,   bg: 'rgba(222,53,11,0.1)' },
  DISPUTED:     { label: 'En litige',     color: colors.error,   bg: 'rgba(222,53,11,0.1)' },
};

function formatPrice(amount: number | null | undefined, currency: string) {
  if (amount == null) return '';
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

interface BookingData {
  id: string;
  ref: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  agreedPrice: number;
  currency: string;
  depositAmount: number | null;
  depositPaid: boolean;
  locationType: string;
  locationAddress: string | null;
  clientNotes: string | null;
  providerNotes: string | null;
  cancelReason: string | null;
  transportRequested: boolean;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  service: {
    name: string;
    durationMin: number;
    category: { name: string };
  };
  provider: {
    id: string;
    displayName: string;
    slug: string;
    city: string;
    commune: string | null;
    isMobile: boolean;
    whatsappNumber: string | null;
    user: { name: string; avatar: string | null; phone: string };
  };
  client: {
    name: string;
    phone: string;
  };
  review: any | null;
}

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      const res: any = await api(`/bookings/${id}`);
      setBooking(res.data);
    } catch (e: any) {
      // console.error('Fetch booking error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  async function handleStatusChange(newStatus: string, confirmMsg: string) {
    showConfirm('Confirmer', confirmMsg, async () => {
      setActionLoading(true);
      try {
        await api(`/bookings/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        });
        fetchBooking();
      } catch (e: any) {
        showAlert('Erreur', e.message);
      }
      setActionLoading(false);
    });
  }

  function openWhatsApp(phone: string) {
    const cleaned = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleaned}`);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
        <Text style={styles.errorText}>Réservation introuvable</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const status = STATUS_CONFIG[booking.status] || { label: booking.status, color: colors.textMuted, bg: 'rgba(0,0,0,0.05)' };
  const isClient = booking.client && user?.phone === booking.client.phone;
  const isProvider = booking.provider?.user && user?.phone === booking.provider.user.phone;
  const isPending = booking.status === 'REQUESTED';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isInProgress = booking.status === 'IN_PROGRESS';
  const canCancel = ['REQUESTED', 'CONFIRMED', 'DEPOSIT_PAID'].includes(booking.status);
  const isFinished = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(booking.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBooking(); }} tintColor={colors.primary} />}
    >
      {/* ── Success banner for new bookings ── */}
      {isPending && isClient && (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Demande envoyée !</Text>
            <Text style={styles.successText}>Le prestataire va confirmer votre réservation.</Text>
          </View>
        </View>
      )}

      {/* ── Ref + Status ── */}
      <View style={styles.headerCard}>
        <Text style={styles.ref}>{booking.ref}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* ── Provider info ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PRESTATAIRE</Text>
        <Pressable style={styles.providerRow} onPress={() => router.push(`/provider/${booking.provider.slug}`)}>
          <View style={styles.providerAvatar}>
            <Text style={styles.providerAvatarText}>
              {booking.provider.displayName[0]?.toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.providerName}>{booking.provider.displayName}</Text>
            <Text style={styles.providerLocation}>
              {booking.provider.commune ? `${booking.provider.commune}, ` : ''}{booking.provider.city}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      {/* ── Service ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SERVICE</Text>
        <Text style={styles.value}>{booking.service.name}</Text>
        <Text style={styles.subvalue}>{booking.service.category?.name} · {booking.service.durationMin} min</Text>
      </View>

      {/* ── Date & Heure ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DATE & HEURE</Text>
        <Text style={styles.value}>📅 {formatDate(booking.date)}</Text>
        <Text style={styles.subvalue}>🕐 {booking.startTime} — {booking.endTime}</Text>
      </View>

      {/* ── Lieu ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LIEU</Text>
        <Text style={styles.value}>
          {booking.locationType === 'CLIENT' ? '🏠 À domicile' : '📍 Chez le prestataire'}
        </Text>
        {booking.locationAddress && (
          <Text style={styles.subvalue}>{booking.locationAddress}</Text>
        )}
      </View>

      {/* ── Prix ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PRIX</Text>
        <Text style={styles.priceValue}>{formatPrice(booking.agreedPrice, booking.currency)}</Text>
        {booking.depositAmount && (
          <Text style={styles.subvalue}>
            Acompte : {formatPrice(booking.depositAmount, booking.currency)} (30%)
            {booking.depositPaid ? ' ✅ Payé' : ' ⏳ En attente'}
          </Text>
        )}
      </View>

      {/* ── Notes ── */}
      {booking.clientNotes && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTES</Text>
          <Text style={styles.subvalue}>{booking.clientNotes}</Text>
        </View>
      )}

      {booking.providerNotes && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTES DU PRESTATAIRE</Text>
          <Text style={styles.subvalue}>{booking.providerNotes}</Text>
        </View>
      )}

      {/* ── Cancel reason ── */}
      {booking.cancelReason && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RAISON D'ANNULATION</Text>
          <Text style={[styles.subvalue, { color: colors.error }]}>{booking.cancelReason}</Text>
        </View>
      )}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        {/* WhatsApp contact */}
        {booking.provider.whatsappNumber && !isFinished && (
          <Pressable
            style={styles.whatsappButton}
            onPress={() => openWhatsApp(booking.provider.whatsappNumber!)}
          >
            <Text style={styles.whatsappText}>💬 Contacter sur WhatsApp</Text>
          </Pressable>
        )}

        {/* Provider actions */}
        {isProvider && isPending && (
          <Pressable
            style={styles.confirmButton}
            disabled={actionLoading}
            onPress={() => handleStatusChange('CONFIRMED', 'Confirmer cette réservation ?')}
          >
            <Text style={styles.confirmButtonText}>
              {actionLoading ? 'Chargement...' : '✅ Confirmer la réservation'}
            </Text>
          </Pressable>
        )}

        {isProvider && (isConfirmed || booking.status === 'DEPOSIT_PAID') && (
          <Pressable
            style={styles.confirmButton}
            disabled={actionLoading}
            onPress={() => handleStatusChange('IN_PROGRESS', 'Démarrer le service ?')}
          >
            <Text style={styles.confirmButtonText}>
              {actionLoading ? 'Chargement...' : '▶️ Démarrer le service'}
            </Text>
          </Pressable>
        )}

        {isProvider && isInProgress && (
          <Pressable
            style={styles.confirmButton}
            disabled={actionLoading}
            onPress={() => handleStatusChange('COMPLETED', 'Marquer le service comme terminé ?')}
          >
            <Text style={styles.confirmButtonText}>
              {actionLoading ? 'Chargement...' : '✅ Service terminé'}
            </Text>
          </Pressable>
        )}

        {/* Cancel (both client and provider) */}
        {canCancel && (
          <Pressable
            style={styles.cancelButton}
            disabled={actionLoading}
            onPress={() => handleStatusChange('CANCELLED', 'Êtes-vous sûr de vouloir annuler ?')}
          >
            <Text style={styles.cancelText}>Annuler la réservation</Text>
          </Pressable>
        )}

        {/* Existing review */}
        {booking.review && (
          <View style={styles.existingReview}>
            <Text style={styles.sectionLabel}>VOTRE AVIS</Text>
            <Text style={styles.existingReviewStars}>
              {'★'.repeat(booking.review.rating)}{'☆'.repeat(5 - booking.review.rating)}
            </Text>
            {booking.review.comment && (
              <Text style={styles.subvalue}>{booking.review.comment}</Text>
            )}
          </View>
        )}

        {/* Leave review */}
        {isClient && booking.status === 'COMPLETED' && !booking.review && (
          <View style={styles.reviewPrompt}>
            <Text style={styles.reviewPromptTitle}>Comment s'est passé votre service ?</Text>
            <Text style={styles.reviewPromptSubtitle}>
              Votre avis aide les autres clientes à trouver les meilleures prestataires
            </Text>
            <Pressable
              style={styles.reviewButton}
              onPress={() => router.push(`/booking/review/${booking.id}?providerName=${encodeURIComponent(booking.provider.displayName)}`)}
            >
              <Text style={styles.reviewButtonText}>Laisser un avis</Text>
            </Pressable>
          </View>
        )}

        {/* Rebook */}
        {isFinished && isClient && (
          <Pressable
            style={styles.rebookButton}
            onPress={() => router.push(`/booking/${booking.provider.id}?slug=${booking.provider.slug}`)}
          >
            <Text style={styles.rebookButtonText}>🔄 Réserver à nouveau</Text>
          </Pressable>
        )}
      </View>

      {/* ── Timeline ── */}
      <View style={styles.timeline}>
        <Text style={styles.sectionLabel}>HISTORIQUE</Text>
        <TimelineItem label="Demande créée" date={booking.createdAt} />
        {booking.confirmedAt && <TimelineItem label="Confirmée" date={booking.confirmedAt} />}
        {booking.completedAt && <TimelineItem label="Terminée" date={booking.completedAt} />}
        {booking.cancelledAt && <TimelineItem label="Annulée" date={booking.cancelledAt} />}
      </View>
    </ScrollView>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  const d = new Date(date);
  const timeStr = `${d.getDate()}/${d.getMonth() + 1} à ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot} />
      <Text style={styles.timelineLabel}>{label}</Text>
      <Text style={styles.timelineDate}>{timeStr}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  errorText: { fontSize: 16, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  backButton: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  backButtonText: { color: colors.white, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' },

  // Success banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,135,90,0.1)',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
  },
  successIcon: { fontSize: 24, marginRight: 12 },
  successTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700', color: colors.success },
  successText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },

  // Header
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ref: { fontSize: 15, fontFamily: 'Poppins_700Bold', fontWeight: '700', color: colors.accent },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  statusText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' },

  // Provider row
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  providerAvatarText: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', color: colors.primary },
  providerName: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '600', color: colors.accent },
  providerLocation: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.textMuted },

  // Sections
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  value: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', fontWeight: '600', color: colors.text },
  subvalue: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 4 },
  priceValue: { fontSize: 28, fontFamily: 'Poppins_700Bold', fontWeight: '800', color: colors.terracotta },

  // Actions
  actions: { marginTop: 8, gap: 12 },
  whatsappButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  whatsappText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  confirmButtonText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', fontWeight: '600', color: colors.error },
  reviewPrompt: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
  },
  reviewPromptTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 6,
  },
  reviewPromptSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  reviewButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewButtonText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' },
  rebookButton: {
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rebookButtonText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', fontWeight: '600', color: colors.accent },

  // Existing review
  existingReview: { marginBottom: 20 },
  existingReviewStars: { fontSize: 20, color: colors.star, marginBottom: 4 },

  // Timeline
  timeline: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  timelineLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium', fontWeight: '500', color: colors.text, flex: 1 },
  timelineDate: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
});
