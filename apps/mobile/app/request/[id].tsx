import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { showAlert, showConfirm } from '../../src/lib/alert';
import { useAuth } from '../../src/lib/auth-context';
import CurveHeader from '../../src/components/CurveHeader';

interface Proposal {
  id: string;
  providerId: string;
  price: number;
  currency: string;
  message: string;
  estimatedDuration: number;
  portfolioSamples: string[];
  status: string;
  createdAt: string;
  provider?: {
    id: string;
    displayName: string;
    slug: string;
    avgRating: number;
    totalReviews: number;
    city: string;
    user: { name: string; avatar?: string | null };
  } | null;
}

interface BeautyRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  categoryId: string;
  photos: string[];
  selfieUrl?: string | null;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  preferredDate?: string | null;
  flexibleDate: boolean;
  locationType: string;
  locationAddress?: string | null;
  city: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  proposals: Proposal[];
  isOwner: boolean;
  hasProposed: boolean;
  client?: { id: string; name: string; avatar?: string | null };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Ouverte', color: colors.success },
  IN_REVIEW: { label: 'En cours', color: colors.primary },
  ACCEPTED: { label: 'Acceptée', color: colors.primary },
  EXPIRED: { label: 'Expirée', color: colors.textMuted },
  CANCELLED: { label: 'Annulée', color: colors.error },
  COMPLETED: { label: 'Terminée', color: colors.success },
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isProvider } = useAuth();
  const [request, setRequest] = useState<BeautyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Proposal form
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalDuration, setProposalDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      const res: any = await api(`/requests/${id}`);
      setRequest(res.data);
    } catch (e: any) {
      showAlert('Erreur', e.message || 'Impossible de charger la demande');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  function onRefresh() {
    setRefreshing(true);
    fetchRequest();
  }

  function formatPrice(amount: number | null | undefined, currency?: string): string {
    if (amount == null) return '';
    const symbol = (currency || 'CDF') === 'CDF' ? 'FC' : 'FCFA';
    return `${amount.toLocaleString('fr-FR')} ${symbol}`;
  }

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Flexible';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  function locationLabel(type: string): string {
    switch (type) {
      case 'CLIENT': return 'Chez le client';
      case 'PROVIDER': return 'Chez le prestataire';
      case 'FLEXIBLE': return 'Flexible';
      default: return type;
    }
  }

  async function handleSendProposal() {
    const price = parseInt(proposalPrice);
    const duration = parseInt(proposalDuration);
    if (isNaN(price) || price <= 0) return showAlert('Erreur', 'Indiquez un prix valide');
    if (!proposalMessage.trim()) return showAlert('Erreur', 'Ajoutez un message');
    if (isNaN(duration) || duration < 5) return showAlert('Erreur', 'Indiquez une durée estimée (min 5 min)');

    setSubmitting(true);
    try {
      await api(`/requests/${id}/proposals`, {
        method: 'POST',
        body: JSON.stringify({
          price,
          message: proposalMessage.trim(),
          estimatedDuration: duration,
        }),
      });
      setShowProposalForm(false);
      setProposalPrice('');
      setProposalMessage('');
      setProposalDuration('');
      fetchRequest();
      showAlert('Proposition envoyée', 'Le client recevra votre proposition.');
    } catch (e: any) {
      showAlert('Erreur', e.message || 'Impossible d\'envoyer la proposition');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcceptProposal(proposalId: string) {
    showConfirm(
      'Accepter cette proposition ?',
      'Une réservation sera créée automatiquement. Les autres propositions seront rejetées.',
      async () => {
        try {
          const res: any = await api(`/requests/${id}/accept/${proposalId}`, { method: 'PATCH' });
          showAlert('Proposition acceptée', 'Votre réservation a été créée.');
          fetchRequest();
        } catch (e: any) {
          showAlert('Erreur', e.message || 'Impossible d\'accepter');
        }
      }
    );
  }

  async function handleCancelRequest() {
    showConfirm(
      'Annuler cette demande ?',
      'Cette action est irréversible.',
      async () => {
        try {
          await api(`/requests/${id}`, { method: 'DELETE' });
          showAlert('Demande annulée', undefined, () => router.back());
        } catch (e: any) {
          showAlert('Erreur', e.message || 'Impossible d\'annuler');
        }
      }
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Demande introuvable</Text>
      </View>
    );
  }

  const statusInfo = STATUS_LABELS[request.status] || { label: request.status, color: colors.textMuted };
  const canPropose = isProvider && !request.isOwner && !request.hasProposed &&
    (request.status === 'OPEN' || request.status === 'IN_REVIEW');
  const canCancel = request.isOwner && !['ACCEPTED', 'COMPLETED', 'CANCELLED'].includes(request.status);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CurveHeader title="Demande" showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>

        {/* Title & Client */}
        <Text style={styles.title}>{request.title}</Text>
        {!request.isOwner && request.client && (
          <Text style={styles.clientName}>Par {request.client.name}</Text>
        )}

        {/* Meta info */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Budget</Text>
            <Text style={styles.metaValue}>
              {formatPrice(request.budgetMin, request.currency)} — {formatPrice(request.budgetMax, request.currency)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>
              {request.flexibleDate ? 'Flexible' : formatDate(request.preferredDate)}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Ville</Text>
            <Text style={styles.metaValue}>{request.city}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Lieu</Text>
            <Text style={styles.metaValue}>{locationLabel(request.locationType)}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{request.description}</Text>
        </View>

        {/* Photos placeholder */}
        {request.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos d'inspiration</Text>
            <View style={styles.photosRow}>
              {request.photos.map((url, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Text style={styles.photoThumbText}>{'\uD83D\uDCF7'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* PROPOSALS SECTION — visible to client owner */}
        {request.isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Propositions ({request.proposals.length})
            </Text>
            {request.proposals.length === 0 ? (
              <View style={styles.emptyProposals}>
                <Text style={styles.emptyEmoji}>{'\uD83D\uDD50'}</Text>
                <Text style={styles.emptyText}>Aucune proposition pour le moment</Text>
                <Text style={styles.emptySubtext}>Les prestataires verront votre demande bientôt</Text>
              </View>
            ) : (
              request.proposals.map((p) => (
                <View key={p.id} style={styles.proposalCard}>
                  {/* Provider info */}
                  <Pressable
                    style={styles.proposalHeader}
                    onPress={() => p.provider?.slug && router.push(`/provider/${p.provider.slug}` as any)}
                  >
                    <View style={styles.proposalAvatar}>
                      <Text style={styles.proposalAvatarText}>
                        {p.provider?.user?.name?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.proposalInfo}>
                      <Text style={styles.proposalName}>{p.provider?.displayName || 'Prestataire'}</Text>
                      <View style={styles.proposalRating}>
                        <Text style={styles.ratingStar}>{'\u2605'}</Text>
                        <Text style={styles.ratingValue}>{(p.provider?.avgRating || 0).toFixed(1)}</Text>
                        <Text style={styles.reviewCount}>({p.provider?.totalReviews || 0})</Text>
                      </View>
                    </View>
                    <Text style={styles.proposalPrice}>{formatPrice(p.price, p.currency)}</Text>
                  </Pressable>

                  {/* Message */}
                  <Text style={styles.proposalMessage}>{p.message}</Text>

                  {/* Duration */}
                  <Text style={styles.proposalDuration}>
                    {'\u23F1'} Durée estimée: {p.estimatedDuration} min
                  </Text>

                  {/* Actions */}
                  {p.status === 'PENDING' && request.status !== 'ACCEPTED' && (
                    <View style={styles.proposalActions}>
                      <Pressable
                        style={styles.acceptBtn}
                        onPress={() => handleAcceptProposal(p.id)}
                      >
                        <Text style={styles.acceptBtnText}>Accepter</Text>
                      </Pressable>
                    </View>
                  )}
                  {p.status !== 'PENDING' && (
                    <View style={[styles.proposalStatusBadge, {
                      backgroundColor: p.status === 'ACCEPTED' ? colors.success + '18' : colors.textMuted + '18',
                    }]}>
                      <Text style={[styles.proposalStatusText, {
                        color: p.status === 'ACCEPTED' ? colors.success : colors.textMuted,
                      }]}>
                        {p.status === 'ACCEPTED' ? 'Acceptée' : p.status === 'REJECTED' ? 'Rejetée' : p.status}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Provider's own proposal */}
        {!request.isOwner && request.hasProposed && request.proposals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre proposition</Text>
            {request.proposals.map((p) => (
              <View key={p.id} style={styles.proposalCard}>
                <View style={styles.proposalHeader}>
                  <Text style={styles.proposalPrice}>{formatPrice(p.price, p.currency)}</Text>
                  <View style={[styles.proposalStatusBadge, {
                    backgroundColor: p.status === 'PENDING' ? colors.warning + '18' :
                      p.status === 'ACCEPTED' ? colors.success + '18' : colors.textMuted + '18',
                  }]}>
                    <Text style={[styles.proposalStatusText, {
                      color: p.status === 'PENDING' ? colors.warning :
                        p.status === 'ACCEPTED' ? colors.success : colors.textMuted,
                    }]}>
                      {p.status === 'PENDING' ? 'En attente' : p.status === 'ACCEPTED' ? 'Acceptée' : 'Rejetée'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.proposalMessage}>{p.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Cancel button for owner */}
        {canCancel && (
          <Pressable style={styles.cancelBtn} onPress={handleCancelRequest}>
            <Text style={styles.cancelBtnText}>Annuler la demande</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Provider CTA */}
      {canPropose && (
        <View style={styles.ctaBar}>
          <Pressable style={styles.ctaBtn} onPress={() => setShowProposalForm(true)}>
            <Text style={styles.ctaBtnText}>Envoyer une proposition</Text>
          </Pressable>
        </View>
      )}

      {/* Proposal form modal */}
      <Modal visible={showProposalForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Votre proposition</Text>

            <Text style={styles.formLabel}>Prix (FC)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ex: 15000"
              placeholderTextColor={colors.textMuted}
              value={proposalPrice}
              onChangeText={setProposalPrice}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Durée estimée (minutes)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ex: 90"
              placeholderTextColor={colors.textMuted}
              value={proposalDuration}
              onChangeText={setProposalDuration}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Message</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Décrivez votre expérience, comment vous réaliseriez cette prestation..."
              placeholderTextColor={colors.textMuted}
              value={proposalMessage}
              onChangeText={setProposalMessage}
              multiline
              numberOfLines={4}
              maxLength={2000}
            />

            <Pressable
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSendProposal}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Envoyer</Text>
              )}
            </Pressable>

            <Pressable style={styles.modalClose} onPress={() => setShowProposalForm(false)}>
              <Text style={styles.modalCloseText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  errorText: { fontSize: 16, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  // Status
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  // Title
  title: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginBottom: 4 },
  clientName: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginBottom: 16 },
  // Meta
  metaRow: { flexDirection: 'row', marginBottom: 12 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginBottom: 2 },
  metaValue: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  // Section
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 10 },
  descriptionText: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.text, lineHeight: 22 },
  // Photos
  photosRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  photoThumb: {
    width: 80, height: 80, borderRadius: 16, backgroundColor: colors.n300,
    justifyContent: 'center', alignItems: 'center',
  },
  photoThumbText: { fontSize: 24 },
  // Empty proposals
  emptyProposals: { alignItems: 'center', paddingVertical: 24 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  emptySubtext: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 4 },
  // Proposal card
  proposalCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(90,56,60,0.06)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    }) as any,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  proposalAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  proposalAvatarText: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.white },
  proposalInfo: { flex: 1 },
  proposalName: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text },
  proposalRating: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  ratingStar: { fontSize: 13, color: colors.terracotta, marginRight: 4 },
  ratingValue: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.terracotta, marginRight: 4 },
  reviewCount: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  proposalPrice: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.terracotta },
  proposalMessage: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text, lineHeight: 20, marginBottom: 8 },
  proposalDuration: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  // Proposal actions
  proposalActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.white },
  proposalStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  proposalStatusText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  // Cancel
  cancelBtn: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.error },
  // CTA bar
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.white },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 16 },
  modalClose: { paddingVertical: 12, alignItems: 'center' },
  modalCloseText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  // Form
  formLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginTop: 12, marginBottom: 6 },
  formInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
  },
  formTextArea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.white },
});
