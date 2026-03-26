import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';

const SLIDES = [
  {
    id: '1',
    number: '01',
    title: 'Trouvez votre\nprofessionnelle',
    subtitle: 'Coiffeuses, nail artists, maquilleuses, masseuses — trouvez les meilleures près de chez vous.',
    accent: 'Abidjan · Kinshasa · Dakar',
  },
  {
    id: '2',
    number: '02',
    title: 'Réservez\nen 30 secondes',
    subtitle: 'Choisissez le service, la date et l\'heure. À domicile ou au salon. Confirmé instantanément.',
    accent: 'Simple · Rapide · Sécurisé',
  },
  {
    id: '3',
    number: '03',
    title: 'Analysez votre\nbeauté avec l\'IA',
    subtitle: 'Première IA conçue pour les peaux qui vous ressemblent. Analysez votre peau et vos cheveux.',
    accent: 'Monk Scale · Type 4A-4C',
  },
];

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

  return (
    <View style={styles.container}>
      {/* Top — slide number */}
      <View style={styles.top}>
        <Text style={styles.logo}>Tokoss</Text>
        <Text style={styles.skip} onPress={() => router.replace('/auth/login')}>
          Passer
        </Text>
      </View>

      {/* Content */}
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },

  // Top
  top: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60,
  },
  logo: {
    fontSize: 22, fontWeight: '700', color: colors.white,
    fontStyle: 'italic', letterSpacing: -0.5,
  },
  skip: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  // Content
  content: {
    flex: 1, justifyContent: 'center', paddingHorizontal: 32,
  },
  number: {
    fontSize: 64, fontWeight: '800', color: 'rgba(124,58,237,0.15)',
    marginBottom: -8,
  },
  title: {
    fontSize: 32, fontWeight: '700', color: colors.white,
    lineHeight: 40, marginBottom: 16, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16, color: 'rgba(255,255,255,0.6)',
    lineHeight: 24, marginBottom: 24,
  },
  accentLine: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  accentDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terracotta,
  },
  accentText: {
    fontSize: 13, color: colors.terracotta, fontWeight: '500', letterSpacing: 0.5,
  },

  // Footer
  footer: { paddingHorizontal: 32, paddingBottom: 48 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 6 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    backgroundColor: colors.white, width: 28,
  },
  button: {
    backgroundColor: colors.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
  },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: '600' },
});
