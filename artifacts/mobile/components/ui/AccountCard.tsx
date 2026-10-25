import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type DimensionValue,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle as SvgCircle, Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { money, currencySymbol } from "@/utils/format";
import { fontWeight, spacing, radius } from "@/constants/tokens";
import type { AccountType, Currency } from "@/context/FinanceContext";
import {
  getCardTheme,
  getCardLast4,
  resolveCardSubtitle,
  HOME_CARD_THEMES,
  HOME_CARD_THEMES_LIGHT,
  getHomeCardThemes,
  type CardTheme,
  type HomeCardThemeInfo,
} from "@/utils/accountCards";
import { haptics } from "@/utils/haptics";

export {
  getCardTheme,
  getCardLast4,
  resolveCardSubtitle,
  HOME_CARD_THEMES,
  HOME_CARD_THEMES_LIGHT,
  getHomeCardThemes,
  type CardTheme,
  type HomeCardThemeInfo,
};

export interface InlineAccountDraft {
  name: string;
  displayName: string;
  balanceInput: string;
  type: AccountType;
  colorThemeIndex?: number;
  customColor?: string;
  accountNumberLast4?: string;
  cardLast4?: string;
}

export const accountTypeOptions: {
  value: AccountType;
  label: string;
  icon: "credit-card" | "pocket" | "smartphone" | "shield" | "more-horizontal";
}[] = [
  { value: "CARD", label: "Card", icon: "credit-card" },
  { value: "BANK", label: "Bank", icon: "credit-card" },
  { value: "CASH", label: "Cash", icon: "pocket" },
  { value: "UPI", label: "UPI", icon: "smartphone" },
  { value: "SAVINGS", label: "Savings", icon: "shield" },
  { value: "OTHER", label: "Other", icon: "more-horizontal" },
];

// Contactless wave SVG symbol (Wi-Fi payment symbol)
export function ContactlessIcon({
  color = "#FFFFFF",
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 8.5C8.5 5.5 13.5 5.5 16.5 8.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Path
        d="M7.5 11.5C9.5 9.5 12.5 9.5 14.5 11.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Path
        d="M9.5 14.5C10.5 13.5 11.5 13.5 12.5 14.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Mastercard / Visa network badge
export function CardNetworkBadge({
  isLime = false,
  network = "mastercard",
}: {
  isLime?: boolean;
  network?: "mastercard" | "visa";
}) {
  if (network === "visa") {
    return (
      <Text
        style={[
          styles.visaText,
          { color: isLime ? "#070B06" : "rgba(255, 255, 255, 0.9)" },
        ]}
      >
        VISA
      </Text>
    );
  }

  // Mastercard overlapping dual circles
  return (
    <Svg width={36} height={22} viewBox="0 0 38 24">
      <SvgCircle
        cx="14"
        cy="12"
        r="10"
        fill={isLime ? "rgba(7, 11, 6, 0.55)" : "rgba(255, 255, 255, 0.38)"}
      />
      <SvgCircle
        cx="24"
        cy="12"
        r="10"
        fill={isLime ? "rgba(7, 11, 6, 0.32)" : "rgba(255, 255, 255, 0.22)"}
      />
    </Svg>
  );
}

// Minimal geometric Account Logo Mark matching Home Screen
export function AccountLogoMark({
  type,
  isLime = false,
}: {
  type?: string;
  isLime?: boolean;
}) {
  const iconColor = isLime ? "#070B06" : "#FFFFFF";
  const bg = isLime ? "rgba(7, 11, 6, 0.12)" : "rgba(255, 255, 255, 0.14)";
  const border = isLime ? "rgba(7, 11, 6, 0.18)" : "rgba(255, 255, 255, 0.22)";

  let iconName: "pocket" | "credit-card" | "shield" | "smartphone" | "more-horizontal" = "pocket";
  const normalized = (type || "").toUpperCase();
  if (normalized === "BANK" || normalized === "CARD" || normalized === "CREDIT") iconName = "credit-card";
  else if (normalized === "SAVINGS") iconName = "shield";
  else if (normalized === "UPI") iconName = "smartphone";
  else if (normalized === "CASH") iconName = "pocket";
  else if (normalized === "OTHER") iconName = "more-horizontal";

  return (
    <View
      style={[
        styles.accountLogoBadge,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      <Feather name={iconName} size={12} color={iconColor} />
    </View>
  );
}

export interface AccountCardProps {
  name: string;
  displayName?: string;
  type?: AccountType | string;
  balance?: number;
  currency?: string;
  last4?: string;
  cardLast4?: string;
  accountNumberLast4?: string;
  network?: "mastercard" | "visa";
  colorThemeIndex?: number;
  customColor?: string;
  isDefault?: boolean;
  accountsVisible?: boolean;
  width?: DimensionValue;
  height?: number;
  interactive?: boolean;
  onPress?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  onViewTransactions?: () => void;
  testID?: string;

  // Direct Inline Card Editing
  isEditing?: boolean;
  editDraft?: InlineAccountDraft;
  onDraftChange?: (field: keyof InlineAccountDraft, value: any) => void;
  onSaveInline?: () => void;
  onCancelInline?: () => void;
  isSaving?: boolean;
  hasNameError?: boolean;
}

/**
 * Universal Account Card — Shared between Home screen and Accounts & Wallets page.
 * Guarantees 100% visual fidelity, responsive dimensions, and direct inline live editing.
 */
export function AccountCard({
  name,
  displayName,
  type = "BANK",
  balance = 0,
  currency = "INR",
  last4,
  cardLast4,
  accountNumberLast4,
  network = "mastercard",
  colorThemeIndex = 0,
  customColor,
  isDefault = false,
  accountsVisible = true,
  width = 276,
  height = 176,
  interactive = false,
  onPress,
  showActions = false,
  onEdit,
  onDelete,
  onSetDefault,
  onViewTransactions,
  testID,
  isEditing = false,
  editDraft,
  onDraftChange,
  onSaveInline,
  onCancelInline,
  isSaving = false,
  hasNameError = false,
}: AccountCardProps) {
  const colors = useColors();
  const isLight = !colors.isDark || colors.canvas === "#FFFFFF";

  const draftThemeIndex =
    editDraft?.colorThemeIndex !== undefined
      ? editDraft.colorThemeIndex
      : colorThemeIndex;

  const theme = getCardTheme(0, isLight, draftThemeIndex);

  const handleCycleTheme = () => {
    if (!isEditing || !onDraftChange) return;
    void haptics.selection();
    const current = draftThemeIndex ?? 0;
    const next = ((current % 3) + 1) % 3;
    onDraftChange("colorThemeIndex", next as any);
  };

  const [typePickerOpen, setTypePickerOpen] = useState(false);

  // Active or draft values
  const draftName = editDraft ? editDraft.name : name;
  const draftDisplayName = editDraft ? editDraft.displayName : (displayName || "");
  const draftType = (editDraft ? editDraft.type : (type || "BANK")) as AccountType;
  const draftBalanceInput = editDraft ? editDraft.balanceInput : balance.toString();

  const cleanName = draftName && draftName.trim() ? draftName.trim() : "New Account";
  const cleanBalance = typeof balance === "number" && !isNaN(balance) ? balance : 0;
  const cleanType = (draftType || "BANK").toString().toUpperCase();

  // Subtitle: Nickname/Display Name if provided, or `${type} ACCOUNT`
  const subtitle = draftDisplayName && draftDisplayName.trim()
    ? draftDisplayName.trim()
    : cleanType === "UPI"
    ? "UPI WALLET"
    : cleanType === "CASH"
    ? "CASH WALLET"
    : `${cleanType} ACCOUNT`;

  const safeLast4 =
    last4 ||
    cardLast4 ||
    accountNumberLast4 ||
    editDraft?.cardLast4 ||
    editDraft?.accountNumberLast4 ||
    getCardLast4(cleanName, colorThemeIndex);

  const cardContent = (
    <LinearGradient
      colors={theme.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.cardGradient,
        {
          borderColor: isDefault
            ? theme.isLime
              ? "rgba(7, 11, 6, 0.42)"
              : "rgba(255, 255, 255, 0.42)"
            : theme.borderColor,
          width,
          minHeight: height,
        },
      ]}
      testID={testID}
    >
      {/* Specular top glare highlight */}
      <LinearGradient
        colors={theme.specular}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Card Header: Icon Badge + Bank Name + Inline Editing Controls */}
      <View style={styles.cardHeader}>
        {isEditing ? (
          <View style={styles.inlineHeaderInputWrapper}>
            <Pressable
              onPress={() => {
                void haptics.selection();
                setTypePickerOpen((prev) => !prev);
              }}
              style={[
                styles.inlineTypeBadgeBtn,
                {
                  backgroundColor: theme.isLime
                    ? "rgba(7, 11, 6, 0.12)"
                    : "rgba(255, 255, 255, 0.16)",
                  borderColor: theme.isLime
                    ? "rgba(7, 11, 6, 0.22)"
                    : "rgba(255, 255, 255, 0.25)",
                },
              ]}
              hitSlop={6}
              accessibilityLabel="Change account type"
            >
              <AccountLogoMark type={draftType} isLime={theme.isLime} />
              <Feather
                name={typePickerOpen ? "chevron-up" : "chevron-down"}
                size={10}
                color={theme.isLime ? "#070B06" : "#FFFFFF"}
              />
            </Pressable>

            <TextInput
              value={draftName}
              onChangeText={(val) => onDraftChange?.("name", val)}
              placeholder="Account / Bank Name"
              placeholderTextColor={
                theme.isLime
                  ? "rgba(7, 11, 6, 0.45)"
                  : "rgba(255, 255, 255, 0.45)"
              }
              style={[
                styles.bankTitleText,
                styles.inlineTitleInput,
                {
                  color: theme.textColor,
                  borderColor: hasNameError
                    ? "#EF4444"
                    : theme.isLime
                    ? "rgba(7, 11, 6, 0.25)"
                    : "rgba(255, 255, 255, 0.3)",
                  backgroundColor: theme.isLime
                    ? "rgba(7, 11, 6, 0.08)"
                    : "rgba(255, 255, 255, 0.12)",
                },
              ]}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              accessibilityLabel="Account or Bank Name"
            />
          </View>
        ) : (
          <View style={styles.accountHeaderRow}>
            <AccountLogoMark type={cleanType} isLime={theme.isLime} />
            <Text
              style={[styles.bankTitleText, { color: theme.subTextColor }]}
              numberOfLines={1}
            >
              {cleanName}
            </Text>
            {isDefault && (
              <View
                style={[
                  styles.defaultIndicatorBadge,
                  {
                    backgroundColor: theme.isLime
                      ? "rgba(7, 11, 6, 0.14)"
                      : "rgba(255, 255, 255, 0.16)",
                    borderColor: theme.isLime
                      ? "rgba(7, 11, 6, 0.22)"
                      : "rgba(255, 255, 255, 0.25)",
                  },
                ]}
                testID="default-account-indicator"
                accessibilityLabel="Default Account"
              >
                <Feather
                  name="check"
                  size={9}
                  color={theme.isLime ? "#070B06" : "#FFFFFF"}
                />
              </View>
            )}
          </View>
        )}

        <ContactlessIcon
          color={theme.isLime ? "#070B06" : "#FFFFFF"}
          size={18}
        />
      </View>

      {/* Compact Inline Account Type Popover / Selector */}
      {isEditing && typePickerOpen && (
        <View
          style={[
            styles.inlineTypePickerOverlay,
            {
              backgroundColor: theme.isLime
                ? "rgba(7, 11, 6, 0.94)"
                : "rgba(18, 24, 20, 0.95)",
              borderColor: theme.borderColor,
            },
          ]}
        >
          {accountTypeOptions.map((opt) => {
            const isSelected = draftType === opt.value;
            const chipTextColor = theme.isLime
              ? isSelected
                ? "#7ED92A"
                : "#FFFFFF"
              : isSelected
              ? "#7ED92A"
              : "rgba(255, 255, 255, 0.75)";
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  void haptics.selection();
                  onDraftChange?.("type", opt.value);
                  setTypePickerOpen(false);
                }}
                style={[
                  styles.inlineTypeChip,
                  isSelected && styles.inlineTypeChipSelected,
                ]}
              >
                <Feather
                  name={opt.icon}
                  size={11}
                  color={chipTextColor}
                />
                <Text
                  style={[
                    styles.inlineTypeChipText,
                    { color: chipTextColor },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Card Center: Prominent Tabular Balance & Subtitle */}
      <View style={styles.cardCenter}>
        {isEditing ? (
          <View style={styles.inlineCenterEditWrapper}>
            {/* Inline Balance Input with currency symbol */}
            <View style={styles.inlineBalanceRow}>
              <Text
                style={[
                  styles.inlineCurrencySymbol,
                  { color: theme.textColor },
                ]}
              >
                {currencySymbol(currency as Currency)}
              </Text>
              <TextInput
                value={draftBalanceInput}
                onChangeText={(val) =>
                  onDraftChange?.("balanceInput", val.replace(/[^0-9.-]/g, ""))
                }
                placeholder="0.00"
                placeholderTextColor={
                  theme.isLime
                    ? "rgba(7, 11, 6, 0.45)"
                    : "rgba(255, 255, 255, 0.45)"
                }
                keyboardType="decimal-pad"
                style={[
                  styles.moneyAmountText,
                  styles.inlineBalanceInput,
                  {
                    color: theme.textColor,
                    backgroundColor: theme.isLime
                      ? "rgba(7, 11, 6, 0.08)"
                      : "rgba(255, 255, 255, 0.12)",
                    borderColor: theme.isLime
                      ? "rgba(7, 11, 6, 0.22)"
                      : "rgba(255, 255, 255, 0.28)",
                  },
                ]}
                returnKeyType="done"
                accessibilityLabel="Account Balance"
              />
            </View>

            {/* Inline Nickname / Subtitle Input */}
            <TextInput
              value={draftDisplayName}
              onChangeText={(val) => onDraftChange?.("displayName", val)}
              placeholder="Account Nickname (Optional)"
              placeholderTextColor={
                theme.isLime
                  ? "rgba(7, 11, 6, 0.45)"
                  : "rgba(255, 255, 255, 0.45)"
              }
              style={[
                styles.accountSubtitleText,
                styles.inlineSubtitleInput,
                {
                  color: theme.subTextColor,
                  backgroundColor: theme.isLime
                    ? "rgba(7, 11, 6, 0.08)"
                    : "rgba(255, 255, 255, 0.12)",
                  borderColor: theme.isLime
                    ? "rgba(7, 11, 6, 0.22)"
                    : "rgba(255, 255, 255, 0.28)",
                },
              ]}
              autoCapitalize="words"
              accessibilityLabel="Account Nickname"
            />
          </View>
        ) : (
          <>
            <Text
              style={[styles.moneyAmountText, { color: theme.textColor }]}
              numberOfLines={1}
            >
              {accountsVisible
                ? money(cleanBalance, currency as Currency)
                : `${currencySymbol(currency as Currency)}••••••`}
            </Text>
            <Text
              style={[styles.accountSubtitleText, { color: theme.subTextColor }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </>
        )}
      </View>

      {/* Card Footer: Masked Numbers + Network Badge */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Text style={[styles.cardMaskDots, { color: theme.subTextColor }]}>
            ****
          </Text>
          {isEditing ? (
            <TextInput
              value={editDraft?.cardLast4 !== undefined ? editDraft.cardLast4 : (last4 || safeLast4)}
              onChangeText={(val) => {
                const cleanDigits = val.replace(/\D/g, "");
                const last4Val = cleanDigits.length > 4 ? cleanDigits.slice(-4) : cleanDigits;
                onDraftChange?.("cardLast4", last4Val);
                onDraftChange?.("accountNumberLast4", last4Val);
              }}
              placeholder={safeLast4 || "0000"}
              placeholderTextColor={
                theme.isLime
                  ? "rgba(7, 11, 6, 0.45)"
                  : "rgba(255, 255, 255, 0.45)"
              }
              keyboardType="number-pad"
              maxLength={19}
              style={[
                styles.cardMaskNumber,
                styles.inlineFooterNumberInput,
                {
                  color: theme.textColor,
                  borderColor: theme.isLime
                    ? "rgba(7, 11, 6, 0.28)"
                    : "rgba(255, 255, 255, 0.32)",
                  backgroundColor: theme.isLime
                    ? "rgba(7, 11, 6, 0.12)"
                    : "rgba(255, 255, 255, 0.16)",
                },
              ]}
              returnKeyType="done"
              accessibilityLabel="Edit Card Last 4 Digits"
            />
          ) : (
            <Text style={[styles.cardMaskNumber, { color: theme.textColor }]}>
              {safeLast4}
            </Text>
          )}
        </View>

        <CardNetworkBadge isLime={theme.isLime} network={network} />
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.cardOuterContainer}>
      {isEditing ? (
        <Pressable
          onPress={handleCycleTheme}
          style={({ pressed }) => [
            styles.pressableContainer,
            pressed && { opacity: 0.95 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Card color. Tap card to cycle through the 3 Home card colors."
        >
          {cardContent}
        </Pressable>
      ) : interactive ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.pressableContainer,
            pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] },
          ]}
        >
          {cardContent}
        </Pressable>
      ) : (
        cardContent
      )}

      {/* Optional Card Actions Bar (used in Accounts & Wallets screen) */}
      {showActions && (
        <View style={styles.actionsBarWrapper}>
          {isEditing ? (
            <View style={styles.inlineEditingControlsContainer}>
              {/* Card Theme & Color Selector in Edit Mode (Strictly the 3 Home Card Colors) */}
              <View style={styles.themeSelectorContainer}>
                <View style={styles.themeSelectorHeaderRow}>
                  <Text style={[styles.themeSelectorTitle, { color: colors.fgMuted }]}>
                    CARD COLOR
                  </Text>
                  <Pressable onPress={handleCycleTheme} hitSlop={8}>
                    <Text style={[styles.themeCycleHintText, { color: colors.primary }]}>
                      Tap card to cycle
                    </Text>
                  </Pressable>
                </View>

                {/* The 3 Home Card Color Swatches — Theme-aware for Light & Dark */}
                <View style={styles.presetThemesRow}>
                  {getHomeCardThemes(isLight).map((themeInfo) => {
                    const isSelected =
                      ((draftThemeIndex ?? 0) % 3 + 3) % 3 === themeInfo.index;
                    return (
                      <Pressable
                        key={themeInfo.id}
                        onPress={() => {
                          void haptics.selection();
                          onDraftChange?.("colorThemeIndex", themeInfo.index as any);
                        }}
                        style={[
                          styles.presetThemeSwatch,
                          {
                            backgroundColor: themeInfo.accentColor,
                            borderColor: isSelected
                              ? colors.primary
                              : isLight
                                ? "rgba(16, 28, 61, 0.18)"
                                : "rgba(255, 255, 255, 0.14)",
                          },
                          isSelected && [
                            styles.presetThemeSwatchSelected,
                            { borderColor: colors.primary },
                          ],
                        ]}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`${themeInfo.name} card theme`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        {isSelected && (
                          <Feather
                            name="check"
                            size={16}
                            color={!isLight && themeInfo.index === 1 ? "#070B06" : "#FFFFFF"}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Cancel and Save Changes Buttons Below Card */}
              <View style={styles.actionEditButtonsRow}>
                <Pressable
                  onPress={onCancelInline}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing"
                >
                  <Feather name="x" size={13} color={colors.fgMuted} />
                  <Text style={[styles.actionBtnText, { color: colors.fgMuted }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onSaveInline}
                  disabled={isSaving}
                  style={[
                    styles.actionBtn,
                    styles.actionSaveInlineBtn,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      opacity: isSaving ? 0.7 : 1,
                    },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Save changes"
                >
                  <Feather name="check" size={13} color={colors.onPrimary} />
                  <Text
                    style={[
                      styles.actionBtnText,
                      {
                        color: colors.onPrimary,
                        fontWeight: fontWeight.semibold,
                      },
                    ]}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.actionsBar}>
              {onEdit && (
                <Pressable
                  onPress={onEdit}
                  style={[
                    styles.iconOnlyActionBtn,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Edit account"
                >
                  <Feather name="edit-2" size={16} color={colors.fg} />
                </Pressable>
              )}

              {onSetDefault && (
                <Pressable
                  onPress={!isDefault ? onSetDefault : undefined}
                  disabled={isDefault}
                  style={[
                    styles.iconOnlyActionBtn,
                    isDefault && styles.iconOnlyActionDefaultActive,
                    {
                      backgroundColor: isDefault
                        ? `${colors.primary}20`
                        : colors.surfaceElevated,
                      borderColor: isDefault ? colors.primary : colors.border,
                    },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isDefault ? "Default account (Active)" : "Set as default account"
                  }
                  accessibilityHint={
                    isDefault
                      ? "This account is already your default payment account"
                      : "Double tap to make this your default payment account"
                  }
                >
                  <Feather
                    name="star"
                    size={16}
                    color={isDefault ? colors.primary : colors.fgMuted}
                  />
                </Pressable>
              )}

              {onViewTransactions && (
                <Pressable
                  onPress={onViewTransactions}
                  style={[
                    styles.iconOnlyActionBtn,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="View transaction history"
                >
                  <Feather name="list" size={16} color={colors.fgMuted} />
                </Pressable>
              )}

              {onDelete && (
                <Pressable
                  onPress={onDelete}
                  style={[
                    styles.iconOnlyActionBtn,
                    styles.iconOnlyActionDelete,
                    {
                      backgroundColor: `${colors.error}14`,
                      borderColor: `${colors.error}33`,
                    },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Delete account"
                >
                  <Feather name="trash-2" size={16} color={colors.error} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuterContainer: {
    alignItems: "center",
    marginVertical: spacing[1],
  },
  pressableContainer: {
    borderRadius: 22,
  },
  cardGradient: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.25,
    elevation: 6,
  },

  // Header
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },
  accountHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    maxWidth: "82%",
  },
  accountLogoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bankTitleText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
  defaultIndicatorBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 0.8,
    alignItems: "center",
    justifyContent: "center",
  },

  // Direct Inline Editing Elements in Card Header
  inlineHeaderInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  inlineTypeBadgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.8,
  },
  inlineTitleInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 0.8,
    minHeight: 28,
  },
  inlineHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineHeaderBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineHeaderSaveBtn: {
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  // Compact Inline Type Picker Popover Overlay
  inlineTypePickerOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
    zIndex: 50,
  },
  inlineTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  inlineTypeChipSelected: {
    backgroundColor: "rgba(126, 217, 42, 0.22)",
    borderWidth: 0.8,
    borderColor: "#7ED92A",
  },
  inlineTypeChipText: {
    fontSize: 9.5,
    fontWeight: fontWeight.medium,
  },

  // Center
  cardCenter: {
    marginVertical: 4,
    gap: 2,
  },
  moneyAmountText: {
    fontSize: 23,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  accountSubtitleText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Direct Inline Editing Elements in Card Center
  inlineCenterEditWrapper: {
    gap: 4,
  },
  inlineBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inlineCurrencySymbol: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
  },
  inlineBalanceInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.8,
    minHeight: 38,
  },
  inlineSubtitleInput: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
    minHeight: 24,
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMaskDots: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.5,
    lineHeight: 14,
  },
  cardMaskNumber: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.2,
    fontVariant: ["tabular-nums"],
  },
  inlineFooterNumberInput: {
    height: 22,
    paddingHorizontal: 5,
    paddingVertical: 0,
    borderRadius: 5,
    borderWidth: 0.8,
    minWidth: 46,
    textAlign: "center",
  },
  visaText: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
    fontStyle: "italic",
  },

  // Actions Bar & Editing Controls
  actionsBarWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  inlineEditingControlsContainer: {
    width: "100%",
    alignItems: "center",
  },
  themeSelectorContainer: {
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 10,
  },
  themeSelectorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeSelectorTitle: {
    fontSize: 10.5,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  themeCycleHintText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  presetThemesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  presetThemeSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  presetThemeSwatchSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.08 }],
  },
  actionEditButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
    width: "100%",
  },
  actionsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  iconOnlyActionBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconOnlyActionDefaultActive: {
    borderWidth: 1.5,
  },
  iconOnlyActionDelete: {
    borderWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1,
    minHeight: 40,
  },
  actionSaveInlineBtn: {
    paddingHorizontal: 18,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
  },
});
