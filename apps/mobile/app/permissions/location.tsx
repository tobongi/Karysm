import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import IconMapPin from '@tabler/icons-react-native/dist/esm/icons/IconMapPin.mjs';
import { colors } from '../../src/theme/colors';
import { PressableScale } from '../../src/components/animations';

let Location: any = null;
try {
  Location = require('expo-location');
} catch {
  // expo-location not installed
}

export default function LocationPermissionScreen() {
  const handleAllow = async () => {
    try {
      if (Location) {
        await Location.requestForegroundPermissionsAsync();
      }
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
        {/* Map pin illustration */}
        <View style={styles.iconCircle}>
          <IconMapPin size={56} color={colors.accent} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>Trouvez les prestataires près de chez vous</Text>
        <Text style={styles.subtitle}>
          Nous utilisons votre position pour vous montrer les prestataires les plus proches, triés par distance et disponibilité.
        </Text>
      </View>

      <View style={styles.bottom}>
        <PressableScale style={styles.ctaButton} onPress={handleAllow}>
          <Text style={styles.ctaText}>Autoriser la localisation</Text>
        </PressableScale>
        <PressableScale onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Plus tard</Text>
        </PressableScale>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: colors.accent,
    textAlign: 'center',
    lineHeight: 30,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 10,
  },
  ctaButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(139,105,82,0.25)' }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        }
    ) as any,
  },
  ctaText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  skipButton: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  skipText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
});
