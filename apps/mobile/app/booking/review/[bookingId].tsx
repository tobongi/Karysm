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
import { colors } from '../../../src/theme/colors';
import { api } from '../../../src/lib/api';
import { showAlert } from '../../../src/lib/alert';
import { pickAndUploadImage } from '../../../src/lib/upload';
import { REVIEW_TAGS } from '@karysm/shared';

const TAG_LABELS: Record<string, string> = {
  ponctuel: '⏰ Ponctuel',
  professionnel: '👔 Professionnel',
  propre: '✨ Propre',
  bon_prix: '💰 Bon prix',
  creatif: '🎨 Créatif',
  rapide: '⚡ Rapide',
  accueillant: '🤗 Accueillant',
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
      showAlert('Merci ! 🎉', 'Votre avis a été publié avec succès.');
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
              <Pressable key={star} onPress={() => setRating(star)} style={styles.starButton}>
                <Text style={[styles.starText, star <= rating && styles.starActive]}>
                  ★
                </Text>
              </Pressable>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 1 ? 'Décevant' : rating === 2 ? 'Moyen' : rating === 3 ? 'Bien' : rating === 4 ? 'Très bien' : 'Excellent !'}
            </Text>
          )}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CE QUI VOUS A PLU (optionnel)</Text>
          <View style={styles.tagsWrap}>
            {REVIEW_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[styles.tag, isSelected && styles.tagSelected]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                    {TAG_LABELS[tag] || tag}
                  </Text>
                </Pressable>
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
                  <Text style={styles.photoRemoveText}>✕</Text>
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
        <Pressable
          style={[styles.submitButton, (submitting || rating === 0) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting || rating === 0}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>Publier l'avis</Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 20 },

  title: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', color: colors.accent, marginBottom: 4 },
  subtitle: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginBottom: 24, lineHeight: 22 },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Poppins_700Bold', fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, marginBottom: 10,
  },

  // Stars
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  starButton: { padding: 4 },
  starText: { fontSize: 36, color: colors.n300 },
  starActive: { color: colors.star },
  ratingLabel: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.star, fontWeight: '600' },

  // Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  tagSelected: {
    backgroundColor: colors.primaryGhost, borderColor: colors.primaryBorder,
  },
  tagText: { fontSize: 13, fontFamily: 'Poppins_500Medium', fontWeight: '500', color: colors.textSecondary },
  tagTextSelected: { color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontWeight: '600' },

  // Comment
  textInput: {
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.text, borderWidth: 1, borderColor: colors.border,
    minHeight: 120,
  },
  charCount: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, textAlign: 'right', marginTop: 4 },

  // Photos
  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoWrapper: { position: 'relative' },
  photo: { width: 72, height: 72, borderRadius: 12 },
  photoRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center',
  },
  photoRemoveText: { color: colors.white, fontSize: 12, fontFamily: 'Poppins_700Bold', fontWeight: '700' },
  addPhotoButton: {
    width: 72, height: 72, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
    borderStyle: 'dashed',
  },
  addPhotoText: { fontSize: 28, color: colors.textMuted },

  // Submit
  submitButton: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 25,
    alignItems: 'center', marginTop: 8,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.white, fontSize: 17, fontFamily: 'Poppins_700Bold', fontWeight: '700' },
});
