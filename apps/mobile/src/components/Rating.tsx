import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
import IconStar from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';

type RatingSize = 'sm' | 'md';

interface RatingProps {
  rating: number;
  reviewCount?: number;
  size?: RatingSize;
}

export default function Rating({ rating, reviewCount, size = 'md' }: RatingProps) {
  const isSm = size === 'sm';

  return (
    <View style={styles.container}>
      <IconStar size={isSm ? 14 : 16} color={colors.star} fill={colors.star} />
      <Text style={[styles.rating, { fontSize: isSm ? 12 : 14 }]}>
        {rating.toFixed(1)}
      </Text>
      {reviewCount != null ? (
        <Text style={[styles.count, { fontSize: isSm ? 11 : 12 }]}>
          ({reviewCount})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontFamily: fonts.bodyBold,
    color: colors.n900,
  },
  count: {
    fontFamily: fonts.body,
    color: colors.terracotta,
  },
});
