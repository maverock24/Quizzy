import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type GradientColors = readonly [string, string, ...string[]];

interface SafeAreaLinearGradientProps {
  children: ReactNode;
  colors?: GradientColors;
  style?: ViewStyle;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const SafeAreaLinearGradient: React.FC<SafeAreaLinearGradientProps> = ({
  children,
  colors = ['#1a1a1a', '#2a2a2a'],
  style,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
}) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        start={start}
        end={end}
      />
      <SafeAreaView style={styles.contentContainer}>{children}</SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    overflow: 'visible',
  },
});
