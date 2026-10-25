import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
  Modal,
} from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { fontSize, fontWeight, radius, spacing } from '@/constants/tokens';

export interface PremiumLoaderProps {
  /** Size preset or exact numeric pixel dimension */
  size?: 'small' | 'medium' | 'large' | number;
  /** Primary accent color. Defaults to theme colors.primary */
  color?: string;
  /** Optional secondary track/glow color */
  secondaryColor?: string;
  /** Optional message displayed below the loader */
  message?: string;
  /** Optional sub-message or status detail */
  submessage?: string;
  /** Whether to render as a full-screen overlay backdrop */
  overlay?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

/**
 * Zeno Premium Minimal Loader
 *
 * Bespoke fintech loading indicator featuring:
 * - Fluid dual-arc orbital ring with smooth continuous 60fps rotation
 * - Central 4-point Zeno sparkle / diamond mark with subtle breathing pulse
 * - Ambient radial glow
 * - Optional micro-copy with graceful pulse
 * - Automatic dark/light theme integration
 */
export function PremiumLoader({
  size = 'medium',
  color,
  secondaryColor,
  message,
  submessage,
  overlay = false,
  style,
}: PremiumLoaderProps) {
  const colors = useColors();
  const isDark = colors.isDark ?? colors.canvas !== '#FFFFFF';

  // Resolve numeric dimensions
  const dimension =
    typeof size === 'number'
      ? size
      : size === 'small'
      ? 22
      : size === 'large'
      ? 56
      : 38;

  const accentColor = color || (isDark ? '#B7FF63' : '#10B981');
  const trackColor =
    secondaryColor ||
    (isDark ? 'rgba(183, 255, 99, 0.15)' : 'rgba(16, 185, 129, 0.15)');

  // Continuous rotation driver
  const spinAnim = useRef(new Animated.Value(0)).current;
  // Subtle pulse / breath driver
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spinAnim, pulseAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const centerScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.12],
  });

  const centerOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  const strokeWidth = dimension <= 24 ? 2.5 : dimension >= 50 ? 4 : 3.2;
  const radiusVal = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  // Arc length: ~65% of circle
  const dashLength = circumference * 0.65;
  const gapLength = circumference - dashLength;

  const loaderContent = (
    <View style={[styles.wrapper, style]}>
      {/* Central Rotating Orbital Ring */}
      <View
        style={[
          styles.spinnerBox,
          { width: dimension, height: dimension },
        ]}
      >
        {/* Static Background Track Ring */}
        <Svg
          width={dimension}
          height={dimension}
          style={StyleSheet.absoluteFillObject}
        >
          <Circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radiusVal}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>

        {/* Dynamic Spinning Foreground Arc */}
        <AnimatedSvg
          width={dimension}
          height={dimension}
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Defs>
            <SvgLinearGradient id="zenoLoaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={accentColor} stopOpacity="1" />
              <Stop offset="70%" stopColor={accentColor} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={accentColor} stopOpacity="0.1" />
            </SvgLinearGradient>
          </Defs>
          <Circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radiusVal}
            stroke="url(#zenoLoaderGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${gapLength}`}
            strokeLinecap="round"
            fill="none"
          />
        </AnimatedSvg>

        {/* Center Breathing Sparkle / Diamond Emblem (visible on medium & large) */}
        {dimension >= 30 && (
          <Animated.View
            style={[
              styles.centerMark,
              {
                transform: [{ scale: centerScale }],
                opacity: centerOpacity,
              },
            ]}
          >
            <Svg width={dimension * 0.38} height={dimension * 0.38} viewBox="0 0 24 24">
              <Path
                d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
                fill={accentColor}
              />
            </Svg>
          </Animated.View>
        )}
      </View>

      {/* Optional Status Micro-Copy */}
      {message && (
        <Text
          style={[
            styles.message,
            {
              color: colors.fg,
              fontSize: dimension >= 50 ? fontSize.base : fontSize.sm,
            },
          ]}
        >
          {message}
        </Text>
      )}

      {submessage && (
        <Text
          style={[
            styles.submessage,
            {
              color: colors.fgMuted,
              fontSize: fontSize.xs,
            },
          ]}
        >
          {submessage}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent animationType="fade" visible>
        <View
          style={[
            styles.overlayBackdrop,
            {
              backgroundColor: isDark
                ? 'rgba(9, 11, 10, 0.78)'
                : 'rgba(255, 255, 255, 0.84)',
            },
          ]}
        >
          <View
            style={[
              styles.overlayCard,
              {
                backgroundColor: isDark ? '#141816' : '#FFFFFF',
                borderColor: isDark ? '#232E27' : '#E5E9F0',
                shadowColor: isDark ? '#000000' : '#1A2E20',
              },
            ]}
          >
            {loaderContent}
          </View>
        </View>
      </Modal>
    );
  }

  return loaderContent;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerMark: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: spacing[3],
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  submessage: {
    marginTop: spacing[1],
    textAlign: 'center',
  },
  overlayBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  overlayCard: {
    minWidth: 180,
    maxWidth: 280,
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[6],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
});

