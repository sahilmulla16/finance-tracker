import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

export interface QuickAddLogoProps {
  size?: number;
  badgeSize?: number;
}

/**
 * Minimal & Premium Quick Add Logo
 * Features a refined geometric lightning spark inside a sleek rounded squircle.
 */
export function QuickAddLogo({ size = 36 }: QuickAddLogoProps) {
  const colors = useColors();
  const isDark = colors.canvas !== "#FFFFFF";

  const primaryAccent = colors.primary;
  const bgFill = isDark
    ? "rgba(184, 243, 107, 0.12)"
    : "rgba(16, 28, 61, 0.08)";
  const borderColor = isDark
    ? "rgba(184, 243, 107, 0.25)"
    : "rgba(16, 28, 61, 0.15)";
  const boltColor = isDark ? "#B8F36B" : "#101C3D";

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          backgroundColor: bgFill,
          borderColor: borderColor,
        },
      ]}
    >
      <Svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 24 24"
        fill="none"
      >
        <Defs>
          <LinearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={boltColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={boltColor} stopOpacity="0.85" />
          </LinearGradient>
        </Defs>
        {/* Sleek, geometric, high-precision lightning glyph */}
        <Path
          d="M13.5 2.5L4.5 13H11.5L10.5 21.5L19.5 11H12.5L13.5 2.5Z"
          fill="url(#boltGrad)"
          stroke={boltColor}
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
