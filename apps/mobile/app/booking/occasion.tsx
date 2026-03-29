import { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react-native';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { radius, spacing, screenPadding } from '../../src/theme/spacing';

// ─── Constants ──────────────────────────────────────────────────────────────

const OCCASIONS = [
  { id: 'mariage', emoji: '💒', label: 'Mariage' },
  { id: 'eglise', emoji: '⛪', label: 'Église' },
  { id: 'fete', emoji: '🎉', label: 'Fête' },
  { id: 'baby-shower', emoji: '👶', label: 'Baby Shower' },
  { id: 'diplome', emoji: '🎓', label: 'Diplôme' },
  { id: 'shooting', emoji: '📸', label: 'Shooting Photo' },
  { id: 'autre', emoji: '🌟', label: 'Autre' },
];

const SERVICES = [
  { id: 'coiffure', emoji: '✂️', label: 'Coiffure / Tresses', category: 'coiffure' },
  { id: 'ongles', emoji: '💅', label: 'Ongles / Manucure', category: 'ongles' },
  { id: 'maquillage', emoji: '💄', label: 'Maquillage', category: 'maquillage' },
  { id: 'soin', emoji: '💆', label: 'Soin visage', category: 'spa' },
  { id: 'massage', emoji: '💪', label: 'Massage', category: 'massage' },
];

const SERVICE_PLANNING: Record<string, { daysBefore: number; duration: string; label: string }> = {
  coiffure: { daysBefore: 7, duration: '3-4h', label: 'Coiffure / Tresses' },
  soin: { daysBefore: 3, duration: '1h', label: 'Soin visage' },
  ongles: { daysBefore: 2, duration: '1h30', label: 'Manucure' },
  massage: { daysBefore: 1, duration: '1h', label: 'Massage détente' },
  maquillage: { daysBefore: 0, duration: '1h30', label: 'Maquillage' },
};

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function generateNext30Days(): { date: Date; dayName: string; dayNum: number; monthName: string; dateStr: string }[] {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      dayName: DAYS_FR[d.getDay()],
      dayNum: d.getDate(),
      monthName: MONTHS_FR[d.getMonth()],
      dateStr: d.toISOString().split('T')[0],
    });
  }
  return days;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function OccasionBookingScreen() {
  const [occasion, setOccasion] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [personCount, setPersonCount] = useState(1);
  const [personNames, setPersonNames] = useState<string[]>([]);
  const [serviceNotes, setServiceNotes] = useState<Record<string, string>>({});

  const days = useMemo(() => generateNext30Days(), []);

  const toggleService = (id: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Clear note
        setServiceNotes(n => {
          const copy = { ...n };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updatePersonCount = (delta: number) => {
    setPersonCount(prev => {
      const next = Math.max(1, Math.min(8, prev + delta));
      // Adjust names array
      if (next > prev) {
        setPersonNames(names => [...names, ...Array(next - prev).fill('')]);
      } else {
        setPersonNames(names => names.slice(0, next - 1));
      }
      return next;
    });
  };

  const planning = useMemo(() => {
    if (!selectedDate || selectedServices.size === 0) return [];
    return Array.from(selectedServices)
      .filter(id => SERVICE_PLANNING[id])
      .map(id => {
        const plan = SERVICE_PLANNING[id];
        const planDate = new Date(selectedDate);
        planDate.setDate(planDate.getDate() - plan.daysBefore);
        return {
          id,
          ...plan,
          planDate,
          dateLabel: plan.daysBefore === 0
            ? 'Jour J'
            : `J-${plan.daysBefore}`,
          fullDate: `${DAYS_FR[planDate.getDay()]} ${planDate.getDate()} ${MONTHS_FR[planDate.getMonth()]}`,
        };
      })
      .sort((a, b) => a.planDate.getTime() - b.planDate.getTime());
  }, [selectedDate, selectedServices]);

  const canSearch = occasion && selectedDate && selectedServices.size > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.webWrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <IconArrowLeft size={22} color={colors.text} strokeWidth={2} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Préparer un événement</Text>
              <Text style={styles.headerSubtitle}>
                Planifiez tous vos services beauté en une fois
              </Text>
            </View>
          </View>

          {/* Section 1: Occasion selector */}
          <Text style={styles.sectionLabel}>Quel est l'événement ?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.occasionScroll}
          >
            {OCCASIONS.map(o => {
              const isActive = occasion === o.id;
              return (
                <Pressable
                  key={o.id}
                  style={[styles.occasionChip, isActive && styles.occasionChipActive]}
                  onPress={() => setOccasion(isActive ? null : o.id)}
                >
                  <Text style={styles.occasionEmoji}>{o.emoji}</Text>
                  <Text style={[styles.occasionLabel, isActive && styles.occasionLabelActive]}>
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Section 2: Date picker */}
          <Text style={styles.sectionLabel}>Date de l'événement</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScroll}
          >
            {days.map(d => {
              const isActive = selectedDateStr === d.dateStr;
              return (
                <Pressable
                  key={d.dateStr}
                  style={[styles.dateCircle, isActive && styles.dateCircleActive]}
                  onPress={() => {
                    setSelectedDate(d.date);
                    setSelectedDateStr(d.dateStr);
                  }}
                >
                  <Text style={[styles.dateDayName, isActive && styles.dateDayNameActive]}>
                    {d.dayName}
                  </Text>
                  <Text style={[styles.dateDayNum, isActive && styles.dateDayNumActive]}>
                    {d.dayNum}
                  </Text>
                  <Text style={[styles.dateMonth, isActive && styles.dateMonthActive]}>
                    {d.monthName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Section 3: Services multi-select */}
          <Text style={styles.sectionLabel}>Services souhaités</Text>
          <View style={styles.servicesContainer}>
            {SERVICES.map(svc => {
              const isSelected = selectedServices.has(svc.id);
              return (
                <View key={svc.id}>
                  <Pressable
                    style={[styles.serviceRow, isSelected && styles.serviceRowSelected]}
                    onPress={() => toggleService(svc.id)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <IconCheck size={14} color={colors.white} strokeWidth={3} />}
                    </View>
                    <Text style={styles.serviceEmoji}>{svc.emoji}</Text>
                    <Text style={[styles.serviceLabel, isSelected && styles.serviceLabelSelected]}>
                      {svc.label}
                    </Text>
                  </Pressable>
                  {isSelected && (
                    <TextInput
                      style={styles.noteInput}
                      placeholder="Précision (optionnel) — ex: tresses avec rajouts"
                      placeholderTextColor={colors.textMuted}
                      value={serviceNotes[svc.id] || ''}
                      onChangeText={text =>
                        setServiceNotes(prev => ({ ...prev, [svc.id]: text }))
                      }
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Section 4: Person count */}
          <Text style={styles.sectionLabel}>Pour combien de personnes ?</Text>
          <View style={styles.personSection}>
            <View style={styles.stepperRow}>
              <Pressable
                style={[styles.stepperBtn, personCount <= 1 && styles.stepperBtnDisabled]}
                onPress={() => updatePersonCount(-1)}
                disabled={personCount <= 1}
              >
                <Text style={[styles.stepperBtnText, personCount <= 1 && styles.stepperBtnTextDisabled]}>
                  −
                </Text>
              </Pressable>
              <Text style={styles.stepperValue}>{personCount}</Text>
              <Pressable
                style={[styles.stepperBtn, personCount >= 8 && styles.stepperBtnDisabled]}
                onPress={() => updatePersonCount(1)}
                disabled={personCount >= 8}
              >
                <Text style={[styles.stepperBtnText, personCount >= 8 && styles.stepperBtnTextDisabled]}>
                  +
                </Text>
              </Pressable>
            </View>
            {personCount > 1 && (
              <View style={styles.personNamesContainer}>
                <Text style={styles.personHint}>
                  Prix estimé sera multiplié par le nombre de personnes
                </Text>
                {Array.from({ length: personCount - 1 }, (_, i) => (
                  <TextInput
                    key={i}
                    style={styles.personNameInput}
                    placeholder={`Nom personne ${i + 2} (optionnel)`}
                    placeholderTextColor={colors.textMuted}
                    value={personNames[i] || ''}
                    onChangeText={text => {
                      setPersonNames(prev => {
                        const copy = [...prev];
                        copy[i] = text;
                        return copy;
                      });
                    }}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Section 5: Planning timeline */}
          {planning.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Planning suggéré</Text>
              <View style={styles.timelineCard}>
                {planning.map((item, index) => (
                  <View key={item.id} style={styles.timelineItem}>
                    {/* Left: dot + connector */}
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineDot,
                        item.dateLabel === 'Jour J' && styles.timelineDotAccent,
                      ]} />
                      {index < planning.length - 1 && (
                        <View style={styles.timelineConnector} />
                      )}
                    </View>
                    {/* Right: content */}
                    <View style={styles.timelineRight}>
                      <View style={styles.timelineDateRow}>
                        <Text style={styles.timelineDateLabel}>{item.dateLabel}</Text>
                        <Text style={styles.timelineFullDate}>{item.fullDate}</Text>
                      </View>
                      <Text style={styles.timelineService}>
                        {item.label}
                        <Text style={styles.timelineDuration}> ({item.duration})</Text>
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Spacer for CTA */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Pressable
            style={[styles.ctaButton, !canSearch && styles.ctaButtonDisabled]}
            onPress={() => {
              if (!canSearch) return;
              const categories = Array.from(selectedServices)
                .map(id => SERVICES.find(s => s.id === id)?.category)
                .filter(Boolean)
                .join(',');
              router.push(
                `/(tabs)?occasion=${encodeURIComponent(occasion || '')}&categories=${categories}` as any
              );
            }}
            disabled={!canSearch}
          >
            <Text style={[styles.ctaText, !canSearch && styles.ctaTextDisabled]}>
              Rechercher des professionnelles
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
  } as ViewStyle,
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  } as ViewStyle,
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Section labels
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: screenPadding.horizontal,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // Occasion chips
  occasionScroll: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 10,
  },
  occasionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  } as ViewStyle,
  occasionChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  occasionEmoji: {
    fontSize: 16,
  },
  occasionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  occasionLabelActive: {
    color: colors.white,
  },

  // Date picker
  dateScroll: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 10,
  },
  dateCircle: {
    width: 64,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  dateCircleActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dateDayName: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
  },
  dateDayNameActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  dateDayNum: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  dateDayNumActive: {
    color: colors.white,
  },
  dateMonth: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  dateMonthActive: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Services
  servicesContainer: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  } as ViewStyle,
  serviceRowSelected: {
    borderColor: 'rgba(124,58,237,0.2)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  serviceEmoji: {
    fontSize: 18,
  },
  serviceLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  serviceLabelSelected: {
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
  },
  noteInput: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
    marginLeft: 50,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Person stepper
  personSection: {
    paddingHorizontal: screenPadding.horizontal,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  } as ViewStyle,
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    borderColor: colors.border,
  },
  stepperBtnText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  stepperBtnTextDisabled: {
    color: colors.textMuted,
  },
  stepperValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    minWidth: 64,
    textAlign: 'center',
  },
  personNamesContainer: {
    marginTop: spacing.sm,
    gap: 8,
  },
  personHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  personNameInput: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Timeline
  timelineCard: {
    marginHorizontal: screenPadding.horizontal,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  } as ViewStyle,
  timelineLeft: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  timelineDotAccent: {
    backgroundColor: colors.accent,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  timelineDateLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  timelineFullDate: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  timelineService: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  timelineDuration: {
    fontFamily: fonts.body,
    fontWeight: '400',
    color: colors.textSecondary,
  },

  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: screenPadding.horizontal,
    paddingBottom: Platform.OS === 'web' ? 20 : 10,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  } as ViewStyle,
  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: colors.border,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  ctaTextDisabled: {
    color: colors.textMuted,
  },
});
