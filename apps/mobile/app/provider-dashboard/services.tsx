import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, TextInput,
  ActivityIndicator, RefreshControl, Switch, ScrollView, Modal,
} from 'react-native';
import { Image } from 'react-native';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { showAlert, showConfirm } from '../../src/lib/alert';
import { pickAndUploadMedia, type MediaResult } from '../../src/lib/upload';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceMin: number;
  priceMax: number | null;
  isActive: boolean;
  description: string | null;
  categoryId: string;
  category?: Category;
}

interface ServiceForm {
  name: string;
  categoryId: string;
  durationMin: string;
  priceMin: string;
  priceMax: string;
  description: string;
  socialLink1: string;
  socialLink2: string;
}

const EMPTY_FORM: ServiceForm = {
  name: '',
  categoryId: '',
  durationMin: '',
  priceMin: '',
  priceMax: '',
  description: '',
  socialLink1: '',
  socialLink2: '',
};

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchServices = useCallback(async () => {
    try {
      const res = await api<{ success: boolean; data: Service[] }>('/provider/services');
      setServices(res.data);
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de charger les services');
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api<{ success: boolean; data: Category[] }>('/categories');
      setCategories(res.data);
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de charger les catégories');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchServices(), fetchCategories()]);
      setLoading(false);
    })();
  }, [fetchServices, fetchCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }, [fetchServices]);

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotoUrls([]);
    setShowForm(true);
  }

  function openEditForm(service: any) {
    setEditingId(service.id);
    const links = (service.socialLinks || []) as string[];
    // Separate photo URLs from social links
    const photos = links.filter((l: string) => l.startsWith('http') && !l.includes('instagram') && !l.includes('tiktok'));
    const socials = links.filter((l: string) => l.includes('instagram') || l.includes('tiktok'));
    setPhotoUrls(photos);
    setForm({
      name: service.name,
      categoryId: service.categoryId,
      durationMin: String(service.durationMin),
      priceMin: String(service.priceMin),
      priceMax: service.priceMax ? String(service.priceMax) : '',
      description: service.description || '',
      socialLink1: socials[0] || '',
      socialLink2: socials[1] || '',
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotoUrls([]);
  }

  async function handleAddMedia() {
    if (photoUrls.length >= 5) {
      showAlert('Limite atteinte', 'Maximum 5 photos/vidéos par service');
      return;
    }
    setUploadingPhoto(true);
    try {
      const result = await pickAndUploadMedia('portfolios');
      if (result) {
        setPhotoUrls(prev => [...prev, result.url]);
      }
    } catch (e: any) {
      showAlert('Erreur', e.message || "Impossible d'uploader le média");
    }
    setUploadingPhoto(false);
  }

  function removePhoto(index: number) {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  }

  async function saveService() {
    if (!form.name.trim()) {
      showAlert('Champ requis', 'Le nom du service est obligatoire');
      return;
    }
    if (!form.categoryId) {
      showAlert('Champ requis', 'Veuillez choisir une catégorie');
      return;
    }
    if (!form.durationMin || isNaN(Number(form.durationMin)) || Number(form.durationMin) <= 0) {
      showAlert('Champ requis', 'La durée doit être un nombre positif');
      return;
    }
    if (!form.priceMin || isNaN(Number(form.priceMin)) || Number(form.priceMin) <= 0) {
      showAlert('Champ requis', 'Le prix minimum doit être un nombre positif');
      return;
    }

    const body: any = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      durationMin: Number(form.durationMin),
      priceMin: Number(form.priceMin),
    };
    if (form.priceMax && !isNaN(Number(form.priceMax))) {
      body.priceMax = Number(form.priceMax);
    }
    if (form.description.trim()) {
      body.description = form.description.trim();
    }
    // Social links + uploaded photos combined
    const socialLinks = [form.socialLink1, form.socialLink2].filter(l => l.trim());
    const allLinks = [...photoUrls, ...socialLinks];
    if (allLinks.length > 0) {
      body.socialLinks = allLinks;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api(`/provider/services/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        setSuccessMessage('Service mis à jour ✅');
      } else {
        await api('/provider/services', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setSuccessMessage('Service créé avec succès 🎉');
      }
      cancelForm();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      await fetchServices();
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  }

  function deleteService(service: Service) {
    showConfirm(
      'Supprimer le service',
      `Voulez-vous vraiment supprimer "${service.name}" ?`,
      async () => {
        try {
          await api(`/provider/services/${service.id}`, { method: 'DELETE' });
          await fetchServices();
        } catch (err: any) {
          showAlert('Erreur', err.message || 'Impossible de supprimer');
        }
      },
    );
  }

  async function toggleActive(service: Service) {
    try {
      await api(`/provider/services/${service.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: service.name,
          categoryId: service.categoryId,
          durationMin: service.durationMin,
          priceMin: service.priceMin,
          priceMax: service.priceMax,
          isActive: !service.isActive,
        }),
      });
      await fetchServices();
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de modifier');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
    {/* ── Success Toast ── */}
    {showSuccess && (
      <View style={styles.successToast}>
        <Text style={styles.successToastText}>{successMessage}</Text>
      </View>
    )}

    {/* ── Service Form Modal ── */}
    <Modal visible={showForm} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.formTitle}>
              {editingId ? '✏️ Modifier le service' : '✨ Nouveau service'}
            </Text>
            <Pressable onPress={cancelForm} hitSlop={12}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nom du service</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Tresses collées"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />

            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.categoryPicker}>
              {categories.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    form.categoryId === cat.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setForm(f => ({ ...f, categoryId: cat.id }))}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      form.categoryId === cat.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Durée (min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="90"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={form.durationMin}
                  onChangeText={v => setForm(f => ({ ...f, durationMin: v }))}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Prix min</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={form.priceMin}
                  onChangeText={v => setForm(f => ({ ...f, priceMin: v }))}
                />
              </View>
            </View>

            <Text style={styles.label}>Prix maximum (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 8000"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={form.priceMax}
              onChangeText={v => setForm(f => ({ ...f, priceMax: v }))}
            />

            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Décrivez votre service..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={form.description}
              onChangeText={v => setForm(f => ({ ...f, description: v }))}
            />

            {/* Portfolio photos + social links */}
            <View style={styles.socialSection}>
              <Text style={styles.socialTitle}>📸 Portfolio — Montrez vos réalisations</Text>
              <Text style={styles.socialHint}>Ajoutez des photos ou des liens de vos prestations</Text>

              {/* Uploaded photos grid */}
              <View style={styles.photoGrid}>
                {photoUrls.map((url, i) => {
                  const isVideo = url.includes('/video/') || url.endsWith('.mp4') || url.endsWith('.mov');
                  return (
                    <View key={i} style={styles.photoItem}>
                      <Image source={{ uri: url }} style={styles.photoImage} />
                      {isVideo && (
                        <View style={styles.videoOverlay}>
                          <Text style={styles.videoPlayIcon}>▶</Text>
                        </View>
                      )}
                      <Pressable style={styles.photoRemove} onPress={() => removePhoto(i)}>
                        <Text style={styles.photoRemoveText}>✕</Text>
                      </Pressable>
                    </View>
                  );
                })}
                {photoUrls.length < 5 && (
                  <Pressable
                    style={styles.photoAddButton}
                    onPress={handleAddMedia}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Text style={styles.photoAddIcon}>📱</Text>
                        <Text style={styles.photoAddText}>Photo / Vidéo</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>

              <Text style={[styles.socialHint, { marginTop: 16 }]}>Ou collez un lien Instagram / TikTok</Text>

              <View style={styles.socialInputRow}>
                <Text style={styles.socialIcon}>📷</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="https://instagram.com/p/..."
                  placeholderTextColor={colors.textMuted}
                  value={form.socialLink1}
                  onChangeText={v => setForm(f => ({ ...f, socialLink1: v }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.socialInputRow}>
                <Text style={styles.socialIcon}>🎵</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="https://tiktok.com/@.../video/..."
                  placeholderTextColor={colors.textMuted}
                  value={form.socialLink2}
                  onChangeText={v => setForm(f => ({ ...f, socialLink2: v }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.formButtons}>
            <Pressable style={styles.cancelButton} onPress={cancelForm}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={saveService}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingId ? 'Mettre à jour' : 'Créer le service'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>

    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={item => item.id}
        contentContainerStyle={services.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Aucun service</Text>
            <Text style={styles.emptyText}>
              Ajoutez vos services pour que les clients puissent vous réserver.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.isActive && styles.cardInactive]}
            onPress={() => openEditForm(item)}
          >
            <View style={styles.cardLeft}>
              <View style={styles.cardHeader}>
                {item.category && (
                  <Text style={styles.categoryIcon}>{item.category.icon}</Text>
                )}
                <Text style={styles.serviceName}>{item.name}</Text>
              </View>
              <Text style={styles.serviceMeta}>
                {item.category?.name} · {item.durationMin} min
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.servicePrice}>
                {item.priceMin.toLocaleString('fr-FR')}
                {item.priceMax ? ` - ${item.priceMax.toLocaleString('fr-FR')}` : ''}
              </Text>
              <View style={styles.cardActions}>
                <Switch
                  value={item.isActive}
                  onValueChange={() => toggleActive(item)}
                  trackColor={{ false: colors.n300, true: colors.primaryLight }}
                  thumbColor={item.isActive ? colors.primary : colors.textMuted}
                />
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => deleteService(item)}
                  hitSlop={8}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      />
      <Pressable style={styles.addButton} onPress={openCreateForm}>
        <Text style={styles.addText}>+ Ajouter un service</Text>
      </Pressable>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  list: { padding: 20, gap: 10, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyState: { alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInactive: { opacity: 0.5 },
  cardLeft: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  categoryIcon: { fontSize: 18 },
  serviceName: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  serviceMeta: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  servicePrice: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.terracotta },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(222,53,11,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 12, color: colors.error, fontFamily: 'Poppins_700Bold' },

  addButton: {
    margin: 20,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
  },
  addText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },

  // Success toast
  successToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: colors.success,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    zIndex: 100,
    alignItems: 'center',
  },
  successToastText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

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
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalClose: { fontSize: 20, color: colors.textMuted, padding: 4 },
  modalScroll: { paddingHorizontal: 20, maxHeight: 500 },

  // Form styles
  formTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.accent },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  label: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.primaryGhost,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.primary },
  categoryChipTextActive: { color: colors.white },
  // Social links
  socialSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  socialTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 4 },
  socialHint: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginBottom: 12 },
  socialInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  socialIcon: { fontSize: 20 },

  // Photo upload grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
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
  photoRemoveText: { color: colors.white, fontSize: 11, fontFamily: 'Poppins_700Bold' },
  photoAddButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryGhost,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  videoPlayIcon: { color: colors.white, fontSize: 24 },
  photoAddIcon: { fontSize: 24, marginBottom: 2 },
  photoAddText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.primary, textAlign: 'center' },

  formButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
    backgroundColor: colors.primaryGhost,
  },
  cancelButtonText: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  saveButtonText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  buttonDisabled: { opacity: 0.6 },
});
