import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius, spacing, fontSize, fontWeight, lineHeight } from '@/constants/tokens';

type BadgeProps = {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'income' | 'expense';
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

export function Badge({ label, variant = 'default', size = 'sm', style }: BadgeProps) {
  const colors = useColors();

  const getColors = () => {
    switch (variant) {
      case 'success':
      case 'income':
        return { bg: `${colors.success}18`, text: colors.success };
      case 'warning':
        return { bg: `${colors.warning}18`, text: colors.warning };
      case 'error':
      case 'expense':
        return { bg: `${colors.error}18`, text: colors.error };
      default:
        return { bg: `${colors.primary}18`, text: colors.primary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'md' && styles.badgeMd,
        style,
      ]}
    >
      <Text style={[styles.text, { color: text }, size === 'md' && styles.textMd]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: 0.04,
    textTransform: 'uppercase',
  },
  textMd: {
    fontSize: fontSize.sm,
  },
});
