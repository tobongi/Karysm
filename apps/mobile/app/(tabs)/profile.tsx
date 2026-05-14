import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Platform, LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { pickAndUploadAvatar } from '../../src/lib/upload';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';
import { PressableScale, FadeInStagger } from '../../src/components/animations';
import IconCamera from '@tabler/icons-react-native/dist/esm/icons/IconCamera.mjs';
import IconUser from '@tabler/icons-react-native/dist/esm/icons/IconUser.mjs';
import IconHeart from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
import IconBriefcase from '@tabler/icons-react-native/dist/esm/icons/IconBriefcase.mjs';
import IconScissors from '@tabler/icons-react-native/dist/esm/icons/IconScissors.mjs';
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import IconCash from '@tabler/icons-react-native/dist/esm/icons/IconCash.mjs';
import IconClipboardList from '@tabler/icons-react-native/dist/esm/icons/IconClipboardList.mjs';
import IconCreditCard from '@tabler/icons-react-native/dist/esm/icons/IconCreditCard.mjs';
import IconId from '@tabler/icons-react-native/dist/esm/icons/IconId.mjs';
import IconSettings from '@tabler/icons-react-native/dist/esm/icons/IconSettings.mjs';
import IconGift from '@tabler/icons-react-native/dist/esm/icons/IconGift.mjs';
import IconLogout from '@tabler/icons-react-native/dist/esm/icons/IconLogout.mjs';
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';

export default function ProfileTab() {
  const { user, logout, isProvider } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [headerW, setHeaderW] = useState(480);

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const measured = e.nativeEvent.layout.width;
    if (measured > 0) setHeaderW(measured);
  }, []);

  const svgPath = useMemo(
    () => `M0,0 L0,130 C${headerW * 0.3},175 ${headerW * 0.7},103 ${headerW},115 L${headerW},0 Z`,
    [headerW]
  );

  const group2Start = isProvider ? 8 : 3;

  async function handleAvatarUpload() {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar();
      if (!url) { setUploadingAvatar(false); return; }
      setAvatar(url);
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
      {/* Dark curved header */}
      <View style={styles.header} onLayout={onHeaderLayout}>
        <View style={styles.headerBg} />
        <Svg
          width="100%"
          height={190}
          viewBox={`0 0 ${headerW} 190`}
          preserveAspectRatio="none"
          style={styles.headerCurve}
        >
          <Path d={svgPath} fill={colors.headerDark} />
        </Svg>
        <View style={styles.headerContent}>
          <PressableScale onPress={handleAvatarUpload} style={styles.avatarWrapper}>
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
                <IconCamera size={20} color={colors.white} />
              </View>
            )}
          </PressableScale>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.headerPhone}>{user?.phone}</Text>
            {isProvider && (
              <View style={styles.providerBadge}>
                <Text style={styles.providerBadgeText}>Prestataire</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Menu Group 1 — Account */}
      <View style={styles.menuGroup}>
        <FadeInStagger index={0}><MenuItem icon={<IconUser size={20} color={colors.primary} />} label="Mon profil" onPress={() => router.push('/settings/edit-profile' as any)} /></FadeInStagger>
        <FadeInStagger index={1}><MenuItem icon={<IconHeart size={20} color={colors.primary} />} label="Favoris" onPress={() => router.push('/favorites' as any)} /></FadeInStagger>

        {!isProvider && (
          <FadeInStagger index={2}><MenuItem icon={<IconBriefcase size={20} color={colors.primary} />} label="Devenir prestataire" onPress={() => router.push('/provider-register')} /></FadeInStagger>
        )}

        {isProvider && (
          <>
            <FadeInStagger index={2}><MenuItem icon={<IconScissors size={20} color={colors.primary} />} label="Mes services" onPress={() => router.push('/provider-dashboard/services')} /></FadeInStagger>
            <FadeInStagger index={3}><MenuItem icon={<IconCalendar size={20} color={colors.primary} />} label="Disponibilites" onPress={() => router.push('/provider-dashboard/availability')} /></FadeInStagger>
            <FadeInStagger index={4}><MenuItem icon={<IconCash size={20} color={colors.primary} />} label="Mes revenus" onPress={() => router.push('/provider-dashboard/earnings')} /></FadeInStagger>
            <FadeInStagger index={5}><MenuItem icon={<IconClipboardList size={20} color={colors.primary} />} label="Demandes ouvertes" onPress={() => router.push('/request/browse' as any)} /></FadeInStagger>
            <FadeInStagger index={6}><MenuItem icon={<IconCreditCard size={20} color={colors.primary} />} label="Portefeuille" onPress={() => router.push('/wallet' as any)} /></FadeInStagger>
            <FadeInStagger index={7}><MenuItem icon={<IconId size={20} color={colors.primary} />} label="Verification identite" onPress={() => router.push('/kyc' as any)} /></FadeInStagger>
          </>
        )}
      </View>

      {/* Menu Group 2 — Settings & Social */}
      <View style={styles.menuGroup}>
        <FadeInStagger index={group2Start}><MenuItem icon={<IconSettings size={20} color={colors.primary} />} label="Parametres" onPress={() => router.push('/settings' as any)} /></FadeInStagger>
        <FadeInStagger index={group2Start + 1}><MenuItem icon={<IconGift size={20} color={colors.primary} />} label="Inviter des amies" onPress={() => router.push('/referral' as any)} /></FadeInStagger>
      </View>

      {/* Logout */}
      <FadeInStagger index={group2Start + 2}>
        <PressableScale style={styles.logoutItem} onPress={() => { logout(); router.replace('/auth/login'); }}>
          <View style={styles.iconCircle}>
            <IconLogout size={20} color={colors.error} />
          </View>
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </PressableScale>
      </FadeInStagger>
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <PressableScale style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconCircle}>
        {icon}
      </View>
      <Text style={styles.menuText}>{label}</Text>
      <IconChevronRight size={16} color={colors.textMuted} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },

  // Header
  header: {
    height: 190,
    position: 'relative',
    marginBottom: 32,
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  headerCurve: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.headerDark,
  },
  avatarText: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: colors.white },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.white,
  },
  headerPhone: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  providerBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  providerBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.white,
  },

  // Menu groups
  menuGroup: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },

  // Menu item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },

  // Logout
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.error,
  },
});
