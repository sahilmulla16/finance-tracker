import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, lineHeight, radius } from '@/constants/tokens';

type SectionHeaderProps = {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function SectionHeader({ title, action, onAction, style }: SectionHeaderProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: colors.fg }]}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={[styles.actionText, { color: colors.primaryText }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.snug,
  },
  action: {
    padding: 0,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
});
