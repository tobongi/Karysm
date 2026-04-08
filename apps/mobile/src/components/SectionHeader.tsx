import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '../theme/colors';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  seeAllText?: string;
}

function SectionHeader({ title, onSeeAll, seeAllText = 'Voir tout' }: SectionHeaderProps) {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 16,
      marginTop: 24,
    }}>
      <Text style={{
        fontFamily: 'Poppins_700Bold',
        fontSize: 18,
        color: colors.text,
      }}>
        {title}
      </Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={{
            fontFamily: 'Poppins_500Medium',
            fontSize: 13,
            color: colors.primary,
          }}>
            {seeAllText} {'\u203A'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default SectionHeader;
