import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFinance, Currency, AccountType } from "@/context/FinanceContext";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
];

const ACCOUNT_TYPES: {
  type: AccountType;
  label: string;
  sub: string;
  icon: string;
}[] = [
  {
    type: "BANK",
    label: "Bank Account",
    sub: "Primary checking or savings account",
    icon: "credit-card",
  },
  {
    type: "CASH",
    label: "Cash Wallet",
    sub: "Physical cash in wallet or drawer",
    icon: "dollar-sign",
  },
  {
    type: "UPI",
    label: "UPI Wallet",
    sub: "GPay, PhonePe, Paytm, etc.",
    icon: "smartphone",
  },
];

export default function BasicSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding, settings } = useFinance();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    settings.currency || "INR",
  );
  const [selectedAccountType, setSelectedAccountType] =
    useState<AccountType>("BANK");
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (saving) return;
    setSaving(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await completeOnboarding({
        currency: selectedCurrency,
        defaultAccountType: selectedAccountType,
      });
      router.replace("/(tabs)");
    } catch {
      router.replace("/(tabs)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing[6],
            paddingBottom: insets.bottom + spacing[5],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.stepBadge,
              { backgroundColor: `${colors.primary}18` },
            ]}
          >
            <Text style={[styles.stepBadgeText, { color: colors.primary }]}>
              Final Step
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.fg }]}>Almost there</Text>
          <Text style={[styles.subtitle, { color: colors.fgMuted }]}>
            Choose your default currency and primary account to begin tracking.
          </Text>
        </View>

        {/* Currency Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>
            Primary Currency
          </Text>
          <View style={styles.currencyGrid}>
            {CURRENCIES.map((curr) => {
              const isSelected = selectedCurrency === curr.code;
              return (
                <Pressable
                  key={curr.code}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedCurrency(curr.code);
                  }}
                  style={({ pressed }) => [
                    styles.currencyCard,
                    {
                      backgroundColor: isSelected
                        ? colors.surfaceElevated
                        : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.divider,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.currencySymbol,
                      { color: isSelected ? colors.primary : colors.fg },
                    ]}
                  >
                    {curr.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.currencyCode,
                      { color: isSelected ? colors.fg : colors.fgMuted },
                    ]}
                  >
                    {curr.code}
                  </Text>
                  <Text
                    style={[styles.currencyName, { color: colors.fgSubtle }]}
                    numberOfLines={1}
                  >
                    {curr.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Account Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>
            Primary Account Type
          </Text>
          <View style={styles.accountTypesList}>
            {ACCOUNT_TYPES.map((item) => {
              const isSelected = selectedAccountType === item.type;
              return (
                <Pressable
                  key={item.type}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedAccountType(item.type);
                  }}
                  style={({ pressed }) => [
                    styles.accountTypeRow,
                    {
                      backgroundColor: isSelected
                        ? colors.surfaceElevated
                        : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.divider,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View
                    style={[
                      styles.accountTypeIcon,
                      {
                        backgroundColor: isSelected
                          ? `${colors.primary}20`
                          : colors.surfaceRecessed,
                      },
                    ]}
                  >
                    <Feather
                      name={item.icon as never}
                      size={18}
                      color={isSelected ? colors.primary : colors.fgMuted}
                    />
                  </View>

                  <View style={styles.accountTypeText}>
                    <Text
                      style={[styles.accountTypeLabel, { color: colors.fg }]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[styles.accountTypeSub, { color: colors.fgMuted }]}
                    >
                      {item.sub}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected
                          ? colors.primary
                          : colors.divider,
                        backgroundColor: isSelected
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    {isSelected && (
                      <Feather
                        name="check"
                        size={12}
                        color={colors.onPrimary}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Completion Button */}
        <Pressable
          onPress={handleComplete}
          disabled={saving}
          style={({ pressed }) => [
            styles.completeButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed || saving ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Complete Setup and Get Started"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <>
              <Text
                style={[styles.completeButtonText, { color: colors.onPrimary }]}
              >
                Get Started
              </Text>
              <Feather
                name="arrow-right"
                size={18}
                color={colors.onPrimary}
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing[6],
  },
  stepBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing[3],
  },
  stepBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  title: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    textAlign: "center",
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing[2],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[3],
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  currencyCard: {
    width: "31%",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  currencySymbol: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  currencyName: {
    fontSize: 10,
    marginTop: 2,
  },
  accountTypesList: {
    gap: spacing[3],
  },
  accountTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  accountTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  accountTypeText: {
    flex: 1,
  },
  accountTypeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  accountTypeSub: {
    fontSize: fontSize.xs,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: radius.xl,
    marginTop: spacing[2],
  },
  completeButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
