import React, { useState, useMemo } from 'react';
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
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck.mjs';
import IconHeart from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
import IconBuilding from '@tabler/icons-react-native/dist/esm/icons/IconBuilding.mjs';
import IconConfetti from '@tabler/icons-react-native/dist/esm/icons/IconConfetti.mjs';
import IconBabyCarriage from '@tabler/icons-react-native/dist/esm/icons/IconBabyCarriage.mjs';
import IconCertificate from '@tabler/icons-react-native/dist/esm/icons/IconCertificate.mjs';
import IconCamera from '@tabler/icons-react-native/dist/esm/icons/IconCamera.mjs';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';
import IconScissors from '@tabler/icons-react-native/dist/esm/icons/IconScissors.mjs';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles.mjs';
import IconEye from '@tabler/icons-react-native/dist/esm/icons/IconEye.mjs';
import IconLeaf from '@tabler/icons-react-native/dist/esm/icons/IconLeaf.mjs';
import IconActivity from '@tabler/icons-react-native/dist/esm/icons/IconActivity.mjs';
import IconUsers from '@tabler/icons-react-native/dist/esm/icons/IconUsers.mjs';
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { radius, spacing, screenPadding } from '../../src/theme/spacing';
import { FadeInStagger, PressableScale } from '../../src/components/animations';
import CurveHeader from '../../src/components/CurveHeader';

// ─── Constants ──────────────────────────────────────────────────────────────

const OCCASIONS: { id: string; icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>; label: string }[] = [
  { id: 'mariage',    icon: IconHeart,       label: 'Mariage' },
  { id: 'eglise',     icon: IconBuilding,    label: 'Église' },
  { id: 'fete',       icon: IconConfetti,    label: 'Fête' },
  { id: 'baby-shower',icon: IconBabyCarriage,label: 'Baby Shower' },
  { id: 'diplome',    icon: IconCertificate, label: 'Diplôme' },
  { id: 'shooting',   icon: IconCamera,      label: 'Shooting' },
  { id: 'autre',      icon: IconStar,        label: 'Autre' },
];

const SERVICES: { id: string; icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>; label: string; category: string; sub: string }[] = [
  { id: 'coiffure',   icon: IconScissors,  label: 'Coiffure / Tresses', category: 'coiffure',   sub: 'Tresses, nattes, défrisage…' },
  { id: 'ongles',     icon: IconSparkles,  label: 'Ongles / Manucure',  category: 'ongles',     sub: 'Gel, nail art, pédicure…' },
  { id: 'maquillage', icon: IconEye,       label: 'Maquillage',         category: 'maquillage', sub: 'Naturel, glam, libanais…' },
  { id: 'soin',       icon: IconLeaf,      label: 'Soin visage',        category: 'soins',      sub: 'Hydratation, gommage…' },
  { id: 'massage',    icon: IconActivity,  label: 'Massage',            category: 'soins',      sub: 'Relaxant, drainant…' },
];

const SERVICE_PLANNING: Record<string, { daysBefore: number; duration: string; label: string }> = {
  coiffure:   { daysBefore: 7, duration: '3-4h',  label: 'Coiffure / Tresses' },
  soin:       { daysBefore: 3, duration: '1h',    label: 'Soin visage' },
  ongles:     { daysBefore: 2, duration: '1h30',  label: 'Manucure' },
  massage:    { daysBefore: 1, duration: '1h',    label: 'Massage détente' },
  maquillage: { daysBefore: 0, duration: '1h30',  label: 'Maquillage' },
};

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAYS_FR   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function generateNext14Days() {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date:      d,
      dayName:   DAYS_FR[d.getDay()],
      dayNum:    d.getDate(),
      monthName: MONTHS_FR[d.getMonth()],
      dateStr:   d.toISOString().split('T')[0],
      isToday:   i === 0,
    };
  });
}

function parseDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepPill({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <View style={[s.stepPill, done && s.stepPillDone, active && s.stepPillActive]}>
      {done
        ? <IconCheck size={10} color={colors.white} strokeWidth={3} />
        : <View style={[s.stepDot, active && s.stepDotActive]} />}
      <Text style={[s.stepLabel, (done || active) && s.stepLabelActive]}>{label}</Text>
    </View>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function OccasionBookingScreen() {
  const [occasion,         setOccasion]         = useState<string | null>(null);
  const [selectedDate,     setSelectedDate]     = useState<Date | null>(null);
  const [selectedDateStr,  setSelectedDateStr]  = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [personCount,      setPersonCount]      = useState(1);
  const [personNames,      setPersonNames]      = useState<string[]>([]);

  const days = useMemo(() => generateNext14Days(), []);
  const [customDateStr, setCustomDateStr] = useState<string | null>(null);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleCustomDate = (str: string) => {
    if (!str) return;
    const d = parseDateStr(str);
    setSelectedDate(d);
    setSelectedDateStr(str);
    setCustomDateStr(str);
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updatePersonCount = (delta: number) => {
    setPersonCount(prev => {
      const next = Math.max(1, Math.min(8, prev + delta));
      if (next > prev) setPersonNames(n => [...n, ...Array(next - prev).fill('')]);
      else             setPersonNames(n => n.slice(0, next - 1));
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
          dateLabel: plan.daysBefore === 0 ? 'Jour J' : `J-${plan.daysBefore}`,
          fullDate:  `${DAYS_FR[planDate.getDay()]} ${planDate.getDate()} ${MONTHS_FR[planDate.getMonth()]}`,
        };
      })
      .sort((a, b) => a.planDate.getTime() - b.planDate.getTime());
  }, [selectedDate, selectedServices]);

  const canSearch = !!(occasion && selectedDate && selectedServices.size > 0);

  // step indicator state
  const step1done = !!occasion;
  const step2done = !!selectedDate;
  const step3done = selectedServices.size > 0;
  const step1active = !occasion;
  const step2active = !!occasion && !selectedDate;
  const step3active = !!occasion && !!selectedDate && selectedServices.size === 0;

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <View style={s.webWrapper}>

        {/* ── Curve header ─────────────────────────────────── */}
        <CurveHeader
          title="Préparer un événement"
          subtitle="Planifiez tous vos services beauté en une fois"
          height={140}
          showBack
        />

        {/* ── Step progress strip ───────────────────────────── */}
        <View style={s.stepRow}>
          <StepPill label="Occasion" done={step1done} active={step1active} />
          <View style={s.stepLine} />
          <StepPill label="Date"     done={step2done} active={step2active} />
          <View style={s.stepLine} />
          <StepPill label="Services" done={step3done} active={step3active} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Section 1: Occasion grid ───────────────────── */}
          <SectionLabel text="Quel est l'événement ?" />
          <View style={s.occasionGrid}>
            {OCCASIONS.map((o, idx) => {
              const isActive = occasion === o.id;
              return (
                <FadeInStagger key={o.id} index={idx} delay={40}>
                  <PressableScale onPress={() => setOccasion(isActive ? null : o.id)}>
                    <View style={[s.occasionCard, isActive && s.occasionCardActive]}>
                      <View style={[s.occasionIconWrap, isActive && s.occasionIconWrapActive]}>
                        <o.icon size={22} color={isActive ? colors.white : colors.primary} strokeWidth={1.8} />
                      </View>
                      <Text style={[s.occasionLabel, isActive && s.occasionLabelActive]} numberOfLines={2}>
                        {o.label}
                      </Text>
                      {isActive && (
                        <View style={s.occasionCheckBadge}>
                          <IconCheck size={9} color={colors.white} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  </PressableScale>
                </FadeInStagger>
              );
            })}
          </View>

          {/* ── Section 2: Date strip ─────────────────────── */}
          <SectionLabel text="Date de l'événement" />
          <View style={s.dateStripWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dateScroll}
          >
            {days.map((d, idx) => {
              const isActive = selectedDateStr === d.dateStr;
              return (
                <FadeInStagger key={d.dateStr} index={idx} delay={30}>
                  <PressableScale onPress={() => { setSelectedDate(d.date); setSelectedDateStr(d.dateStr); setCustomDateStr(null); }}>
                    <View style={[s.datePill, isActive && s.datePillActive]}>
                      {d.isToday && !isActive && <View style={s.todayDot} />}
                      <Text style={[s.dateDayName, isActive && s.dateDayNameActive]}>{d.dayName}</Text>
                      <Text style={[s.dateDayNum,  isActive && s.dateDayNumActive]}>{d.dayNum}</Text>
                      <Text style={[s.dateMonth,   isActive && s.dateMonthActive]}>{d.monthName}</Text>
                    </View>
                  </PressableScale>
                </FadeInStagger>
              );
            })}

            {/* ── Custom date picker chip ── */}
            <FadeInStagger index={15} delay={30}>
              <View style={s.customDateWrap}>
                {Platform.OS === 'web' ? (
                  <label style={{ position: 'relative', display: 'block' }}>
                    <View style={[s.datePill, s.datePillCustom, !!customDateStr && s.datePillActive]}>
                      <IconCalendar size={18} color={customDateStr ? colors.white : colors.accent} strokeWidth={1.8} />
                      <Text style={[s.customDateLabel, !!customDateStr && s.customDateLabelActive]}>
                        {customDateStr
                          ? (() => {
                              const d2 = parseDateStr(customDateStr);
                              return `${DAYS_FR[d2.getDay()]} ${d2.getDate()} ${MONTHS_FR[d2.getMonth()]}`;
                            })()
                          : 'Autre\ndate'}
                      </Text>
                    </View>
                    {/* @ts-ignore — web-only input */}
                    <input
                      type="date"
                      min={todayStr}
                      value={customDateStr || ''}
                      onChange={(e: any) => handleCustomDate(e.target.value)}
                      style={{
                        position: 'absolute', inset: 0, opacity: 0,
                        cursor: 'pointer', width: '100%', height: '100%',
                      }}
                    />
                  </label>
                ) : (
                  <PressableScale onPress={() => {}}>
                    <View style={[s.datePill, s.datePillCustom]}>
                      <IconCalendar size={18} color={colors.accent} strokeWidth={1.8} />
                      <Text style={s.customDateLabel}>Autre{'\n'}date</Text>
                    </View>
                  </PressableScale>
                )}
              </View>
            </FadeInStagger>
          </ScrollView>
          {/* right-edge fade to hint scrollability */}
          <View style={s.dateStripFade} pointerEvents="none" />
          </View>

          {/* ── Custom date confirmation banner ── */}
          {customDateStr && (() => {
            const d2 = parseDateStr(customDateStr);
            return (
              <View style={s.customDateBanner}>
                <IconCalendar size={14} color={colors.accent} strokeWidth={2} />
                <Text style={s.customDateBannerText}>
                  {`${DAYS_FR[d2.getDay()]} ${d2.getDate()} ${MONTHS_FR[d2.getMonth()]} ${d2.getFullYear()}`}
                </Text>
              </View>
            );
          })()}

          {/* ── Section 3: Services ───────────────────────── */}
          <SectionLabel text="Services souhaités" hint={`${selectedServices.size} sélectionné${selectedServices.size > 1 ? 's' : ''}`} />
          <View style={s.servicesContainer}>
            {SERVICES.map((svc, idx) => {
              const isSelected = selectedServices.has(svc.id);
              return (
                <FadeInStagger key={svc.id} index={idx} delay={25} style={{ width: '100%' }}>
                  <PressableScale onPress={() => toggleService(svc.id)}>
                    <View style={[s.serviceCard, isSelected && s.serviceCardSelected]}>
                      <View style={[s.serviceIconBadge, isSelected && s.serviceIconBadgeSelected]}>
                        <svc.icon size={18} color={isSelected ? colors.white : colors.primary} strokeWidth={1.8} />
                      </View>
                      <View style={s.serviceTextWrap}>
                        <Text style={[s.serviceLabel, isSelected && s.serviceLabelSelected]}>{svc.label}</Text>
                        <Text style={s.serviceSub}>{svc.sub}</Text>
                      </View>
                      <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
                        {isSelected
                          ? <IconCheck size={12} color={colors.white} strokeWidth={3} />
                          : null}
                      </View>
                    </View>
                  </PressableScale>
                </FadeInStagger>
              );
            })}
          </View>

          {/* ── Section 4: Person count ───────────────────── */}
          <SectionLabel text="Pour combien de personnes ?" />
          <View style={s.personCard}>
            <View style={s.personHeader}>
              <View style={s.personIconBadge}>
                <IconUsers size={18} color={colors.accent} strokeWidth={1.8} />
              </View>
              <Text style={s.personHint}>Groupe (1 – 8 personnes)</Text>
            </View>
            <View style={s.stepperRow}>
              <PressableScale onPress={() => updatePersonCount(-1)} disabled={personCount <= 1}>
                <View style={[s.stepperBtn, personCount <= 1 && s.stepperBtnDisabled]}>
                  <Text style={[s.stepperBtnText, personCount <= 1 && s.stepperBtnTextDisabled]}>−</Text>
                </View>
              </PressableScale>
              <View style={s.stepperValueWrap}>
                <Text style={s.stepperValue}>{personCount}</Text>
                <Text style={s.stepperUnit}>{personCount === 1 ? 'personne' : 'personnes'}</Text>
              </View>
              <PressableScale onPress={() => updatePersonCount(1)} disabled={personCount >= 8}>
                <View style={[s.stepperBtn, personCount >= 8 && s.stepperBtnDisabled]}>
                  <Text style={[s.stepperBtnText, personCount >= 8 && s.stepperBtnTextDisabled]}>+</Text>
                </View>
              </PressableScale>
            </View>
            {personCount > 1 && (
              <View style={s.personNamesWrap}>
                <Text style={s.personNameHint}>Noms des autres participantes (optionnel)</Text>
                {Array.from({ length: personCount - 1 }, (_, i) => (
                  <TextInput
                    key={i}
                    style={s.personNameInput}
                    placeholder={`Personne ${i + 2}`}
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

          {/* ── Section 5: Timeline ───────────────────────── */}
          {planning.length > 0 && (
            <>
              <SectionLabel text="Planning suggéré" />
              <View style={s.timelineCard}>
                <Text style={s.timelineIntro}>
                  Basé sur votre date, voici quand planifier chaque service.
                </Text>
                {planning.map((item, index) => (
                  <View key={item.id} style={s.timelineItem}>
                    <View style={s.timelineLeft}>
                      <View style={[
                        s.timelineDot,
                        item.dateLabel === 'Jour J' ? s.timelineDotAccent : s.timelineDotPrimary,
                      ]} />
                      {index < planning.length - 1 && <View style={s.timelineConnector} />}
                    </View>
                    <View style={s.timelineRight}>
                      <View style={s.timelineMeta}>
                        <View style={[
                          s.timelineBadge,
                          item.dateLabel === 'Jour J' ? s.timelineBadgeAccent : s.timelineBadgePrimary,
                        ]}>
                          <Text style={s.timelineBadgeText}>{item.dateLabel}</Text>
                        </View>
                        <Text style={s.timelineFullDate}>{item.fullDate}</Text>
                      </View>
                      <Text style={s.timelineService}>{item.label}</Text>
                      <Text style={s.timelineDuration}>{item.duration}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ── Sticky CTA ───────────────────────────────────── */}
        <View style={s.ctaWrap}>
          {!canSearch && (
            <Text style={s.ctaHint}>
              {!occasion ? 'Choisissez une occasion' : !selectedDate ? 'Choisissez une date' : 'Choisissez au moins un service'}
            </Text>
          )}
          <PressableScale
            onPress={() => {
              if (!canSearch) return;
              const categories = Array.from(selectedServices)
                .map(id => SERVICES.find(sv => sv.id === id)?.category)
                .filter(Boolean)
                .join(',');
              router.push({ pathname: '/(tabs)/', params: { occasion, categories } } as any);
            }}
            disabled={!canSearch}
          >
            <View style={[s.ctaBtn, !canSearch && s.ctaBtnDisabled]}>
              <Text style={s.ctaBtnText}>Rechercher des prestataires</Text>
              {canSearch && <IconChevronRight size={20} color={colors.white} strokeWidth={2} />}
            </View>
          </PressableScale>
        </View>

      </View>
    </SafeAreaView>
  );
}

// ─── Section label helper ────────────────────────────────────────────────────

function SectionLabel({ text, hint }: { text: string; hint?: string }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionLabel}>{text}</Text>
      {hint ? <Text style={s.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const ACCENT_TINT = 'rgba(91,33,182,0.08)';
const ACCENT_BORDER = 'rgba(91,33,182,0.22)';

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
  } as ViewStyle,

  // ── Step progress ──────────────────────────────────────
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPadding.horizontal,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as ViewStyle,
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
  } as ViewStyle,
  stepPillDone: {
    backgroundColor: colors.accent,
  },
  stepPillActive: {
    backgroundColor: ACCENT_TINT,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.accent,
  },
  stepLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.accent,
    fontFamily: fonts.bodySemiBold,
  },

  // ── Scroll ────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // ── Section labels ────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: screenPadding.horizontal,
    marginTop: spacing.xxl,   // 32px — generous inter-section gap
    marginBottom: spacing.sm, // 12px tight to label's content
  } as ViewStyle,
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.accent,
  },

  // ── Occasion grid ─────────────────────────────────────
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: screenPadding.horizontal,
    gap: 10,
  } as ViewStyle,
  occasionCard: {
    // 4 columns: (430 - 48px gutters - 30px gaps) / 4 ≈ 88px — use flex instead
    flex: 1,
    minWidth: 72,
    maxWidth: 100,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  } as ViewStyle,
  occasionCardActive: {
    backgroundColor: ACCENT_TINT,
    borderColor: colors.accent,
  },
  occasionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  occasionIconWrapActive: {
    backgroundColor: colors.accent,
  },
  occasionLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
  },
  occasionLabelActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.accent,
  },
  occasionCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Date strip ────────────────────────────────────────
  dateStripWrap: {
    position: 'relative',
  } as ViewStyle,
  dateStripFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    // gradient from transparent → bg to hint more content
    backgroundImage: `linear-gradient(to right, transparent, ${colors.bg})`,
    pointerEvents: 'none',
  } as any,
  dateScroll: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 10,
  },
  datePill: {
    width: 64,
    height: 82,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    position: 'relative',
    overflow: 'hidden',
  } as ViewStyle,
  datePillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  todayDot: {
    position: 'absolute',
    top: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  dateDayName: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  dateDayNameActive: { color: 'rgba(255,255,255,0.75)' },
  dateDayNum: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  dateDayNumActive: { color: colors.white },
  dateMonth: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
  },
  dateMonthActive: { color: 'rgba(255,255,255,0.7)' },

  // ── Custom date chip ─────────────────────────────────
  customDateWrap: {
    position: 'relative',
  } as ViewStyle,
  datePillCustom: {
    width: 72,
    height: 82,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    borderWidth: 1.5,
    backgroundColor: ACCENT_TINT,
    gap: 4,
  },
  customDateLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.accent,
    textAlign: 'center',
  },
  customDateLabelActive: {
    color: colors.white,
  },
  customDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: screenPadding.horizontal,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: ACCENT_TINT,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
  } as ViewStyle,
  customDateBannerText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.accent,
  },

  // ── Services ──────────────────────────────────────────
  servicesContainer: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 8,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  } as ViewStyle,
  serviceCardSelected: {
    backgroundColor: ACCENT_TINT,
    borderColor: colors.accent,
  },
  serviceIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIconBadgeSelected: {
    backgroundColor: colors.accent,
  },
  serviceTextWrap: {
    flex: 1,
    gap: 2,
  },
  serviceLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  serviceLabelSelected: {
    color: colors.accent,
  },
  serviceSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
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

  // ── Person stepper ────────────────────────────────────
  personCard: {
    marginHorizontal: screenPadding.horizontal,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as ViewStyle,
  personIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ACCENT_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  } as ViewStyle,
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ACCENT_TINT,
  },
  stepperBtnDisabled: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  stepperBtnText: {
    fontSize: 22,
    color: colors.accent,
    fontWeight: '500',
    lineHeight: 26,
  },
  stepperBtnTextDisabled: {
    color: colors.textMuted,
  },
  stepperValueWrap: {
    alignItems: 'center',
    minWidth: 80,
  },
  stepperValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 40,
  },
  stepperUnit: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  personNamesWrap: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  personNameHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  personNameInput: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ── Timeline ──────────────────────────────────────────
  timelineCard: {
    marginHorizontal: screenPadding.horizontal,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineIntro: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 64,
  } as ViewStyle,
  timelineLeft: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  timelineDotPrimary: {
    backgroundColor: colors.primary,
  },
  timelineDotAccent: {
    backgroundColor: colors.accent,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 20,
    gap: 3,
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  timelineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  timelineBadgePrimary: {
    backgroundColor: colors.primaryGhost,
  },
  timelineBadgeAccent: {
    backgroundColor: ACCENT_TINT,
  },
  timelineBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
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
  },
  timelineDuration: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },

  // ── CTA ───────────────────────────────────────────────
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: screenPadding.horizontal,
    paddingBottom: Platform.OS === 'web' ? 24 : 20,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  } as ViewStyle,
  ctaHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  ctaBtn: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    borderRadius: radius.xxl,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  } as ViewStyle,
  ctaBtnDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.45,
  },
  ctaBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.2,
  },
});
