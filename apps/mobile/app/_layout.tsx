import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../src/lib/auth-context';
import { colors } from '../src/theme/colors';
import { registerForPushNotifications, addNotificationResponseListener } from '../src/lib/notifications';
import { router } from 'expo-router';

function PushNotificationSetup() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user]);

  useEffect(() => {
    const subscription = addNotificationResponseListener((bookingId) => {
      if (bookingId) {
        router.push(`/booking/detail/${bookingId}`);
      }
    });
    return () => subscription.remove();
  }, []);

  return null;
}

function AppContent() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.accent,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Connexion', headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ title: 'Inscription', headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="provider/[slug]" options={{ title: '' }} />
        <Stack.Screen name="booking/[providerId]" options={{ title: 'Réserver' }} />
        <Stack.Screen name="booking/detail/[id]" options={{ title: 'Réservation' }} />
        <Stack.Screen name="provider-register" options={{ title: 'Devenir prestataire' }} />
        <Stack.Screen name="provider-dashboard/services" options={{ title: 'Mes services' }} />
        <Stack.Screen name="provider-dashboard/availability" options={{ title: 'Disponibilités' }} />
        <Stack.Screen name="provider-dashboard/earnings" options={{ title: 'Mes revenus' }} />
        <Stack.Screen name="request/create" options={{ title: 'Nouvelle demande' }} />
        <Stack.Screen name="request/[id]" options={{ title: 'Demande' }} />
        <Stack.Screen name="request/browse" options={{ title: 'Demandes ouvertes' }} />
        <Stack.Screen name="booking/review/[bookingId]" options={{ title: 'Laisser un avis' }} />
        <Stack.Screen name="favorites" options={{ title: 'Favoris' }} />
        <Stack.Screen name="settings/edit-profile" options={{ title: 'Modifier le profil' }} />
        <Stack.Screen name="kyc/index" options={{ title: 'Vérification KYC' }} />
        <Stack.Screen name="wallet/index" options={{ title: 'Portefeuille' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PushNotificationSetup />
      {Platform.OS === 'web' ? (
        <View style={styles.webShell}>
          <View style={styles.webDevice}>
            <AppContent />
          </View>
        </View>
      ) : (
        <AppContent />
      )}
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    backgroundColor: '#E8E0F0',
    alignItems: 'center',
  },
  webDevice: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.bg,
    // Subtle shadow to look like a device
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 40px rgba(124,58,237,0.1)',
    } : {}),
  },
});
