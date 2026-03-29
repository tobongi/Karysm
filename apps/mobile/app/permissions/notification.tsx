import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconBell } from '@tabler/icons-react-native';
import { colors } from '../../src/theme/colors';
import Button from '../../src/components/Button';
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <IconBell size={56} color={colors.primary} />
        </View>
        <Text style={styles.title}>Activer les notifications</Text>
        <Text style={styles.subtitle}>
          Ne manquez jamais un rendez-vous ou un message de vos prestataires
        </Text>
      </View>

      <View style={styles.bottom}>
        <Button
          title="Autoriser les notifications"
          onPress={handleAllow}
          size="lg"
          fullWidth
        />
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Plus tard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.accent,
    textAlign: 'center',
    marginTop: 32,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
