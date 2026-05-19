import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Switch, Platform,
} from 'react-native';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';
import CurveHeader from '../../src/components/CurveHeader';
import { PressableScale, FadeInStagger } from '../../src/components/animations';

interface AvailabilitySlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DAYS: { key: string; label: string }[] = [
  { key: 'MON', label: 'Lundi' },
  { key: 'TUE', label: 'Mardi' },
  { key: 'WED', label: 'Mercredi' },
  { key: 'THU', label: 'Jeudi' },
  { key: 'FRI', label: 'Vendredi' },
  { key: 'SAT', label: 'Samedi' },
  { key: 'SUN', label: 'Dimanche' },
];

// Generate time slots every 30 min from 06:00 to 22:00
const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const DEFAULT_SCHEDULE: AvailabilitySlot[] = DAYS.map(d => ({
  dayOfWeek: d.key,
  startTime: '08:00',
  endTime: '18:00',
  isActive: d.key !== 'SUN',
}));

export default function AvailabilityScreen() {
  const [schedule, setSchedule] = useState<AvailabilitySlot[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [pickingField, setPickingField] = useState<'start' | 'end' | null>(null);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await api<{ success: boolean; data: any }>('/provider/profile');
      const avail: any[] = res.data.availability || [];
      if (avail.length > 0) {
        const merged = DAYS.map(d => {
          const existing = avail.find((a: any) => a.dayOfWeek === d.key);
          if (existing) {
            return {
              dayOfWeek: d.key,
              startTime: existing.startTime,
              endTime: existing.endTime,
              isActive: existing.isActive ?? true,
            };
          }
          return {
            dayOfWeek: d.key,
            startTime: '08:00',
            endTime: '18:00',
            isActive: false,
          };
        });
        setSchedule(merged);
      }
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de charger les disponibilités');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAvailability();
      setLoading(false);
    })();
  }, [fetchAvailability]);

  function toggleDay(dayKey: string) {
    setSchedule(prev =>
      prev.map(s =>
        s.dayOfWeek === dayKey ? { ...s, isActive: !s.isActive } : s,
      ),
    );
  }

  function selectTime(dayKey: string, field: 'start' | 'end', time: string) {
    setSchedule(prev =>
      prev.map(s =>
        s.dayOfWeek === dayKey
          ? { ...s, [field === 'start' ? 'startTime' : 'endTime']: time }
          : s,
      ),
    );
    setPickingField(null);
    setExpandedDay(null);
  }

  function openTimePicker(dayKey: string, field: 'start' | 'end') {
    if (expandedDay === dayKey && pickingField === field) {
      setExpandedDay(null);
      setPickingField(null);
    } else {
      setExpandedDay(dayKey);
      setPickingField(field);
    }
  }

  async function saveAvailability() {
    setSaving(true);
    try {
      await api('/provider/availability', {
        method: 'PUT',
        body: JSON.stringify({ schedule }),
      });
      showAlert('Succès', 'Vos disponibilités ont été enregistrées');
    } catch (err: any) {
      showAlert('Erreur', err.message || 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getDayLabel = (key: string) => DAYS.find(d => d.key === key)?.label || key;
  const getDayShort = (key: string) => {
    const map: Record<string, string> = {
      MON: 'L', TUE: 'M', WED: 'M', THU: 'J', FRI: 'V', SAT: 'S', SUN: 'D',
    };
    return map[key] || key;
  };

  return (
    <View style={styles.container}>
      <CurveHeader title="Disponibilités" showBack height={160} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.helperText}>
          Vos clientes verront uniquement les créneaux libres.
        </Text>

        <View style={styles.daysRow}>
          {DAYS.map((day, idx) => {
            const slot = schedule.find(s => s.dayOfWeek === day.key);
            if (!slot) return null;
            return (
              <PressableScale
                key={day.key}
                style={[styles.dayPill, slot.isActive && styles.dayPillActive]}
                onPress={() => toggleDay(day.key)}
              >
                <Text style={[styles.dayPillText, slot.isActive && styles.dayPillTextActive]}>
                  {getDayShort(day.key)}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.slotsContainer}>
          {schedule.map(slot => {
            const isExpanded = expandedDay === slot.dayOfWeek;
            if (!slot.isActive) return null;
            return (
              <View key={slot.dayOfWeek} style={styles.daySection}>
                <Text style={styles.daySectionTitle}>{getDayLabel(slot.dayOfWeek)}</Text>

                <View style={styles.timesRow}>
                  <PressableScale
                    style={[
                      styles.timeChip,
                      isExpanded && pickingField === 'start' && styles.timeChipActive,
                    ]}
                    onPress={() => openTimePicker(slot.dayOfWeek, 'start')}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        isExpanded && pickingField === 'start' && styles.timeChipTextActive,
                      ]}
                    >
                      {slot.startTime}
                    </Text>
                  </PressableScale>
                  <Text style={styles.timeSeparator}>—</Text>
                  <PressableScale
                    style={[
                      styles.timeChip,
                      isExpanded && pickingField === 'end' && styles.timeChipActive,
                    ]}
                    onPress={() => openTimePicker(slot.dayOfWeek, 'end')}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        isExpanded && pickingField === 'end' && styles.timeChipTextActive,
                      ]}
                    >
                      {slot.endTime}
                    </Text>
                  </PressableScale>
                </View>

                {isExpanded && pickingField && (
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>
                      {pickingField === 'start' ? 'Heure de début' : 'Heure de fin'}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.pickerScroll}
                    >
                      {TIME_SLOTS.map(time => {
                        const currentValue =
                          pickingField === 'start' ? slot.startTime : slot.endTime;
                        const isSelected = time === currentValue;
                        return (
                          <PressableScale
                            key={time}
                            style={[
                              styles.pickerChip,
                              isSelected && styles.pickerChipActive,
                            ]}
                            onPress={() =>
                              selectTime(slot.dayOfWeek, pickingField, time)
                            }
                          >
                            <Text
                              style={[
                                styles.pickerChipText,
                                isSelected && styles.pickerChipTextActive,
                              ]}
                            >
                              {time}
                            </Text>
                          </PressableScale>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PressableScale
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={saveAvailability}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Appliquer et enregistrer</Text>
          )}
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { padding: 20, paddingBottom: 100 },
  helperText: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginBottom: 20, lineHeight: 20 },

  // Days row with pills
  daysRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  dayPill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayPillText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  dayPillTextActive: { color: colors.white },

  // Slots container
  slotsContainer: { marginBottom: 24 },
  daySection: { marginBottom: 20 },
  daySectionTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 10 },

  timesRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeChip: {
    flex: 1,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  timeChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  timeChipText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  timeChipTextActive: { color: colors.white },
  timeSeparator: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textMuted },

  pickerContainer: {
    backgroundColor: colors.card,
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  pickerLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary, marginBottom: 8 },
  pickerScroll: { gap: 6, paddingRight: 12 },
  pickerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pickerChipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  pickerChipTextActive: { color: colors.white },

  footer: { padding: 20, paddingBottom: 32, backgroundColor: colors.bg },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(139,105,82,0.25)' }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        }
    ) as any,
  },
  saveButtonText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  buttonDisabled: { opacity: 0.6 },
});
