import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Platform, LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/lib/auth-context';
import { pickAndUploadAvatar } from '../../src/lib/upload';
import { api } from '../../src/lib/api';
import { showAlert } from '../../src/lib/alert';
import { PressableScale, FadeInStagger, Shimmer } from '../../src/components/animations';
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
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck.mjs';

interface KPIData {
  label: string;
  value: string;
}

interface KYCStatus {
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';
  rejectedReason?: string;
}

export default function ProfileTab() {
  const { user, logout, isProvider } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [headerW, setHeaderW] = useState(480);
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const measured = e.nativeEvent.layout.width;
    if (measured > 0) setHeaderW(measured);
  }, []);

  const svgPath = useMemo(
    () => `M0,0 L0,140 C${headerW * 0.3},190 ${headerW * 0.7},110 ${headerW},125 L${headerW},0 Z`,
    [headerW]
  );

  // Fetch KPI data on mount
  useEffect(() => {
    async function fetchKPI() {
      setKpiLoading(true);
      try {
        if (isProvider) {
          const results = await Promise.allSettled([
            api('/provider/profile'),
            api('/bookings/mine?status=completed&limit=1'),
          ]);

          const profileRes = results[0];
          const avgRating = profileRes.status === 'fulfilled' ? profileRes.value?.avgRating || 0 : 0;
          const totalReviews = profileRes.status === 'fulfilled' ? profileRes.value?.totalReviews || 0 : 0;
          const bookingCount = profileRes.status === 'fulfilled' ? profileRes.value?.bookingCount || 0 : 0;

          setKpiData([
            { label: 'Note moyenne', value: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : '—' },
            { label: 'RDV terminés', value: bookingCount.toString() },
            { label: 'Clientes', value: totalReviews.toString() },
          ]);
        } else {
          const results = await Promise.allSettled([
            api('/bookings/mine?limit=1'),
            api('/favorites'),
            api('/feed/saved'),
          ]);

          const bookingCount = results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value.length : 0;
          const favorites = results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value.length : 0;
          const saved = results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value.length : 0;

          setKpiData([
            { label: 'Réservations', value: bookingCount.toString() },
            { label: 'Favoris', value: favorites.toString() },
            { label: 'Looks sauvés', value: saved.toString() },
          ]);
        }
      } catch {
        // gracefully skip on error
      } finally {
        setKpiLoading(false);
      }
    }

    fetchKPI();
  }, [isProvider]);

  // Fetch KYC status for providers
  useEffect(() => {
    if (!isProvider) return;

    async function fetchKYCStatus() {
      try {
        const res = await api('/kyc/status');
        if (res) {
          setKycStatus(res.status || 'NOT_SUBMITTED');
        }
      } catch {
        // silently ignore
      }
    }

    fetchKYCStatus();
  }, [isProvider]);

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
      {/* Curved header with avatar */}
      <View style={styles.header} onLayout={onHeaderLayout}>
        <View style={styles.headerBg} />
        <Svg
          width="100%"
          height={240}
          viewBox={`0 0 ${headerW} 240`}
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
              <Text style={styles.headerSubtitle}>Prestataire</Text>
            )}
          </View>
        </View>
      </View>

      {/* KPI Strip */}
      <View style={styles.kpiContainer}>
        {kpiLoading ? (
          <View style={styles.kpiRow}>
            <Shimmer width={80} height={60} borderRadius={8} style={styles.kpiCardSkeleton} />
            <Shimmer width={80} height={60} borderRadius={8} style={styles.kpiCardSkeleton} />
            <Shimmer width={80} height={60} borderRadius={8} style={styles.kpiCardSkeleton} />
          </View>
        ) : (
          <View style={styles.kpiRow}>
            {kpiData.map((kpi, idx) => (
              <FadeInStagger key={idx} index={idx} delay={30}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{kpi.value}</Text>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                </View>
              </FadeInStagger>
            ))}
          </View>
        )}
      </View>

      {/* Menu Group 1 — MON ACTIVITÉ */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionLabel}>MON ACTIVITÉ</Text>
        <View style={styles.menuCard}>
          {isProvider ? (
            <>
              <FadeInStagger index={0}><MenuItem icon={<IconScissors size={20} color={colors.primary} />} label="Mes services" onPress={() => router.push('/provider-dashboard/services')} /></FadeInStagger>
              <FadeInStagger index={1}><MenuItem icon={<IconCalendar size={20} color={colors.primary} />} label="Disponibilités" onPress={() => router.push('/provider-dashboard/availability')} /></FadeInStagger>
              <FadeInStagger index={2}><MenuItem icon={<IconCash size={20} color={colors.primary} />} label="Mes revenus" onPress={() => router.push('/provider-dashboard/earnings')} /></FadeInStagger>
              <FadeInStagger index={3}><MenuItem icon={<IconClipboardList size={20} color={colors.primary} />} label="Demandes ouvertes" onPress={() => router.push('/request/browse' as any)} /></FadeInStagger>
            </>
          ) : (
            <>
              <FadeInStagger index={0}><MenuItem icon={<IconCalendar size={20} color={colors.primary} />} label="Mes réservations" onPress={() => router.push('/(tabs)/bookings')} /></FadeInStagger>
              <FadeInStagger index={1}><MenuItem icon={<IconHeart size={20} color={colors.primary} />} label="Favoris" onPress={() => router.push('/favorites' as any)} /></FadeInStagger>
              <FadeInStagger index={2}><MenuItem icon={<IconBriefcase size={20} color={colors.primary} />} label="Looks sauvés" onPress={() => router.push('/(tabs)/lookbook' as any)} /></FadeInStagger>
            </>
          )}
        </View>
      </View>

      {/* Menu Group 2 — COMPTE */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionLabel}>COMPTE</Text>
        <View style={styles.menuCard}>
          <FadeInStagger index={4}><MenuItem icon={<IconUser size={20} color={colors.primary} />} label="Mon profil" onPress={() => router.push('/settings/edit-profile' as any)} /></FadeInStagger>

          {isProvider ? (
            <>
              <FadeInStagger index={5}><MenuItem icon={<IconCreditCard size={20} color={colors.primary} />} label="Portefeuille" onPress={() => router.push('/wallet' as any)} /></FadeInStagger>
              <FadeInStagger index={6}>
                <MenuItem
                  icon={<IconId size={20} color={colors.primary} />}
                  label="Vérification identité"
                  rightElement={<KYCStatusBadge status={kycStatus?.status} />}
                  onPress={() => router.push('/kyc' as any)}
                />
              </FadeInStagger>
              <FadeInStagger index={7}><MenuItem icon={<IconHeart size={20} color={colors.primary} />} label="Favoris" onPress={() => router.push('/favorites' as any)} /></FadeInStagger>
            </>
          ) : (
            <FadeInStagger index={5}>
              <MenuItem
                icon={<IconBriefcase size={20} color={colors.accent} />}
                label="Devenir prestataire"
                highlighted
                onPress={() => router.push('/provider-register')}
              />
            </FadeInStagger>
          )}
        </View>
      </View>

      {/* Menu Group 3 — AIDE */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionLabel}>AIDE</Text>
        <View style={styles.menuCard}>
          <FadeInStagger index={8}><MenuItem icon={<IconSettings size={20} color={colors.primary} />} label="Paramètres" onPress={() => router.push('/settings' as any)} /></FadeInStagger>
          <FadeInStagger index={9}><MenuItem icon={<IconGift size={20} color={colors.primary} />} label="Inviter des amies" onPress={() => router.push('/referral' as any)} /></FadeInStagger>
        </View>
      </View>

      {/* Logout */}
      <FadeInStagger index={10}>
        <PressableScale style={styles.logoutItem} onPress={() => { logout(); router.replace('/auth/login'); }}>
          <View style={[styles.iconCircle, styles.logoutIconCircle]}>
            <IconLogout size={20} color={colors.error} />
          </View>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </PressableScale>
      </FadeInStagger>

      {/* Footer */}
      <Text style={styles.footer}>Karysm v0.1 · Fait avec ❤ en Afrique</Text>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  rightElement,
  highlighted,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <PressableScale style={[styles.menuItem, highlighted && styles.menuItemHighlighted]} onPress={onPress}>
      <View style={[styles.iconCircle, highlighted && styles.iconCircleHighlighted]}>
        {icon}
      </View>
      <Text style={[styles.menuText, highlighted && styles.menuTextHighlighted]}>{label}</Text>
      {rightElement ? rightElement : <IconChevronRight size={16} color={colors.textMuted} />}
    </PressableScale>
  );
}

function KYCStatusBadge({ status }: { status?: string }) {
  if (!status || status === 'NOT_SUBMITTED') {
    return <Text style={styles.kycBadgeMuted}>Non soumis</Text>;
  }
  if (status === 'APPROVED') {
    return (
      <View style={styles.kycBadgeGreen}>
        <IconCheck size={14} color={colors.success} />
        <Text style={styles.kycBadgeTextGreen}>Vérifié</Text>
      </View>
    );
  }
  if (status === 'SUBMITTED') {
    return <Text style={styles.kycBadgeWarning}>En attente</Text>;
  }
  if (status === 'REJECTED') {
    return <Text style={styles.kycBadgeError}>Rejeté</Text>;
  }
  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 60 },

  // Header — taller, centered avatar
  header: {
    height: 240,
    position: 'relative',
    marginBottom: 100,
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
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarText: { fontSize: 32, fontFamily: 'Poppins_700Bold', color: colors.white },
  headerInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  headerName: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontStyle: 'italic',
    color: colors.white,
  },
  headerPhone: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // KPI Strip — floating over curve bottom
  kpiContainer: {
    marginHorizontal: 24,
    marginTop: -80,
    marginBottom: 32,
    zIndex: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kpiCardSkeleton: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Section layout
  menuSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Menu item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemHighlighted: {
    backgroundColor: 'rgba(91, 33, 182, 0.04)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconCircleHighlighted: {
    backgroundColor: 'rgba(91, 33, 182, 0.12)',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },
  menuTextHighlighted: {
    fontFamily: 'Poppins_600SemiBold',
    color: colors.accent,
  },

  // KYC badge styles
  kycBadgeMuted: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textMuted,
  },
  kycBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(0, 135, 90, 0.08)',
    borderRadius: 12,
  },
  kycBadgeTextGreen: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.success,
  },
  kycBadgeWarning: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.warning,
  },
  kycBadgeError: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.error,
  },

  // Logout
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 36,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 32,
  },
  logoutIconCircle: {
    backgroundColor: 'rgba(222, 53, 11, 0.08)',
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.error,
    marginLeft: 14,
  },

  // Footer
  footer: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
});
