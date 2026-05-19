import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Share,
  StyleSheet,
} from 'react-native';
import IconCopy from '@tabler/icons-react-native/dist/esm/icons/IconCopy.mjs';
import IconShare from '@tabler/icons-react-native/dist/esm/icons/IconShare.mjs';
import IconUsers from '@tabler/icons-react-native/dist/esm/icons/IconUsers.mjs';
import IconCoins from '@tabler/icons-react-native/dist/esm/icons/IconCoins.mjs';
import { colors } from '../src/theme/colors';
import CurveHeader from '../src/components/CurveHeader';
import { PressableScale } from '../src/components/animations';
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
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralCode).then(() => {
        showAlert('Code copié ✓', `${referralCode} est dans votre presse-papiers`);
      });
    } else {
      showAlert('Code copié', referralCode);
    }
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
      description: 'Envoyez votre code de parrainage à vos amies',
    },
    {
      number: '2',
      title: 'Votre amie reçoit -10%',
      description: 'Elle s\'inscrit avec votre code',
    },
    {
      number: '3',
      title: 'Vous gagnez 1 000 FC',
      description: 'Crédité à chaque inscription',
    },
  ];

  return (
    <View style={styles.container}>
      <CurveHeader title="Inviter des amies" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Partagez Karysm</Text>
          <Text style={styles.heroSubtitle}>
            Gagnez des récompenses à chaque amie invitée
          </Text>
        </View>

        {/* Code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Votre code de parrainage</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralCode}</Text>
          </View>
          <PressableScale
            style={styles.copyButton}
            onPress={handleCopyCode}
          >
            <IconCopy size={16} color={colors.primary} strokeWidth={2} />
            <Text style={styles.copyText}>Copier le code</Text>
          </PressableScale>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <IconUsers size={20} color={colors.primary} strokeWidth={1.8} />
              </View>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Amies invitées</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <IconCoins size={20} color={colors.primary} strokeWidth={1.8} />
              </View>
              <Text style={styles.statNumber}>0 FC</Text>
              <Text style={styles.statLabel}>Gagnées</Text>
            </View>
          </View>
        </View>

        {/* Share button */}
        <PressableScale
          style={styles.shareBtn}
          onPress={handleShare}
        >
          <IconShare size={18} color={colors.white} strokeWidth={2} />
          <Text style={styles.shareBtnText}>Partager le code</Text>
        </PressableScale>

        {/* How it works */}
        <Text style={styles.sectionTitle}>Comment ça marche</Text>
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Hero card
  heroCard: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    fontStyle: 'italic' as const,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },

  // Code card
  codeCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  codeLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: colors.primaryGhost,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 14,
  },
  codeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: colors.accent,
    letterSpacing: 2,
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  copyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },

  // Stats card
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: colors.accent,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 52,
    backgroundColor: colors.border,
  },

  // Share button
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 32,
  },
  shareBtnText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },

  // How it works
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  stepsContainer: {
    marginLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 20,
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
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  stepRight: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 8,
  },
  stepTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.text,
    marginBottom: 2,
  },
  stepDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});
