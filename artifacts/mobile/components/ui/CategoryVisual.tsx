import React from "react";
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  CATEGORY_VISUALS,
  type CategoryVisualId,
} from "@/constants/categoryVisuals";
import { resolveCategoryVisual } from "@/utils/categoryResolver";
import { useFinance, type Category } from "@/context/FinanceContext";

export type CategoryVisualSize = "small" | "medium" | "large" | number;

type CategoryVisualProps = {
  categoryName?: string;
  iconName?: string;
  color?: string;
  imageUrl?: string;
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
  imageUrl,
  size = "medium",
  showBorder = false,
  style,
}: CategoryVisualProps) {
  const pixelSize = typeof size === "number" ? size : SIZES[size];
  const borderRadius = Math.round(pixelSize * 0.28);

  // Attempt to resolve missing details from the category context if categoryName is provided
  let matchedCategory: Category | undefined;
  try {
    const finance = useFinance();
    if (finance?.categories && categoryName) {
      const lower = categoryName.toLowerCase().trim();
      matchedCategory = finance.categories.find(
        (c) =>
          c.name.toLowerCase().trim() === lower ||
          c.id.toLowerCase() === lower,
      );
    }
  } catch {
    // Outside of FinanceProvider context
  }

  const effectiveImageUrl = imageUrl || matchedCategory?.imageUrl;
  const effectiveIcon = iconName || matchedCategory?.icon;
  const effectiveColor = color || matchedCategory?.color;

  // 1. Photo priority: User uploaded a custom category photo
  if (effectiveImageUrl) {
    return (
      <View
        style={[
          styles.container,
          {
            width: pixelSize,
            height: pixelSize,
            borderRadius,
          },
          showBorder && styles.border,
          style,
        ]}
      >
        <Image
          source={{ uri: effectiveImageUrl }}
          style={{ width: pixelSize, height: pixelSize, borderRadius }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // 2. Explicit logo: prefix (e.g., "logo:fuel", "logo:food", "logo:emi")
  if (effectiveIcon && effectiveIcon.startsWith("logo:")) {
    const visualId = effectiveIcon.slice(5) as CategoryVisualId;
    const visualDef = CATEGORY_VISUALS[visualId];
    if (visualDef) {
      return (
        <View
          style={[
            styles.container,
            {
              width: pixelSize,
              height: pixelSize,
              borderRadius,
            },
            showBorder && styles.border,
            style,
          ]}
        >
          {visualDef.renderVisual(pixelSize)}
        </View>
      );
    }
  }

  // 3. Direct CategoryVisualId match
  if (effectiveIcon && CATEGORY_VISUALS[effectiveIcon as CategoryVisualId]) {
    const visualDef = CATEGORY_VISUALS[effectiveIcon as CategoryVisualId];
    return (
      <View
        style={[
          styles.container,
          {
            width: pixelSize,
            height: pixelSize,
            borderRadius,
          },
          showBorder && styles.border,
          style,
        ]}
      >
        {visualDef.renderVisual(pixelSize)}
      </View>
    );
  }

  // 4. Custom Icon + Color Tile
  // If an explicit color or custom icon was specified and it's not a default unchanged category,
  // render the custom colored tile with Feather icon.
  const isDefaultUnmodified =
    matchedCategory?.isDefault &&
    !color &&
    (!iconName || iconName === matchedCategory.icon);

  if (effectiveColor && !isDefaultUnmodified) {
    const iconSize = Math.max(14, Math.round(pixelSize * 0.48));
    return (
      <View
        style={[
          styles.container,
          {
            width: pixelSize,
            height: pixelSize,
            borderRadius,
            backgroundColor: effectiveColor,
          },
          showBorder && styles.border,
          style,
        ]}
      >
        <Feather
          name={(effectiveIcon as never) || "tag"}
          size={iconSize}
          color="#FFFFFF"
        />
      </View>
    );
  }

  // 5. Fallback: Keyword resolution to built-in SVG logos
  const visual = resolveCategoryVisual(categoryName, effectiveIcon);
  return (
    <View
      style={[
        styles.container,
        {
          width: pixelSize,
          height: pixelSize,
          borderRadius,
        },
        showBorder && styles.border,
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
  border: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
});
