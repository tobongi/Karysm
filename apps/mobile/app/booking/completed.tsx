import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { IconCheck, IconUser, IconScissors, IconCalendarEvent, IconClock } from '@tabler/icons-react-native';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { spacing, screenPadding, radius } from '../../src/theme/spacing';
import { shadows } from '../../src/theme/shadows';
import Button from '../../src/components/Button';
import { Pressable } from 'react-native';

interface BookingDetailRow {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export default function BookingCompletedScreen() {
  const { bookingId, providerName, serviceName, date, time, price } = useLocalSearchParams<{
    bookingId: string;
    providerName: string;
    serviceName: string;
    date: string;
    time: string;
    price: string;
  }>();

  const rows: BookingDetailRow[] = [];
  if (providerName) rows.push({ icon: <IconUser size={18} color={colors.textSecondary} strokeWidth={1.5} />, label: 'Prestataire', value: providerName });
  if (serviceName) rows.push({ icon: <IconScissors size={18} color={colors.textSecondary} strokeWidth={1.5} />, label: 'Service', value: serviceName });
  if (date) rows.push({ icon: <IconCalendarEvent size={18} color={colors.textSecondary} strokeWidth={1.5} />, label: 'Date', value: date });
  if (time) rows.push({ icon: <IconClock size={18} color={colors.textSecondary} strokeWidth={1.5} />, label: 'Heure', value: time });
  if (price) rows.push({ icon: <Text style={styles.priceIcon}>FC</Text>, label: 'Prix', value: price });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.webWrapper}>
        {/* Centered content */}
        <View style={styles.centerContent}>
          {/* Success circle */}
          <View style={styles.successCircle}>
            <IconCheck size={48} color={colors.white} strokeWidth={2.5} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Reservation confirmee !</Text>
          <Text style={styles.subtitle}>Votre rendez-vous a ete enregistre avec succes</Text>

          {/* Booking summary card */}
          {rows.length > 0 && (
            <View style={styles.summaryCard}>
              {rows.map((row, index) => (
                <View key={row.label}>
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      {row.icon}
                      <Text style={styles.rowLabel}>{row.label}</Text>
                    </View>
                    <Text style={styles.rowValue}>{row.value}</Text>
                  </View>
                  {index < rows.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom buttons */}
        <View style={styles.bottomContainer}>
          <Button
            title="Voir ma reservation"
            size="lg"
            fullWidth
            onPress={() => {
              if (bookingId) {
                router.replace(`/booking/detail/${bookingId}` as any);
              } else {
                router.replace('/(tabs)/bookings' as any);
              }
            }}
          />
          <Pressable
            style={styles.homeLink}
            onPress={() => router.replace('/(tabs)' as any)}
          >
            <Text style={styles.homeLinkText}>Retour a l'accueil</Text>
          </Pressable>
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
    paddingHorizontal: screenPadding.horizontal,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: colors.accent,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: 32,
    width: '100%',
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  rowValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  priceIcon: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 18,
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: screenPadding.horizontal,
    paddingBottom: 40,
  },
  homeLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  homeLinkText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
});
