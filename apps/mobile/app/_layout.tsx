import { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
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
          headerTitleStyle: { fontFamily: 'Poppins_600SemiBold', fontWeight: '600', fontSize: 16 },
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerBackTitle: '',
          animation: 'slide_from_right',
          animationDuration: 200,
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <Pressable onPress={() => router.back()} style={{ paddingRight: 16, paddingVertical: 8 }}>
                <Text style={{ fontSize: 22, color: colors.accent, fontFamily: 'Poppins_400Regular' }}>‹</Text>
              </Pressable>
            ) : null,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth/login" options={{ title: 'Connexion', headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Inscription', headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="provider/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="booking/[providerId]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="booking/detail/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="provider-register" options={{ title: 'Devenir prestataire' }} />
        <Stack.Screen name="provider-dashboard/services" options={{ headerShown: false }} />
        <Stack.Screen name="provider-dashboard/availability" options={{ title: 'Disponibilités' }} />
        <Stack.Screen name="provider-dashboard/earnings" options={{ title: 'Mes revenus' }} />
        <Stack.Screen name="request/create" options={{ title: 'Nouvelle demande', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="request/[id]" options={{ title: 'Demande' }} />
        <Stack.Screen name="request/browse" options={{ title: 'Demandes ouvertes' }} />
        <Stack.Screen name="booking/review/[bookingId]" options={{ title: 'Laisser un avis', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="favorites" options={{ title: 'Favoris' }} />
        <Stack.Screen name="settings/edit-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="kyc/index" options={{ title: 'Vérification KYC' }} />
        <Stack.Screen name="wallet/index" options={{ title: 'Portefeuille' }} />
        <Stack.Screen name="ai/skin-capture" options={{ title: 'Analyse de peau', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ai/skin-results/[id]" options={{ title: 'Résultats peau' }} />
        <Stack.Screen name="ai/hair-capture" options={{ title: 'Analyse cheveux', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ai/hair-results/[id]" options={{ title: 'Résultats cheveux' }} />
        <Stack.Screen name="permissions/location" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="permissions/notification" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="referral" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
        <Stack.Screen name="store/[providerId]" options={{ headerShown: false }} />
        <Stack.Screen name="store/product/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="hair-journal" options={{ headerShown: false }} />
        <Stack.Screen name="clients/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="booking/occasion" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="booking/completed" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="scan" options={{ title: 'Scanner un produit', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ai/virtual-tryon" options={{ title: 'Miroir Virtuel', animation: 'slide_from_bottom', headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  // On web: don't block on fonts — CSS handles fallback via font-family stacks
  // On native: wait for fonts to load
  const isWeb = Platform.OS === 'web';
  const ready = isWeb ? true : (fontsLoaded || !!fontError);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, color: colors.accent, fontStyle: 'italic' }}>Karysm</Text>
      </View>
    );
  }

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
    backgroundColor: '#E9D2C2',
    alignItems: 'center',
  },
  webDevice: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.bg,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 40px rgba(167,115,102,0.15)',
    } : {}),
  },
});
