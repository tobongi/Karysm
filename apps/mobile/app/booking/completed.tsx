import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck.mjs';
import { colors } from '../../src/theme/colors';
import { PressableScale } from '../../src/components/animations';

export default function BookingCompletedScreen() {
  const { bookingId, providerName, serviceName, date, time, price } = useLocalSearchParams<{
    bookingId: string;
    providerName: string;
    serviceName: string;
    date: string;
    time: string;
    price: string;
  }>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.webWrapper}>
        {/* Centered content */}
        <View style={styles.centerContent}>
          {/* Success circle — outer ring + inner circle */}
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <IconCheck size={30} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Réservation confirmée !</Text>

          {/* Summary card */}
          <View style={styles.summaryCard}>
            {providerName ? (
              <Text style={styles.providerName}>{providerName}</Text>
            ) : null}
            {serviceName ? (
              <Text style={styles.detailText}>{serviceName}</Text>
            ) : null}
            {date || time ? (
              <Text style={styles.detailText}>
                {[date, time].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            {price ? (
              <Text style={styles.priceText}>{price}</Text>
            ) : null}
          </View>
        </View>

        {/* Bottom buttons */}
        <View style={styles.bottomContainer}>
          <PressableScale
            onPress={() => {
              if (bookingId) {
                router.replace(`/booking/detail/${bookingId}` as any);
              } else {
                router.replace('/(tabs)/bookings' as any);
              }
            }}
          >
            <View style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Voir ma réservation</Text>
            </View>
          </PressableScale>

          <PressableScale
            onPress={() => router.replace('/(tabs)' as any)}
          >
            <View style={styles.homeLink}>
              <Text style={styles.homeLinkText}>Retour à l'accueil</Text>
            </View>
          </PressableScale>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  outerCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,135,90,0.25)' },
      default: { shadowColor: colors.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20 },
    }) as any,
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.accent,
    textAlign: 'center',
    marginTop: 28,
    letterSpacing: -0.3,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    }) as any,
  },
  providerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  detailText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  priceText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 19,
    color: colors.terracotta,
    textAlign: 'center',
    marginTop: 14,
    fontWeight: '700',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 44,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 28,
    paddingVertical: 17,
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(91,33,182,0.30)' },
      default: { shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 16 },
    }) as any,
  },
  primaryButtonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  homeLink: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 12,
  },
  homeLinkText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
});
