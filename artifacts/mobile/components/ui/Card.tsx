import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/tokens';

type CardProps = {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'hero' | 'recessed';
  style?: ViewStyle;
  noPadding?: boolean;
};

export function Card({ children, variant = 'default', style, noPadding }: CardProps) {
  const colors = useColors();

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    elevated: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hero: {
      backgroundColor: colors.heroBg,
      borderWidth: 0,
    },
    recessed: {
      backgroundColor: colors.surfaceRecessed,
      borderWidth: 0,
    },
  };

  return (
    <View
      style={[
        styles.card,
        variantStyles[variant],
        !noPadding && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.card,
  },
});
