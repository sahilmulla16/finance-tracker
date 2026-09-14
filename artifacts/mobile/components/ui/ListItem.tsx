import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, lineHeight, radius } from '@/constants/tokens';
import { Feather } from '@expo/vector-icons';

type ListItemProps = {
  icon?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  style?: ViewStyle;
};

export function ListItem({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onPress,
  trailing,
  showChevron = true,
  style,
}: ListItemProps) {
  const colors = useColors();

  const content = (
    <View style={[styles.row, style]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceRecessed }]}>
          <Feather name={icon as any} size={18} color={iconColor || colors.fgMuted} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.fg }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.fgMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text style={[styles.value, { color: colors.fgMuted }]} numberOfLines={1}>
          {value}
        </Text>
      )}
      {trailing}
      {showChevron && onPress && (
        <Feather name="chevron-right" size={18} color={colors.fgMuted} style={styles.chevron} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minHeight: 56,
    paddingVertical: spacing[3],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.snug,
  },
  subtitle: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.snug,
  },
  value: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    whiteSpace: 'nowrap',
  },
  chevron: {
    marginLeft: spacing[1],
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.7,
  },
});
