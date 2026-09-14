import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, lineHeight, radius } from '@/constants/tokens';
import { Feather } from '@expo/vector-icons';

type EmptyStateProps = {
  icon: string;
  title: string;
  message: string;
};

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceRecessed }]}>
        <Feather name={icon as any} size={32} color={colors.fgSubtle} />
      </View>
      <Text style={[styles.title, { color: colors.fg }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.fgMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[8],
    gap: spacing[4],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    lineHeight: fontSize.lg * lineHeight.snug,
  },
  message: {
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: fontSize.base * lineHeight.normal,
    maxWidth: 280,
  },
});
