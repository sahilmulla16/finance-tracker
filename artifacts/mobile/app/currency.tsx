import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFinance, type Currency } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { ALL_CURRENCIES } from "@/constants/currencies";
import * as Haptics from "expo-haptics";

export default function CurrencyScreen() {
  const { settings, updateSettings, accounts, updateAccount } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelect = async (code: Currency) => {
    void Haptics.selectionAsync();
    await updateSettings({ currency: code });
    for (const acc of accounts) {
      await updateAccount({ ...acc, currency: code });
    }
    router.back();
  };

  // Filter currencies based on search query
  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Put currently selected currency at the very top for convenience
      const current = settings.currency || "INR";
      const selected = ALL_CURRENCIES.find((c) => c.code === current);
      const others = ALL_CURRENCIES.filter((c) => c.code !== current);
      return selected ? [selected, ...others] : ALL_CURRENCIES;
    }
    return ALL_CURRENCIES.filter(
      (curr) =>
        curr.code.toLowerCase().includes(q) ||
        curr.name.toLowerCase().includes(q) ||
        curr.country.toLowerCase().includes(q) ||
        curr.symbol.toLowerCase().includes(q),
    );
  }, [searchQuery, settings.currency]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>Currency</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Top Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather
            name="search"
            size={18}
            color={colors.fgMuted}
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search currency or country..."
            placeholderTextColor={colors.fgMuted}
            style={[styles.searchInput, { color: colors.fg }]}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={8}
              style={styles.clearBtn}
            >
              <Feather name="x-circle" size={16} color={colors.fgMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionTitle, { color: colors.fgMuted }]}>
          {searchQuery.trim()
            ? `RESULTS (${filteredCurrencies.length})`
            : "SELECT CURRENCY"}
        </Text>

        {filteredCurrencies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={32} color={colors.fgMuted} />
            <Text style={[styles.emptyText, { color: colors.fgMuted }]}>
              No currencies found matching &quot;{searchQuery}&quot;
            </Text>
          </View>
        ) : (
          filteredCurrencies.map((curr) => {
            const isSelected = settings.currency === curr.code;
            return (
              <Pressable
                key={curr.code}
                onPress={() => void handleSelect(curr.code)}
                style={[
                  styles.currencyCard,
                  { backgroundColor: colors.surface },
                  isSelected && {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.currencySymbol,
                    {
                      color: isSelected ? colors.primary : colors.fg,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {curr.symbol}
                </Text>
                <View style={styles.currencyInfo}>
                  <View style={styles.codeRow}>
                    <Text
                      style={[
                        styles.currencyCode,
                        {
                          color: isSelected ? colors.primary : colors.fg,
                        },
                      ]}
                    >
                      {curr.code}
                    </Text>
                    {curr.country ? (
                      <Text
                        style={[
                          styles.currencyCountry,
                          { color: colors.fgMuted },
                        ]}
                        numberOfLines={1}
                      >
                        · {curr.country}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[styles.currencyName, { color: colors.fgMuted }]}
                    numberOfLines={1}
                  >
                    {curr.name}
                  </Text>
                </View>
                {isSelected && (
                  <Feather
                    name="check-circle"
                    size={22}
                    color={colors.primary}
                  />
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    height: 44,
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    height: "100%",
  },
  clearBtn: {
    padding: spacing[1],
  },
  content: {
    padding: spacing[4],
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing[1],
  },
  currencyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[3],
    borderWidth: 2,
    borderColor: "transparent",
  },
  currencySymbol: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.semibold,
    width: 48,
    textAlign: "center",
  },
  currencyInfo: {
    flex: 1,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  currencyCode: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  currencyCountry: {
    fontSize: fontSize.xs,
    flexShrink: 1,
  },
  currencyName: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
