import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/theme/colors';

export default function MessagesTab() {
  return (
    <View style={styles.container}>
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🔔</Text>
        <Text style={styles.emptyTitle}>Notifications</Text>
        <Text style={styles.emptyText}>Vos notifications de reservation apparaitront ici.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
