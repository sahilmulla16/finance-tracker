import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import { useFinance, Currency, AccountType } from "@/context/FinanceContext";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: "INR", symbol: "₹", label: "₹ INR (Indian Rupee)" },
  { code: "USD", symbol: "$", label: "$ USD (US Dollar)" },
  { code: "EUR", symbol: "€", label: "€ EUR (Euro)" },
  { code: "GBP", symbol: "£", label: "£ GBP (British Pound)" },
  { code: "AED", symbol: "د.إ", label: "د.إ AED (UAE Dirham)" },
];

const ACCOUNT_OPTIONS: { type: AccountType; label: string; icon: string }[] = [
  { type: "CASH", label: "Cash", icon: "dollar-sign" },
  { type: "BANK", label: "Bank Account", icon: "credit-card" },
  { type: "UPI", label: "UPI Wallet", icon: "smartphone" },
];

export default function BasicSetupScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, settings } = useFinance();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    settings.currency || "INR",
  );
  const [selectedAccountType, setSelectedAccountType] =
    useState<AccountType>("CASH");
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCurrencyObj =
    CURRENCIES.find((c) => c.code === selectedCurrency) || CURRENCIES[0];
  const selectedAccountObj =
    ACCOUNT_OPTIONS.find((a) => a.type === selectedAccountType) ||
    ACCOUNT_OPTIONS[0];

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
    <View style={[styles.screen, { backgroundColor: "#090B0A" }]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing[6],
            paddingBottom: insets.bottom + spacing[4],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section (Exact match to reference Screen 5) */}
        <View style={styles.titleSection}>
          <Text style={styles.headline}>Almost there.</Text>
          <Text style={styles.subtitle}>
            Let's set up your Pocketflow experience.
          </Text>
        </View>

        {/* Dropdown Selectors */}
        <View style={styles.selectorsSection}>
          {/* Currency Card */}
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setCurrencyModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.selectorCard,
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.selectorIconWrap}>
              <Text style={styles.selectorIconSymbol}>
                {selectedCurrencyObj.symbol}
              </Text>
            </View>

            <View style={styles.selectorTextContent}>
              <Text style={styles.selectorLabel}>Currency</Text>
              <Text style={styles.selectorValue}>
                {selectedCurrencyObj.symbol} {selectedCurrencyObj.code}
              </Text>
            </View>

            <Feather name="chevron-down" size={20} color="#777D76" />
          </Pressable>

          {/* Main Account Card */}
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setAccountModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.selectorCard,
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.selectorIconWrap}>
              <Feather
                name={selectedAccountObj.icon as never}
                size={18}
                color="#B7FF63"
              />
            </View>

            <View style={styles.selectorTextContent}>
              <Text style={styles.selectorLabel}>Main Account</Text>
              <Text style={styles.selectorValue}>
                {selectedAccountObj.label}
              </Text>
            </View>

            <Feather name="chevron-down" size={20} color="#777D76" />
          </Pressable>
        </View>

        {/* On-Device Security & Privacy Badge */}
        <View style={styles.securityBadgeCard}>
          <View style={styles.shieldIconWrap}>
            <Feather name="shield" size={20} color="#B7FF63" />
          </View>
          <Text style={styles.securityBadgeText}>
            Your data stays on your device. Google Sign-In is used only to
            identify you.
          </Text>
        </View>

        {/* Full-width Lime Get Started Button */}
        <View style={styles.bottomArea}>
          <Pressable
            onPress={handleComplete}
            disabled={saving}
            style={({ pressed }) => [
              styles.getStartedButton,
              (pressed || saving) && {
                opacity: 0.85,
                transform: [{ scale: 0.99 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Currency Selection Modal */}
      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCurrencyModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Currency</Text>
            {CURRENCIES.map((curr) => {
              const isSelected = selectedCurrency === curr.code;
              return (
                <Pressable
                  key={curr.code}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedCurrency(curr.code);
                    setCurrencyModalVisible(false);
                  }}
                  style={[
                    styles.modalOptionRow,
                    isSelected && styles.modalOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && { color: "#B7FF63" },
                    ]}
                  >
                    {curr.label}
                  </Text>
                  {isSelected && (
                    <Feather name="check" size={18} color="#B7FF63" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* Account Type Selection Modal */}
      <Modal
        visible={accountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAccountModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Main Account</Text>
            {ACCOUNT_OPTIONS.map((item) => {
              const isSelected = selectedAccountType === item.type;
              return (
                <Pressable
                  key={item.type}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedAccountType(item.type);
                    setAccountModalVisible(false);
                  }}
                  style={[
                    styles.modalOptionRow,
                    isSelected && styles.modalOptionSelected,
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Feather
                      name={item.icon as never}
                      size={18}
                      color={isSelected ? "#B7FF63" : "#A5AAA3"}
                    />
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && { color: "#B7FF63" },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Feather name="check" size={18} color="#B7FF63" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#090B0A",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    justifyContent: "space-between",
  },
  titleSection: {
    alignItems: "center",
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  headline: {
    fontSize: 34,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: fontSize.sm + 0.5,
    fontWeight: fontWeight.regular,
    color: "#A5AAA3",
    textAlign: "center",
  },
  selectorsSection: {
    gap: spacing[3],
    marginVertical: spacing[4],
  },
  selectorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171A18",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#282D29",
  },
  selectorIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(183, 255, 99, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[4],
  },
  selectorIconSymbol: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: "#B7FF63",
  },
  selectorTextContent: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: fontSize.xs,
    color: "#777D76",
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
  },
  securityBadgeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131614",
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#222723",
    marginVertical: spacing[4],
    gap: spacing[3],
  },
  shieldIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  securityBadgeText: {
    flex: 1,
    fontSize: fontSize.xs + 0.5,
    color: "#A5AAA3",
    lineHeight: 18,
  },
  bottomArea: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  getStartedButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: radius.full,
    backgroundColor: "#B7FF63",
    shadowColor: "#B7FF63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  getStartedButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: "#000000",
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[5],
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#171A18",
    borderRadius: radius.hero,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: "#2B322D",
    gap: spacing[2],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
    marginBottom: spacing[3],
  },
  modalOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3] + 2,
    paddingHorizontal: spacing[3],
    borderRadius: radius.lg,
  },
  modalOptionSelected: {
    backgroundColor: "rgba(183, 255, 99, 0.12)",
  },
  modalOptionText: {
    fontSize: fontSize.base,
    color: "#F5F7F3",
    fontWeight: fontWeight.medium,
  },
});
