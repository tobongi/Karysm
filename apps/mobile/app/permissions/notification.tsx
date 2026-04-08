import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import IconBell from '@tabler/icons-react-native/dist/esm/icons/IconBell.mjs';
import { colors } from '../../src/theme/colors';
import { registerForPushNotifications } from '../../src/lib/notifications';

export default function NotificationPermissionScreen() {
  const handleAllow = async () => {
    try {
      await registerForPushNotifications();
    } catch {
      // Permission request failed or not available
    }
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const inner = (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Bell illustration */}
        <View style={styles.iconCircle}>
          <IconBell size={48} color={colors.primaryLight} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>
          Restez informée de vos rendez-vous et messages.
        </Text>
        <Text style={styles.subtitle}>
          Activez les notifications pour ne manquer aucune réservation ou offre.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable style={styles.ctaButton} onPress={handleAllow}>
          <Text style={styles.ctaText}>Activer les notifications</Text>
        </Pressable>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Peut-être plus tard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  if (Platform.OS === 'web') {
    return <View style={styles.webWrapper}>{inner}</View>;
  }
  return inner;
}

const styles = StyleSheet.create({
  webWrapper: { flex: 1, alignItems: 'center', backgroundColor: colors.bg },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    maxWidth: 480,
    width: '100%' as any,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  bottom: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  ctaButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.headerDark,
    textAlign: 'center',
  },
});
