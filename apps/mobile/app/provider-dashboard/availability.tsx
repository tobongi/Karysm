import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Switch,
} from 'react-native';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Vos disponibilités</Text>
        <Text style={styles.subtitle}>
          Définissez vos horaires pour chaque jour de la semaine.
        </Text>

        {schedule.map(slot => {
          const isExpanded = expandedDay === slot.dayOfWeek;
          return (
            <View key={slot.dayOfWeek}>
              <View style={[styles.row, !slot.isActive && styles.rowInactive]}>
                <View style={styles.dayInfo}>
                  <Text style={styles.day}>{getDayLabel(slot.dayOfWeek)}</Text>
                  {slot.isActive ? (
                    <View style={styles.timesRow}>
                      <Pressable
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
                      </Pressable>
                      <Text style={styles.timeSeparator}>—</Text>
                      <Pressable
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
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.closedText}>Fermé</Text>
                  )}
                </View>
                <Switch
                  value={slot.isActive}
                  onValueChange={() => toggleDay(slot.dayOfWeek)}
                  trackColor={{ false: colors.n300, true: colors.primaryLight }}
                  thumbColor={slot.isActive ? colors.primary : colors.textMuted}
                />
              </View>

              {isExpanded && pickingField && slot.isActive && (
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
                        <Pressable
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
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={saveAvailability}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.accent, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowInactive: { opacity: 0.6 },
  dayInfo: { flex: 1 },
  day: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 4 },
  timesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeChip: {
    backgroundColor: colors.primaryGhost,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGhost,
  },
  timeChipText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  timeChipTextActive: { color: colors.primary },
  timeSeparator: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  closedText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textMuted, fontStyle: 'italic' },

  pickerContainer: {
    backgroundColor: colors.card,
    marginBottom: 8,
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
    backgroundColor: colors.primaryGhost,
  },
  pickerChipActive: { backgroundColor: colors.primary },
  pickerChipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.primary },
  pickerChipTextActive: { color: colors.white },

  footer: { padding: 20, paddingBottom: 32, backgroundColor: colors.bg },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
  },
  saveButtonText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  buttonDisabled: { opacity: 0.6 },
});
