import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/tokens';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Base Shimmer Skeleton Element
 *
 * Implements smooth 60fps horizontal gradient sweep that mirrors
 * real interface components during loading and hydration.
 */
export function Skeleton({
  width,
  height,
  borderRadius = radius.md,
  style,
  children,
}: SkeletonProps) {
  const colors = useColors();
  const isDark = colors.isDark ?? colors.canvas !== '#FFFFFF';

  const [layoutWidth, setLayoutWidth] = useState<number>(
    typeof width === 'number' ? width : 100
  );

  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1350,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== layoutWidth) {
      setLayoutWidth(w);
    }
  };

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-layoutWidth, layoutWidth * 1.5],
  });

  const baseBg = isDark ? '#161B18' : '#E8EDF2';
  const highlightColors: readonly [string, string, string] = isDark
    ? ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)']
    : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0)'];

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.skeletonContainer,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: baseBg,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            width: layoutWidth,
            transform: [{ translateX }],
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={highlightColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      {children}
    </View>
  );
}

/** Circular skeleton for avatars, icons, badges */
export function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

/** Text line placeholder with natural typography line heights */
export function SkeletonText({
  width = '100%',
  height = 14,
  borderRadius = radius.sm,
  style,
}: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
}

/** Card container skeleton replicating Zeno's curved surface boxes */
export function SkeletonCard({
  height,
  borderRadius = radius.xl,
  style,
  children,
}: {
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const colors = useColors();
  const isDark = colors.isDark ?? colors.canvas !== '#FFFFFF';

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? '#141816' : '#FFFFFF',
          borderColor: isDark ? '#232E27' : '#E8ECF2',
          borderRadius,
          height,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    overflow: 'hidden',
  },
  cardContainer: {
    borderWidth: 1,
    padding: spacing[4],
    overflow: 'hidden',
  },
});

