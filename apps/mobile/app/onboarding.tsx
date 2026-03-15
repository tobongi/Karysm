import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '\u{1F487}\u200D\u2640\uFE0F',
    title: 'Trouvez votre pro',
    subtitle: 'Coiffeurs, nail artists, maquilleurs... pres de chez vous a Kinshasa, Douala, Libreville.',
  },
  {
    id: '2',
    emoji: '\u{1F4C5}',
    title: 'Reservez en 2 clics',
    subtitle: 'Choisissez le service, la date et l\'heure. Le prestataire se deplace chez vous.',
  },
  {
    id: '3',
    emoji: '\u{1F4B0}',
    title: 'Payez mobile money',
    subtitle: 'Depot securise via M-Pesa, Airtel Money ou Orange Money. Le reste en cash.',
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <Pressable
          style={styles.button}
          onPress={() => router.replace('/auth/login')}
        >
          <Text style={styles.buttonText}>Commencer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  slide: { width, paddingHorizontal: 40, justifyContent: 'center', alignItems: 'center', flex: 1 },
  emoji: { fontSize: 80, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 40, paddingBottom: 60 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border, marginHorizontal: 4 },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: '600' },
});
