import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';
import { PressableScale } from '../src/components/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    label: 'DÉCOUVREZ',
    title: 'Votre beauté,\nsublimée',
    subtitle: 'Trouvez les prestataires qui vous comprennent, près de chez vous.',
    image: require('../assets/images/onboarding_1.jpg'),
  },
  {
    id: '2',
    label: 'À VOTRE IMAGE',
    title: 'Analysez votre\nbeauté avec l\'IA',
    subtitle: 'Peau et cheveux qui vous ressemblent. Conseils personnalisés.',
    image: require('../assets/images/onboarding_2.jpg'),
  },
  {
    id: '3',
    label: 'COMMUNAUTÉ',
    title: 'Une vraie\ncommunauté',
    subtitle: 'Réservez, partagez vos transformations, inspirez.',
    image: require('../assets/images/onboarding_3.jpg'),
  },
];

// Premium gradient overlay: dark gradient from transparent to opaque
function GradientOverlay() {
  const steps = 12;
  return (
    <View style={overlayStyles.container} pointerEvents="none">
      {Array.from({ length: steps }, (_, i) => {
        const opacity = (i / steps) * 0.92;
        return (
          <View
            key={i}
            style={[
              overlayStyles.step,
              { backgroundColor: colors.headerDark, opacity },
            ]}
          />
        );
      })}
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    flexDirection: 'column',
  },
  step: {
    flex: 1,
  },
});

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  function handleNext() {
    if (isLast) {
      router.replace('/auth/login');
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handleSkip() {
    router.replace('/auth/login');
  }

  const inner = (
    <View style={styles.container}>
      {/* Full-screen background image */}
      <Image
        source={slide.image}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Gradient overlay on bottom half */}
      <GradientOverlay />

      {/* Top header: Karysm wordmark */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>Karysm</Text>
      </View>

      {/* Bottom content overlay */}
      <View style={styles.bottomContent}>
        {/* Chip label */}
        <Text style={styles.label}>{slide.label}</Text>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* CTA buttons row */}
        <View style={styles.ctaRow}>
          {/* Skip button */}
          <PressableScale onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Passer</Text>
          </PressableScale>

          {/* Page indicators */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Continue button */}
          <PressableScale onPress={handleNext} style={styles.continueButton}>
            <Text style={styles.continueText}>
              {isLast ? 'Commencer' : 'Continuer'}
            </Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );

  // Web wrapper: constrain to mobile width
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrapper}>
        {inner}
      </View>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    maxWidth: 480,
    width: '100%' as any,
    position: 'relative',
  },

  // Full-screen background image
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  // Top header with Karysm wordmark
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  wordmark: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: colors.white,
    fontStyle: 'italic',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  // Bottom content area (overlays the image)
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 32,
  },

  // Chip label (uppercase, accent color)
  label: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.white,
    lineHeight: 36,
    marginBottom: 12,
    letterSpacing: -0.3,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.90)',
    lineHeight: 22,
    marginBottom: 32,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // CTA row: skip | dots | continue
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Skip button (ghost text)
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  skipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.70)',
    letterSpacing: 0.2,
  },

  // Page indicator dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  dotActive: {
    backgroundColor: colors.accent,
    width: 20,
  },

  // Continue button (violet pill)
  continueButton: {
    backgroundColor: colors.accent,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueText: {
    fontFamily: 'Poppins_600SemiBold',
    color: colors.white,
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
