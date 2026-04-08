import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Trouvez votre\nprestataire',
    subtitle: 'Coiffeuses, nail artists, maquilleuses près de chez vous.',
    image: require('../assets/images/onboarding_1.jpg'),
  },
  {
    id: '2',
    title: 'Réservez\nen 30 secondes',
    subtitle: 'Service, date et heure. Confirmé instantanément.',
    image: require('../assets/images/onboarding_2.jpg'),
  },
  {
    id: '3',
    title: 'Analysez votre\nbeauté avec l\'IA',
    subtitle: 'Première IA pour les peaux et cheveux qui vous ressemblent.',
    image: require('../assets/images/onboarding_3.jpg'),
  },
];

// Faux gradient overlay: stacked Views with increasing opacity
function GradientOverlay() {
  const steps = 12;
  return (
    <View style={overlayStyles.container} pointerEvents="none">
      {Array.from({ length: steps }, (_, i) => (
        <View
          key={i}
          style={[
            overlayStyles.step,
            { backgroundColor: colors.bg, opacity: (i / steps) * 0.95 },
          ]}
        />
      ))}
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
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

      {/* Bottom content overlay */}
      <View style={styles.bottomContent}>
        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        {/* Single CTA button */}
        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {isLast ? 'Commencer' : 'Suivant'}
          </Text>
        </Pressable>
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

  // Bottom content area (overlays the image)
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 48,
  },

  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 31,
    color: colors.white,
    lineHeight: 40,
    marginBottom: 10,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginBottom: 28,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // Dot indicators
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 24,
  },

  // CTA button
  button: {
    backgroundColor: colors.primaryLight,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: colors.white,
    fontSize: 17,
  },
});
