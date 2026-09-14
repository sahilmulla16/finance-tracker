import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/tokens';

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: ViewStyle;
};

export function Toggle({
  value,
  onValueChange,
  size = 'md',
  disabled,
  style,
}: ToggleProps) {
  const colors = useColors();
  const thumbSize = size === 'sm' ? 20 : 24;
  const trackWidth = size === 'sm' ? 44 : 52;
  const trackHeight = size === 'sm' ? 26 : 30;

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={[
        styles.track,
        {
          width: trackWidth,
          height: trackHeight,
          borderRadius: trackHeight / 2,
          backgroundColor: value ? colors.primary : colors.surfaceRecessed,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Pressable
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: value ? '#000000' : colors.fgMuted,
            transform: [{ translateX: value ? trackWidth - thumbSize - 4 : 4 }],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
    padding: 2,
  },
  thumb: {
    position: 'absolute',
  },
});
