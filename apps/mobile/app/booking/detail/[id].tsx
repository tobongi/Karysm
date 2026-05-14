import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Platform, Linking, RefreshControl, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import IconClock from '@tabler/icons-react-native/dist/esm/icons/IconClock.mjs';
import IconMapPin from '@tabler/icons-react-native/dist/esm/icons/IconMapPin.mjs';
import IconHome from '@tabler/icons-react-native/dist/esm/icons/IconHome.mjs';
import IconCoin from '@tabler/icons-react-native/dist/esm/icons/IconCoin.mjs';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck.mjs';
import IconPlayerPlay from '@tabler/icons-react-native/dist/esm/icons/IconPlayerPlay.mjs';
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
import IconBrandWhatsapp from '@tabler/icons-react-native/dist/esm/icons/IconBrandWhatsapp.mjs';
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX.mjs';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';
import IconRefresh from '@tabler/icons-react-native/dist/esm/icons/IconRefresh.mjs';
import IconScissors from '@tabler/icons-react-native/dist/esm/icons/IconScissors.mjs';
import IconAlertCircle from '@tabler/icons-react-native/dist/esm/icons/IconAlertCircle.mjs';
import IconNote from '@tabler/icons-react-native/dist/esm/icons/IconNote.mjs';
import { colors } from '../../../src/theme/colors';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth-context';
import { showAlert, showConfirm } from '../../../src/lib/alert';
import Skeleton from '../../../src/components/Skeleton';
import { FadeInStagger, PressableScale } from '../../../src/components/animations';

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  REQUESTED:    { label: 'En attente',    color: colors.warning,     bg: 'rgba(245,158,11,0.12)' },
  CONFIRMED:    { label: 'Confirmée',     color: colors.success,     bg: 'rgba(0,135,90,0.12)' },
  DEPOSIT_PAID: { label: 'Acompte payé', color: colors.primary,     bg: colors.primaryGhost },
  IN_PROGRESS:  { label: 'En cours',     color: colors.primaryDark, bg: colors.primaryGhost },
  COMPLETED:    { label: 'Terminée',     color: colors.textMuted,   bg: 'rgba(107,107,107,0.10)' },
  CANCELLED:    { label: 'Annulée',      color: colors.error,       bg: 'rgba(222,53,11,0.10)' },
  NO_SHOW:      { label: 'Absent',       color: colors.error,       bg: 'rgba(222,53,11,0.10)' },
  DISPUTED:     { label: 'En litige',    color: colors.error,       bg: 'rgba(222,53,11,0.10)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number | null | undefined, currency: string) {
  if (amount == null) return '';
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  const months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  return `${d.getDate()} ${months[d.getMonth()]} · ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Types ────────────────────────────────────────────────────────────────────

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
  service: { name: string; durationMin: number; category: { name: string } };
  provider: {
    id: string; displayName: string; slug: string; city: string;
    commune: string | null; isMobile: boolean; whatsappNumber: string | null;
    user: { name: string; avatar: string | null; phone: string };
  };
  client: { name: string; phone: string };
  review: any | null;
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <View style={ir.row}>
      <View style={ir.iconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{value}</Text>
        {sub ? <Text style={ir.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const ir = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  label: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.textMuted, letterSpacing: 0.4, marginBottom: 2 },
  value: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  sub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },
});

// ─── Timeline item ─────────────────────────────────────────────────────────────

function TimelineItem({ label, date, isLast }: { label: string; date: string; isLast: boolean }) {
  return (
    <View style={tl.row}>
      <View style={tl.track}>
        <View style={tl.dot} />
        {!isLast && <View style={tl.line} />}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 18 }}>
        <Text style={tl.label}>{label}</Text>
        <Text style={tl.date}>{formatTimestamp(date)}</Text>
      </View>
    </View>
  );
}

const tl = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
  track: { alignItems: 'center', width: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 4 },
  line: { width: 1.5, flex: 1, backgroundColor: colors.border, marginTop: 4 },
  label: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  date: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 1 },
});

// ─── Stars ────────────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3, marginVertical: 6 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <IconStar
          key={i}
          size={18}
          color={colors.terracotta}
          fill={i <= rating ? colors.terracotta : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchBooking = useCallback(async () => {
    try {
      const res: any = await api(`/bookings/${id}`);
      setBooking(res.data);
    } catch (e: any) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

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

  async function handleCancel(reason: string) {
    setActionLoading(true);
    try {
      await api(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED', reason: reason || undefined }),
      });
      fetchBooking();
    } catch (e: any) {
      showAlert('Erreur', e.message);
    }
    setActionLoading(false);
  }

  function openWhatsApp(phone: string) {
    Linking.openURL(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`);
  }

  // ── Loading ──
  if (loading) {
    return (
      <View style={s.root}>
        <View style={s.hero}>
          <SafeAreaView edges={['top']}>
            <View style={s.heroTop}>
              <Pressable style={s.backBtn} onPress={() => router.back()}>
                <IconArrowLeft size={20} color={colors.white} strokeWidth={2} />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
        <View style={{ padding: 20, gap: 16 }}>
          <Skeleton width="100%" height={100} borderRadius={20} />
          <Skeleton width="100%" height={180} borderRadius={20} />
          <Skeleton width="60%" height={14} borderRadius={8} />
        </View>
      </View>
    );
  }

  // ── Error ──
  if (!booking) {
    return (
      <View style={s.root}>
        <View style={s.hero}>
          <SafeAreaView edges={['top']}>
            <View style={s.heroTop}>
              <Pressable style={s.backBtn} onPress={() => router.back()}>
                <IconArrowLeft size={20} color={colors.white} strokeWidth={2} />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
        <View style={s.errorWrap}>
          <View style={s.errorIcon}>
            <IconAlertCircle size={32} color={colors.textMuted} strokeWidth={1.5} />
          </View>
          <Text style={s.errorTitle}>Réservation introuvable</Text>
          <Pressable style={s.accentBtn} onPress={() => router.back()}>
            <Text style={s.accentBtnText}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const status = STATUS_CONFIG[booking.status] || { label: booking.status, color: colors.textMuted, bg: 'rgba(0,0,0,0.05)' };
  const isClient = user?.phone === booking.client?.phone;
  const isProvider = user?.phone === booking.provider?.user?.phone;
  const isPending = booking.status === 'REQUESTED';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isInProgress = booking.status === 'IN_PROGRESS';
  const isDisputed = booking.status === 'DISPUTED';
  const canCancel = ['REQUESTED', 'CONFIRMED', 'DEPOSIT_PAID'].includes(booking.status);
  const isFinished = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(booking.status);
  const bookingDatePast = new Date(booking.date) < new Date();
  const canNoShow = isProvider && ['CONFIRMED', 'DEPOSIT_PAID'].includes(booking.status) && bookingDatePast;
  const canDispute = !isDisputed && ['IN_PROGRESS', 'COMPLETED'].includes(booking.status);

  const timelineEvents: { label: string; date: string }[] = [
    { label: 'Demande créée', date: booking.createdAt },
    ...(booking.confirmedAt ? [{ label: 'Confirmée', date: booking.confirmedAt }] : []),
    ...(booking.completedAt ? [{ label: 'Terminée', date: booking.completedAt }] : []),
    ...(booking.cancelledAt ? [{ label: 'Annulée', date: booking.cancelledAt }] : []),
  ];

  return (
    <View style={s.root}>
      {/* ── Dark hero ── */}
      <View style={s.hero}>
        <SafeAreaView edges={['top']}>
          <View style={s.heroTop}>
            <Pressable style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/bookings')} hitSlop={8}>
              <IconArrowLeft size={20} color={colors.white} strokeWidth={2} />
            </Pressable>
            <Text style={s.heroTitle}>Réservation</Text>
            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>

        {/* Ref + status in hero */}
        <View style={s.heroBody}>
          <Text style={s.heroRef}>{booking.ref}</Text>
          <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchBooking(); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Pending banner ── */}
        {isPending && isClient && (
          <View style={s.pendingBanner}>
            <View style={s.pendingIconWrap}>
              <IconClock size={18} color={colors.warning} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.pendingTitle}>En attente de confirmation</Text>
              <Text style={s.pendingText}>Le prestataire va confirmer votre demande sous peu.</Text>
            </View>
          </View>
        )}

        {/* ── Disputed banner ── */}
        {isDisputed && (
          <View style={s.disputedBanner}>
            <View style={s.disputedIconWrap}>
              <IconAlertCircle size={18} color={colors.error} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.disputedTitle}>Litige en cours</Text>
              <Text style={s.disputedText}>Notre équipe examine votre dossier. Contactez le support via WhatsApp.</Text>
            </View>
          </View>
        )}

        {/* ── Provider card ── */}
        <PressableScale onPress={() => router.push(`/provider/${booking.provider.slug}`)}>
          <View style={s.providerCard}>
            {booking.provider.user.avatar ? (
              <Image source={{ uri: booking.provider.user.avatar }} style={s.providerAvatar} />
            ) : (
              <View style={s.providerAvatarFallback}>
                <Text style={s.providerAvatarInitial}>{getInitials(booking.provider.displayName)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.providerName}>{booking.provider.displayName}</Text>
              <Text style={s.providerCity}>
                {booking.provider.commune ? `${booking.provider.commune}, ` : ''}{booking.provider.city}
              </Text>
            </View>
            <View style={s.providerChevron}>
              <IconChevronRight size={16} color={colors.primary} strokeWidth={2} />
            </View>
          </View>
        </PressableScale>

        {/* ── Info card ── */}
        <View style={s.card}>
          <InfoRow
            icon={<IconScissors size={18} color={colors.primary} strokeWidth={1.8} />}
            label="Service"
            value={booking.service.name}
            sub={`${booking.service.category?.name} · ${booking.service.durationMin} min`}
          />
          <View style={s.divider} />
          <InfoRow
            icon={<IconCalendar size={18} color={colors.primary} strokeWidth={1.8} />}
            label="Date"
            value={formatDate(booking.date)}
          />
          <View style={s.divider} />
          <InfoRow
            icon={<IconClock size={18} color={colors.primary} strokeWidth={1.8} />}
            label="Horaire"
            value={`${booking.startTime} — ${booking.endTime}`}
          />
          <View style={s.divider} />
          <InfoRow
            icon={booking.locationType === 'CLIENT'
              ? <IconHome size={18} color={colors.primary} strokeWidth={1.8} />
              : <IconMapPin size={18} color={colors.primary} strokeWidth={1.8} />}
            label="Lieu"
            value={booking.locationType === 'CLIENT' ? 'À domicile' : 'Chez le prestataire'}
            sub={booking.locationAddress ?? undefined}
          />
          <View style={s.divider} />
          <InfoRow
            icon={<IconCoin size={18} color={colors.terracotta} strokeWidth={1.8} />}
            label="Prix"
            value={formatPrice(booking.agreedPrice, booking.currency)}
            sub={booking.depositAmount
              ? `Acompte : ${formatPrice(booking.depositAmount, booking.currency)} (30%) · ${booking.depositPaid ? 'Payé' : 'En attente'}`
              : undefined}
          />
        </View>

        {/* ── Notes ── */}
        {(booking.clientNotes || booking.providerNotes) && (
          <View style={s.card}>
            {booking.clientNotes && (
              <View style={s.noteRow}>
                <IconNote size={16} color={colors.textMuted} strokeWidth={1.8} />
                <View style={{ flex: 1 }}>
                  <Text style={s.noteLabel}>Notes client</Text>
                  <Text style={s.noteText}>{booking.clientNotes}</Text>
                </View>
              </View>
            )}
            {booking.clientNotes && booking.providerNotes && <View style={s.divider} />}
            {booking.providerNotes && (
              <View style={s.noteRow}>
                <IconNote size={16} color={colors.textMuted} strokeWidth={1.8} />
                <View style={{ flex: 1 }}>
                  <Text style={s.noteLabel}>Notes prestataire</Text>
                  <Text style={s.noteText}>{booking.providerNotes}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Cancel reason ── */}
        {booking.cancelReason && (
          <View style={s.cancelReasonCard}>
            <IconAlertCircle size={16} color={colors.error} strokeWidth={1.8} />
            <Text style={s.cancelReasonText}>{booking.cancelReason}</Text>
          </View>
        )}

        {/* ── Actions ── */}
        <View style={s.actions}>
          {/* WhatsApp */}
          {booking.provider.whatsappNumber && !isFinished && (
            <PressableScale onPress={() => openWhatsApp(booking.provider.whatsappNumber!)}>
              <View style={s.whatsappBtn}>
                <IconBrandWhatsapp size={20} color={colors.white} strokeWidth={1.8} />
                <Text style={s.whatsappBtnText}>Contacter sur WhatsApp</Text>
              </View>
            </PressableScale>
          )}

          {/* Provider: confirm */}
          {isProvider && isPending && (
            <PressableScale onPress={() => handleStatusChange('CONFIRMED', 'Confirmer cette réservation ?')} disabled={actionLoading}>
              <View style={[s.primaryBtn, actionLoading && { opacity: 0.6 }]}>
                <IconCheck size={18} color={colors.white} strokeWidth={2.5} />
                <Text style={s.primaryBtnText}>{actionLoading ? 'Chargement…' : 'Confirmer la réservation'}</Text>
              </View>
            </PressableScale>
          )}

          {/* Provider: start */}
          {isProvider && (isConfirmed || booking.status === 'DEPOSIT_PAID') && (
            <PressableScale onPress={() => handleStatusChange('IN_PROGRESS', 'Démarrer le service ?')} disabled={actionLoading}>
              <View style={[s.primaryBtn, actionLoading && { opacity: 0.6 }]}>
                <IconPlayerPlay size={18} color={colors.white} strokeWidth={2} />
                <Text style={s.primaryBtnText}>{actionLoading ? 'Chargement…' : 'Démarrer le service'}</Text>
              </View>
            </PressableScale>
          )}

          {/* Provider: complete */}
          {isProvider && isInProgress && (
            <PressableScale onPress={() => handleStatusChange('COMPLETED', 'Marquer le service comme terminé ?')} disabled={actionLoading}>
              <View style={[s.primaryBtn, actionLoading && { opacity: 0.6 }]}>
                <IconCheck size={18} color={colors.white} strokeWidth={2.5} />
                <Text style={s.primaryBtnText}>{actionLoading ? 'Chargement…' : 'Service terminé'}</Text>
              </View>
            </PressableScale>
          )}

          {/* No-show (provider only, date passed) */}
          {canNoShow && (
            <PressableScale onPress={() => handleStatusChange('NO_SHOW', 'Marquer la cliente comme absente ?')} disabled={actionLoading}>
              <View style={[s.warnBtn, actionLoading && { opacity: 0.6 }]}>
                <IconAlertCircle size={16} color={colors.warning} strokeWidth={2.5} />
                <Text style={s.warnBtnText}>Cliente absente</Text>
              </View>
            </PressableScale>
          )}

          {/* Dispute */}
          {canDispute && (
            <PressableScale onPress={() => handleStatusChange('DISPUTED', 'Signaler un litige pour cette réservation ?')} disabled={actionLoading}>
              <View style={[s.disputeBtn, actionLoading && { opacity: 0.6 }]}>
                <IconAlertCircle size={16} color={colors.error} strokeWidth={2} />
                <Text style={s.disputeBtnText}>Signaler un litige</Text>
              </View>
            </PressableScale>
          )}

          {/* Cancel */}
          {canCancel && (
            <PressableScale onPress={() => setCancelModal(true)} disabled={actionLoading}>
              <View style={[s.cancelBtn, actionLoading && { opacity: 0.6 }]}>
                <IconX size={16} color={colors.error} strokeWidth={2.5} />
                <Text style={s.cancelBtnText}>Annuler la réservation</Text>
              </View>
            </PressableScale>
          )}

          {/* Rebook */}
          {isFinished && isClient && (
            <PressableScale onPress={() => router.push(`/booking/${booking.provider.id}?slug=${booking.provider.slug}`)}>
              <View style={s.rebookBtn}>
                <IconRefresh size={18} color={colors.accent} strokeWidth={2} />
                <Text style={s.rebookBtnText}>Réserver à nouveau</Text>
              </View>
            </PressableScale>
          )}
        </View>

        {/* ── Existing review ── */}
        {booking.review && (
          <View style={s.reviewCard}>
            <Text style={s.reviewCardLabel}>Votre avis</Text>
            <StarRow rating={booking.review.rating} />
            {booking.review.comment && (
              <Text style={s.reviewCardComment}>{booking.review.comment}</Text>
            )}
          </View>
        )}

        {/* ── Review prompt ── */}
        {isClient && booking.status === 'COMPLETED' && !booking.review && (
          <View style={s.reviewPrompt}>
            <Text style={s.reviewPromptTitle}>Comment s'est passé votre service ?</Text>
            <Text style={s.reviewPromptSub}>
              Votre avis aide les autres clientes à trouver les meilleures prestataires
            </Text>
            <Pressable
              style={s.reviewPromptBtn}
              onPress={() => router.push(`/booking/review/${booking.id}?providerName=${encodeURIComponent(booking.provider.displayName)}`)}
            >
              <IconStar size={16} color={colors.white} strokeWidth={2} />
              <Text style={s.reviewPromptBtnText}>Laisser un avis</Text>
            </Pressable>
          </View>
        )}

        {/* ── Timeline ── */}
        <View style={s.timelineCard}>
          <Text style={s.timelineTitle}>Historique</Text>
          {timelineEvents.map((evt, i) => (
            <TimelineItem
              key={evt.date}
              label={evt.label}
              date={evt.date}
              isLast={i === timelineEvents.length - 1}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Cancel reason modal ── */}
      <Modal
        visible={cancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Annuler la réservation</Text>
            <Text style={s.modalSub}>Raison de l'annulation (optionnel)</Text>
            <TextInput
              style={s.modalInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Ex : empêchement, disponibilité..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={s.modalActions}>
              <Pressable
                style={s.modalBackBtn}
                onPress={() => { setCancelModal(false); setCancelReason(''); }}
              >
                <Text style={s.modalBackBtnText}>Retour</Text>
              </Pressable>
              <Pressable
                style={[s.modalConfirmBtn, actionLoading && { opacity: 0.6 }]}
                disabled={actionLoading}
                onPress={async () => {
                  setCancelModal(false);
                  const reason = cancelReason;
                  setCancelReason('');
                  await handleCancel(reason);
                }}
              >
                <Text style={s.modalConfirmBtnText}>
                  {actionLoading ? 'Chargement…' : 'Annuler le RDV'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Hero
  hero: {
    backgroundColor: colors.headerDark,
    ...(Platform.OS === 'web' ? { background: `linear-gradient(160deg, ${colors.headerDark} 0%, #5C3D3D 100%)` } as any : {}),
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.white, letterSpacing: 0.3 },
  heroBody: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 24,
    gap: 12,
  },
  heroRef: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.6 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, ...Platform.select({
    web: { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
  }) as any },
  statusText: { fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' },

  // Scroll
  scroll: { padding: 20, gap: 14 },

  // Pending banner
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.20)',
  },
  pendingIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,158,11,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  pendingTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.warning, marginBottom: 2 },
  pendingText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 18 },

  // Provider card
  providerCard: {
    backgroundColor: colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    }) as any,
  },
  providerAvatar: { width: 48, height: 48, borderRadius: 24 },
  providerAvatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center', alignItems: 'center',
  },
  providerAvatarInitial: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: colors.primary },
  providerName: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 2 },
  providerCity: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  providerChevron: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center', alignItems: 'center',
  },

  // Info card
  card: {
    backgroundColor: colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    }) as any,
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },

  // Notes
  noteRow: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
  noteLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 3 },
  noteText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text, lineHeight: 20 },

  // Cancel reason
  cancelReasonCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(222,53,11,0.06)', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: 'rgba(222,53,11,0.12)',
  },
  cancelReasonText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.error, lineHeight: 20 },

  // Actions
  actions: { gap: 10 },
  whatsappBtn: {
    backgroundColor: '#25D366', borderRadius: 25,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(37,211,102,0.28)' },
      default: { shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12 },
    }) as any,
  },
  whatsappBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.white },
  primaryBtn: {
    backgroundColor: colors.accent, borderRadius: 25,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(91,33,182,0.28)' },
      default: { shadowColor: '#5B21B6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12 },
    }) as any,
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.white },
  cancelBtn: {
    borderRadius: 25, borderWidth: 1.5, borderColor: colors.error,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
  },
  cancelBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.error },
  rebookBtn: {
    backgroundColor: colors.card, borderRadius: 25, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
  },
  rebookBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.accent },

  // Review
  reviewCard: {
    backgroundColor: colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    padding: 18,
  },
  reviewCardLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: colors.textMuted, letterSpacing: 0.8, marginBottom: 4 },
  reviewCardComment: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text, lineHeight: 22, marginTop: 6 },
  reviewPrompt: {
    backgroundColor: colors.card, borderRadius: 20,
    borderWidth: 2, borderColor: colors.primaryBorder,
    padding: 22, alignItems: 'center', gap: 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(139,105,82,0.12)' },
      default: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12 },
    }) as any,
  },
  reviewPromptTitle: { fontSize: 19, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, textAlign: 'center', letterSpacing: -0.3 },
  reviewPromptSub: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  reviewPromptBtn: {
    marginTop: 14, backgroundColor: colors.primary, borderRadius: 26,
    paddingHorizontal: 32, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(139,105,82,0.25)' },
      default: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
    }) as any,
  },
  reviewPromptBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.white, fontWeight: '700' },

  // Timeline
  timelineCard: {
    backgroundColor: colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
    }) as any,
  },
  timelineTitle: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: colors.textMuted, letterSpacing: 0.9, marginBottom: 18, textTransform: 'uppercase' },

  // Disputed banner
  disputedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(222,53,11,0.08)',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(222,53,11,0.18)',
  },
  disputedIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(222,53,11,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  disputedTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.error, marginBottom: 2 },
  disputedText: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 18 },

  // Warn button (no-show)
  warnBtn: {
    borderRadius: 25, borderWidth: 1.5, borderColor: colors.warning,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
  },
  warnBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.warning },

  // Dispute button
  disputeBtn: {
    borderRadius: 25, borderWidth: 1.5, borderColor: 'rgba(222,53,11,0.35)',
    backgroundColor: 'rgba(222,53,11,0.04)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
  },
  disputeBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.error },

  // Cancel reason modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: colors.text },
  modalSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  modalInput: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    minHeight: 80,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBackBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 25,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  modalBackBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 25,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalConfirmBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.white },

  // Error / loading
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  errorIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center', alignItems: 'center',
  },
  errorTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text },
  accentBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: colors.accent, borderRadius: 25 },
  accentBtnText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
