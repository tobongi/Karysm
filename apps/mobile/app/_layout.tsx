import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/lib/auth-context';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
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
        <Stack.Screen name="booking/[providerId]" options={{ title: 'Reserver' }} />
        <Stack.Screen name="booking/detail/[id]" options={{ title: 'Reservation' }} />
        <Stack.Screen name="provider-dashboard/services" options={{ title: 'Mes services' }} />
        <Stack.Screen name="provider-dashboard/availability" options={{ title: 'Disponibilites' }} />
        <Stack.Screen name="provider-dashboard/earnings" options={{ title: 'Mes revenus' }} />
      </Stack>
    </AuthProvider>
  );
}
