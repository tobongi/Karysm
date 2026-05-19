import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import IconArrowRight from '@tabler/icons-react-native/dist/esm/icons/IconArrowRight.mjs';

interface BeforeAfterProps {
  beforeImage: string | null;
  afterImage: string | null;
  serviceName: string;
  onPress?: () => void;
}

export default function BeforeAfter({ beforeImage, afterImage, serviceName, onPress }: BeforeAfterProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.imageRow}>
        <View style={styles.imageWrapper}>
          <View style={[styles.image, !beforeImage && styles.placeholder]}>
            {beforeImage ? (
              <Image source={{ uri: beforeImage }} style={styles.img} resizeMode="cover" />
            ) : (
              <Text style={styles.placeholderText}>Avant</Text>
            )}
          </View>
          <View style={styles.labelBadge}>
            <Text style={styles.labelText}>AVANT</Text>
          </View>
        </View>

        <View style={styles.arrow}>
          <IconArrowRight size={20} color={colors.textSecondary} />
        </View>

        <View style={styles.imageWrapper}>
          <View style={[styles.image, !afterImage && styles.placeholderAfter]}>
            {afterImage ? (
              <Image source={{ uri: afterImage }} style={styles.img} resizeMode="cover" />
            ) : (
              <Text style={styles.placeholderText}>Après</Text>
            )}
          </View>
          <View style={[styles.labelBadge, styles.labelAfter]}>
            <Text style={[styles.labelText, styles.labelAfterText]}>APRÈS</Text>
          </View>
        </View>
      </View>
      <Text style={styles.serviceName}>{serviceName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 12,
    overflow: 'hidden',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 14,
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderAfter: {
    backgroundColor: colors.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  labelBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  labelText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  labelAfter: {
    backgroundColor: colors.accent,
  },
  labelAfterText: {
    color: '#FFFFFF',
  },
  arrow: {
    paddingHorizontal: 4,
  },
  serviceName: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
});
