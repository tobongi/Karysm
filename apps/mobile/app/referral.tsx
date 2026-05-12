import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconGift from '@tabler/icons-react-native/dist/esm/icons/IconGift.mjs';
import IconCopy from '@tabler/icons-react-native/dist/esm/icons/IconCopy.mjs';
import IconShare from '@tabler/icons-react-native/dist/esm/icons/IconShare.mjs';
import IconUsers from '@tabler/icons-react-native/dist/esm/icons/IconUsers.mjs';
import IconCoins from '@tabler/icons-react-native/dist/esm/icons/IconCoins.mjs';
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft.mjs';
import { router } from 'expo-router';
import { colors } from '../src/theme/colors';
import Button from '../src/components/Button';
import Card from '../src/components/Card';
import { useAuth } from '../src/lib/auth-context';
import { showAlert } from '../src/lib/alert';

function generateReferralCode(user: { name?: string; phone?: string } | null): string {
  if (!user) return 'Karysm0000';
  const namePrefix = (user.name || 'TOK').slice(0, 3).toUpperCase();
  const phoneSuffix = (user.phone || '0000').slice(-4);
  return `${namePrefix}${phoneSuffix}`;
}

export default function ReferralScreen() {
  const { user } = useAuth();

  const referralCode = useMemo(() => generateReferralCode(user), [user]);

  const handleCopyCode = () => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(referralCode);
      }
    }
    showAlert('Code copie !', `Le code ${referralCode} a ete copie dans le presse-papiers.`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Rejoins Karysm ! Utilise mon code ${referralCode} pour t'inscrire. https://karysm.com`,
      });
    } catch {
      // user cancelled
    }
  };

  const steps = [
    {
      number: '1',
      title: 'Partagez votre code',
      description: 'Envoyez votre code de parrainage a vos amis',
    },
    {
      number: '2',
      title: "Ils s'inscrivent",
      description: 'Vos amis creent un compte avec votre code',
    },
    {
      number: '3',
      title: 'Vous etes recompenses',
      description: 'Recevez des credits pour chaque inscription',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <IconArrowLeft size={24} color={colors.accent} />
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.giftCircle}>
            <IconGift size={40} color={colors.white} />
          </View>
          <Text style={styles.title}>Invitez vos amis</Text>
          <Text style={styles.subtitle}>
            Partagez Karysm et gagnez des recompenses pour chaque ami inscrit
          </Text>
        </View>

        {/* Referral code card */}
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Votre code de parrainage</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralCode}</Text>
          </View>
          <Pressable onPress={handleCopyCode} style={styles.copyButton}>
            <IconCopy size={18} color={colors.primary} />
            <Text style={styles.copyText}>Copier le code</Text>
          </Pressable>
        </Card>

        {/* How it works */}
        <Text style={styles.sectionTitle}>Comment ca marche</Text>
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={step.number} style={styles.stepRow}>
              {/* Left: circle + line */}
              <View style={styles.stepLeft}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>{step.number}</Text>
                </View>
                {index < steps.length - 1 && <View style={styles.stepLine} />}
              </View>
              {/* Right: text */}
              <View style={styles.stepRight}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <IconUsers size={22} color={colors.primary} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Amis invites</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <IconCoins size={22} color={colors.primary} />
              <Text style={styles.statNumber}>0 FC</Text>
              <Text style={styles.statLabel}>Gagnes</Text>
            </View>
          </View>
        </Card>

        {/* Share button */}
        <View style={styles.shareButtonWrapper}>
          <Button
            title="Partager le code"
            onPress={handleShare}
            size="lg"
            fullWidth
            icon={<IconShare size={20} color={colors.white} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: 8,
  },
  giftCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.accent,
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 21,
  },

  // Code card
  codeCard: {
    marginTop: 28,
    alignItems: 'center' as const,
  },
  codeLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  codeBox: {
    backgroundColor: colors.primaryGhost,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginTop: 12,
    alignSelf: 'stretch' as const,
    alignItems: 'center' as const,
  },
  codeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: colors.accent,
    letterSpacing: 4,
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  copyText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.primary,
    marginLeft: 6,
  },

  // How it works
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.accent,
    marginTop: 32,
    marginBottom: 16,
  },
  stepsContainer: {
    marginLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepLeft: {
    alignItems: 'center',
    width: 40,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: colors.white,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.n300,
    marginVertical: 4,
  },
  stepRight: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 24,
  },
  stepTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  stepDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

  // Stats
  statsCard: {
    marginTop: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.accent,
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: colors.n300,
  },

  // Share button
  shareButtonWrapper: {
    marginTop: 32,
  },
});
