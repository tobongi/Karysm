import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { api } from '../src/lib/api';
import { useAuth } from '../src/lib/auth-context';
import { showAlert } from '../src/lib/alert';
import { pickAndUploadAvatar } from '../src/lib/upload';
import IconCamera from '@tabler/icons-react-native/dist/esm/icons/IconCamera.mjs';
import IconConfetti from '@tabler/icons-react-native/dist/esm/icons/IconConfetti.mjs';

const CITIES = [
  { name: 'Kinshasa', country: 'RDC', currency: 'CDF' },
  { name: 'Douala', country: 'Cameroun', currency: 'XAF' },
  { name: 'Libreville', country: 'Gabon', currency: 'XAF' },
  { name: 'Abidjan', country: "Cote d'Ivoire", currency: 'XAF' },
  { name: 'Dakar', country: 'Senegal', currency: 'XAF' },
];

export default function ProviderRegisterScreen() {
  const { user, updateUser } = useAuth();

  // Step 1 — Identity
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  // Step 2 — Location
  const [selectedCity, setSelectedCity] = useState<typeof CITIES[number] | null>(null);
  const [commune, setCommune] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileRadius, setMobileRadius] = useState(10);

  // Step 3 — Contact
  const [whatsappNumber, setWhatsappNumber] = useState(user?.phone || '');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const canSubmit =
    displayName.trim().length >= 2 &&
    selectedCity !== null &&
    commune.trim().length >= 2 &&
    whatsappNumber.trim().length >= 8;

  async function handleAvatarPick() {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar();
      if (url) setAvatarUrl(url);
    } catch (err: any) {
      showAlert('Erreur', err.message || "Impossible d'envoyer la photo");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const body: Record<string, any> = {
        displayName: displayName.trim(),
        city: selectedCity!.name,
        commune: commune.trim(),
        isMobile,
        whatsappNumber: whatsappNumber.trim(),
        currency: selectedCity!.currency,
      };

      if (bio.trim()) body.bio = bio.trim();
      if (isMobile) body.mobileRadius = mobileRadius;
      if (instagramHandle.trim()) body.instagramHandle = instagramHandle.trim().replace(/^@/, '');
      if (tiktokHandle.trim()) (body as any).tiktokHandle = tiktokHandle.trim().replace(/^@/, '');

      await api('/provider/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // Upload avatar to provider profile if one was selected
      if (avatarUrl) {
        try {
          await api('/provider/profile', {
            method: 'PUT',
            body: JSON.stringify({ avatarUrl }),
          });
        } catch {
          // silently ignore — registration succeeded
        }
      }

      // Update user role in auth context
      if (user) {
        await updateUser({ ...user, role: 'PROVIDER' });
      }

      setShowSuccess(true);
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  function radiusLabel(r: number): string {
    return `${r} km`;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1: Identity ─────────────────── */}
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Identite</Text>
            </View>

            <View style={styles.avatarSection}>
              <Pressable onPress={handleAvatarPick} style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : uploadingAvatar ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <IconCamera size={32} color={colors.textMuted} />
                )}
              </Pressable>
              <Text style={styles.avatarHint}>
                {avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </Text>
            </View>

            <Text style={styles.label}>Comment vous appelez-vous ?</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Marie Kabila"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              maxLength={60}
            />

            <Text style={styles.label}>Presentez-vous en quelques mots</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Coiffeuse prestataire avec 5 ans d'experience..."
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/300</Text>
          </View>

          {/* ── Step 2: Location ─────────────────── */}
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Localisation</Text>
            </View>

            <Text style={styles.label}>Dans quelle ville exercez-vous ?</Text>
            <View style={styles.cityGrid}>
              {CITIES.map((city) => {
                const isSelected = selectedCity?.name === city.name;
                return (
                  <Pressable
                    key={city.name}
                    style={[styles.cityCard, isSelected && styles.cityCardSelected]}
                    onPress={() => setSelectedCity(city)}
                  >
                    <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                      {city.name}
                    </Text>
                    <Text style={[styles.cityCountry, isSelected && styles.cityCountrySelected]}>
                      {city.country}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Quartier / Commune</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Gombe, Bonanjo, Akanda..."
              placeholderTextColor={colors.textMuted}
              value={commune}
              onChangeText={setCommune}
              autoCapitalize="words"
              maxLength={60}
            />

            <Text style={styles.label}>Vous deplacez-vous chez le client ?</Text>
            <Pressable
              style={[styles.toggle, isMobile && styles.toggleActive]}
              onPress={() => setIsMobile(!isMobile)}
            >
              <View style={[styles.toggleThumb, isMobile && styles.toggleThumbActive]} />
              <Text style={[styles.toggleLabel, isMobile && styles.toggleLabelActive]}>
                {isMobile ? 'Oui, je me deplace' : 'Non, sur place uniquement'}
              </Text>
            </Pressable>

            {isMobile && (
              <View style={styles.radiusSection}>
                <Text style={styles.radiusLabel}>
                  Rayon de deplacement : <Text style={styles.radiusValue}>{radiusLabel(mobileRadius)}</Text>
                </Text>
                <View style={styles.radiusButtons}>
                  {[5, 10, 15, 20, 25].map((r) => (
                    <Pressable
                      key={r}
                      style={[styles.radiusChip, mobileRadius === r && styles.radiusChipActive]}
                      onPress={() => setMobileRadius(r)}
                    >
                      <Text
                        style={[styles.radiusChipText, mobileRadius === r && styles.radiusChipTextActive]}
                      >
                        {r} km
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ── Step 3: Contact ──────────────────── */}
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Contact</Text>
            </View>

            <Text style={styles.label}>Numero WhatsApp</Text>
            <TextInput
              style={styles.input}
              placeholder="+243 812 345 001"
              placeholderTextColor={colors.textMuted}
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              keyboardType="phone-pad"
              maxLength={20}
            />

            <Text style={styles.label}>Instagram (optionnel)</Text>
            <View style={styles.instagramRow}>
              <View style={styles.atPrefix}>
                <Text style={styles.atPrefixText}>@</Text>
              </View>
              <TextInput
                style={[styles.input, styles.instagramInput]}
                placeholder="marie_tresses"
                placeholderTextColor={colors.textMuted}
                value={instagramHandle}
                onChangeText={setInstagramHandle}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>

            <Text style={styles.label}>TikTok (optionnel)</Text>
            <View style={styles.instagramRow}>
              <View style={styles.atPrefix}>
                <Text style={styles.atPrefixText}>@</Text>
              </View>
              <TextInput
                style={[styles.input, styles.instagramInput]}
                placeholder="marie_beauty"
                placeholderTextColor={colors.textMuted}
                value={tiktokHandle}
                onChangeText={setTiktokHandle}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>
          </View>

          {/* Spacer for bottom button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Bottom CTA ─────────────────────────── */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Devenir prestataire</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* ── Success Modal ────────────────────────── */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconConfetti size={56} color={colors.accent} />
            <Text style={styles.modalTitle}>Bienvenue !</Text>
            <Text style={styles.modalMessage}>
              Votre profil prestataire a ete cree. Ajoutez vos services pour commencer a recevoir des
              reservations.
            </Text>

            <Pressable
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowSuccess(false);
                router.replace('/provider-dashboard/services');
              }}
            >
              <Text style={styles.modalPrimaryButtonText}>Ajouter mes services</Text>
            </Pressable>

            <Pressable
              style={styles.modalSecondaryButton}
              onPress={() => {
                setShowSuccess(false);
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.modalSecondaryButtonText}>Plus tard</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 8 },

  // Step sections
  stepSection: {
    marginBottom: 28,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepBadgeText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.accent,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryGhost,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarHint: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
    marginTop: 8,
  },

  // Labels & Inputs
  label: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },

  // City picker
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  cityCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 100,
    alignItems: 'center',
  },
  cityCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGhost,
  },
  cityName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  cityNameSelected: {
    color: colors.primary,
  },
  cityCountry: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  cityCountrySelected: {
    color: colors.primaryLight,
  },

  // Toggle
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGhost,
  },
  toggleThumb: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.n300,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleThumbActive: {
    backgroundColor: colors.primary,
  },
  toggleLabel: {
    marginLeft: 12,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  toggleLabelActive: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Radius
  radiusSection: {
    marginTop: 12,
  },
  radiusLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  radiusValue: {
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radiusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusChipText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
  },
  radiusChipTextActive: {
    color: colors.white,
  },

  // Instagram
  instagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  atPrefix: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRightWidth: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  atPrefixText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
  },
  instagramInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },

  // Bottom CTA
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.accent,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalPrimaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  modalSecondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
});
