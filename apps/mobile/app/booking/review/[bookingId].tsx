import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX.mjs';
import { colors } from '../../../src/theme/colors';
import { api } from '../../../src/lib/api';
import { showAlert } from '../../../src/lib/alert';
import { pickAndUploadImage } from '../../../src/lib/upload';
import { REVIEW_TAGS } from '@karysm/shared';
import { PressableScale, FadeInStagger } from '../../../src/components/animations';

const TAG_LABELS: Record<string, string> = {
  ponctuel: 'Ponctuel',
  professionnel: 'Professionnel',
  propre: 'Propre',
  bon_prix: 'Bon prix',
  creatif: 'Créatif',
  rapide: 'Rapide',
  accueillant: 'Accueillant',
};

export default function ReviewScreen() {
  const { bookingId, providerName } = useLocalSearchParams<{
    bookingId: string;
    providerName?: string;
  }>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev,
    );
  }

  async function handleAddPhoto() {
    if (photos.length >= 5 || uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      const url = await pickAndUploadImage('reviews');
      if (url) setPhotos((prev) => [...prev, url]);
    } catch (err: any) {
      showAlert('Erreur', err.message || "Impossible d'ajouter la photo");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (rating === 0) {
      showAlert('Note requise', 'Veuillez donner une note de 1 à 5 étoiles.');
      return;
    }
    setSubmitting(true);
    try {
      await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim() || undefined,
          photos: photos.length > 0 ? photos : undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        }),
      });
      showAlert('Merci !', 'Votre avis a été publié avec succès.');
      router.back();
    } catch (err: any) {
      showAlert('Erreur', err.message || "Impossible d'envoyer l'avis");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Laisser un avis</Text>
        {providerName && (
          <Text style={styles.subtitle}>Comment s'est passée votre expérience avec {providerName} ?</Text>
        )}

        {/* Rating stars */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTE</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <PressableScale key={star} onPress={() => setRating(star)} scale={0.90}>
                <IconStar size={36} color={star <= rating ? colors.star : colors.textMuted} fill={star <= rating ? colors.star : 'none'} strokeWidth={1.5} />
              </PressableScale>
            ))}
          </View>
          {rating > 0 && (
            <FadeInStagger index={0} duration={300}>
              <Text style={styles.ratingLabel}>
                {rating === 1 ? 'Décevant' : rating === 2 ? 'Moyen' : rating === 3 ? 'Bien' : rating === 4 ? 'Très bien' : 'Excellent !'}
              </Text>
            </FadeInStagger>
          )}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CE QUI VOUS A PLU (optionnel)</Text>
          <View style={styles.tagsWrap}>
            {REVIEW_TAGS.map((tag, idx) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <FadeInStagger key={tag} index={idx} delay={30}>
                  <PressableScale onPress={() => toggleTag(tag)} scale={0.95}>
                    <View style={[styles.tag, isSelected && styles.tagSelected]}>
                      <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                        {TAG_LABELS[tag] || tag}
                      </Text>
                    </View>
                  </PressableScale>
                </FadeInStagger>
              );
            })}
          </View>
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COMMENTAIRE (optionnel)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Décrivez votre expérience..."
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/1000</Text>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHOTOS (optionnel, max 5)</Text>
          <View style={styles.photosRow}>
            {photos.map((url, i) => (
              <View key={i} style={styles.photoWrapper}>
                <Image source={{ uri: url }} style={styles.photo} />
                <Pressable style={styles.photoRemove} onPress={() => removePhoto(i)}>
                  <IconX size={12} color={colors.white} strokeWidth={3} />
                </Pressable>
              </View>
            ))}
            {photos.length < 5 && (
              <Pressable style={styles.addPhotoButton} onPress={handleAddPhoto} disabled={uploadingPhoto}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.addPhotoText}>+</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* Submit */}
        <PressableScale onPress={handleSubmit} disabled={submitting || rating === 0}>
          <View
            style={[styles.submitButton, (submitting || rating === 0) && styles.submitDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>Publier l'avis</Text>
            )}
          </View>
        </PressableScale>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20 },

  title: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', color: colors.accent, marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginBottom: 28, lineHeight: 23 },

  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Poppins_700Bold', fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.2, marginBottom: 12, textTransform: 'uppercase',
  },

  // Stars
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: 12, justifyContent: 'center' },
  starButton: { padding: 6 },
  ratingLabel: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.star, fontWeight: '600', textAlign: 'center', marginTop: 2 },

  // Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  tagSelected: {
    backgroundColor: colors.primaryGhost, borderColor: colors.primary, borderWidth: 1.5,
  },
  tagText: { fontSize: 13, fontFamily: 'Poppins_500Medium', fontWeight: '500', color: colors.textSecondary },
  tagTextSelected: { color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' },

  // Comment
  textInput: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.text, borderWidth: 1.5, borderColor: colors.border,
    minHeight: 130,
  },
  charCount: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'right', marginTop: 6 },

  // Photos
  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoWrapper: { position: 'relative' },
  photo: { width: 76, height: 76, borderRadius: 14 },
  photoRemove: {
    position: 'absolute', top: -8, right: -8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center',
  },
  addPhotoButton: {
    width: 76, height: 76, borderRadius: 14,
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
    borderStyle: 'dashed',
  },
  addPhotoText: { fontSize: 32, color: colors.textMuted, fontWeight: '300' },

  // Submit
  submitButton: {
    backgroundColor: colors.primary, paddingVertical: 17, borderRadius: 26,
    alignItems: 'center', marginTop: 12,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_700Bold', fontWeight: '700', letterSpacing: 0.2 },
});
