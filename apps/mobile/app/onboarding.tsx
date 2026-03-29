import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.48;

const SLIDES = [
  {
    id: '1',
    number: '01',
    title: 'Trouvez votre\nprofessionnelle',
    subtitle: 'Coiffeuses, nail artists, maquilleuses, masseuses \u2014 trouvez les meilleures pr\u00e8s de chez vous.',
    accent: 'Abidjan \u00b7 Kinshasa \u00b7 Dakar',
    image: require('../assets/images/onboarding_1.jpg'),
  },
  {
    id: '2',
    number: '02',
    title: 'R\u00e9servez\nen 30 secondes',
    subtitle: 'Choisissez le service, la date et l\'heure. \u00c0 domicile ou au salon. Confirm\u00e9 instantan\u00e9ment.',
    accent: 'Simple \u00b7 Rapide \u00b7 S\u00e9curis\u00e9',
    image: require('../assets/images/onboarding_2.jpg'),
  },
  {
    id: '3',
    number: '03',
    title: 'Analysez votre\nbeaut\u00e9 avec l\'IA',
    subtitle: 'Premi\u00e8re IA con\u00e7ue pour les peaux qui vous ressemblent. Analysez votre peau et vos cheveux.',
    accent: 'Monk Scale \u00b7 Type 4A-4C',
    image: null,
  },
];

// Faux gradient: multiple Views with increasing opacity to simulate a fade
function FadeOverlay({ color }: { color: string }) {
  const steps = 8;
  return (
    <View style={overlayStyles.container} pointerEvents="none">
      {Array.from({ length: steps }, (_, i) => (
        <View
          key={i}
          style={[
            overlayStyles.step,
            { backgroundColor: color, opacity: (i / steps) * 0.95 },
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
    height: 100,
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
  const hasImage = slide.image !== null;

  function handleNext() {
    if (isLast) {
      router.replace('/auth/login');
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  const inner = (
    <View style={styles.container}>
      {/* Image or gradient hero area */}
      <View style={styles.heroArea}>
        {hasImage ? (
          <>
            <Image
              source={slide.image}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <FadeOverlay color={colors.bg} />
          </>
        ) : (
          <View style={styles.heroGradient}>
            {/* Layered gradient effect: accent to primary */}
            <View style={styles.gradientLayer1} />
            <View style={styles.gradientLayer2} />
            <View style={styles.gradientLayer3} />
            {/* Decorative circles */}
            <View style={styles.decoCircle1} />
            <View style={styles.decoCircle2} />
            <View style={styles.decoCircle3} />
            {/* AI sparkle icon */}
            <Text style={styles.heroEmoji}>{'\u2728'}</Text>
            <FadeOverlay color={colors.bg} />
          </View>
        )}

        {/* Top bar overlaying the image */}
        <View style={styles.top}>
          <Text style={[styles.logo, hasImage && styles.logoOnImage]}>Tokoss</Text>
          <Text
            style={[styles.skip, hasImage && styles.skipOnImage]}
            onPress={() => router.replace('/auth/login')}
          >
            Passer
          </Text>
        </View>
      </View>

      {/* Content area */}
      <View style={styles.content}>
        <Text style={styles.number}>{slide.number}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
        <View style={styles.accentLine}>
          <View style={styles.accentDot} />
          <Text style={styles.accentText}>{slide.accent}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        {/* CTA */}
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
  },

  // Hero image area
  heroArea: {
    height: IMAGE_HEIGHT,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.accent,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.accent,
  },
  gradientLayer2: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3D2580',
    opacity: 0.7,
  },
  gradientLayer3: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  decoCircle1: {
    position: 'absolute',
    top: '15%',
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(202,152,126,0.12)',
  },
  decoCircle2: {
    position: 'absolute',
    top: '40%',
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decoCircle3: {
    position: 'absolute',
    bottom: '20%',
    right: '20%',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(202,152,126,0.08)',
  },
  heroEmoji: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    fontSize: 72,
  },

  // Top bar (overlays hero)
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    zIndex: 10,
  },
  logo: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: colors.accent,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  logoOnImage: {
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  skip: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.textMuted,
  },
  skipOnImage: {
    color: 'rgba(255,255,255,0.85)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 4,
  },
  number: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 56,
    color: colors.n300,
    marginBottom: -6,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30,
    color: colors.accent,
    lineHeight: 38,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 23,
    marginBottom: 24,
  },
  accentLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.terracotta,
  },
  accentText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.terracotta,
    letterSpacing: 0.5,
  },

  // Footer
  footer: { paddingHorizontal: 36, paddingBottom: 48 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 28, gap: 10 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.n300,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 28,
  },
  button: {
    backgroundColor: colors.primary,
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
