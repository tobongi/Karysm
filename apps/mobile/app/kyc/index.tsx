import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { pickImage } from '../../src/lib/upload';
import { showAlert, showConfirm } from '../../src/lib/alert';

interface KycDoc {
  id: string;
  type: string;
  imageUrl: string;
  status: string;
  rejectedReason: string | null;
  createdAt: string;
}

interface KycStatus {
  kycStatus: string;
  idVerified: boolean;
  documents: Record<string, KycDoc>;
}

const DOC_CONFIG = [
  { type: 'ID_FRONT', label: 'Recto de la pièce d\'identité', icon: '🪪', description: 'Photo claire du recto de votre carte d\'identité ou passeport' },
  { type: 'ID_BACK', label: 'Verso de la pièce d\'identité', icon: '🔄', description: 'Photo claire du verso de votre carte d\'identité' },
  { type: 'SELFIE_WITH_ID', label: 'Selfie avec pièce d\'identité', icon: '🤳', description: 'Prenez-vous en photo en tenant votre pièce d\'identité à côté de votre visage' },
];

const STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  NOT_STARTED: { label: 'Non soumis', color: colors.textMuted, bg: 'rgba(0,0,0,0.04)' },
  PENDING: { label: 'En attente', color: colors.warning, bg: 'rgba(245,158,11,0.1)' },
  APPROVED: { label: 'Approuvé', color: colors.success, bg: 'rgba(16,185,129,0.1)' },
  REJECTED: { label: 'Refusé', color: colors.error, bg: 'rgba(239,68,68,0.1)' },
};

export default function KycScreen() {
  const [kycData, setKycData] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res: any = await api('/kyc/status');
      setKycData(res.data);
    } catch (err: any) {
      // console.error('KYC status error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleUpload(type: string) {
    if (uploading) return;
    setUploading(type);
    try {
      const base64 = await pickImage();
      if (!base64) { setUploading(null); return; }

      await api('/kyc/upload', {
        method: 'POST',
        body: JSON.stringify({ type, data: base64 }),
      });

      showAlert('Document envoyé', 'Votre document est en cours de vérification.');
      fetchStatus();
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible d\'envoyer le document');
    } finally {
      setUploading(null);
    }
  }

  function handleResubmit(type: string) {
    showConfirm('Re-soumettre', 'Voulez-vous soumettre un nouveau document ?', () => {
      handleUpload(type);
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const overallStatus = kycData?.kycStatus || 'NOT_STARTED';
  const statusDisplay = STATUS_DISPLAY[overallStatus] || STATUS_DISPLAY.NOT_STARTED;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStatus(); }} tintColor={colors.primary} />
        }
      >
        <Text style={styles.title}>Vérification d'identité</Text>
        <Text style={styles.subtitle}>
          Soumettez vos documents pour obtenir le badge vérifié ✅ sur votre profil.
        </Text>

        {/* Overall status */}
        <View style={[styles.statusCard, { borderColor: statusDisplay.color }]}>
          <View style={[styles.statusBadge, { backgroundColor: statusDisplay.bg }]}>
            <Text style={[styles.statusText, { color: statusDisplay.color }]}>
              {statusDisplay.label}
            </Text>
          </View>
          {kycData?.idVerified && (
            <Text style={styles.verifiedText}>✅ Identité vérifiée</Text>
          )}
          {overallStatus === 'REJECTED' && (
            <Text style={styles.rejectedHint}>
              Un ou plusieurs documents ont été refusés. Veuillez les re-soumettre.
            </Text>
          )}
        </View>

        {/* Document cards */}
        {DOC_CONFIG.map((config) => {
          const doc = kycData?.documents?.[config.type];
          const docStatus = doc?.status || 'NOT_STARTED';
          const docDisplay = STATUS_DISPLAY[docStatus] || STATUS_DISPLAY.NOT_STARTED;
          const canUpload = !doc || docStatus === 'REJECTED';
          const isUploading = uploading === config.type;

          return (
            <View key={config.type} style={styles.docCard}>
              <View style={styles.docHeader}>
                <Text style={styles.docIcon}>{config.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docLabel}>{config.label}</Text>
                  <Text style={styles.docDescription}>{config.description}</Text>
                </View>
              </View>

              {/* Preview if uploaded */}
              {doc && (
                <View style={styles.docPreview}>
                  <Image source={{ uri: doc.imageUrl }} style={styles.docImage} />
                  <View style={[styles.docStatusBadge, { backgroundColor: docDisplay.bg }]}>
                    <Text style={[styles.docStatusText, { color: docDisplay.color }]}>
                      {docDisplay.label}
                    </Text>
                  </View>
                </View>
              )}

              {/* Rejected reason */}
              {doc?.rejectedReason && (
                <View style={styles.rejectedBox}>
                  <Text style={styles.rejectedLabel}>Raison du refus :</Text>
                  <Text style={styles.rejectedReason}>{doc.rejectedReason}</Text>
                </View>
              )}

              {/* Upload / Re-submit button */}
              {canUpload && (
                <Pressable
                  style={[styles.uploadButton, isUploading && styles.uploadDisabled]}
                  onPress={() => docStatus === 'REJECTED' ? handleResubmit(config.type) : handleUpload(config.type)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.uploadText}>
                      {docStatus === 'REJECTED' ? '🔄 Re-soumettre' : '📷 Prendre en photo'}
                    </Text>
                  )}
                </Pressable>
              )}

              {docStatus === 'PENDING' && (
                <Text style={styles.pendingHint}>⏳ En cours de vérification...</Text>
              )}

              {docStatus === 'APPROVED' && (
                <Text style={styles.approvedHint}>✅ Document approuvé</Text>
              )}
            </View>
          );
        })}

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

  title: { fontSize: 24, fontWeight: '700', color: colors.accent, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },

  // Overall status
  statusCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, marginBottom: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
  verifiedText: { fontSize: 16, fontWeight: '700', color: colors.success, marginTop: 8 },
  rejectedHint: { fontSize: 13, color: colors.error, marginTop: 8, lineHeight: 18 },

  // Document cards
  docCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  docHeader: { flexDirection: 'row', marginBottom: 12 },
  docIcon: { fontSize: 28, marginRight: 12, marginTop: 2 },
  docLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  docDescription: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },

  docPreview: { marginBottom: 12 },
  docImage: { width: '100%', height: 160, borderRadius: 10, marginBottom: 8, backgroundColor: colors.cardHover },
  docStatusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  docStatusText: { fontSize: 12, fontWeight: '600' },

  rejectedBox: {
    backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: 12, marginBottom: 12,
  },
  rejectedLabel: { fontSize: 12, fontWeight: '600', color: colors.error, marginBottom: 4 },
  rejectedReason: { fontSize: 13, color: colors.error, lineHeight: 18 },

  uploadButton: {
    backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  uploadDisabled: { opacity: 0.5 },
  uploadText: { color: colors.white, fontSize: 14, fontWeight: '600' },

  pendingHint: { fontSize: 13, color: colors.warning, marginTop: 4 },
  approvedHint: { fontSize: 13, color: colors.success, marginTop: 4 },
});
