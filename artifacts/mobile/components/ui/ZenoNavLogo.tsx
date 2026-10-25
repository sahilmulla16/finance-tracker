import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

export interface ZenoNavLogoProps {
  color?: string;
  size?: number;
  focused?: boolean;
}

/**
 * Subtle and minimal Zeno AI navigation tab emblem.
 * Uses clean geometric vector curves for a sleek, modern, native aesthetic.
 */
export function ZenoNavLogo({
  color = "#B8F36B",
  size = 22,
  focused = false,
}: ZenoNavLogoProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Primary 4-point AI spark with organic gentle curvature */}
        <Path
          d="M12 2C12 7.523 7.523 12 2 12C7.523 12 12 16.477 12 22C12 16.477 16.477 12 22 12C16.477 12 12 7.523 12 2Z"
          fill={focused ? color : "none"}
          stroke={color}
          strokeWidth={focused ? "1.6" : "1.75"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Subtle center core accent */}
        <Circle
          cx="12"
          cy="12"
          r={focused ? "1.8" : "1.2"}
          fill={focused ? "#000000" : color}
        />
      </Svg>
    </View>
  );
}
