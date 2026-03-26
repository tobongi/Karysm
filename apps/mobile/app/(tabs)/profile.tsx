import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { pickAndUploadAvatar } from '../../src/lib/upload';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';

export default function ProfileTab() {
  const { user, logout, isProvider } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleAvatarUpload() {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar();
      if (!url) { setUploadingAvatar(false); return; }
      setAvatar(url);
      // Persist avatar to provider profile if provider, otherwise just keep locally
      if (isProvider) {
        try {
          await api('/provider/profile', {
            method: 'PUT',
            body: JSON.stringify({ avatarUrl: url }),
          });
        } catch {
          // silently ignore — avatar is already uploaded to Cloudinary
        }
      }
    } catch (err: any) {
      showAlert('Erreur', err.message || "Impossible d'envoyer la photo");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarContainer}>
        <Pressable onPress={handleAvatarUpload} style={styles.avatarWrapper}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          {uploadingAvatar ? (
            <View style={styles.cameraOverlay}>
              <ActivityIndicator color={colors.white} size="small" />
            </View>
          ) : (
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>{'\uD83D\uDCF7'}</Text>
            </View>
          )}
        </Pressable>
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
              <Text style={styles.menuEmoji}>💇🏿</Text>
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
            <Pressable style={styles.menuItem} onPress={() => router.push('/wallet' as any)}>
              <Text style={styles.menuEmoji}>💳</Text>
              <Text style={styles.menuText}>Portefeuille</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => router.push('/kyc' as any)}>
              <Text style={styles.menuEmoji}>🪪</Text>
              <Text style={styles.menuText}>Vérification identité</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          </>
        )}

        <Pressable style={styles.menuItem} onPress={() => router.push('/favorites' as any)}>
          <Text style={styles.menuEmoji}>❤️</Text>
          <Text style={styles.menuText}>Favoris</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>

        <Pressable style={styles.menuItem} onPress={() => router.push('/settings/edit-profile' as any)}>
          <Text style={styles.menuEmoji}>⚙️</Text>
          <Text style={styles.menuText}>Paramètres</Text>
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
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  cameraIcon: { fontSize: 14 },
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
