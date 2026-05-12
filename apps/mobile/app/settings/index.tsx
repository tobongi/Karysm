import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
import IconUser from '@tabler/icons-react-native/dist/esm/icons/IconUser.mjs';
import IconShieldCheck from '@tabler/icons-react-native/dist/esm/icons/IconShieldCheck.mjs';
import IconBell from '@tabler/icons-react-native/dist/esm/icons/IconBell.mjs';
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import IconLanguage from '@tabler/icons-react-native/dist/esm/icons/IconLanguage.mjs';
import IconMoon from '@tabler/icons-react-native/dist/esm/icons/IconMoon.mjs';
import IconLock from '@tabler/icons-react-native/dist/esm/icons/IconLock.mjs';
import IconFileText from '@tabler/icons-react-native/dist/esm/icons/IconFileText.mjs';
import IconTrash from '@tabler/icons-react-native/dist/esm/icons/IconTrash.mjs';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import { colors } from '../../src/theme/colors';

function Toggle({ value, onToggle, disabled }: { value: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onToggle}
      style={[
        styles.toggle,
        { backgroundColor: value ? colors.primary : colors.n300 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View
        style={[
          styles.toggleCircle,
          { left: value ? 22 : 4 },
        ]}
      />
    </Pressable>
  );
}

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  labelColor?: string;
};

function MenuItem({ icon, label, onPress, right, labelColor }: MenuItemProps) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
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
  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <IconArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.header}>Parametres</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Section: Compte */}
        <Text style={styles.sectionTitle}>COMPTE</Text>
        <MenuItem
          icon={<IconUser size={24} color={colors.textSecondary} />}
          label="Modifier le profil"
          onPress={() => router.push('/settings/edit-profile')}
          right={<IconChevronRight size={20} color={colors.textMuted} />}
        />
        <MenuItem
          icon={<IconShieldCheck size={24} color={colors.textSecondary} />}
          label="Verification KYC"
          onPress={() => router.push('/kyc')}
          right={<IconChevronRight size={20} color={colors.textMuted} />}
        />

        {/* Section: Notifications */}
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <MenuItem
          icon={<IconBell size={24} color={colors.textSecondary} />}
          label="Notifications push"
          right={<Toggle value={pushEnabled} onToggle={() => setPushEnabled(!pushEnabled)} />}
        />
        <MenuItem
          icon={<IconCalendar size={24} color={colors.textSecondary} />}
          label="Rappels de rendez-vous"
          right={<Toggle value={remindersEnabled} onToggle={() => setRemindersEnabled(!remindersEnabled)} />}
        />

        {/* Section: Preferences */}
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <MenuItem
          icon={<IconLanguage size={24} color={colors.textSecondary} />}
          label="Langue"
          right={
            <View style={styles.valueRow}>
              <Text style={styles.valueText}>Francais</Text>
              <IconChevronRight size={20} color={colors.textMuted} />
            </View>
          }
        />
        <MenuItem
          icon={<IconMoon size={24} color={colors.textSecondary} />}
          label="Mode sombre"
          right={
            <View style={styles.valueRow}>
              <Text style={styles.soonBadge}>Bientot</Text>
              <Toggle value={darkMode} onToggle={() => {}} disabled />
            </View>
          }
        />

        {/* Section: Confidentialite */}
        <Text style={styles.sectionTitle}>CONFIDENTIALITE</Text>
        <MenuItem
          icon={<IconLock size={24} color={colors.textSecondary} />}
          label="Politique de confidentialite"
          onPress={() => {}}
          right={<IconChevronRight size={20} color={colors.textMuted} />}
        />
        <MenuItem
          icon={<IconFileText size={24} color={colors.textSecondary} />}
          label="Conditions d'utilisation"
          onPress={() => {}}
          right={<IconChevronRight size={20} color={colors.textMuted} />}
        />

        {/* Section: Danger zone */}
        <Text style={styles.sectionTitle}>DANGER ZONE</Text>
        <MenuItem
          icon={<IconTrash size={24} color={colors.error} />}
          label="Supprimer mon compte"
          labelColor={colors.error}
          onPress={() => {}}
        />

        <Text style={styles.version}>Karysm v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  header: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 32,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
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
    backgroundColor: '#E9D2C2',
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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  soonBadge: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.n300,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    position: 'absolute',
  },
  version: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
});
