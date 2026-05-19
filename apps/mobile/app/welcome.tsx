import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import IconSearch from '@tabler/icons-react-native/dist/esm/icons/IconSearch.mjs';
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles.mjs';
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import { colors } from '../src/theme/colors';
import { PressableScale } from '../src/components/animations';

export default function WelcomeScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const firstName = name ? name.split(' ')[0] : 'Bienvenue';

  const inner = (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title — Playfair italic */}
        <Text style={styles.title}>
          Bienvenue sur{' '}
          <Text style={styles.titleAccent}>Karysm</Text>
        </Text>

        {/* User greeting */}
        <Text style={styles.greeting}>
          Heureuse de vous accueillir, {firstName}
        </Text>

        {/* Value props */}
        <View style={styles.valuePropsContainer}>
          {/* Prop 1 — Search */}
          <View style={styles.valueProp}>
            <View style={styles.valuePropIcon}>
              <IconSearch size={20} color={colors.accent} strokeWidth={2.5} />
            </View>
            <Text style={styles.valuePropText}>
              Trouvez les meilleures prestataires
            </Text>
          </View>

          {/* Prop 2 — AI */}
          <View style={styles.valueProp}>
            <View style={styles.valuePropIcon}>
              <IconSparkles size={20} color={colors.accent} strokeWidth={2.5} />
            </View>
            <Text style={styles.valuePropText}>
              Analyse beauté IA personnalisée
            </Text>
          </View>

          {/* Prop 3 — Booking */}
          <View style={styles.valueProp}>
            <View style={styles.valuePropIcon}>
              <IconCalendar size={20} color={colors.accent} strokeWidth={2.5} />
            </View>
            <Text style={styles.valuePropText}>
              Réservation en un clic
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <PressableScale
          style={styles.ctaButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.ctaText}>Commencer</Text>
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
    paddingHorizontal: 28,
  },

  /* Welcome title — Playfair italic with accent */
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  titleAccent: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontStyle: 'italic',
    color: colors.accent,
    fontSize: 32,
  },

  /* User greeting */
  greeting: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },

  /* Value propositions */
  valuePropsContainer: {
    marginTop: 48,
    width: '100%',
  },
  valueProp: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  valuePropIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(91,33,182,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
    flexShrink: 0,
  },
  valuePropText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },

  /* CTA button */
  bottom: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  ctaButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.3,
  },
});
