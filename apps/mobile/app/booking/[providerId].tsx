import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../src/theme/colors';

const AVAILABLE_DATES = ['2026-03-18', '2026-03-19', '2026-03-20', '2026-03-21', '2026-03-22'];
const AVAILABLE_TIMES = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

export default function BookingFlow() {
  const { providerId, serviceId } = useLocalSearchParams<{ providerId: string; serviceId?: string }>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<'CLIENT' | 'PROVIDER'>('CLIENT');

  function handleConfirm() {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Attention', 'Choisissez une date et un horaire');
      return;
    }
    // TODO: POST /api/bookings
    Alert.alert('Reservation envoyee !', 'Le prestataire va confirmer votre demande.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Choisir une date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesRow}>
        {AVAILABLE_DATES.map(date => {
          const d = new Date(date);
          const day = d.toLocaleDateString('fr-FR', { weekday: 'short' });
          const num = d.getDate();
          return (
            <Pressable
              key={date}
              style={[styles.dateChip, selectedDate === date && styles.dateChipActive]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dateDay, selectedDate === date && styles.dateTextActive]}>{day}</Text>
              <Text style={[styles.dateNum, selectedDate === date && styles.dateTextActive]}>{num}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>Choisir un horaire</Text>
      <View style={styles.timesGrid}>
        {AVAILABLE_TIMES.map(time => (
          <Pressable
            key={time}
            style={[styles.timeChip, selectedTime === time && styles.timeChipActive]}
            onPress={() => setSelectedTime(time)}
          >
            <Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>{time}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Lieu du rendez-vous</Text>
      <View style={styles.locationRow}>
        <Pressable
          style={[styles.locationOption, locationType === 'CLIENT' && styles.locationActive]}
          onPress={() => setLocationType('CLIENT')}
        >
          <Text style={styles.locationEmoji}>🏠</Text>
          <Text style={[styles.locationText, locationType === 'CLIENT' && styles.locationTextActive]}>Chez moi</Text>
        </Pressable>
        <Pressable
          style={[styles.locationOption, locationType === 'PROVIDER' && styles.locationActive]}
          onPress={() => setLocationType('PROVIDER')}
        >
          <Text style={styles.locationEmoji}>💈</Text>
          <Text style={[styles.locationText, locationType === 'PROVIDER' && styles.locationTextActive]}>Au salon</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resume</Text>
        <Text style={styles.summaryItem}>📅 {selectedDate || '—'} a {selectedTime || '—'}</Text>
        <Text style={styles.summaryItem}>📍 {locationType === 'CLIENT' ? 'A domicile' : 'Au salon'}</Text>
        <Text style={styles.summaryItem}>💰 Acompte: 1 500 FC (30%)</Text>
      </View>

      <Pressable style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmText}>Confirmer la reservation</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 20 },
  datesRow: { flexDirection: 'row', marginBottom: 8 },
  dateChip: {
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginRight: 10,
  },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateDay: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  dateNum: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
  dateTextActive: { color: colors.white },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  timeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeText: { fontSize: 15, fontWeight: '600', color: colors.text },
  timeTextActive: { color: colors.white },
  locationRow: { flexDirection: 'row', gap: 12 },
  locationOption: {
    flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 14,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  locationActive: { borderColor: colors.primary, backgroundColor: 'rgba(224,122,95,0.05)' },
  locationEmoji: { fontSize: 28, marginBottom: 8 },
  locationText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  locationTextActive: { color: colors.primary },
  summary: {
    marginTop: 28, backgroundColor: colors.card, padding: 20, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  summaryItem: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  confirmButton: {
    marginTop: 24, backgroundColor: colors.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
  },
  confirmText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
