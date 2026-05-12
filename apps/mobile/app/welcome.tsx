import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck.mjs';
import { colors } from '../src/theme/colors';

export default function WelcomeScreen() {
  const inner = (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Welcome illustration */}
        <View style={styles.iconCircle}>
          <View style={styles.checkInner}>
            <IconCheck size={40} color={colors.white} />
          </View>
        </View>

        <Text style={styles.title}>Bienvenue sur Karysm !</Text>
        <Text style={styles.subtitle}>
          Trouvez les meilleures prestataires de beauté près de chez vous et réservez en un instant.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable style={styles.ctaButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.ctaText}>C'est parti !</Text>
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
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  checkInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginTop: 32,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
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
});
