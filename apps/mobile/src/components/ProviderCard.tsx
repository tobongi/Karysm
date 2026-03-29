import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radius, shadows, fonts } from '../theme';

interface ProviderCardProps {
  name: string;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  address: string;
  distance: string;
  offer?: string | null;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  style?: ViewStyle;
}

export default function ProviderCard({
  name,
  imageUrl,
  rating,
  reviewCount,
  address,
  distance,
  offer,
  onPress,
  onFavorite,
  isFavorite = false,
  style,
}: ProviderCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.95 },
        style,
      ]}
    >
      {/* Image area */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}

        {/* Favorite heart */}
        {onFavorite && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onFavorite();
            }}
            style={styles.favoriteButton}
            hitSlop={8}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '\u2665' : '\u2661'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Offer bar */}
      {offer ? (
        <View style={styles.offerBar}>
          <Text style={styles.offerText} numberOfLines={1}>
            {offer}
          </Text>
        </View>
      ) : null}

      {/* Info area */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {address}
        </Text>
        <View style={styles.row}>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>{'\u2605'}</Text>
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
            {reviewCount > 0 && (
              <Text style={styles.reviewCount}>({reviewCount})</Text>
            )}
          </View>
          <Text style={styles.distance}>{distance}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  } as ViewStyle,
  imageContainer: {
    height: 160,
    backgroundColor: colors.n300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.n300,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 18,
    color: colors.white,
  },
  offerBar: {
    backgroundColor: colors.n300,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  info: {
    padding: 12,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.accent,
  },
  address: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.terracotta,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 14,
    color: colors.star,
  },
  ratingValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    marginLeft: 4,
  },
  reviewCount: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 2,
  },
  distance: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.terracotta,
  },
});
