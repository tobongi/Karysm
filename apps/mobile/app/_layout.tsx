import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, StyleSheet } from 'react-native';
import { AuthProvider } from '../src/lib/auth-context';
import { colors } from '../src/theme/colors';

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
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
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
