import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';

export default function ProfileTab() {
  const { user, logout, isProvider } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Utilisateur'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        {isProvider && (
          <View style={styles.providerBadge}>
            <Text style={styles.providerBadgeText}>✨ Prestataire</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        {!isProvider && (
          <Pressable style={styles.menuItem} onPress={() => router.push('/provider-register')}>
            <Text style={styles.menuEmoji}>💼</Text>
            <Text style={styles.menuText}>Devenir prestataire</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        )}

        {isProvider && (
          <>
            <Pressable style={styles.menuItem} onPress={() => router.push('/provider-dashboard/services')}>
              <Text style={styles.menuEmoji}>💇</Text>
              <Text style={styles.menuText}>Mes services</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => router.push('/provider-dashboard/availability')}>
              <Text style={styles.menuEmoji}>📅</Text>
              <Text style={styles.menuText}>Disponibilites</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => router.push('/provider-dashboard/earnings')}>
              <Text style={styles.menuEmoji}>{'\uD83D\uDCB0'}</Text>
              <Text style={styles.menuText}>Mes revenus</Text>
              <Text style={styles.menuArrow}>{'\u203A'}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => router.push('/request/browse' as any)}>
              <Text style={styles.menuEmoji}>{'\uD83D\uDCCB'}</Text>
              <Text style={styles.menuText}>Demandes ouvertes</Text>
              <Text style={styles.menuArrow}>{'\u203A'}</Text>
            </Pressable>
          </>
        )}

        <Pressable style={styles.menuItem}>
          <Text style={styles.menuEmoji}>❤️</Text>
          <Text style={styles.menuText}>Favoris</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>

        <Pressable style={styles.menuItem}>
          <Text style={styles.menuEmoji}>⚙️</Text>
          <Text style={styles.menuText}>Parametres</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={() => { logout(); router.replace('/auth/login'); }}>
        <Text style={styles.logoutText}>Se deconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.white },
  name: { fontSize: 22, fontWeight: '700', color: colors.accent },
  phone: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  providerBadge: {
    marginTop: 8, backgroundColor: colors.primaryGhost,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
  },
  providerBadgeText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  section: { gap: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: 12, marginBottom: 8,
  },
  menuEmoji: { fontSize: 20, marginRight: 14 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  menuArrow: { fontSize: 22, color: colors.textMuted },
  logoutButton: {
    marginTop: 32, paddingVertical: 14, alignItems: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: colors.error,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.error },
});
