import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { resolveBankBrand } from "@/utils/bankResolver";
import type { AccountType } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";

export type BankLogoSize = "small" | "medium" | "large" | number;

type BankLogoProps = {
  accountName?: string;
  accountType?: AccountType;
  size?: BankLogoSize;
  style?: StyleProp<ViewStyle>;
  showBorder?: boolean;
};

const SIZES: Record<"small" | "medium" | "large", number> = {
  small: 28,
  medium: 40,
  large: 56,
};

export function BankLogo({
  accountName,
  accountType,
  size = "medium",
  style,
  showBorder = false,
}: BankLogoProps) {
  const colors = useColors();
  const pixelSize = typeof size === "number" ? size : SIZES[size];
  const brand = resolveBankBrand(accountName, accountType);
  const borderRadius = Math.round(pixelSize * 0.28);

  return (
    <View
      style={[
        styles.container,
        {
          width: pixelSize,
          height: pixelSize,
          borderRadius,
          backgroundColor: brand.badgeBg || colors.surfaceRecessed,
        },
        showBorder && {
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {brand.renderLogo(pixelSize)}
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
