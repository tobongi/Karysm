import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck.mjs';
import IconClock from '@tabler/icons-react-native/dist/esm/icons/IconClock.mjs';
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import IconMapPin from '@tabler/icons-react-native/dist/esm/icons/IconMapPin.mjs';
import IconHome from '@tabler/icons-react-native/dist/esm/icons/IconHome.mjs';
import IconScissors from '@tabler/icons-react-native/dist/esm/icons/IconScissors.mjs';
import IconCoin from '@tabler/icons-react-native/dist/esm/icons/IconCoin.mjs';
import IconMoodSad from '@tabler/icons-react-native/dist/esm/icons/IconMoodSad.mjs';
import IconLock from '@tabler/icons-react-native/dist/esm/icons/IconLock.mjs';
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
import IconGift from '@tabler/icons-react-native/dist/esm/icons/IconGift.mjs';
import IconUsers from '@tabler/icons-react-native/dist/esm/icons/IconUsers.mjs';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import { showAlert } from '../../src/lib/alert';
import Skeleton from '../../src/components/Skeleton';
import { FadeInStagger, PressableScale } from '../../src/components/animations';

// ─── French locale helpers ────────────────────────────────────────────────────

const DAYS_FR: Record<string, string> = {
  MON: 'Lun', TUE: 'Mar', WED: 'Mer', THU: 'Jeu', FRI: 'Ven', SAT: 'Sam', SUN: 'Dim',
};

const DAYS_MAP: Record<number, string> = {
  0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
};

const MONTHS_FR = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

function formatPrice(amount: number | null | undefined, currency: string) {
  if (amount == null) return '';
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceCategory { id: string; name: string; slug: string; }

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
  dayOfWeek: string;
  startTime: string;
  endTime: string;
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
  dateStr: string;
  dayKey: string;
  dayLabel: string;
  dayNum: number;
  monthLabel: string;
  available: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDowIndex(date: Date): number {
  const day = date.getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1; // Mon=0 … Sun=6
}

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

// ─── Progress bar ─────────────────────────────────────────────────────────────

const STEP_LABELS = ['Service', 'Date', 'Heure', 'Détails'];
const TOTAL_STEPS = 4;

function ProgressBar({ current }: { current: number }) {
  return (
    <View style={pb.wrap}>
      <View style={pb.dotsRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const stepNum = i + 1;
          const done = stepNum < current;
          const active = stepNum === current;
          return (
            <View
              key={i}
              style={[
                pb.dot,
                done && pb.dotDone,
                active && pb.dotActive,
              ]}
            />
          );
        })}
      </View>
      <View style={pb.labelRow}>
        <Text style={pb.stepCounter}>Étape {current} de {TOTAL_STEPS}</Text>
        <Text style={pb.stepLabel}>{STEP_LABELS[current - 1]}</Text>
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  dotsRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotDone: { backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { backgroundColor: colors.white },
  labelRow: { alignItems: 'center', gap: 4 },
  stepCounter: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 },
  stepLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.white },
});

// ─── Time slot picker ────────────────────────────────────────────────────────

type TimePeriod = { key: string; label: string; sublabel: string; slots: string[] };

function groupSlotsByPeriod(slots: string[]): TimePeriod[] {
  const matin: string[] = [];
  const apresmidi: string[] = [];
  const soir: string[] = [];

  for (const slot of slots) {
    const h = parseInt(slot.split(':')[0], 10);
    if (h < 12) matin.push(slot);
    else if (h < 17) apresmidi.push(slot);
    else soir.push(slot);
  }

  const periods: TimePeriod[] = [];
  if (matin.length) periods.push({ key: 'matin', label: 'Matin', sublabel: 'avant midi', slots: matin });
  if (apresmidi.length) periods.push({ key: 'apresmidi', label: 'Après-midi', sublabel: '12h – 17h', slots: apresmidi });
  if (soir.length) periods.push({ key: 'soir', label: 'Soir', sublabel: 'après 17h', slots: soir });
  return periods;
}

function TimeSlotPicker({
  slots,
  selectedTime,
  onSelect,
  dateBadge,
}: {
  slots: string[];
  selectedTime: string | null;
  onSelect: (t: string) => void;
  dateBadge: string | null;
}) {
  if (slots.length === 0) {
    return (
      <View style={ts.empty}>
        <Text style={ts.emptyText}>Aucun créneau disponible pour cette date</Text>
      </View>
    );
  }

  const periods = groupSlotsByPeriod(slots);

  return (
    <View style={ts.root}>
      {dateBadge && (
        <View style={ts.dateBadge}>
          <IconCalendar size={13} color={colors.primary} strokeWidth={1.8} />
          <Text style={ts.dateBadgeText}>{dateBadge}</Text>
        </View>
      )}

      {periods.map((period, pi) => (
        <View key={period.key} style={ts.periodBlock}>
          {/* Period header */}
          <View style={ts.periodHeader}>
            <View style={ts.periodLine} />
            <View style={ts.periodLabelWrap}>
              <Text style={ts.periodLabel}>{period.label}</Text>
              <Text style={ts.periodSub}>{period.sublabel}</Text>
            </View>
            <View style={ts.periodLine} />
          </View>

          {/* Slot grid — 3 per row */}
          <View style={ts.grid}>
            {period.slots.map(time => {
              const isSel = selectedTime === time;
              return (
                <Pressable
                  key={time}
                  style={[ts.chip, isSel && ts.chipSel]}
                  onPress={() => onSelect(time)}
                >
                  <Text style={[ts.chipText, isSel && ts.chipTextSel]}>{time}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const ts = StyleSheet.create({
  root: { gap: 24 },
  empty: { paddingTop: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textMuted, fontStyle: 'italic' },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryGhost, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 4,
  },
  dateBadgeText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.primaryDark },
  periodBlock: { gap: 14 },
  periodHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  periodLine: { flex: 1, height: 1, backgroundColor: colors.border },
  periodLabelWrap: { alignItems: 'center' },
  periodLabel: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  periodSub: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: colors.textMuted, marginTop: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    width: '30%', flexGrow: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    }) as any,
  },
  chipSel: {
    backgroundColor: colors.headerDark,
    borderColor: colors.headerDark,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(58,34,40,0.25)' },
      default: { shadowColor: colors.headerDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
    }) as any,
  },
  chipText: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  chipTextSel: { color: colors.white },
});

// ─── Calendar picker ─────────────────────────────────────────────────────────

const DOW_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function CalendarPicker({
  dates,
  selectedDate,
  onSelect,
}: {
  dates: DateItem[];
  selectedDate: string | null;
  onSelect: (dateStr: string) => void;
}) {
  // Group dates by month
  const monthGroups: { key: string; label: string; items: DateItem[] }[] = [];
  for (const item of dates) {
    const key = `${item.date.getFullYear()}-${item.date.getMonth()}`;
    const label = `${item.monthLabel} ${item.date.getFullYear()}`;
    const existing = monthGroups.find(g => g.key === key);
    if (existing) existing.items.push(item);
    else monthGroups.push({ key, label, items: [item] });
  }

  return (
    <View style={cal.root}>
      {monthGroups.map(group => {
        const leadingBlanks = getDowIndex(group.items[0].date);
        return (
          <View key={group.key} style={cal.monthBlock}>
            {/* Month header */}
            <Text style={cal.monthTitle}>{group.label}</Text>

            {/* Day-of-week row */}
            <View style={cal.dowRow}>
              {DOW_LABELS.map((d, i) => (
                <View key={i} style={cal.dowCell}>
                  <Text style={cal.dowText}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View style={cal.grid}>
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <View key={`blank-${i}`} style={cal.cell} />
              ))}
              {group.items.map(item => {
                const isSel = item.dateStr === selectedDate;
                const isToday = item.dateStr === dates[0]?.dateStr;
                return (
                  <Pressable
                    key={item.dateStr}
                    style={[
                      cal.cell,
                      isToday && !isSel && cal.cellToday,
                      isSel && cal.cellSel,
                      !item.available && cal.cellUnavail,
                    ]}
                    onPress={() => item.available && onSelect(item.dateStr)}
                    disabled={!item.available}
                  >
                    <Text style={[
                      cal.cellNum,
                      isToday && !isSel && cal.cellNumToday,
                      isSel && cal.cellNumSel,
                      !item.available && cal.cellNumDim,
                    ]}>
                      {item.dayNum}
                    </Text>
                    {isToday && (
                      <View style={[cal.todayDot, isSel && cal.todayDotSel]} />
                    )}
                    {!item.available && (
                      <View style={cal.unavailLine} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Legend */}
      <View style={cal.legend}>
        <View style={cal.legendItem}>
          <View style={[cal.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={cal.legendText}>Disponible</Text>
        </View>
        <View style={cal.legendItem}>
          <View style={[cal.legendDot, { backgroundColor: colors.border }]} />
          <Text style={cal.legendText}>Indisponible</Text>
        </View>
      </View>
    </View>
  );
}

const CELL_SIZE = 44;

const cal = StyleSheet.create({
  root: { gap: 28 },
  monthBlock: { gap: 0 },
  monthTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  dowRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dowCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dowText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  cellToday: {},
  cellSel: {},
  cellUnavail: { opacity: 0.3 },
  cellNum: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: CELL_SIZE,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    overflow: 'hidden',
  },
  cellNumToday: {
    borderWidth: 2,
    borderColor: colors.primary,
    color: colors.primaryDark,
  },
  cellNumSel: {
    backgroundColor: colors.primary,
    color: colors.white,
  },
  cellNumDim: {
    color: colors.textMuted,
  },
  todayDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  todayDotSel: {
    backgroundColor: colors.white,
  },
  unavailLine: {
    position: 'absolute',
    width: 20,
    height: 1.5,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingFlow() {
  const { providerId, slug, serviceId } = useLocalSearchParams<{ providerId: string; slug?: string; serviceId?: string }>();
  const { user, isLoading: authLoading } = useAuth();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
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
      c.scale.setValue(0); c.translateX.setValue(0);
      c.translateY.setValue(0); c.opacity.setValue(1);
    });

    Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();

    setTimeout(() => {
      confettiAnims.forEach((c, i) => {
        const angle = (Math.PI * 2 * i) / confettiAnims.length;
        const distance = 40 + Math.random() * 40;
        Animated.parallel([
          Animated.spring(c.scale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.timing(c.translateX, { toValue: Math.cos(angle) * distance, duration: 600, useNativeDriver: true }),
          Animated.timing(c.translateY, { toValue: Math.sin(angle) * distance, duration: 600, useNativeDriver: true }),
          Animated.timing(c.opacity, { toValue: 0, duration: 800, delay: 400, useNativeDriver: true }),
        ]).start();
      });
    }, 200);
  }, [successScale, confettiAnims]);

  useEffect(() => {
    let cancelled = false;

    async function fetchProvider() {
      setLoading(true); setError(null);
      try {
        if (!slug) throw new Error('Slug du prestataire manquant');
        const res = await api<{ success: boolean; data: Provider }>(`/search/providers/${slug}`);
        if (cancelled) return;
        if (!res.success || !res.data) throw new Error('Prestataire introuvable');

        const p = res.data;
        setProvider(p);
        if (!p.isMobile) setLocationType('PROVIDER');

        if (serviceId) {
          const match = p.services.find(s => s.id === serviceId);
          if (match) setSelectedService(match);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Impossible de charger le prestataire');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProvider();
    return () => { cancelled = true; };
  }, [slug, serviceId]);

  const dates = useMemo(() => {
    if (!provider) return [];
    return buildNext14Days(provider.availability);
  }, [provider]);

  const selectedDayKey = useMemo(() => {
    if (!selectedDate) return null;
    return dates.find(d => d.dateStr === selectedDate)?.dayKey ?? null;
  }, [selectedDate, dates]);

  const timeSlots = useMemo(() => {
    if (!provider || !selectedDayKey) return [];
    return generateTimeSlots(provider.availability, selectedDayKey);
  }, [provider, selectedDayKey]);

  useEffect(() => { setSelectedTime(null); }, [selectedDate]);

  const summaryDate = useMemo(() => {
    if (!selectedDate) return null;
    const item = dates.find(d => d.dateStr === selectedDate);
    if (!item) return null;
    return `${item.dayLabel} ${item.dayNum} ${item.monthLabel}`;
  }, [selectedDate, dates]);

  function canAdvance(): boolean {
    if (currentStep === 1) return !!selectedService;
    if (currentStep === 2) return !!selectedDate;
    if (currentStep === 3) return !!selectedTime;
    return true;
  }

  function handleBack() {
    if (currentStep === 1) router.back();
    else setCurrentStep(s => s - 1);
  }

  function handleNext() {
    if (currentStep < TOTAL_STEPS) setCurrentStep(s => s + 1);
    else handleConfirm();
  }

  const handleConfirm = useCallback(async () => {
    if (!selectedService || !selectedDate || !selectedTime || !provider) return;

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
        showAlert('Erreur', "La réservation n'a pas pu être créée. Réessayez.");
      }
    } catch (err: any) {
      if (err.message?.includes('Session expirée') || err.message?.includes('Connectez-vous')) {
        showAlert('Session expirée', 'Veuillez vous reconnecter.', () => router.replace('/auth/login'));
      } else {
        showAlert('Erreur', err.message || 'Impossible de créer la réservation');
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedService, selectedDate, selectedTime, locationType, clientNotes, provider]);

  // ── Auth loading ──
  if (authLoading) {
    return (
      <SafeAreaView style={s.centered}>
        <View style={{ width: '100%', gap: 16, paddingHorizontal: 20 }}>
          <Skeleton width="100%" height={80} borderRadius={20} />
          <Skeleton width="60%" height={16} borderRadius={8} />
          <Skeleton width="100%" height={90} borderRadius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={s.centered}>
        <View style={s.iconCircle}><IconLock size={36} color={colors.primary} strokeWidth={1.5} /></View>
        <Text style={s.wallTitle}>Connexion requise</Text>
        <Text style={s.wallSub}>Vous devez être connecté pour réserver.</Text>
        <Pressable style={s.accentBtn} onPress={() => router.replace('/auth/login')}>
          <Text style={s.accentBtnText}>Se connecter</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={s.centered}>
        <View style={{ width: '100%', gap: 16, paddingHorizontal: 20 }}>
          <Skeleton width="100%" height={80} borderRadius={20} />
          <Skeleton width="60%" height={16} borderRadius={8} />
          <Skeleton width="100%" height={90} borderRadius={20} />
          <Skeleton width="100%" height={90} borderRadius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !provider) {
    return (
      <SafeAreaView style={s.centered}>
        <View style={s.iconCircle}><IconMoodSad size={36} color={colors.textMuted} strokeWidth={1.5} /></View>
        <Text style={s.wallTitle}>Prestataire introuvable</Text>
        <Text style={s.wallSub}>{error || 'Une erreur est survenue'}</Text>
        <Pressable style={s.accentBtn} onPress={() => router.back()}>
          <Text style={s.accentBtnText}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isLastStep = currentStep === TOTAL_STEPS;
  const nextLabel = isLastStep ? 'Confirmer la réservation' : 'Continuer';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Success Modal ── */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <ScrollView contentContainerStyle={s.modalScrollContent} showsVerticalScrollIndicator={false}>
            <View style={s.modalCard}>
              <View style={s.checkContainer}>
                <Animated.View style={[s.checkCircle, { transform: [{ scale: successScale }] }]}>
                  <IconCheck size={36} color={colors.white} strokeWidth={2.5} />
                </Animated.View>
                {confettiAnims.map((c, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      s.confettiDot,
                      {
                        backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                        opacity: c.opacity,
                        transform: [{ translateX: c.translateX }, { translateY: c.translateY }, { scale: c.scale }],
                      },
                    ]}
                  />
                ))}
              </View>

              <Text style={s.modalTitle}>Réservation envoyée !</Text>
              <Text style={s.modalText}>
                Votre demande a été envoyée à{' '}
                <Text style={{ fontWeight: '700', color: colors.accent }}>{provider?.displayName}</Text>.
                {'\n'}Vous recevrez une confirmation très bientôt.
              </Text>

              {selectedService && (
                <View style={s.recapCard}>
                  <RecapRow icon={<IconCalendar size={15} color={colors.primary} strokeWidth={1.8} />} text={summaryDate ?? ''} />
                  <RecapRow icon={<IconClock size={15} color={colors.primary} strokeWidth={1.8} />} text={selectedTime ?? ''} />
                  <RecapRow icon={<IconScissors size={15} color={colors.primary} strokeWidth={1.8} />} text={selectedService.name} />
                  <RecapRow icon={<IconCoin size={15} color={colors.primary} strokeWidth={1.8} />} text={formatPrice(selectedService.priceMin, provider?.currency ?? 'XAF')} />
                </View>
              )}

              {/* Next steps — minimal timeline */}
              <View style={s.nextStepsWrap}>
                {[
                  { label: 'Confirmation par le prestataire' },
                  { label: 'Notification de confirmation' },
                  { label: 'Profitez de votre service' },
                ].map((step, i, arr) => (
                  <View key={i} style={s.nextStepRow}>
                    <View style={s.nextStepTrack}>
                      <View style={s.nextStepDot} />
                      {i < arr.length - 1 && <View style={s.nextStepConnector} />}
                    </View>
                    <Text style={[s.nextStepText, i === arr.length - 1 && { color: colors.success, fontFamily: 'Poppins_600SemiBold' }]}>
                      {step.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Primary CTA */}
              <Pressable
                style={s.modalBtn}
                onPress={() => { setShowSuccess(false); if (confirmedBookingId) router.replace(`/booking/detail/${confirmedBookingId}`); }}
              >
                <Text style={s.modalBtnText}>Voir ma réservation</Text>
              </Pressable>
              <Pressable style={s.modalSecondary} onPress={() => { setShowSuccess(false); router.replace('/(tabs)'); }}>
                <Text style={s.modalSecondaryText}>Retour à l'accueil</Text>
              </Pressable>

              {/* Referral card */}
              <Pressable
                style={s.referralCard}
                onPress={() => { setShowSuccess(false); router.push('/referral' as any); }}
              >
                <View style={s.referralIconWrap}>
                  <IconGift size={22} color={colors.primary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.referralCardTitle}>Invitez vos amies</Text>
                  <Text style={s.referralCardSub}>Gagnez des crédits beauté pour chaque inscription</Text>
                </View>
                <IconChevronRight size={18} color={colors.primary} strokeWidth={2} />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── Header ── */}
        <View style={s.header}>
          <SafeAreaView edges={['top']}>
            <View style={s.headerTop}>
              <Pressable style={s.backBtn} onPress={handleBack} hitSlop={8}>
                <IconArrowLeft size={20} color={colors.white} strokeWidth={2} />
              </Pressable>
              <View style={s.headerProvider}>
                {provider.user.avatar ? (
                  <Image source={{ uri: provider.user.avatar }} style={s.headerAvatar} />
                ) : (
                  <View style={s.headerAvatarFallback}>
                    <Text style={s.headerAvatarInitial}>{getInitials(provider.displayName)}</Text>
                  </View>
                )}
                <View>
                  <Text style={s.headerProviderName}>{provider.displayName}</Text>
                  <Text style={s.headerProviderCity}>{provider.city}</Text>
                </View>
              </View>
              <View style={{ width: 38 }} />
            </View>
          </SafeAreaView>
          <ProgressBar current={currentStep} />
        </View>

        {/* ── Step content ── */}
        <ScrollView
          key={currentStep}
          style={{ flex: 1 }}
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.stepHeadingRow}>
            <Text style={s.stepHeading}>
              {currentStep === 1 && 'Quel service ?'}
              {currentStep === 2 && 'Quelle date ?'}
              {currentStep === 3 && 'Quel horaire ?'}
              {currentStep === 4 && 'Derniers détails'}
            </Text>
            <Text style={s.stepCounter}>{currentStep} / {TOTAL_STEPS}</Text>
          </View>

          {/* ── STEP 1: Services ── */}
          {currentStep === 1 && (
            provider.services.length === 0 ? (
              <Text style={s.empty}>Aucun service disponible</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {provider.services.map((svc, idx) => {
                  const isSel = selectedService?.id === svc.id;
                  return (
                    <FadeInStagger key={svc.id} index={idx} style={{ width: '100%' }}>
                      <PressableScale onPress={() => setSelectedService(svc)}>
                        <View
                          style={[s.svcCard, isSel && s.svcCardSel]}
                        >
                      <View style={s.svcLeft}>
                        <View style={[s.svcRadio, isSel && s.svcRadioSel]}>
                          {isSel && <IconCheck size={13} color={colors.white} strokeWidth={3} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.svcName, isSel && s.svcNameSel]} numberOfLines={1}>{svc.name}</Text>
                          <Text style={[s.svcCat, isSel && s.svcCatSel]}>{svc.category.name}</Text>
                        </View>
                      </View>
                      <View style={s.svcRight}>
                        <Text style={[s.svcPrice, isSel && s.svcPriceSel]}>
                          {!svc.priceMax || svc.priceMin === svc.priceMax
                            ? formatPrice(svc.priceMin, provider.currency)
                            : `${formatPrice(svc.priceMin, provider.currency)}+`}
                        </Text>
                        <View style={s.svcDurRow}>
                          <IconClock size={11} color={isSel ? colors.primaryDark : colors.textMuted} strokeWidth={1.8} />
                          <Text style={[s.svcDur, isSel && s.svcDurSel]}>{svc.durationMin} min</Text>
                        </View>
                      </View>
                        </View>
                      </PressableScale>
                    </FadeInStagger>
                  );
                })}
              </View>
            )
          )}

          {/* ── STEP 2: Date ── */}
          {currentStep === 2 && (
            <CalendarPicker
              dates={dates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          )}

          {/* ── STEP 3: Time ── */}
          {currentStep === 3 && (
            <TimeSlotPicker
              slots={timeSlots}
              selectedTime={selectedTime}
              onSelect={setSelectedTime}
              dateBadge={summaryDate}
            />
          )}

          {/* ── STEP 4: Details ── */}
          {currentStep === 4 && (
            <View style={{ gap: 20 }}>
              {/* Recap summary */}
              <View style={s.summaryCard}>
                <Text style={s.summaryCardTitle}>{selectedService?.name}</Text>
                <View style={s.summaryCardRow}>
                  <IconCalendar size={14} color={colors.primary} strokeWidth={1.8} />
                  <Text style={s.summaryCardDetail}>{summaryDate} à {selectedTime}</Text>
                </View>
                <View style={s.summaryCardRow}>
                  <IconCoin size={14} color={colors.terracotta} strokeWidth={1.8} />
                  <Text style={[s.summaryCardDetail, { color: colors.terracotta, fontFamily: 'Poppins_700Bold' }]}>
                    {formatPrice(selectedService?.priceMin, provider.currency)}
                  </Text>
                </View>
              </View>

              {/* Location */}
              {provider.isMobile && (
                <>
                  <Text style={s.detailsLabel}>Lieu du rendez-vous</Text>
                  <Pressable
                    style={[s.locCard, locationType === 'CLIENT' && s.locCardSel]}
                    onPress={() => setLocationType('CLIENT')}
                  >
                    <View style={[s.locIcon, locationType === 'CLIENT' && s.locIconSel]}>
                      <IconHome size={20} color={locationType === 'CLIENT' ? colors.white : colors.primary} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.locTitle, locationType === 'CLIENT' && s.locTitleSel]}>Chez moi</Text>
                      <Text style={s.locSub}>Le prestataire se déplace</Text>
                    </View>
                    {locationType === 'CLIENT' && (
                      <View style={s.locCheck}><IconCheck size={11} color={colors.white} strokeWidth={2.5} /></View>
                    )}
                  </Pressable>
                </>
              )}
              <Pressable
                style={[s.locCard, locationType === 'PROVIDER' && s.locCardSel]}
                onPress={() => setLocationType('PROVIDER')}
              >
                <View style={[s.locIcon, locationType === 'PROVIDER' && s.locIconSel]}>
                  <IconMapPin size={20} color={locationType === 'PROVIDER' ? colors.white : colors.primary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.locTitle, locationType === 'PROVIDER' && s.locTitleSel]}>Chez le prestataire</Text>
                  <Text style={s.locSub}>{provider.city}</Text>
                </View>
                {locationType === 'PROVIDER' && (
                  <View style={s.locCheck}><IconCheck size={11} color={colors.white} strokeWidth={2.5} /></View>
                )}
              </Pressable>

              {/* Notes */}
              <Text style={s.detailsLabel}>Notes (optionnel)</Text>
              <TextInput
                style={s.notesInput}
                placeholder="Style souhaité, allergies, précisions..."
                placeholderTextColor={colors.textMuted}
                value={clientNotes}
                onChangeText={setClientNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── Footer CTA ── */}
        <View style={s.footer}>
          <Pressable
            style={[s.nextBtn, !canAdvance() && s.nextBtnDisabled, submitting && { opacity: 0.7 }]}
            onPress={handleNext}
            disabled={!canAdvance() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={s.nextBtnText}>{nextLabel}</Text>
                {!isLastStep && <IconChevronRight size={18} color={colors.white} strokeWidth={2.5} />}
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Recap row helper ─────────────────────────────────────────────────────────

function RecapRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3 }}>
      <View style={{ width: 24, alignItems: 'center' }}>{icon}</View>
      <Text style={{ fontSize: 14, fontFamily: 'Poppins_500Medium', fontWeight: '500', color: colors.text, flex: 1 }}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  centered: {
    flex: 1, backgroundColor: colors.bg,
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  wallTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 8 },
  wallSub: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  accentBtn: { paddingHorizontal: 32, paddingVertical: 13, backgroundColor: colors.accent, borderRadius: 25 },
  accentBtnText: { color: colors.white, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  // Header
  header: {
    backgroundColor: colors.headerDark,
    ...(Platform.OS === 'web' ? { background: `linear-gradient(160deg, ${colors.headerDark} 0%, #5C3D3D 100%)` } as any : {}),
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerProvider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAvatarFallback: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarInitial: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.white },
  headerProviderName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.white },
  headerProviderCity: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.6)' },

  // Body
  body: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },
  stepHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 },
  stepHeading: { fontSize: 26, fontFamily: 'PlayfairDisplay_700Bold', color: colors.text, flex: 1 },
  stepCounter: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted, marginTop: 4 },
  empty: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textMuted, fontStyle: 'italic' },

  // Service cards
  svcCard: {
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1.5, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16, gap: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.05)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
    }) as any,
  },
  svcCardSel: { borderColor: colors.primary, backgroundColor: 'rgba(139,105,82,0.08)', ...Platform.select({
    web: { boxShadow: '0 4px 12px rgba(139,105,82,0.15)' },
    default: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
  }) as any },
  svcLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  svcRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  svcRadioSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  svcName: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 2 },
  svcNameSel: { color: colors.primaryDark },
  svcCat: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  svcCatSel: { color: colors.primary },
  svcRight: { alignItems: 'flex-end', gap: 4 },
  svcPrice: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.terracotta },
  svcPriceSel: { color: colors.terracotta },
  svcDurRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  svcDur: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  svcDurSel: { color: colors.primaryDark },



  // Step 4 details
  summaryCard: {
    backgroundColor: colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    padding: 18, gap: 8,
  },
  summaryCardTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 4 },
  summaryCardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryCardDetail: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  detailsLabel: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.text },
  locCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1.5, borderColor: colors.border,
    padding: 16, position: 'relative',
  },
  locCardSel: { borderColor: colors.primary, backgroundColor: 'rgba(139,105,82,0.05)' },
  locIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center', alignItems: 'center',
  },
  locIconSel: { backgroundColor: colors.primary },
  locTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 2 },
  locTitleSel: { color: colors.primaryDark },
  locSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  locCheck: {
    position: 'absolute', top: 12, right: 12,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  notesInput: {
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 16, padding: 14,
    fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text,
    minHeight: 90, lineHeight: 22,
  },

  // Footer
  footer: {
    backgroundColor: colors.card,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 8 : 20,
    borderTopWidth: 1, borderTopColor: colors.border,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 10 },
    }) as any,
  },
  nextBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 17, paddingHorizontal: 24, borderRadius: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 54,
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(91,33,182,0.32)' },
      default: { shadowColor: '#5B21B6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 18, elevation: 8 },
    }) as any,
  },
  nextBtnDisabled: { backgroundColor: colors.textMuted, opacity: 0.6, ...(Platform.OS === 'web' ? { boxShadow: 'none' } : {}) as any },
  nextBtnText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_700Bold', letterSpacing: 0.3 },

  // Success Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  modalCard: {
    backgroundColor: colors.white, borderRadius: 28, padding: 28,
    alignItems: 'center', width: '100%', maxWidth: 380,
  },
  checkContainer: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  checkCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.success,
    justifyContent: 'center', alignItems: 'center',
  },
  confettiDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  modalTitle: {
    fontSize: 26, fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.accent, textAlign: 'center', marginBottom: 10,
  },
  modalText: {
    fontSize: 14, fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 4,
  },
  recapCard: {
    width: '100%', backgroundColor: colors.bg,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 16, marginTop: 16, gap: 6,
  },
  nextStepsWrap: { width: '100%', marginTop: 20, gap: 0 },
  nextStepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  nextStepTrack: { alignItems: 'center', width: 16 },
  nextStepDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary, marginTop: 3,
  },
  nextStepConnector: {
    width: 1.5, height: 28,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  nextStepText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, flex: 1, paddingBottom: 16 },
  modalBtn: {
    backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 25, alignItems: 'center', width: '100%', marginTop: 20,
  },
  modalBtnText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  modalSecondary: { marginTop: 12, paddingVertical: 10 },
  modalSecondaryText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  referralCard: {
    width: '100%', marginTop: 8,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.bg,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(139,105,82,0.20)',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(139,105,82,0.10)' },
      default: {},
    }) as any,
  },
  referralIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center', alignItems: 'center',
  },
  referralCardTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 2 },
  referralCardSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textMuted, lineHeight: 17 },
});
