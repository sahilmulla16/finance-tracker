import React, { useState, useEffect, useMemo } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { fontSize, fontWeight, radius, spacing } from "@/constants/tokens";
import { money } from "@/utils/format";
import { CategoryVisual } from "@/components/ui/CategoryVisual";
import { haptics } from "@/utils/haptics";
import { Currency } from "@/context/FinanceContext";

export type CategoryBudgets = Record<string, number>;

type CategoryBudgetModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (budgets: CategoryBudgets) => Promise<void>;
  initialBudgets: CategoryBudgets;
  categories: { id: string; name: string; icon?: string; color?: string }[];
  totalMonthlyBudget: number;
  currency: Currency;
  categoryExpenses?: Record<string, number>;
};

export function CategoryBudgetModal({
  visible,
  onClose,
  onSave,
  initialBudgets,
  categories,
  totalMonthlyBudget,
  currency,
  categoryExpenses = {},
}: CategoryBudgetModalProps) {
  const colors = useColors();
  const [localBudgets, setLocalBudgets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Synchronize local input state with initialBudgets whenever modal opens
  useEffect(() => {
    if (visible) {
      const state: Record<string, string> = {};
      categories.forEach((cat) => {
        if (initialBudgets[cat.name] && initialBudgets[cat.name] > 0) {
          state[cat.name] = String(initialBudgets[cat.name]);
        } else {
          state[cat.name] = "";
        }
      });
      setLocalBudgets(state);
    }
  }, [visible, initialBudgets, categories]);

  // Sum of current user-allocated budgets
  const totalAllocated = useMemo(() => {
    let sum = 0;
    Object.values(localBudgets).forEach((val) => {
      const num = parseFloat(val.replace(/,/g, "").trim());
      if (!isNaN(num) && num > 0) {
        sum += num;
      }
    });
    return sum;
  }, [localBudgets]);

  const unallocated = totalMonthlyBudget - totalAllocated;
  const isOverAllocated = unallocated < 0;

  const handleTextChange = (catName: string, text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    setLocalBudgets((prev) => ({
      ...prev,
      [catName]: cleaned,
    }));
  };

  const handleClearCategory = (catName: string) => {
    void haptics.selection();
    setLocalBudgets((prev) => ({
      ...prev,
      [catName]: "",
    }));
  };

  // Helper: Distribute remaining budget evenly among unconfigured categories
  const handleDistributeRemaining = () => {
    void haptics.selection();
    const unsetCats = categories.filter((c) => {
      const v = localBudgets[c.name];
      return !v || isNaN(parseFloat(v)) || parseFloat(v) <= 0;
    });

    if (unsetCats.length === 0) {
      Alert.alert(
        "All Categories Set",
        "Every category already has an explicit custom budget.",
      );
      return;
    }

    if (unallocated <= 0) {
      Alert.alert(
        "No Remaining Budget",
        "Your total monthly budget has already been fully allocated.",
      );
      return;
    }

    const perCategory = Math.floor(unallocated / unsetCats.length);
    setLocalBudgets((prev) => {
      const next = { ...prev };
      unsetCats.forEach((c) => {
        next[c.name] = String(perCategory);
      });
      return next;
    });
  };

  const handleResetAll = () => {
    void haptics.selection();
    const empty: Record<string, string> = {};
    categories.forEach((c) => {
      empty[c.name] = "";
    });
    setLocalBudgets(empty);
  };

  const handleSave = async () => {
    void haptics.low();
    setSaving(true);
    try {
      const cleanResult: CategoryBudgets = {};
      Object.entries(localBudgets).forEach(([name, val]) => {
        const num = parseFloat(val.replace(/,/g, "").trim());
        if (!isNaN(num) && num > 0) {
          cleanResult[name] = num;
        }
      });
      await onSave(cleanResult);
      onClose();
    } catch (err) {
      console.error("Failed to save category budgets:", err);
      Alert.alert("Error", "Could not save category budgets.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalBackdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.fg }]}>
                Advanced Budget Controls
              </Text>
              <Text style={[styles.modalSub, { color: colors.fgMuted }]}>
                Set tailored limits per category
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surfaceRecessed },
              ]}
              hitSlop={8}
            >
              <Feather name="x" size={18} color={colors.fg} />
            </Pressable>
          </View>

          {/* Allocation Summary Card */}
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surfaceRecessed },
            ]}
          >
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>
                  Monthly Budget
                </Text>
                <Text style={[styles.summaryBudgetVal, { color: colors.fg }]}>
                  {money(totalMonthlyBudget, currency)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>
                  Allocated
                </Text>
                <Text
                  style={[
                    styles.summaryAllocVal,
                    {
                      color: isOverAllocated
                        ? colors.error || "#EF4444"
                        : colors.primary,
                    },
                  ]}
                >
                  {money(totalAllocated, currency)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: isOverAllocated
                      ? colors.error || "#EF4444"
                      : colors.primary,
                    width: `${Math.min(
                      (totalAllocated / Math.max(totalMonthlyBudget, 1)) * 100,
                      100,
                    )}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.summaryBottomRow}>
              <Text
                style={[
                  styles.allocationStatusText,
                  {
                    color: isOverAllocated
                      ? colors.error || "#EF4444"
                      : colors.fgMuted,
                  },
                ]}
              >
                {isOverAllocated
                  ? `Overallocated by ${money(Math.abs(unallocated), currency)}`
                  : unallocated > 0
                    ? `${money(unallocated, currency)} remaining to allocate`
                    : "Fully balanced!"}
              </Text>
            </View>
          </View>

          {/* Quick Actions Row */}
          <View style={styles.quickActionsRow}>
            <Pressable
              onPress={handleDistributeRemaining}
              style={[
                styles.quickBtn,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Feather name="pie-chart" size={13} color={colors.primary} />
              <Text style={[styles.quickBtnText, { color: colors.primary }]}>
                Split Remaining
              </Text>
            </Pressable>

            <Pressable
              onPress={handleResetAll}
              style={[
                styles.quickBtn,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Feather name="rotate-ccw" size={13} color={colors.fgMuted} />
              <Text style={[styles.quickBtnText, { color: colors.fgMuted }]}>
                Reset to Auto
              </Text>
            </Pressable>
          </View>

          {/* Category Input List */}
          <ScrollView
            style={styles.categoryList}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((cat) => {
              const currentSpend = categoryExpenses[cat.name] || 0;
              const val = localBudgets[cat.name] || "";
              const hasCustom = val.trim().length > 0;

              return (
                <View
                  key={cat.id || cat.name}
                  style={[styles.catRow, { borderBottomColor: colors.divider }]}
                >
                  <View style={styles.catInfo}>
                    <CategoryVisual
                      categoryName={cat.name}
                      iconName={cat.icon}
                      size="small"
                    />
                    <View style={{ flex: 1, marginLeft: spacing[2] }}>
                      <Text
                        style={[styles.catName, { color: colors.fg }]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                      <Text
                        style={[styles.catSpend, { color: colors.fgMuted }]}
                      >
                        Spent: {money(currentSpend, currency)}
                      </Text>
                    </View>
                  </View>

                  {/* Input & Clear */}
                  <View style={styles.catInputWrap}>
                    <View
                      style={[
                        styles.inputBox,
                        {
                          backgroundColor: colors.surfaceRecessed,
                          borderColor: hasCustom
                            ? colors.primary
                            : colors.divider,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currencyPrefix,
                          { color: colors.fgMuted },
                        ]}
                      >
                        {currency}
                      </Text>
                      <TextInput
                        value={val}
                        onChangeText={(txt) => handleTextChange(cat.name, txt)}
                        placeholder="Auto"
                        placeholderTextColor={colors.fgSubtle}
                        keyboardType="decimal-pad"
                        style={[styles.textInput, { color: colors.fg }]}
                      />
                    </View>

                    {hasCustom && (
                      <Pressable
                        onPress={() => handleClearCategory(cat.name)}
                        style={styles.clearCatBtn}
                        hitSlop={6}
                      >
                        <Feather
                          name="x-circle"
                          size={14}
                          color={colors.fgSubtle}
                        />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Save Action */}
          <View style={styles.modalFooter}>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                saving && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : "Save Category Budgets"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "85%",
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  modalSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    borderRadius: radius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    textTransform: "uppercase",
    fontWeight: fontWeight.semibold,
  },
  summaryBudgetVal: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  summaryAllocVal: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: spacing[2],
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  summaryBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  allocationStatusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    gap: 6,
  },
  quickBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  categoryList: {
    maxHeight: 340,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  catInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  catName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  catSpend: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  catInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[2],
    height: 36,
    width: 110,
  },
  currencyPrefix: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    padding: 0,
  },
  clearCatBtn: {
    padding: 2,
  },
  modalFooter: {
    marginTop: spacing[3],
  },
  saveButton: {
    height: 48,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
