import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, Platform,
  RefreshControl, Switch, ScrollView, Modal, ActivityIndicator,
  Image, KeyboardAvoidingView, LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { showAlert, showConfirm } from '../../src/lib/alert';
import { pickAndUploadMedia } from '../../src/lib/upload';
import { PressableScale, FadeInStagger } from '../../src/components/animations';
import Skeleton from '../../src/components/Skeleton';
import { CategoryIcon } from '../../src/lib/category-icons';
import IconX from '@tabler/icons-react-native/dist/esm/icons/IconX.mjs';
import IconPlus from '@tabler/icons-react-native/dist/esm/icons/IconPlus.mjs';
import IconPencil from '@tabler/icons-react-native/dist/esm/icons/IconPencil.mjs';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck.mjs';
import IconCamera from '@tabler/icons-react-native/dist/esm/icons/IconCamera.mjs';
import IconPlayerPlay from '@tabler/icons-react-native/dist/esm/icons/IconPlayerPlay.mjs';
import IconScissors from '@tabler/icons-react-native/dist/esm/icons/IconScissors.mjs';
import IconClock from '@tabler/icons-react-native/dist/esm/icons/IconClock.mjs';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import IconBrandInstagram from '@tabler/icons-react-native/dist/esm/icons/IconBrandInstagram.mjs';
import IconBrandTiktok from '@tabler/icons-react-native/dist/esm/icons/IconBrandTiktok.mjs';
import IconBrandFacebook from '@tabler/icons-react-native/dist/esm/icons/IconBrandFacebook.mjs';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function formatPrice(priceMin: number, priceMax: number | null): string {
  const fmtMin = priceMin.toLocaleString('fr-FR');
  if (!priceMax) return `${fmtMin} FC`;
  return `${fmtMin} – ${priceMax.toLocaleString('fr-FR')} FC`;
}

function getPhotoUrls(socialLinks?: string[]): string[] {
  if (!socialLinks) return [];
  return socialLinks.filter(
    l => l.startsWith('http') && !l.includes('instagram') && !l.includes('tiktok'),
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  icon: string;
  parentId?: string | null;
  children?: Category[];
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
  socialLinks?: string[];
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function ServiceSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardIconCircle}>
        <Skeleton width={22} height={22} borderRadius={6} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width={130} height={16} borderRadius={6} />
        <Skeleton width={100} height={13} borderRadius={6} />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Skeleton width={80} height={16} borderRadius={6} />
        <Skeleton width={64} height={28} borderRadius={14} />
      </View>
    </View>
  );
}

function SubcategoryPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const parentCat = categories.find(
    c => c.id === selectedId || (c.children || []).some(ch => ch.id === selectedId),
  );
  const subs = parentCat?.children ?? [];
  if (subs.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 8, marginBottom: 4 }}
      contentContainerStyle={{ gap: 8 }}
    >
      {subs.map(sub => (
        <PressableScale
          key={sub.id}
          style={[
            styles.categoryChip,
            styles.categoryChipSub,
            selectedId === sub.id && styles.categoryChipActive,
          ]}
          onPress={() => onSelect(sub.id)}
        >
          <Text
            style={[
              styles.categoryChipText,
              styles.categoryChipTextSub,
              selectedId === sub.id && styles.categoryChipTextActive,
            ]}
          >
            {sub.name}
          </Text>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [headerW, setHeaderW] = useState(480);
  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setHeaderW(w);
  }, []);
  const svgPath = useMemo(
    () => `M0,0 L0,130 C${headerW * 0.3},175 ${headerW * 0.7},103 ${headerW},115 L${headerW},0 Z`,
    [headerW],
  );

  const activeCount = services.filter(s => s.isActive).length;

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

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }, [fetchServices]);

  function showToast(message: string) {
    setSuccessMessage(message);
    setShowSuccess(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowSuccess(false), 3000);
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotoUrls([]);
    setShowForm(true);
  }

  function openEditForm(service: Service) {
    setEditingId(service.id);
    const links = service.socialLinks ?? [];
    const photos = links.filter(l => l.startsWith('http') && !l.includes('instagram') && !l.includes('tiktok'));
    const socials = links.filter(l => l.includes('instagram') || l.includes('tiktok'));
    setPhotoUrls(photos);
    setForm({
      name: service.name,
      categoryId: service.categoryId,
      durationMin: String(service.durationMin),
      priceMin: String(service.priceMin),
      priceMax: service.priceMax ? String(service.priceMax) : '',
      description: service.description ?? '',
      socialLink1: socials[0] ?? '',
      socialLink2: socials[1] ?? '',
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
      if (result) setPhotoUrls(prev => [...prev, result.url]);
    } catch (e: any) {
      showAlert('Erreur', e.message || "Impossible d'uploader le média");
    } finally {
      setUploadingPhoto(false);
    }
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
    if (form.priceMax && !isNaN(Number(form.priceMax))) body.priceMax = Number(form.priceMax);
    if (form.description.trim()) body.description = form.description.trim();
    const socialLinks = [form.socialLink1, form.socialLink2].filter(l => l.trim());
    const allLinks = [...photoUrls, ...socialLinks];
    if (allLinks.length > 0) body.socialLinks = allLinks;

    setSaving(true);
    try {
      if (editingId) {
        await api(`/provider/services/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast('Service mis à jour');
      } else {
        await api('/provider/services', { method: 'POST', body: JSON.stringify(body) });
        showToast('Service créé avec succès');
      }
      cancelForm();
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

  // ── Loading state ──
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}>
          <View style={styles.skeletonHeader} />
          <View style={{ padding: 20, gap: 10 }}>
            {[0, 1, 2, 3].map(i => <ServiceSkeleton key={i} />)}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const ListFooter = (
    <>
      {/* Add button */}
      <PressableScale style={styles.addButton} onPress={openCreateForm}>
        <IconPlus size={18} color={colors.white} />
        <Text style={styles.addText}>Ajouter un service</Text>
      </PressableScale>

      {/* Import Social — Coming Soon */}
      <View style={styles.comingSoonSection}>
        <View style={styles.comingSoonHeader}>
          <Text style={styles.comingSoonTitle}>Importer depuis les réseaux</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>Prochainement</Text>
          </View>
        </View>
        <Text style={styles.comingSoonDesc}>
          Importez vos meilleures réalisations depuis Instagram, TikTok et Facebook en un clic.
        </Text>
        <View style={styles.socialPills}>
          <View style={styles.socialPill}>
            <IconBrandInstagram size={16} color="#E1306C" />
            <Text style={styles.socialPillText}>Instagram</Text>
          </View>
          <View style={styles.socialPill}>
            <IconBrandTiktok size={16} color={colors.text} />
            <Text style={styles.socialPillText}>TikTok</Text>
          </View>
          <View style={styles.socialPill}>
            <IconBrandFacebook size={16} color="#1877F2" />
            <Text style={styles.socialPillText}>Facebook</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        {/* ── Success Toast ── */}
        {showSuccess && (
          <View style={styles.successToast}>
            <IconCheck size={16} color={colors.white} />
            <Text style={styles.successToastText}>{successMessage}</Text>
          </View>
        )}

        {/* ── Service Form Modal ── */}
        <Modal visible={showForm} transparent animationType="slide" onRequestClose={cancelForm}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                {/* Sheet handle */}
                <View style={styles.sheetHandle} />

                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <View style={styles.modalIconCircle}>
                      {editingId
                        ? <IconPencil size={18} color={colors.white} />
                        : <IconPlus size={18} color={colors.white} />}
                    </View>
                    <Text style={styles.formTitle}>
                      {editingId ? 'Modifier le service' : 'Nouveau service'}
                    </Text>
                  </View>
                  <PressableScale onPress={cancelForm} hitSlop={16} style={styles.modalCloseBtn}>
                    <IconX size={16} color={colors.textMuted} />
                  </PressableScale>
                </View>

                <ScrollView
                  style={styles.modalScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Service name */}
                  <Text style={styles.label}>
                    Nom du service <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Tresses collées"
                    placeholderTextColor={colors.textMuted}
                    value={form.name}
                    onChangeText={v => setForm(f => ({ ...f, name: v }))}
                  />

                  {/* Category */}
                  <Text style={styles.label}>
                    Catégorie <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.categoryPicker}>
                    {categories.map(cat => {
                      const isParentSelected =
                        form.categoryId === cat.id ||
                        (cat.children || []).some(c => c.id === form.categoryId);
                      return (
                        <PressableScale
                          key={cat.id}
                          style={[styles.categoryChip, isParentSelected && styles.categoryChipActive]}
                          onPress={() => setForm(f => ({ ...f, categoryId: cat.id }))}
                        >
                          <CategoryIcon
                            icon={cat.icon}
                            name={cat.name}
                            size={13}
                            color={isParentSelected ? colors.white : colors.primary}
                          />
                          <Text style={[styles.categoryChipText, isParentSelected && styles.categoryChipTextActive]}>
                            {cat.name}
                          </Text>
                        </PressableScale>
                      );
                    })}
                  </View>

                  <SubcategoryPicker
                    categories={categories}
                    selectedId={form.categoryId}
                    onSelect={id => setForm(f => ({ ...f, categoryId: id }))}
                  />

                  {/* Duration + price min */}
                  <View style={styles.rowInputs}>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>
                        Durée <Text style={styles.required}>*</Text>
                      </Text>
                      <View style={styles.inputSuffixRow}>
                        <TextInput
                          style={[styles.input, styles.inputFlex]}
                          placeholder="90"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="numeric"
                          value={form.durationMin}
                          onChangeText={v => setForm(f => ({ ...f, durationMin: v }))}
                        />
                        <View style={styles.inputSuffix}>
                          <Text style={styles.inputSuffixText}>min</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>
                        Prix min <Text style={styles.required}>*</Text>
                      </Text>
                      <View style={styles.inputSuffixRow}>
                        <TextInput
                          style={[styles.input, styles.inputFlex]}
                          placeholder="5000"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="numeric"
                          value={form.priceMin}
                          onChangeText={v => setForm(f => ({ ...f, priceMin: v }))}
                        />
                        <View style={styles.inputSuffix}>
                          <Text style={styles.inputSuffixText}>FC</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Price max */}
                  <Text style={styles.label}>
                    Prix max <Text style={styles.optional}>(optionnel)</Text>
                  </Text>
                  <View style={styles.inputSuffixRow}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      placeholder="8000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={form.priceMax}
                      onChangeText={v => setForm(f => ({ ...f, priceMax: v }))}
                    />
                    <View style={styles.inputSuffix}>
                      <Text style={styles.inputSuffixText}>FC</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.label}>
                    Description <Text style={styles.optional}>(optionnel)</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    placeholder="Décrivez votre service..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    value={form.description}
                    onChangeText={v => setForm(f => ({ ...f, description: v }))}
                  />

                  {/* Portfolio section */}
                  <Text style={styles.sectionLabel}>PORTFOLIO</Text>
                  <View style={styles.socialSection}>
                    <Text style={styles.socialTitle}>Montrez vos réalisations</Text>
                    <Text style={styles.socialHint}>Photos ou vidéos de vos prestations</Text>

                    <View style={styles.photoGrid}>
                      {photoUrls.map((url, i) => {
                        const isVideo = url.includes('/video/') || url.endsWith('.mp4') || url.endsWith('.mov');
                        return (
                          <View key={i} style={styles.photoItem}>
                            <Image source={{ uri: url }} style={styles.photoImage} />
                            {isVideo && (
                              <View style={styles.videoOverlay}>
                                <IconPlayerPlay size={20} color={colors.white} />
                              </View>
                            )}
                            <PressableScale style={styles.photoRemove} onPress={() => removePhoto(i)}>
                              <IconX size={10} color={colors.white} />
                            </PressableScale>
                          </View>
                        );
                      })}
                      {photoUrls.length < 5 && (
                        <PressableScale
                          style={styles.photoAddButton}
                          onPress={handleAddMedia}
                          disabled={uploadingPhoto}
                        >
                          {uploadingPhoto ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <>
                              <IconCamera size={22} color={colors.primary} />
                              <Text style={styles.photoAddText}>Photo / Vidéo</Text>
                            </>
                          )}
                        </PressableScale>
                      )}
                    </View>

                    <Text style={[styles.socialHint, { marginTop: 16 }]}>Ou collez un lien Instagram / TikTok</Text>

                    <View style={styles.socialInputRow}>
                      <IconBrandInstagram size={22} color="#E1306C" />
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
                      <IconBrandTiktok size={22} color={colors.text} />
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
                  <PressableScale style={styles.cancelButton} onPress={cancelForm}>
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </PressableScale>
                  <PressableScale
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
                  </PressableScale>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── Curved header ── */}
        <View style={styles.header} onLayout={onHeaderLayout}>
          <View style={styles.headerBg} />
          <Svg
            width="100%"
            height={155}
            viewBox={`0 0 ${headerW} 155`}
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFill}
          >
            <Path d={svgPath} fill={colors.headerDark} />
          </Svg>
          <View style={styles.headerContent}>
            <PressableScale onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <IconArrowLeft size={20} color={colors.white} />
            </PressableScale>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Mes services</Text>
              {services.length > 0 && (
                <Text style={styles.headerSubtitle}>
                  {services.length} service{services.length > 1 ? 's' : ''} · {activeCount} actif{activeCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <PressableScale style={styles.headerAddBtn} onPress={openCreateForm} hitSlop={8}>
              <IconPlus size={20} color={colors.white} />
            </PressableScale>
          </View>
        </View>

        {/* ── List ── */}
        <FlatList
          data={services}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={services.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <IconScissors size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Aucun service</Text>
              <Text style={styles.emptyText}>
                Ajoutez vos services pour que les clientes puissent vous réserver.
              </Text>
              <PressableScale style={styles.emptyBtn} onPress={openCreateForm}>
                <IconPlus size={16} color={colors.white} />
                <Text style={styles.emptyBtnText}>Ajouter un service</Text>
              </PressableScale>
            </View>
          }
          ListFooterComponent={services.length > 0 ? ListFooter : null}
          renderItem={({ item, index }) => {
            const thumbs = getPhotoUrls(item.socialLinks).slice(0, 3);
            const extraCount = (getPhotoUrls(item.socialLinks).length) - 3;
            return (
              <FadeInStagger index={index}>
                <PressableScale
                  style={[styles.card, !item.isActive && styles.cardInactive]}
                  onPress={() => openEditForm(item)}
                >
                  {/* Category icon circle */}
                  <View style={styles.cardIconCircle}>
                    {item.category ? (
                      <CategoryIcon icon={item.category.icon} name={item.category.name} size={20} color={colors.primary} />
                    ) : (
                      <IconScissors size={20} color={colors.primary} />
                    )}
                  </View>

                  {/* Main content */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardNameRow}>
                      <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
                      {!item.isActive && (
                        <View style={styles.pauseBadge}>
                          <Text style={styles.pauseBadgeText}>Pause</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardMetaRow}>
                      <IconClock size={12} color={colors.textMuted} />
                      <Text style={styles.serviceMeta}>
                        {formatDuration(item.durationMin)}
                        {item.category ? `  ·  ${item.category.name}` : ''}
                      </Text>
                    </View>
                    {thumbs.length > 0 && (
                      <View style={styles.cardThumbs}>
                        {thumbs.map((url, i) => (
                          <Image key={i} source={{ uri: url }} style={styles.cardThumb} />
                        ))}
                        {extraCount > 0 && (
                          <View style={styles.cardThumbMore}>
                            <Text style={styles.cardThumbMoreText}>+{extraCount}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Right: price + actions */}
                  <View style={styles.cardRight}>
                    <Text style={styles.servicePrice}>{formatPrice(item.priceMin, item.priceMax)}</Text>
                    <View style={styles.cardActions}>
                      <Switch
                        value={item.isActive}
                        onValueChange={() => toggleActive(item)}
                        trackColor={{ false: colors.n300, true: colors.primaryLight }}
                        thumbColor={item.isActive ? colors.primary : colors.textMuted}
                      />
                      <PressableScale style={styles.deleteBtn} onPress={() => deleteService(item)} hitSlop={8}>
                        <IconX size={14} color={colors.error} />
                      </PressableScale>
                    </View>
                  </View>
                </PressableScale>
              </FadeInStagger>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  webWrap: {
    flex: 1,
    ...(Platform.OS === 'web' ? { maxWidth: 430, width: '100%', alignSelf: 'center' as any } : {}),
  },

  // Curved header
  header: {
    height: 155,
    overflow: 'hidden',
    position: 'relative',
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.headerDark,
  },
  headerContent: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.70)',
    marginTop: 1,
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Skeleton placeholder
  skeletonHeader: {
    height: 155,
    backgroundColor: colors.headerDark,
  },

  // List
  list: { padding: 16, gap: 10, paddingBottom: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

  // Empty state
  emptyState: { alignItems: 'center' },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 8 },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyBtnText: { color: colors.white, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  // Service card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardInactive: { opacity: 0.55 },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serviceName: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text, flex: 1 },
  pauseBadge: {
    backgroundColor: 'rgba(139,105,82,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  pauseBadgeText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceMeta: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  cardThumbs: { flexDirection: 'row', gap: 4, marginTop: 4 },
  cardThumb: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.n300 },
  cardThumbMore: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardThumbMoreText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  cardRight: { alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  servicePrice: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.terracotta },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(222,53,11,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Add button (footer)
  addButton: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },

  // Success toast
  successToast: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: colors.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successToastText: { color: colors.white, fontSize: 14, fontFamily: 'Poppins_600SemiBold', flex: 1 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.50)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: { paddingHorizontal: 20 },
  modalScrollContent: { paddingBottom: 8, paddingTop: 4 },

  // Form
  formTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.accent },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 4,
  },
  required: { color: colors.error },
  optional: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
  },
  inputFlex: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
  inputSuffixRow: { flexDirection: 'row', alignItems: 'stretch' },
  inputSuffix: {
    backgroundColor: colors.n300,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 0,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputSuffixText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.primaryGhost,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipSub: { paddingHorizontal: 12, paddingVertical: 6 },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.primary },
  categoryChipTextSub: { fontSize: 12 },
  categoryChipTextActive: { color: colors.white },

  // Portfolio / social
  socialSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  socialTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 4 },
  socialHint: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginBottom: 12 },
  socialInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },

  // Photo grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  photoItem: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%', borderRadius: 12 },
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
    gap: 4,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  photoAddText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.primary, textAlign: 'center' },

  // Form buttons
  formButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 22,
    alignItems: 'center',
    backgroundColor: colors.primaryGhost,
  },
  cancelButtonText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 22,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  saveButtonText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  buttonDisabled: { opacity: 0.6 },

  // Coming Soon
  comingSoonSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    opacity: 0.85,
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  comingSoonTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.text, flex: 1 },
  comingSoonBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  comingSoonBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    color: colors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  comingSoonDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  socialPills: { flexDirection: 'row', gap: 8 },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  socialPillText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.text },
});
