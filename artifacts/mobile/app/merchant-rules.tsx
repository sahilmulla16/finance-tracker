import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { CategoryVisual, DeleteConfirmationModal } from "@/components/ui";
import { MerchantRule } from "@/types/merchantRules";

export default function MerchantRulesScreen() {
  const {
    merchantRules,
    toggleMerchantRule,
    updateMerchantRuleCategory,
    deleteMerchantRule,
    countEligibleTransactions,
    categories,
  } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.canvas !== "#FFFFFF";

  const [searchQuery, setSearchQuery] = useState("");
  const [editingRule, setEditingRule] = useState<MerchantRule | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [deletingRule, setDeletingRule] = useState<MerchantRule | null>(null);

  const filteredRules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return merchantRules;
    return merchantRules.filter(
      (r) =>
        r.displayMerchant.toLowerCase().includes(q) ||
        r.normalizedKey.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q),
    );
  }, [merchantRules, searchQuery]);

  const activeRulesCount = useMemo(() => {
    return merchantRules.filter((r) => r.enabled !== false).length;
  }, [merchantRules]);

  const totalLinkedTxns = useMemo(() => {
    let count = 0;
    for (const r of merchantRules) {
      const eligible = countEligibleTransactions(r.displayMerchant);
      count += eligible.matchingTransactions.length;
    }
    return count;
  }, [merchantRules, countEligibleTransactions]);

  const handleSelectCategory = async (catId: string, catName: string) => {
    if (!editingRule) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateMerchantRuleCategory(editingRule.normalizedKey, catId, catName);
    setCategoryPickerVisible(false);
    setEditingRule(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRule) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await deleteMerchantRule(deletingRule.normalizedKey);
    setDeletingRule(null);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Navigation Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.fg }]}>
            Learned Merchant Rules
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.fgMuted }]}>
            Auto-tracking memory & categorization
          </Text>
        </View>
        <View
          style={[
            styles.rulesCountBadge,
            { backgroundColor: `${colors.primary}18` },
          ]}
        >
          <Text style={[styles.rulesCountBadgeText, { color: colors.primary }]}>
            {merchantRules.length}
          </Text>
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
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="search" size={17} color={colors.fgSubtle} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search merchant or category..."
            placeholderTextColor={colors.fgSubtle}
            style={[styles.searchInput, { color: colors.fg }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={6}>
              <Feather name="x-circle" size={16} color={colors.fgSubtle} />
            </Pressable>
          )}
        </View>

        {/* Quick Stats Strip */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.fg }]}>
              {merchantRules.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.fgMuted }]}>
              Total Rules
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {activeRulesCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.fgMuted }]}>
              Active Rules
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.fg }]}>
              {totalLinkedTxns}
            </Text>
            <Text style={[styles.statLabel, { color: colors.fgMuted }]}>
              Categorized
            </Text>
          </View>
        </View>

        {/* Re-categorization Notice Banner */}
        <View
          style={[
            styles.infoBanner,
            {
              backgroundColor: isDark
                ? "rgba(184, 243, 107, 0.06)"
                : "rgba(16, 28, 61, 0.04)",
              borderColor: isDark ? "rgba(184, 243, 107, 0.16)" : colors.border,
            },
          ]}
        >
          <Feather name="refresh-cw" size={15} color={colors.primary} />
          <Text style={[styles.infoBannerText, { color: colors.fgMuted }]}>
            Changing a merchant's category automatically updates all previously
            logged transactions for that merchant.
          </Text>
        </View>

        {/* Rules List */}
        {filteredRules.length === 0 ? (
          <View
            style={[
              styles.emptyStateCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Feather name="bookmark" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.fg }]}>
              {searchQuery ? "No Matching Rules" : "No Learned Rules Yet"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.fgMuted }]}>
              {searchQuery
                ? `No merchant rules match "${searchQuery}".`
                : "When you categorize a payment from a new merchant, Zeno will remember it automatically."}
            </Text>
          </View>
        ) : (
          <View style={styles.rulesList}>
            {filteredRules.map((rule) => {
              const eligible = countEligibleTransactions(rule.displayMerchant);
              const count = eligible.matchingTransactions.length;
              const isEnabled = rule.enabled !== false;

              return (
                <View
                  key={rule.normalizedKey}
                  style={[
                    styles.ruleCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isEnabled
                        ? `${colors.primary}35`
                        : colors.border,
                      opacity: isEnabled ? 1 : 0.65,
                    },
                  ]}
                >
                  <View style={styles.ruleTopRow}>
                    <View style={styles.ruleVisualWrap}>
                      <CategoryVisual
                        categoryName={rule.categoryName}
                        size="medium"
                        showBorder
                      />
                    </View>
                    <View style={styles.ruleInfoCol}>
                      <Text
                        style={[styles.ruleMerchantName, { color: colors.fg }]}
                        numberOfLines={1}
                      >
                        {rule.displayMerchant}
                      </Text>
                      <Text
                        style={[styles.ruleMetaText, { color: colors.fgMuted }]}
                      >
                        Key: "{rule.normalizedKey}" • {count}{" "}
                        {count === 1 ? "transaction" : "transactions"}
                      </Text>
                    </View>
                    <Switch
                      value={isEnabled}
                      onValueChange={(val) => {
                        void toggleMerchantRule(rule.normalizedKey, val);
                      }}
                      trackColor={{
                        false: colors.surfaceRecessed,
                        true: colors.primary,
                      }}
                    />
                  </View>

                  <View
                    style={[
                      styles.ruleDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />

                  <View style={styles.ruleBottomRow}>
                    <View
                      style={[
                        styles.categoryPill,
                        { backgroundColor: colors.surfaceRecessed },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          { color: colors.fg },
                        ]}
                      >
                        {rule.categoryName}
                      </Text>
                    </View>

                    <View style={styles.ruleActions}>
                      <Pressable
                        onPress={() => {
                          setEditingRule(rule);
                          setCategoryPickerVisible(true);
                        }}
                        style={[
                          styles.actionBtn,
                          { backgroundColor: colors.surfaceRecessed },
                        ]}
                        hitSlop={6}
                      >
                        <Feather
                          name="edit-2"
                          size={13}
                          color={colors.primary}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.actionBtnText,
                            { color: colors.primary },
                          ]}
                        >
                          Change
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setDeletingRule(rule)}
                        style={[
                          styles.actionBtn,
                          { backgroundColor: `${colors.error}15` },
                        ]}
                        hitSlop={6}
                      >
                        <Feather
                          name="trash-2"
                          size={13}
                          color={colors.error}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={categoryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCategoryPickerVisible(false)}
          />
          <View
            style={[
              styles.pickerSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.pickerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickerTitle, { color: colors.fg }]}>
                  Change Category
                </Text>
                <Text
                  style={[styles.pickerSubtitle, { color: colors.fgMuted }]}
                  numberOfLines={1}
                >
                  For "{editingRule?.displayMerchant}"
                </Text>
              </View>
              <Pressable
                onPress={() => setCategoryPickerVisible(false)}
                hitSlop={8}
                style={[
                  styles.closeIconBtn,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Feather name="x" size={18} color={colors.fgMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 380 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            >
              {categories
                .filter(
                  (c) => c.type === "expense" || !c.type || c.type === "both",
                )
                .map((cat) => {
                  const isCurrent = editingRule?.categoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => handleSelectCategory(cat.id, cat.name)}
                      style={[
                        styles.pickerItem,
                        {
                          backgroundColor: isCurrent
                            ? `${colors.primary}18`
                            : "transparent",
                        },
                      ]}
                    >
                      <CategoryVisual
                        categoryName={cat.name}
                        iconName={cat.icon}
                        color={cat.color}
                        imageUrl={cat.imageUrl}
                        size="small"
                        showBorder
                      />
                      <Text
                        style={[
                          styles.pickerItemText,
                          {
                            color: isCurrent ? colors.primary : colors.fg,
                            fontWeight: isCurrent
                              ? fontWeight.semibold
                              : fontWeight.normal,
                          },
                        ]}
                      >
                        {cat.name}
                      </Text>
                      {isCurrent && (
                        <Feather
                          name="check"
                          size={16}
                          color={colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={!!deletingRule}
        title="Delete Merchant Rule"
        message={`Are you sure you want to delete the rule for "${deletingRule?.displayMerchant}"? Future transactions from this merchant will prompt for category selection again.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingRule(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
  },
  rulesCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  rulesCountBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  content: {
    padding: spacing[4],
    gap: spacing[3],
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    padding: 0,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  rulesList: {
    gap: spacing[3],
  },
  ruleCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  ruleTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ruleVisualWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ruleInfoCol: {
    flex: 1,
    gap: 2,
  },
  ruleMerchantName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  ruleMetaText: {
    fontSize: fontSize.xs,
  },
  ruleDivider: {
    height: 1,
    width: "100%",
  },
  ruleBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  categoryPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  ruleActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  actionBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  emptyStateCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[8],
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing[2],
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  pickerSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  pickerTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  pickerSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radius.md,
    gap: spacing[3],
  },
  pickerItemText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
});
