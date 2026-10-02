import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { resolveCategoryVisual } from "@/utils/categoryResolver";

export type CategoryVisualSize = "small" | "medium" | "large" | number;

type CategoryVisualProps = {
  categoryName?: string;
  iconName?: string;
  color?: string;
  size?: CategoryVisualSize;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SIZES: Record<"small" | "medium" | "large", number> = {
  small: 28,
  medium: 40,
  large: 56,
};

export function CategoryVisual({
  categoryName,
  iconName,
  color,
  size = "medium",
  showBorder = false,
  style,
}: CategoryVisualProps) {
  const pixelSize = typeof size === "number" ? size : SIZES[size];
  const visual = resolveCategoryVisual(categoryName, iconName);
  const borderRadius = Math.round(pixelSize * 0.28);

  // If a dedicated built-in category SVG logo is available, ALWAYS render the actual logo!
  if (visual.id !== "other") {
    return (
      <View
        style={[
          styles.container,
          {
            width: pixelSize,
            height: pixelSize,
            borderRadius,
          },
          showBorder && {
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          },
          style,
        ]}
      >
        {visual.renderVisual(pixelSize)}
      </View>
    );
  }

  // For custom/other categories with a specified custom color, render custom colored tile
  if (color) {
    const iconSize = Math.max(14, Math.round(pixelSize * 0.48));
    return (
      <View
        style={[
          styles.container,
          {
            width: pixelSize,
            height: pixelSize,
            borderRadius,
            backgroundColor: color,
          },
          showBorder && {
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.18)",
          },
          style,
        ]}
      >
        <Feather
          name={(iconName as never) || "tag"}
          size={iconSize}
          color="#FFFFFF"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: pixelSize,
          height: pixelSize,
          borderRadius,
        },
        showBorder && {
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
        },
        style,
      ]}
    >
      {visual.renderVisual(pixelSize)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
