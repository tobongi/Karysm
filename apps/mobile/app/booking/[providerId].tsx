import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { api, getAuthToken } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';

// ─── French locale helpers ───────────────────────────────────────────────────

const DAYS_FR: Record<string, string> = {
  MON: 'Lun', TUE: 'Mar', WED: 'Mer', THU: 'Jeu', FRI: 'Ven', SAT: 'Sam', SUN: 'Dim',
};

const DAYS_MAP: Record<number, string> = {
  0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
};

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatPrice(amount: number | null | undefined, currency: string) {
  if (amount == null) return '';
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
}

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceMin: number;
  priceMax: number | null;
  category: ServiceCategory;
}

interface Availability {
  id: string;
  dayOfWeek: string; // MON, TUE, etc.
  startTime: string; // "08:00"
  endTime: string;   // "18:00"
  isActive: boolean;
}

interface Provider {
  id: string;
  displayName: string;
  slug: string;
  city: string;
  isMobile: boolean;
  currency: string;
  avgRating: number;
  services: Service[];
  availability: Availability[];
  user: { name: string; avatar: string | null };
}

interface DateItem {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayKey: string;  // MON, TUE...
  dayLabel: string; // Lun, Mar...
  dayNum: number;
  monthLabel: string;
  available: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildNext14Days(availability: Availability[]): DateItem[] {
  const activeDays = new Set(availability.map(a => a.dayOfWeek));
  const items: DateItem[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayKey = DAYS_MAP[d.getDay()];
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    items.push({
      date: d,
      dateStr: `${year}-${month}-${day}`,
      dayKey,
      dayLabel: DAYS_FR[dayKey],
      dayNum: d.getDate(),
      monthLabel: MONTHS_FR[d.getMonth()],
      available: activeDays.has(dayKey),
    });
  }

  return items;
}

function generateTimeSlots(availability: Availability[], dayKey: string): string[] {
  const dayAvail = availability.find(a => a.dayOfWeek === dayKey);
  if (!dayAvail) return [];

  const slots: string[] = [];
  const [startH, startM] = dayAvail.startTime.split(':').map(Number);
  const [endH, endM] = dayAvail.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  for (let m = startMinutes; m + 30 <= endMinutes; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }

  return slots;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BookingFlow() {
  const { providerId, slug } = useLocalSearchParams<{ providerId: string; slug?: string }>();

  // Data fetching state
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<'CLIENT' | 'PROVIDER'>('CLIENT');
  const [clientNotes, setClientNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  // ── Success celebration animations ──
  const successScale = useRef(new Animated.Value(0)).current;
  const CONFETTI_COLORS = [colors.primary, colors.accent, colors.success, '#FFD700'];
  const confettiAnims = useRef(
    Array.from({ length: 8 }, () => ({
      scale: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const triggerCelebration = useCallback(() => {
    successScale.setValue(0);
    confettiAnims.forEach(c => {
      c.scale.setValue(0);
      c.translateX.setValue(0);
      c.translateY.setValue(0);
      c.opacity.setValue(1);
    });

    Animated.spring(successScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      confettiAnims.forEach((c, i) => {
        const angle = (Math.PI * 2 * i) / confettiAnims.length;
        const distance = 40 + Math.random() * 40;
        Animated.parallel([
          Animated.spring(c.scale, {
            toValue: 1,
            tension: 80,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(c.translateX, {
            toValue: Math.cos(angle) * distance,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(c.translateY, {
            toValue: Math.sin(angle) * distance,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(c.opacity, {
            toValue: 0,
            duration: 800,
            delay: 400,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 200);
  }, [successScale, confettiAnims]);

  // ── Auth check ──
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      showAlert('Connexion requise', 'Vous devez être connecté pour réserver.', () => {
        router.replace('/auth/login');
      });
    }
  }, []);

  // ── Fetch provider data ──
  useEffect(() => {
    let cancelled = false;

    async function fetchProvider() {
      setLoading(true);
      setError(null);
      try {
        if (!slug) {
          throw new Error('Slug du prestataire manquant');
        }
        const res = await api<{ success: boolean; data: Provider }>(`/search/providers/${slug}`);
        if (cancelled) return;

        if (!res.success || !res.data) {
          throw new Error('Prestataire introuvable');
        }

        const p = res.data;
        setProvider(p);

        // Default location based on provider mobility
        if (!p.isMobile) {
          setLocationType('PROVIDER');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Impossible de charger le prestataire');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProvider();
    return () => { cancelled = true; };
  }, [slug]);

  // ── Computed values ──
  const dates = useMemo(() => {
    if (!provider) return [];
    return buildNext14Days(provider.availability);
  }, [provider]);

  const selectedDayKey = useMemo(() => {
    if (!selectedDate) return null;
    const item = dates.find(d => d.dateStr === selectedDate);
    return item?.dayKey ?? null;
  }, [selectedDate, dates]);

  const timeSlots = useMemo(() => {
    if (!provider || !selectedDayKey) return [];
    return generateTimeSlots(provider.availability, selectedDayKey);
  }, [provider, selectedDayKey]);

  // Reset time when date changes
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  // ── Summary text ──
  const summaryDate = useMemo(() => {
    if (!selectedDate) return null;
    const item = dates.find(d => d.dateStr === selectedDate);
    if (!item) return null;
    return `${item.dayLabel} ${item.dayNum} ${item.monthLabel}`;
  }, [selectedDate, dates]);

  // ── Confirm booking ──
  const handleConfirm = useCallback(async () => {
    if (!selectedService) {
      showAlert('Attention', 'Veuillez choisir un service');
      return;
    }
    if (!selectedDate) {
      showAlert('Attention', 'Veuillez choisir une date');
      return;
    }
    if (!selectedTime) {
      showAlert('Attention', 'Veuillez choisir un horaire');
      return;
    }
    if (!provider) return;

    setSubmitting(true);
    try {
      const body = {
        providerId: provider.id,
        serviceId: selectedService.id,
        date: selectedDate,
        startTime: selectedTime,
        locationType,
        clientNotes: clientNotes.trim() || undefined,
      };

      const res = await api<{ success: boolean; data: { id: string } }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.success && res.data?.id) {
        setConfirmedBookingId(res.data.id);
        setShowSuccess(true);
        triggerCelebration();
      } else {
        showAlert('Erreur', 'La réservation n\'a pas pu être créée. Réessayez.');
      }
    } catch (err: any) {
      if (err.message?.includes('Session expirée') || err.message?.includes('Connectez-vous')) {
        showAlert('Session expirée', 'Veuillez vous reconnecter.', () => {
          router.replace('/auth/login');
        });
      } else {
        showAlert('Erreur', err.message || 'Impossible de créer la réservation');
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedService, selectedDate, selectedTime, locationType, clientNotes, provider]);

  // ── Can confirm? ──
  const canConfirm = !!(selectedService && selectedDate && selectedTime);

  // ── Loading state ──
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  // ── Error state ──
  if (error || !provider) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Prestataire introuvable</Text>
        <Text style={styles.errorMessage}>{error || 'Une erreur est survenue'}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Main render ──
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* ── Success Celebration Modal ── */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.modalCard}>
            {/* Animated checkmark with confetti */}
            <View style={styles.checkContainer}>
              <Animated.View
                style={[
                  styles.checkCircle,
                  { transform: [{ scale: successScale }] },
                ]}
              >
                <Text style={styles.checkIcon}>✓</Text>
              </Animated.View>
              {/* Confetti pieces */}
              {confettiAnims.map((c, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.confettiDot,
                    {
                      backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                      opacity: c.opacity,
                      transform: [
                        { translateX: c.translateX },
                        { translateY: c.translateY },
                        { scale: c.scale },
                      ],
                    },
                  ]}
                />
              ))}
            </View>

            <Text style={styles.modalTitle}>Réservation envoyée !</Text>
            <Text style={styles.modalText}>
              Votre demande a été envoyée à{' '}
              <Text style={{ fontWeight: '700', color: colors.accent }}>
                {provider?.displayName}
              </Text>
              .{'\n'}Vous recevrez une confirmation très bientôt.
            </Text>

            {/* Recap card */}
            {selectedService && (
              <View style={styles.recapCard}>
                <View style={styles.recapRow}>
                  <Text style={styles.recapEmoji}>📅</Text>
                  <Text style={styles.recapText}>{summaryDate}</Text>
                </View>
                <View style={styles.recapRow}>
                  <Text style={styles.recapEmoji}>🕐</Text>
                  <Text style={styles.recapText}>{selectedTime}</Text>
                </View>
                <View style={styles.recapRow}>
                  <Text style={styles.recapEmoji}>💇</Text>
                  <Text style={styles.recapText}>{selectedService.name}</Text>
                </View>
                <View style={styles.recapRow}>
                  <Text style={styles.recapEmoji}>💰</Text>
                  <Text style={styles.recapText}>
                    {formatPrice(selectedService.priceMin, provider?.currency ?? 'XAF')}
                  </Text>
                </View>
              </View>
            )}

            {/* Next steps */}
            <View style={styles.stepsSection}>
              <Text style={styles.stepsTitle}>Prochaines étapes</Text>
              {[
                'Le prestataire confirme votre demande',
                'Vous recevez une notification',
                'Profitez de votre service !',
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={styles.modalButton}
              onPress={() => {
                setShowSuccess(false);
                if (confirmedBookingId) {
                  router.replace(`/booking/detail/${confirmedBookingId}`);
                }
              }}
            >
              <Text style={styles.modalButtonText}>Voir ma réservation</Text>
            </Pressable>
            <Pressable
              style={styles.modalSecondary}
              onPress={() => {
                setShowSuccess(false);
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.modalSecondaryText}>Retour à l'accueil</Text>
            </Pressable>
            <View style={styles.referralPrompt}>
              <Text style={styles.referralPromptText}>
                Invitez une amie et gagnez des crédits !
              </Text>
              <Pressable
                style={styles.referralPromptButton}
                onPress={() => {
                  setShowSuccess(false);
                  router.push('/referral' as any);
                }}
              >
                <Text style={styles.referralPromptButtonText}>Inviter une amie</Text>
              </Pressable>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.backButton}>← Retour</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Réservation</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Provider info */}
          <View style={styles.providerCard}>
            <View style={styles.providerAvatar}>
              <Text style={styles.providerInitial}>
                {provider.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.displayName}</Text>
              <Text style={styles.providerCity}>{provider.city}</Text>
            </View>
          </View>

          {/* Step 1: Service Selection */}
          <Text style={styles.sectionTitle}>1. Choisir un service</Text>
          {provider.services.length === 0 ? (
            <Text style={styles.emptyText}>Aucun service disponible</Text>
          ) : (
            <View style={styles.servicesList}>
              {provider.services.map(service => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <Pressable
                    key={service.id}
                    style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                    onPress={() => setSelectedService(service)}
                  >
                    <View style={styles.serviceHeader}>
                      <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                        {service.name}
                      </Text>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.serviceDuration}>{service.durationMin} min</Text>
                      <Text style={styles.servicePrice}>
                        {!service.priceMax || service.priceMin === service.priceMax
                          ? formatPrice(service.priceMin, provider.currency)
                          : `${formatPrice(service.priceMin, provider.currency)} – ${formatPrice(service.priceMax, provider.currency)}`}
                      </Text>
                    </View>
                    <Text style={styles.serviceCategory}>{service.category.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Step 2: Date Picker */}
          <Text style={styles.sectionTitle}>2. Choisir une date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {dates.map(item => {
              const isSelected = selectedDate === item.dateStr;
              const isToday = item.dateStr === dates[0]?.dateStr;
              return (
                <Pressable
                  key={item.dateStr}
                  style={[
                    styles.dateChip,
                    !item.available && styles.dateChipDisabled,
                    isSelected && styles.dateChipSelected,
                  ]}
                  onPress={() => item.available && setSelectedDate(item.dateStr)}
                  disabled={!item.available}
                >
                  <Text
                    style={[
                      styles.dateDay,
                      !item.available && styles.dateDayDisabled,
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    {item.dayLabel}
                  </Text>
                  <View style={[styles.dateNumCircle, isSelected && styles.dateNumCircleSelected]}>
                    <Text
                      style={[
                        styles.dateNum,
                        !item.available && styles.dateDayDisabled,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {item.dayNum}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.dateMonth,
                      !item.available && styles.dateDayDisabled,
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    {item.monthLabel}
                  </Text>
                  {isToday && <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Step 3: Time Slots */}
          {selectedDate && (
            <>
              <Text style={styles.sectionTitle}>3. Choisir un horaire</Text>
              {timeSlots.length === 0 ? (
                <Text style={styles.emptyText}>Aucun créneau disponible pour cette date</Text>
              ) : (
                <View style={styles.timesGrid}>
                  {timeSlots.map(time => {
                    const isSelected = selectedTime === time;
                    return (
                      <Pressable
                        key={time}
                        style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                          {time}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* Step 4: Location */}
          {selectedTime && (
            <>
              <Text style={styles.sectionTitle}>4. Lieu du rendez-vous</Text>
              <View style={styles.locationRow}>
                {provider.isMobile && (
                  <Pressable
                    style={[styles.locationOption, locationType === 'CLIENT' && styles.locationOptionSelected]}
                    onPress={() => setLocationType('CLIENT')}
                  >
                    <Text style={styles.locationEmoji}>🏠</Text>
                    <Text style={[styles.locationLabel, locationType === 'CLIENT' && styles.locationLabelSelected]}>
                      Chez moi
                    </Text>
                    <Text style={styles.locationSub}>Le prestataire se déplace</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[
                    styles.locationOption,
                    locationType === 'PROVIDER' && styles.locationOptionSelected,
                    !provider.isMobile && styles.locationOptionFull,
                  ]}
                  onPress={() => setLocationType('PROVIDER')}
                >
                  <Text style={styles.locationEmoji}>📍</Text>
                  <Text style={[styles.locationLabel, locationType === 'PROVIDER' && styles.locationLabelSelected]}>
                    Chez le prestataire
                  </Text>
                  <Text style={styles.locationSub}>{provider.city}</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Step 5: Notes */}
          {selectedTime && (
            <>
              <Text style={styles.sectionTitle}>5. Notes (optionnel)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Notes pour le prestataire..."
                placeholderTextColor={colors.textMuted}
                value={clientNotes}
                onChangeText={setClientNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </>
          )}

          {/* Spacer for sticky bottom bar */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sticky bottom summary + confirm */}
        {canConfirm && selectedService && (
          <View style={styles.bottomBar}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Text style={styles.summaryService} numberOfLines={1}>
                  {selectedService.name}
                </Text>
                <Text style={styles.summaryDetails}>
                  {summaryDate} à {selectedTime} · {locationType === 'CLIENT' ? 'À domicile' : 'Sur place'}
                </Text>
              </View>
              <Text style={styles.summaryPrice}>
                {formatPrice(selectedService.priceMin, provider.currency)}
              </Text>
            </View>
            <Pressable
              style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.confirmText}>Confirmer la réservation</Text>
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 25,
  },
  retryText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backButton: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.accent,
  },
  headerSpacer: {
    width: 60,
  },

  // Provider card
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  providerInitial: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.text,
  },
  providerCity: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Section titles
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.accent,
    marginTop: 24,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Services
  servicesList: {
    gap: 10,
  },
  serviceCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  serviceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGhost,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  serviceNameSelected: {
    color: colors.primaryDark,
  },
  checkmark: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.terracotta,
  },
  serviceCategory: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },

  // Dates
  datesContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 58,
  },
  dateChipDisabled: {
    backgroundColor: colors.bg,
    opacity: 0.45,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDay: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateDayDisabled: {
    color: colors.textMuted,
  },
  dateNumCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateNumCircleSelected: {
    backgroundColor: colors.primaryDark,
  },
  dateNum: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.text,
  },
  dateMonth: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dateTextSelected: {
    color: colors.white,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  todayDotSelected: {
    backgroundColor: colors.white,
  },

  // Time slots
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    color: colors.text,
  },
  timeTextSelected: {
    color: colors.white,
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  locationOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGhost,
  },
  locationOptionFull: {
    flex: 1,
  },
  locationEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  locationLabelSelected: {
    color: colors.primaryDark,
  },
  locationSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Notes
  notesInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text,
    minHeight: 80,
    lineHeight: 20,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 140,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.n800,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLeft: {
    flex: 1,
    marginRight: 12,
  },
  summaryService: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.text,
  },
  summaryDetails: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '800',
    color: colors.terracotta,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
  },

  // Success Celebration Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  checkContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#00875A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  confettiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalTitle: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },

  // Recap card
  recapCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 16,
    gap: 10,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recapEmoji: {
    fontSize: 16,
    width: 28,
  },
  recapText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },

  // Next steps
  stepsSection: {
    width: '100%',
    marginTop: 20,
  },
  stepsTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    flex: 1,
  },

  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
  },
  modalSecondary: {
    marginTop: 12,
    paddingVertical: 10,
  },
  modalSecondaryText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
  },
  referralPrompt: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    width: '100%',
  },
  referralPromptText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  referralPromptButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  referralPromptButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
});
