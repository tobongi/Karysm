import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';

interface CurveHeaderProps {
  title: string;
  subtitle?: string;
  height?: number;
  children?: React.ReactNode;
}

const CURVE_DIP = 45;

export default function CurveHeader({ title, subtitle, height = 200, children }: CurveHeaderProps) {
  const [w, setW] = useState(480);
  const totalH = height + CURVE_DIP;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const measured = e.nativeEvent.layout.width;
    if (measured > 0) setW(measured);
  }, []);

  const d = useMemo(() => [
    `M0,0`,
    `L0,${height}`,
    `C${w * 0.3},${height + CURVE_DIP} ${w * 0.7},${height - CURVE_DIP * 0.6} ${w},${height - 15}`,
    `L${w},0 Z`,
  ].join(' '), [w, height]);

  return (
    <View style={[styles.container, { height: totalH }]} onLayout={onLayout}>
      <Svg
        width="100%"
        height={totalH}
        viewBox={`0 0 ${w} ${totalH}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Path d={d} fill={colors.headerDark} />
      </Svg>
      <View style={[styles.content, { paddingTop: Platform.OS === 'ios' ? 56 : 44 }]}>
        {children}
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: CURVE_DIP + 16,
  },
  textWrap: {
    gap: 4,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});
