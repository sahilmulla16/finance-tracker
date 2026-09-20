import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFinance, type SavingsGoal } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { money, currencySymbol } from "@/utils/format";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";

const GOAL_COLORS = [
  "#2868E8",
  "#48B49B",
  "#9B7BEB",
  "#FF8C69",
  "#EC6A8E",
  "#E6B85C",
];

export default function SavingsScreen() {
  const {
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addFundsToGoal,
    settings,
  } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialAmount, setInitialAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);

  // Deposit states
  const [depositAmount, setDepositAmount] = useState("");

  const totalSaved = useMemo(
    () => savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0),
    [savingsGoals],
  );
  const totalTarget = useMemo(
    () => savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0),
    [savingsGoals],
  );
  const overallPercentage =
    totalTarget > 0
      ? Math.min(100, Math.round((totalSaved / totalTarget) * 100))
      : 0;

  const handleOpenCreate = () => {
    setName("");
    setTargetAmount("");
    setInitialAmount("");
    setTargetDate("");
    setSelectedColor(GOAL_COLORS[0]);
    setCreateModalVisible(true);
  };

  const handleSaveGoal = async () => {
    const target = Number(targetAmount.replace(/,/g, ""));
    const current = Number(initialAmount.replace(/,/g, "")) || 0;

    if (!name.trim()) {
      Alert.alert("Required", "Please enter a goal name.");
      return;
    }
    if (!target || target <= 0) {
      Alert.alert("Required", "Please enter a valid target amount.");
      return;
    }

    await addSavingsGoal(
      name.trim(),
      target,
      current,
      targetDate.trim() || undefined,
      "Savings",
      selectedColor,
    );
    setCreateModalVisible(false);
  };

  const handleOpenDeposit = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setDepositAmount("");
    setDepositModalVisible(true);
  };

  const handleConfirmDeposit = async () => {
    if (!selectedGoal) return;
    const amount = Number(depositAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) {
      Alert.alert("Required", "Please enter a valid amount to deposit.");
      return;
    }
    await addFundsToGoal(selectedGoal.id, amount);
    setDepositModalVisible(false);
  };

  const handleDelete = (goal: SavingsGoal) => {
    Alert.alert(
      "Delete Goal",
      `Are you sure you want to delete "${goal.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSavingsGoal(goal.id),
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Savings Goals
        </Text>
        <Pressable
          onPress={handleOpenCreate}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={18} color={colors.onPrimary} />
          <Text style={[styles.addBtnText, { color: colors.onPrimary }]}>
            New
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>
                Total Saved
              </Text>
              <Text style={[styles.summaryAmount, { color: colors.fg }]}>
                {money(totalSaved, settings.currency)}
              </Text>
            </View>
            <View
              style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}
            >
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {overallPercentage}% Reached
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.overallTrack,
              { backgroundColor: colors.surfaceRecessed },
            ]}
          >
            <View
              style={[
                styles.overallFill,
                {
                  width: `${overallPercentage}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.summaryBottom}>
            <Text style={[styles.summarySub, { color: colors.fgSubtle }]}>
              Target: {money(totalTarget, settings.currency)}
            </Text>
            <Text style={[styles.summarySub, { color: colors.fgSubtle }]}>
              {savingsGoals.length}{" "}
              {savingsGoals.length === 1 ? "Goal" : "Goals"}
            </Text>
          </View>
        </View>

        {/* Goals List */}
        <View style={styles.goalsList}>
          {savingsGoals.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconBg,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Feather name="target" size={36} color={colors.fgMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.fg }]}>
                No Savings Goals Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.fgMuted }]}>
                Set targets for gadgets, travel, emergency funds, or anything
                you dream of.
              </Text>
              <Pressable
                onPress={handleOpenCreate}
                style={[
                  styles.emptyCreateBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Feather name="plus" size={18} color={colors.onPrimary} />
                <Text
                  style={[
                    styles.emptyCreateBtnText,
                    { color: colors.onPrimary },
                  ]}
                >
                  Create Your First Goal
                </Text>
              </Pressable>
            </View>
          ) : (
            savingsGoals.map((goal) => {
              const pct =
                goal.targetAmount > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (goal.currentAmount / goal.targetAmount) * 100,
                      ),
                    )
                  : 0;
              const remaining = Math.max(
                0,
                goal.targetAmount - goal.currentAmount,
              );

              return (
                <View
                  key={goal.id}
                  style={[styles.goalCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.goalCardTop}>
                    <View style={styles.goalInfoLeft}>
                      <View
                        style={[
                          styles.colorPill,
                          { backgroundColor: goal.color || colors.primary },
                        ]}
                      />
                      <View>
                        <Text style={[styles.goalName, { color: colors.fg }]}>
                          {goal.name}
                        </Text>
                        {goal.targetDate && (
                          <Text
                            style={[
                              styles.goalTargetDate,
                              { color: colors.fgMuted },
                            ]}
                          >
                            <Feather name="calendar" size={11} /> Target:{" "}
                            {goal.targetDate}
                          </Text>
                        )}
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleDelete(goal)}
                      style={styles.deleteGoalBtn}
                    >
                      <Feather
                        name="trash-2"
                        size={16}
                        color={colors.fgSubtle}
                      />
                    </Pressable>
                  </View>

                  {/* Amounts */}
                  <View style={styles.goalAmountRow}>
                    <View>
                      <Text style={[styles.savedAmount, { color: colors.fg }]}>
                        {money(goal.currentAmount, settings.currency)}
                      </Text>
                      <Text
                        style={[
                          styles.remainingAmount,
                          { color: colors.fgMuted },
                        ]}
                      >
                        {remaining === 0
                          ? "Goal Achieved! 🎉"
                          : `${money(remaining, settings.currency)} to go`}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.goalPercentage,
                        { color: goal.color || colors.primary },
                      ]}
                    >
                      {pct}%
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View
                    style={[
                      styles.goalTrack,
                      { backgroundColor: colors.surfaceRecessed },
                    ]}
                  >
                    <View
                      style={[
                        styles.goalFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: goal.color || colors.primary,
                        },
                      ]}
                    />
                  </View>

                  {/* Add Funds Action */}
                  <View style={styles.goalActionRow}>
                    <Text
                      style={[
                        styles.goalTargetTotal,
                        { color: colors.fgSubtle },
                      ]}
                    >
                      Target: {money(goal.targetAmount, settings.currency)}
                    </Text>
                    <Pressable
                      onPress={() => handleOpenDeposit(goal)}
                      style={[
                        styles.depositBtn,
                        {
                          backgroundColor: `${goal.color || colors.primary}18`,
                        },
                      ]}
                    >
                      <Feather
                        name="plus-circle"
                        size={14}
                        color={goal.color || colors.primary}
                      />
                      <Text
                        style={[
                          styles.depositBtnText,
                          { color: goal.color || colors.primary },
                        ]}
                      >
                        Add Funds
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCreateModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.canvas,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <Text style={[styles.modalTitle, { color: colors.fg }]}>
              New Savings Goal
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                Goal Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. New Laptop, Emergency Fund"
                placeholderTextColor={colors.fgSubtle}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, color: colors.fg },
                ]}
              />

              <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                Target Amount ({currencySymbol(settings.currency)})
              </Text>
              <TextInput
                value={targetAmount}
                onChangeText={(v) => setTargetAmount(v.replace(/[^0-9.]/g, ""))}
                placeholder="50000"
                placeholderTextColor={colors.fgSubtle}
                keyboardType="decimal-pad"
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, color: colors.fg },
                ]}
              />

              <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                Initial Deposit (Optional)
              </Text>
              <TextInput
                value={initialAmount}
                onChangeText={(v) =>
                  setInitialAmount(v.replace(/[^0-9.]/g, ""))
                }
                placeholder="0"
                placeholderTextColor={colors.fgSubtle}
                keyboardType="decimal-pad"
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, color: colors.fg },
                ]}
              />

              <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                Target Date (Optional, YYYY-MM-DD)
              </Text>
              <TextInput
                value={targetDate}
                onChangeText={setTargetDate}
                placeholder="2026-12-31"
                placeholderTextColor={colors.fgSubtle}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, color: colors.fg },
                ]}
              />

              <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                Color Theme
              </Text>
              <View style={styles.colorRow}>
                {GOAL_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c },
                      selectedColor === c && styles.colorCircleActive,
                    ]}
                  >
                    {selectedColor === c && (
                      <Feather name="check" size={14} color="#FFFFFF" />
                    )}
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleSaveGoal}
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[styles.submitBtnText, { color: colors.onPrimary }]}
                >
                  Create Goal
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Deposit Funds Modal */}
      <Modal
        visible={depositModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDepositModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.canvas,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <Text style={[styles.modalTitle, { color: colors.fg }]}>
              Add Funds to {selectedGoal?.name}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
              Deposit Amount ({currencySymbol(settings.currency)})
            </Text>
            <TextInput
              value={depositAmount}
              onChangeText={(v) => setDepositAmount(v.replace(/[^0-9.]/g, ""))}
              placeholder="1000"
              placeholderTextColor={colors.fgSubtle}
              keyboardType="decimal-pad"
              autoFocus
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.fg },
              ]}
            />

            {/* Quick chips */}
            <View style={styles.quickChipsRow}>
              {[500, 1000, 2500, 5000].map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => setDepositAmount(String(amt))}
                  style={[styles.chip, { backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.chipText, { color: colors.fg }]}>
                    +{amt}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleConfirmDeposit}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.submitBtnText, { color: colors.onPrimary }]}>
                Confirm Deposit
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  addBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  summaryCard: {
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[5],
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[3],
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing[1],
  },
  summaryAmount: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  overallTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing[3],
  },
  overallFill: {
    height: "100%",
    borderRadius: 4,
  },
  summaryBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summarySub: {
    fontSize: fontSize.xs,
  },

  goalsList: {
    gap: spacing[4],
  },
  goalCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
  },
  goalCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  goalInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  colorPill: {
    width: 12,
    height: 32,
    borderRadius: radius.full,
  },
  goalName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  goalTargetDate: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  deleteGoalBtn: {
    padding: spacing[2],
  },
  goalAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing[2],
  },
  savedAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  remainingAmount: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  goalPercentage: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  goalTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: spacing[3],
  },
  goalFill: {
    height: "100%",
    borderRadius: 3,
  },
  goalActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing[2],
  },
  goalTargetTotal: {
    fontSize: fontSize.xs,
  },
  depositBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
  },
  depositBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: spacing[10],
    gap: spacing[3],
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing[6],
  },
  emptyCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    marginTop: spacing[2],
  },
  emptyCreateBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  textInput: {
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    fontSize: fontSize.sm,
  },
  colorRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginVertical: spacing[2],
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  colorCircleActive: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  quickChipsRow: {
    flexDirection: "row",
    gap: spacing[2],
    marginVertical: spacing[4],
  },
  chip: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: "center",
    borderRadius: radius.md,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  submitBtn: {
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  submitBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
