import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck.mjs';

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
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (bookingId) {
                router.replace(`/booking/detail/${bookingId}` as any);
              } else {
                router.replace('/(tabs)/bookings' as any);
              }
            }}
          >
            <Text style={styles.primaryButtonText}>Voir ma réservation</Text>
          </Pressable>

          <Pressable
            style={styles.homeLink}
            onPress={() => router.replace('/(tabs)' as any)}
          >
            <Text style={styles.homeLinkText}>Retour à l'accueil</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2E4D9',
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#CA987E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B6952',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: '#1A1A2E',
    textAlign: 'center',
    marginTop: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    padding: 20,
    marginTop: 28,
    width: '100%',
    alignItems: 'center',
  },
  providerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#1A1A2E',
    textAlign: 'center',
  },
  detailText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#4A4A4A',
    textAlign: 'center',
    marginTop: 4,
  },
  priceText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#8B6952',
    textAlign: 'center',
    marginTop: 12,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#CA987E',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  homeLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  homeLinkText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#3A2228',
  },
});
