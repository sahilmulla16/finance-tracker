import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius, spacing, fontSize, fontWeight, lineHeight } from '@/constants/tokens';

type StatTileProps = {
  label: string;
  value: string;
  trend?: string;
  trendColor?: 'income' | 'expense' | 'neutral';
  style?: ViewStyle;
};

export function StatTile({ label, value, trend, trendColor = 'neutral', style }: StatTileProps) {
  const colors = useColors();

  const getTrendColor = () => {
    switch (trendColor) {
      case 'income':
        return colors.income;
      case 'expense':
        return colors.expense;
      default:
        return colors.fgMuted;
    }
  };

  return (
    <View style={[styles.tile, { backgroundColor: colors.surface }, style]}>
      <Text style={[styles.label, { color: colors.fgMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.fg }]}>{value}</Text>
      {trend && (
        <Text style={[styles.trend, { color: getTrendColor() }]}>{trend}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    padding: spacing[4],
  },
  label: {
    fontSize: fontSize.xs,
    letterSpacing: 0.04,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  value: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.medium,
    marginTop: spacing[2],
    letterSpacing: -0.01,
    fontVariant: ['tabular-nums'],
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  trend: {
    fontSize: fontSize.xs,
    marginTop: spacing[1],
    fontWeight: fontWeight.medium,
  },
});
