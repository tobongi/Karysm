import { Redirect } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>Tokoss</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!user) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  logo: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontStyle: 'italic',
    fontSize: 42,
    color: colors.accent,
    letterSpacing: -0.5,
  },
});
