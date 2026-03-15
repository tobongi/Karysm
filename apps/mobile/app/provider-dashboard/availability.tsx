import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/theme/colors';

const SCHEDULE = [
  { day: 'Lundi', start: '08:00', end: '18:00', active: true },
  { day: 'Mardi', start: '08:00', end: '18:00', active: true },
  { day: 'Mercredi', start: '08:00', end: '18:00', active: true },
  { day: 'Jeudi', start: '08:00', end: '18:00', active: true },
  { day: 'Vendredi', start: '08:00', end: '18:00', active: true },
  { day: 'Samedi', start: '09:00', end: '14:00', active: true },
  { day: 'Dimanche', start: '', end: '', active: false },
];

export default function AvailabilityScreen() {
  return (
    <View style={styles.container}>
      {SCHEDULE.map((slot, i) => (
        <View key={i} style={[styles.row, !slot.active && styles.rowInactive]}>
          <Text style={styles.day}>{slot.day}</Text>
          <Text style={styles.hours}>
            {slot.active ? `${slot.start} - ${slot.end}` : 'Ferme'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  rowInactive: { opacity: 0.5 },
  day: { fontSize: 16, fontWeight: '600', color: colors.text },
  hours: { fontSize: 15, color: colors.textSecondary },
});
