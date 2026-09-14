import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, fontSize, fontWeight, lineHeight, radius } from '@/constants/tokens';

type SegmentedControlProps = {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  variant?: 'default' | 'dark';
  style?: ViewStyle;
};

export function SegmentedControl({
  options,
  selected,
  onSelect,
  variant = 'default',
  style,
}: SegmentedControlProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceRecessed,
        },
        style,
      ]}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onSelect(option)}
          style={[
            styles.option,
            selected === option && {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              {
                color: selected === option ? colors.fg : colors.fgMuted,
              },
            ]}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.full,
    padding: 3,
    gap: 4,
  },
  option: {
    flex: 1,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 26,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
});
