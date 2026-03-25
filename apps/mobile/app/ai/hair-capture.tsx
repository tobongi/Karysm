import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Image, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { pickImage } from '../../src/lib/upload';
import { showAlert } from '../../src/lib/alert';

const TIPS = [
  { icon: '☀️', title: 'Lumière naturelle', desc: 'Éclairage uniforme, pas de flash' },
  { icon: '💧', title: 'Cheveux secs', desc: 'Pas mouillés, pas de produit' },
  { icon: '🙆‍♀️', title: 'Détachés', desc: 'Cheveux libres, naturels' },
];

export default function HairCaptureScreen() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [consent, setConsent] = useState(false);

  async function handleTakePhoto() {
    const base64 = await pickImage();
    if (base64) {
      setPhoto(base64);
      setPhotoUri(`data:image/jpeg;base64,${base64}`);
    }
  }

  async function handleAnalyze() {
    if (!photo) return;
    setAnalyzing(true);
    try {
      const res: any = await api('/ai/hair-analysis', {
        method: 'POST',
        body: JSON.stringify({ data: photo, consentDataset: consent }),
      });
      router.replace(`/ai/hair-results/${res.data.id}`);
    } catch (err: any) {
      showAlert('Erreur', err.message || "Impossible d'analyser la photo");
      setAnalyzing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Analyse cheveux</Text>
        <Text style={styles.subtitle}>
          Photographiez vos cheveux naturels pour connaître votre type capillaire et recevoir des conseils adaptés.
        </Text>

        <View style={styles.tipsRow}>
          {TIPS.map((tip, i) => (
            <View key={i} style={styles.tipCard}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDesc}>{tip.desc}</Text>
            </View>
          ))}
        </View>

        {photoUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.preview} />
            <Pressable style={styles.retakeButton} onPress={handleTakePhoto}>
              <Text style={styles.retakeText}>📷 Reprendre</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.captureButton} onPress={handleTakePhoto}>
            <Text style={styles.captureIcon}>💇‍♀️</Text>
            <Text style={styles.captureText}>Photographier mes cheveux</Text>
          </Pressable>
        )}

        {photo && (
          <View style={styles.consentRow}>
            <Switch
              value={consent}
              onValueChange={setConsent}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={consent ? colors.primary : colors.textMuted}
            />
            <Text style={styles.consentText}>
              J'accepte que ma photo soit utilisée anonymement pour améliorer le service
            </Text>
          </View>
        )}

        {photo && (
          <Pressable
            style={[styles.analyzeButton, analyzing && styles.analyzeDisabled]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color={colors.white} size="small" />
                <Text style={styles.analyzeText}>  Analyse en cours...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeText}>✨ Analyser mes cheveux</Text>
            )}
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: colors.accent, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  tipsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tipCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  tipIcon: { fontSize: 24, marginBottom: 6 },
  tipTitle: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
  tipDesc: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  captureButton: {
    backgroundColor: colors.primaryGhost, borderRadius: 16, padding: 40,
    alignItems: 'center', borderWidth: 2, borderColor: colors.primaryBorder, borderStyle: 'dashed',
  },
  captureIcon: { fontSize: 48, marginBottom: 12 },
  captureText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  previewContainer: { alignItems: 'center', marginBottom: 16 },
  preview: { width: 240, height: 240, borderRadius: 16, marginBottom: 12 },
  retakeButton: {
    backgroundColor: colors.card, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1, borderColor: colors.border,
  },
  retakeText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  consentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  consentText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  analyzeButton: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  analyzeDisabled: { opacity: 0.7 },
  analyzeText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  analyzingRow: { flexDirection: 'row', alignItems: 'center' },
});
