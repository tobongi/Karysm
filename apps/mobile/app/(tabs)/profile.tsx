import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
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

      <Text style={styles.sectionHeader}>Compte</Text>

      <View style={styles.section}>
        {!isProvider && (
          <Pressable style={styles.menuItem} onPress={() => router.push('/provider-register')}>
            <Text style={styles.menuEmoji}>💼</Text>
            <Text style={styles.menuText}>Devenir prestataire</Text>
            <Text style={styles.menuArrow}>{'\u203A'}</Text>
          </Pressable>
        )}

        {isProvider && (
          <>
            <Pressable style={styles.menuItem} onPress={() => router.push('/provider-dashboard/services')}>
              <Text style={styles.menuEmoji}>💇🏿</Text>
              <Text style={styles.menuText}>Mes services</Text>
              <Text style={styles.menuArrow}>{'\u203A'}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => router.push('/provider-dashboard/availability')}>
              <Text style={styles.menuEmoji}>📅</Text>
              <Text style={styles.menuText}>Disponibilites</Text>
              <Text style={styles.menuArrow}>{'\u203A'}</Text>
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
              <Text style={styles.menuArrow}>{'\u203A'}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => router.push('/kyc' as any)}>
              <Text style={styles.menuEmoji}>🪪</Text>
              <Text style={styles.menuText}>Vérification identité</Text>
              <Text style={styles.menuArrow}>{'\u203A'}</Text>
            </Pressable>
          </>
        )}

        <Pressable style={styles.menuItem} onPress={() => router.push('/favorites' as any)}>
          <Text style={styles.menuEmoji}>❤️</Text>
          <Text style={styles.menuText}>Favoris</Text>
          <Text style={styles.menuArrow}>{'\u203A'}</Text>
        </Pressable>

        <Pressable style={styles.menuItem} onPress={() => router.push('/referral' as any)}>
          <Text style={styles.menuEmoji}>🎁</Text>
          <Text style={styles.menuText}>Inviter des amies</Text>
          <Text style={styles.menuArrow}>{'\u203A'}</Text>
        </Pressable>

        <Pressable style={styles.menuItem} onPress={() => router.push('/settings/edit-profile' as any)}>
          <Text style={styles.menuEmoji}>⚙️</Text>
          <Text style={styles.menuText}>Paramètres</Text>
          <Text style={styles.menuArrow}>{'\u203A'}</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.referralBanner}
        onPress={() => router.push('/referral' as any)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.referralTitle}>Invitez, gagnez des crédits</Text>
          <Text style={styles.referralSubtitle}>Partagez Tokoss avec vos amies et gagnez toutes les deux</Text>
        </View>
        <Text style={styles.referralArrow}>→</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={() => { logout(); router.replace('/auth/login'); }}>
        <Text style={styles.logoutText}>Se deconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 24 },
  avatarContainer: { alignItems: 'center', marginBottom: 36 },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 24px rgba(90,56,60,0.15)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 5 },
    }) as any,
  },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  cameraIcon: { fontSize: 14 },
  avatarText: { fontSize: 32, fontFamily: 'Poppins_700Bold', color: colors.white },
  name: { fontSize: 26, fontFamily: 'PlayfairDisplay_700Bold', color: colors.accent },
  phone: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.textSecondary, marginTop: 6, textTransform: 'uppercase' as const, letterSpacing: 1.5 },
  providerBadge: {
    marginTop: 8, backgroundColor: colors.primaryGhost,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
  },
  providerBadgeText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  sectionHeader: {
    fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
  },
  section: {
    gap: 0, backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden',
    marginBottom: 28,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(90,56,60,0.08)' },
      default: { shadowColor: '#5A383C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
    }) as any,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'transparent', paddingHorizontal: 20, paddingVertical: 16,
  },
  menuEmoji: { fontSize: 20, marginRight: 14 },
  menuText: { flex: 1, fontSize: 16, fontFamily: 'Poppins_500Medium', color: colors.text },
  menuArrow: { fontSize: 22, fontFamily: 'Poppins_400Regular', color: colors.textMuted },
  logoutButton: {
    marginTop: 8, paddingVertical: 14, alignItems: 'center',
    borderRadius: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(222,53,11,0.08)' },
      default: { shadowColor: colors.error, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
    }) as any,
  },
  logoutText: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.error },
  referralBanner: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  referralTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  referralSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  referralArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    marginLeft: 12,
  },
});
