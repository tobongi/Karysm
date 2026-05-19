import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
import IconUser from '@tabler/icons-react-native/dist/esm/icons/IconUser.mjs';
import IconBell from '@tabler/icons-react-native/dist/esm/icons/IconBell.mjs';
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import IconLock from '@tabler/icons-react-native/dist/esm/icons/IconLock.mjs';
import IconFileText from '@tabler/icons-react-native/dist/esm/icons/IconFileText.mjs';
import IconTrash from '@tabler/icons-react-native/dist/esm/icons/IconTrash.mjs';
import IconLogout from '@tabler/icons-react-native/dist/esm/icons/IconLogout.mjs';
import { colors } from '../../src/theme/colors';
import CurveHeader from '../../src/components/CurveHeader';
import { useAuth } from '../../src/lib/auth-context';
import { showAlert, showConfirm } from '../../src/lib/alert';


type MenuRowProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  labelColor?: string;
};

function MenuRow({ icon, label, onPress, right, labelColor }: MenuRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <View style={styles.menuLeft}>
        <View style={styles.iconCircle}>
          {icon}
        </View>
        <Text style={[styles.menuLabel, labelColor ? { color: labelColor } : undefined]}>
          {label}
        </Text>
      </View>
      <View style={styles.menuRight}>
        {right}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  async function loadNotificationSettings() {
    try {
      const pushSetting = await AsyncStorage.getItem('karysm_notif_push');
      const remindersSetting = await AsyncStorage.getItem('karysm_notif_reminders');
      if (pushSetting !== null) setPushEnabled(JSON.parse(pushSetting));
      if (remindersSetting !== null) setRemindersEnabled(JSON.parse(remindersSetting));
    } catch {}
  }

  async function handlePushToggle(value: boolean) {
    setPushEnabled(value);
    try {
      await AsyncStorage.setItem('karysm_notif_push', JSON.stringify(value));
    } catch {}
  }

  async function handleRemindersToggle(value: boolean) {
    setRemindersEnabled(value);
    try {
      await AsyncStorage.setItem('karysm_notif_reminders', JSON.stringify(value));
    } catch {}
  }

  function handleChangePhone() {
    showAlert('Bientôt', 'La possibilité de changer de numéro sera disponible prochainement.');
  }

  function handleDeleteAccount() {
    showConfirm(
      'Supprimer mon compte',
      'Cette action est irréversible. Tous vos données seront supprimées.',
      async () => {
        try {
          await logout();
          router.replace('/auth/login');
        } catch (err: any) {
          showAlert('Erreur', err.message || 'Impossible de supprimer le compte.');
        }
      }
    );
  }

  function handleLogout() {
    showConfirm(
      'Se déconnecter',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      async () => {
        try {
          await logout();
          router.replace('/auth/login');
        } catch (err: any) {
          showAlert('Erreur', err.message || 'Impossible de se déconnecter.');
        }
      }
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CurveHeader title="Paramètres" showBack height={140} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* MON COMPTE */}
        <Text style={styles.sectionLabel}>MON COMPTE</Text>
        <View style={styles.card}>
          <MenuRow
            icon={<IconUser size={24} color={colors.textSecondary} />}
            label="Modifier le profil"
            onPress={() => router.push('/settings/edit-profile')}
            right={<IconChevronRight size={20} color={colors.textMuted} />}
          />
        </View>

        {/* NOTIFICATIONS */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <IconBell size={24} color={colors.textSecondary} />
              </View>
              <Text style={styles.menuLabel}>Notifications push</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: colors.n300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <IconCalendar size={24} color={colors.textSecondary} />
              </View>
              <Text style={styles.menuLabel}>Rappels de rendez-vous</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={handleRemindersToggle}
              trackColor={{ false: colors.n300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* CONFIDENTIALITÉ */}
        <Text style={styles.sectionLabel}>CONFIDENTIALITÉ</Text>
        <View style={styles.card}>
          <MenuRow
            icon={<IconLock size={24} color={colors.textSecondary} />}
            label="Politique de confidentialité"
            onPress={() => Linking.openURL('https://karysm.com/confidentialite')}
            right={<IconChevronRight size={20} color={colors.textMuted} />}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={<IconFileText size={24} color={colors.textSecondary} />}
            label="Conditions d'utilisation"
            onPress={() => Linking.openURL('https://karysm.com/cgu')}
            right={<IconChevronRight size={20} color={colors.textMuted} />}
          />
        </View>

        {/* À PROPOS */}
        <Text style={styles.sectionLabel}>À PROPOS</Text>
        <View style={styles.card}>
          <MenuRow
            icon={<IconFileText size={24} color={colors.textSecondary} />}
            label="Version"
            right={<Text style={styles.valueText}>v0.1.0</Text>}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={<IconUser size={24} color={colors.textSecondary} />}
            label="Nous contacter"
            onPress={() => Linking.openURL('mailto:contact@karysm.com')}
            right={<IconChevronRight size={20} color={colors.textMuted} />}
          />
        </View>

        {/* LOGOUT */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <IconLogout size={20} color={colors.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>

        {/* DELETE ACCOUNT */}
        <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
          <IconTrash size={20} color={colors.error} />
          <Text style={styles.deleteText}>Supprimer mon compte</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: colors.text,
    marginLeft: 14,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  valueText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(222, 53, 11, 0.08)',
    borderRadius: 14,
    gap: 10,
  },
  logoutText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.error,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(222, 53, 11, 0.08)',
    borderRadius: 14,
    gap: 10,
  },
  deleteText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.error,
  },
});
