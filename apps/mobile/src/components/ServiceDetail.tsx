import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform } from 'react-native';
import IconClock from '@tabler/icons-react-native/dist/esm/icons/IconClock.mjs';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import Button from './Button';

interface ServiceInfo {
  name: string;
  description?: string;
  durationMin: number;
  priceMin: number;
  priceMax?: number | null;
  currency: string;
}

interface ServiceDetailProps {
  visible: boolean;
  onClose: () => void;
  service: ServiceInfo | null;
  onBook?: () => void;
}

function formatPrice(priceMin: number, priceMax: number | null | undefined, currency: string): string {
  const symbol = currency === 'CDF' ? 'FC' : 'FCFA';
  if (priceMax && priceMax > priceMin) {
    return `${priceMin.toLocaleString('fr-FR')} - ${priceMax.toLocaleString('fr-FR')} ${symbol}`;
  }
  return `${priceMin.toLocaleString('fr-FR')} ${symbol}`;
}

export default function ServiceDetail({ visible, onClose, service, onBook }: ServiceDetailProps) {
  if (!service) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Drag handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Service name */}
            <Text style={styles.serviceName}>{service.name}</Text>

            {/* Duration */}
            <View style={styles.durationRow}>
              <IconClock size={16} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={styles.durationText}>{service.durationMin} min</Text>
            </View>

            {/* Price */}
            <Text style={styles.price}>
              {formatPrice(service.priceMin, service.priceMax, service.currency)}
            </Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Description */}
            <Text style={styles.descriptionTitle}>Description</Text>
            {service.description ? (
              <Text style={styles.descriptionText}>{service.description}</Text>
            ) : (
              <Text style={[styles.descriptionText, styles.noDescription]}>
                Aucune description disponible
              </Text>
            )}

            {/* Book button */}
            {onBook && (
              <Button
                title="Reserver ce service"
                size="lg"
                fullWidth
                style={styles.bookButton}
                onPress={() => {
                  onBook();
                  onClose();
                }}
              />
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
    ...(Platform.OS === 'web' ? { maxWidth: 480, alignSelf: 'center', width: '100%' } : {}),
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.n300,
  },
  serviceName: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  durationText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  price: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    fontWeight: '700',
    color: colors.terracotta,
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  descriptionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  descriptionText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: 8,
  },
  noDescription: {
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  bookButton: {
    marginTop: 24,
  },
});
