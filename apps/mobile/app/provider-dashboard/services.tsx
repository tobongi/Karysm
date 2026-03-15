import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../src/theme/colors';

const MOCK_SERVICES = [
  { id: '1', name: 'Tresses collees', durationMin: 90, priceMin: 5000, priceMax: 8000, isActive: true },
  { id: '2', name: 'Tissage complet', durationMin: 120, priceMin: 12000, priceMax: 20000, isActive: true },
  { id: '3', name: 'Locs twist', durationMin: 60, priceMin: 4000, priceMax: null, isActive: false },
];

export default function ServicesScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_SERVICES}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.isActive && styles.cardInactive]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{item.name}</Text>
              <Text style={styles.serviceDuration}>{item.durationMin} min</Text>
            </View>
            <Text style={styles.servicePrice}>
              {item.priceMin.toLocaleString()}{item.priceMax ? ` - ${item.priceMax.toLocaleString()}` : ''} FC
            </Text>
          </View>
        )}
      />
      <Pressable style={styles.addButton}>
        <Text style={styles.addText}>+ Ajouter un service</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 20, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  cardInactive: { opacity: 0.5 },
  serviceName: { fontSize: 16, fontWeight: '600', color: colors.text },
  serviceDuration: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  servicePrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  addButton: {
    margin: 20, backgroundColor: colors.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
  },
  addText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
