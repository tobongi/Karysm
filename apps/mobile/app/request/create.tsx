import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Modal, Switch, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';
import { useAuth } from '../../src/lib/auth-context';
import { pickAndUploadImage } from '../../src/lib/upload';
import { IconX } from '@tabler/icons-react-native/dist/esm/icons/IconX.mjs';
import { IconPhoto } from '@tabler/icons-react-native/dist/esm/icons/IconPhoto.mjs';
import { IconCamera } from '@tabler/icons-react-native/dist/esm/icons/IconCamera.mjs';

const CITIES = ['Kinshasa', 'Douala', 'Libreville', 'Abidjan', 'Dakar'];

const LOCATION_TYPES = [
  { value: 'CLIENT', label: 'Chez moi' },
  { value: 'PROVIDER', label: 'Chez le pro' },
  { value: 'FLEXIBLE', label: 'Flexible' },
];

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Coiffure': '\uD83D\uDC87\u200D\u2640\uFE0F',
  'Ongles': '\uD83D\uDC85',
  'Maquillage': '\uD83D\uDC84',
  'Soins': '\uD83D\uDC86\u200D\u2640\uFE0F',
  'Barber': '\u2702\uFE0F',
  'Spa': '\uD83E\uDDD6\u200D\u2640\uFE0F',
};

export default function CreateRequestScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [city, setCity] = useState(CITIES[0]);
  const [locationType, setLocationType] = useState('CLIENT');
  const [flexibleDate, setFlexibleDate] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res: any = await api('/categories');
      setCategories(res.data || []);
    } catch (e) {
      // console.error('Failed to load categories', e);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function handleAddPhoto() {
    if (photos.length >= 5) {
      return showAlert('Limite atteinte', 'Vous pouvez ajouter 5 photos maximum');
    }
    if (uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      const url = await pickAndUploadImage('requests');
      if (url) setPhotos((prev) => [...prev, url]);
    } catch (err: any) {
      showAlert('Erreur', err.message || "Impossible d'envoyer la photo");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleRemovePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAddSelfie() {
    if (uploadingSelfie) return;
    setUploadingSelfie(true);
    try {
      const url = await pickAndUploadImage('requests');
      if (url) setSelfie(url);
    } catch (err: any) {
      showAlert('Erreur', err.message || "Impossible d'envoyer la photo");
    } finally {
      setUploadingSelfie(false);
    }
  }

  async function handleSubmit() {
    if (!title.trim()) return showAlert('Erreur', 'Ajoutez un titre');
    if (!description.trim()) return showAlert('Erreur', 'Décrivez votre demande');
    if (!categoryId) return showAlert('Erreur', 'Choisissez une catégorie');
    if (!budgetMin || !budgetMax) return showAlert('Erreur', 'Indiquez votre budget');

    const min = parseInt(budgetMin);
    const max = parseInt(budgetMax);
    if (isNaN(min) || isNaN(max) || max < min) {
      return showAlert('Erreur', 'Le budget max doit être supérieur au budget min');
    }

    setLoading(true);
    try {
      const body: any = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        budgetMin: min,
        budgetMax: max,
        city,
        locationType,
        flexibleDate,
      };
      if (preferredDate && !flexibleDate) {
        body.preferredDate = preferredDate;
      }
      if (photos.length > 0) body.photos = photos;
      if (selfie) body.selfieUrl = selfie;

      const res: any = await api('/requests', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setCreatedId(res.data?.id || '');
      setShowSuccess(true);
    } catch (e: any) {
      showAlert('Erreur', e.message || 'Impossible de créer la demande');
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(val: string | number | null | undefined): string {
    if (val == null || val === '') return '';
    const num = typeof val === 'string' ? parseInt(val) : val;
    if (isNaN(num)) return '';
    return num.toLocaleString('fr-FR');
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Que recherchez-vous ?</Text>

        {/* Title */}
        <Text style={styles.label}>Titre</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Tresses collées pour mariage"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />

        {/* Category */}
        <Text style={styles.label}>Catégorie</Text>
        {loadingCategories ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipActive]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat.name] || '\u2728'}</Text>
                <Text style={[styles.categoryText, categoryId === cat.id && styles.categoryTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Décrivez le résultat souhaité, votre type de cheveux, toute info utile..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={2000}
        />

        {/* Photos d'inspiration */}
        <Text style={styles.label}>Photos d'inspiration</Text>
        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoThumbImage} />
                <Pressable style={styles.photoRemove} onPress={() => handleRemovePhoto(i)}>
                  <IconX size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {photos.length < 5 && (
          <Pressable style={styles.photoButton} onPress={handleAddPhoto} disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <ActivityIndicator color={colors.primary} style={{ marginRight: 8 }} />
            ) : (
              <IconPhoto size={20} color={colors.primary} />
            )}
            <Text style={styles.photoButtonText}>
              {photos.length === 0 ? "Ajouter des photos d'inspiration" : `Ajouter une photo (${photos.length}/5)`}
            </Text>
          </Pressable>
        )}

        {/* Selfie */}
        <Text style={styles.label}>Selfie (optionnel)</Text>
        {selfie ? (
          <View style={styles.selfieContainer}>
            <Image source={{ uri: selfie }} style={styles.selfieImage} />
            <Pressable style={styles.selfieChange} onPress={handleAddSelfie}>
              <Text style={styles.selfieChangeText}>Changer</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.photoButton} onPress={handleAddSelfie} disabled={uploadingSelfie}>
            {uploadingSelfie ? (
              <ActivityIndicator color={colors.primary} style={{ marginRight: 8 }} />
            ) : (
              <IconCamera size={20} color={colors.primary} />
            )}
            <Text style={styles.photoButtonText}>Ajouter un selfie</Text>
          </Pressable>
        )}
        <Text style={styles.hint}>Aide les prestataires a mieux vous conseiller</Text>

        {/* Budget */}
        <Text style={styles.label}>Budget (FC)</Text>
        <View style={styles.budgetRow}>
          <View style={styles.budgetInputWrap}>
            <Text style={styles.budgetLabel}>Min</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="5 000"
              placeholderTextColor={colors.textMuted}
              value={budgetMin}
              onChangeText={setBudgetMin}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.budgetSep}>—</Text>
          <View style={styles.budgetInputWrap}>
            <Text style={styles.budgetLabel}>Max</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="20 000"
              placeholderTextColor={colors.textMuted}
              value={budgetMax}
              onChangeText={setBudgetMax}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Date */}
        <Text style={styles.label}>Date souhaitée</Text>
        <View style={styles.flexRow}>
          <Text style={styles.flexLabel}>Date flexible</Text>
          <Switch
            value={flexibleDate}
            onValueChange={setFlexibleDate}
            trackColor={{ true: colors.primary, false: colors.n300 }}
            thumbColor={colors.white}
          />
        </View>
        {!flexibleDate && (
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={colors.textMuted}
            value={preferredDate}
            onChangeText={setPreferredDate}
          />
        )}

        {/* City */}
        <Text style={styles.label}>Ville</Text>
        <View style={styles.cityRow}>
          {CITIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.cityChip, city === c && styles.cityChipActive]}
              onPress={() => setCity(c)}
            >
              <Text style={[styles.cityText, city === c && styles.cityTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        {/* Location type */}
        <Text style={styles.label}>Lieu de prestation</Text>
        <View style={styles.cityRow}>
          {LOCATION_TYPES.map((lt) => (
            <Pressable
              key={lt.value}
              style={[styles.cityChip, locationType === lt.value && styles.cityChipActive]}
              onPress={() => setLocationType(lt.value)}
            >
              <Text style={[styles.cityText, locationType === lt.value && styles.cityTextActive]}>
                {lt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Publier ma demande</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>{'\u2705'}</Text>
            <Text style={styles.modalTitle}>Demande publiée !</Text>
            <Text style={styles.modalText}>
              Les prestataires de votre ville vont pouvoir vous envoyer des propositions.
            </Text>
            <Pressable
              style={styles.modalBtn}
              onPress={() => {
                setShowSuccess(false);
                if (createdId) {
                  router.replace(`/request/${createdId}` as any);
                } else {
                  router.back();
                }
              }}
            >
              <Text style={styles.modalBtnText}>Voir ma demande</Text>
            </Pressable>
            <Pressable
              style={styles.modalBtnSecondary}
              onPress={() => { setShowSuccess(false); router.back(); }}
            >
              <Text style={styles.modalBtnSecondaryText}>Retour</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginBottom: 20 },
  label: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginTop: 16, marginBottom: 8 },
  hint: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 4 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryGhost,
    borderColor: colors.primary,
  },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text },
  categoryTextActive: { color: colors.primary, fontFamily: 'Poppins_700Bold' },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 20,
    borderStyle: 'dashed',
  },
  photoButtonText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selfieImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  selfieChange: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.primaryGhost,
  },
  selfieChangeText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInputWrap: { flex: 1 },
  budgetLabel: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginBottom: 4 },
  budgetInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
  },
  budgetSep: { fontSize: 18, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginHorizontal: 12 },
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flexLabel: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  cityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityChipActive: {
    backgroundColor: colors.primaryGhost,
    borderColor: colors.primary,
  },
  cityText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text },
  cityTextActive: { color: colors.primary, fontFamily: 'Poppins_700Bold' },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.white },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalEmoji: { fontSize: 48, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent, marginBottom: 8 },
  modalText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalBtn: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.white },
  modalBtnSecondary: {
    paddingVertical: 10,
  },
  modalBtnSecondaryText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
});
