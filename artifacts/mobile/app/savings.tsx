import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFinance, type SavingsGoal } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { money, currencySymbol } from "@/utils/format";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { BankLogo, DeleteConfirmationModal } from "@/components/ui";
import { saveGoalImage } from "@/services/profileImageService";

function getDaysLeft(
  targetDate?: string,
): { days: number; text: string; isPast: boolean } | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return { days, text: `${Math.abs(days)}d past`, isPast: true };
  }
  if (days === 0) {
    return { days: 0, text: "Due today", isPast: false };
  }
  return { days, text: `${days}d left`, isPast: false };
}

export default function SavingsScreen() {
  const {
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addFundsToGoal,
    settings,
    accounts,
    getAccountBalance,
  } = useFinance();
  const colors = useColors();
  const isDark = colors.isDark;
  const insets = useSafeAreaInsets();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialAmount, setInitialAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isPickingImage, setIsPickingImage] = useState(false);

  // Deposit states
  const [depositAmount, setDepositAmount] = useState("");
  const [depositAccountId, setDepositAccountId] = useState<string>("");

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

  const pickGoalImage = async () => {
    if (isPickingImage) return;
    setIsPickingImage(true);
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library permission is needed to choose a custom icon for your goal.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const permanentUri = await saveGoalImage(result.assets[0].uri);
        setImageUrl(permanentUri);
      }
    } catch (err) {
      console.warn("Failed to pick goal image:", err);
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setName("");
    setTargetAmount("");
    setInitialAmount("");
    setTargetDate("");
    setImageUrl(undefined);
    setCreateModalVisible(true);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setInitialAmount(String(goal.currentAmount));
    setTargetDate(goal.targetDate || "");
    setImageUrl(goal.imageUrl);
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

    void Haptics.selectionAsync();

    if (editingGoal) {
      await updateSavingsGoal({
        ...editingGoal,
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        targetDate: targetDate.trim() || undefined,
        color: colors.primary,
        imageUrl: imageUrl || undefined,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await addSavingsGoal(
        name.trim(),
        target,
        current,
        targetDate.trim() || undefined,
        "Savings",
        colors.primary,
        imageUrl || undefined,
      );
    }
    setCreateModalVisible(false);
  };

  const handleOpenDeposit = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setDepositAmount("");
    const def = accounts.find((a) => a.isDefault) || accounts[0];
    setDepositAccountId(def?.id || "");
    setDepositModalVisible(true);
  };

  const handleConfirmDeposit = async () => {
    if (!selectedGoal) return;
    const amount = Number(depositAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) {
      Alert.alert("Required", "Please enter a valid amount.");
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addFundsToGoal(selectedGoal.id, amount, depositAccountId || undefined);
    setDepositModalVisible(false);
  };

  const handleDelete = (goal: SavingsGoal) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoalToDelete(goal);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await deleteSavingsGoal(goalToDelete.id);
    setDeleteModalVisible(false);
    setGoalToDelete(null);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Savings Goals
        </Text>
        <Pressable
          onPress={handleOpenCreate}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          hitSlop={8}
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
          paddingBottom: insets.bottom + 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Minimal Overview Card */}
        <View
          style={[styles.overviewCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.overviewTop}>
            <View>
              <Text style={[styles.overviewLabel, { color: colors.fgMuted }]}>
                TOTAL SAVED
              </Text>
              <Text style={[styles.overviewAmount, { color: colors.fg }]}>
                {money(totalSaved, settings.currency)}
              </Text>
            </View>
            <View
              style={[
                styles.percentageBadge,
                { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <Text
                style={[styles.percentageBadgeText, { color: colors.primary }]}
              >
                {overallPercentage}%
              </Text>
            </View>
          </View>

          {/* Minimal Progress Bar */}
          <View
            style={[
              styles.overviewTrack,
              { backgroundColor: colors.surfaceRecessed },
            ]}
          >
            <View
              style={[
                styles.overviewFill,
                {
                  width: `${overallPercentage}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.overviewStats}>
            <Text style={[styles.overviewSub, { color: colors.fgSubtle }]}>
              Target: {money(totalTarget, settings.currency)}
            </Text>
            <Text style={[styles.overviewSub, { color: colors.fgSubtle }]}>
              {savingsGoals.length}{" "}
              {savingsGoals.length === 1 ? "goal" : "goals"}
            </Text>
          </View>
        </View>

        {/* Goals List */}
        <View style={styles.goalsContainer}>
          {savingsGoals.length === 0 ? (
            <View
              style={[styles.emptyCard, { backgroundColor: colors.surface }]}
            >
              <View
                style={[
                  styles.emptyIconBg,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Feather name="target" size={32} color={colors.primary} />
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
                <Feather name="plus" size={16} color={colors.onPrimary} />
                <Text
                  style={[
                    styles.emptyCreateBtnText,
                    { color: colors.onPrimary },
                  ]}
                >
                  Create Goal
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
              const daysInfo = getDaysLeft(goal.targetDate);
              const goalColor = colors.primary;

              return (
                <View
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Background Cover Photo for Rectangular Goal Card */}
                  {goal.imageUrl && (
                    <View style={styles.rectangularGoalBgContainer} pointerEvents="none">
                      <Image
                        source={{ uri: goal.imageUrl }}
                        style={styles.rectangularGoalBgImage}
                        resizeMode="cover"
                      />
                      {/* 85% Background Overlay for High Contrast & Text Readability */}
                      <View
                        style={[
                          styles.rectangularGoalOverlay,
                          {
                            backgroundColor: isDark
                              ? "rgba(10, 14, 13, 0.85)"
                              : "rgba(255, 255, 255, 0.85)",
                          },
                        ]}
                      />
                    </View>
                  )}

                  {/* Card Header: Avatar, Name, Days pill, Actions */}
                  <View style={styles.goalCardHeader}>
                    <View style={styles.goalTitleGroup}>
                      <View
                        style={[
                          styles.goalIconTile,
                          { backgroundColor: `${goalColor}18` },
                        ]}
                      >
                        <Feather name="target" size={18} color={goalColor} />
                      </View>
                      <View style={styles.goalNameCol}>
                        <Text
                          style={[styles.goalName, { color: colors.fg }]}
                          numberOfLines={1}
                        >
                          {goal.name}
                        </Text>
                        {daysInfo && (
                          <View
                            style={[
                              styles.miniPill,
                              {
                                backgroundColor: daysInfo.isPast
                                  ? "rgba(239, 68, 68, 0.12)"
                                  : colors.surfaceRecessed,
                              },
                            ]}
                          >
                            <Feather
                              name="clock"
                              size={10}
                              color={
                                daysInfo.isPast ? "#EF4444" : colors.fgMuted
                              }
                            />
                            <Text
                              style={[
                                styles.miniPillText,
                                {
                                  color: daysInfo.isPast
                                    ? "#EF4444"
                                    : colors.fgMuted,
                                },
                              ]}
                            >
                              {daysInfo.text}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.cardHeaderActions}>
                      <Pressable
                        onPress={() => handleOpenEdit(goal)}
                        hitSlop={8}
                        style={styles.actionIconBtn}
                      >
                        <Feather
                          name="edit-2"
                          size={14}
                          color={colors.fgSubtle}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(goal)}
                        hitSlop={8}
                        style={styles.actionIconBtn}
                      >
                        <Feather
                          name="trash-2"
                          size={14}
                          color={colors.fgSubtle}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Amounts Row */}
                  <View style={styles.goalAmountRow}>
                    <View style={styles.goalAmountLeft}>
                      <Text style={[styles.savedValue, { color: colors.fg }]}>
                        {money(goal.currentAmount, settings.currency)}
                      </Text>
                      <Text
                        style={[styles.targetValue, { color: colors.fgSubtle }]}
                      >
                        {" "}
                        / {money(goal.targetAmount, settings.currency)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.goalPctBadge,
                        { backgroundColor: `${goalColor}18` },
                      ]}
                    >
                      <Text style={[styles.goalPctText, { color: goalColor }]}>
                        {pct}%
                      </Text>
                    </View>
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
                          backgroundColor: goalColor,
                        },
                      ]}
                    />
                  </View>

                  {/* Bottom Row: Remaining + Add Funds button */}
                  <View style={styles.goalBottomRow}>
                    <Text
                      style={[styles.remainingText, { color: colors.fgMuted }]}
                    >
                      {remaining === 0
                        ? "Goal Achieved! 🎉"
                        : `${money(remaining, settings.currency)} to go`}
                    </Text>

                    <Pressable
                      onPress={() => handleOpenDeposit(goal)}
                      style={[
                        styles.addFundsBtn,
                        { backgroundColor: `${goalColor}18` },
                      ]}
                      hitSlop={6}
                    >
                      <Feather name="plus" size={13} color={goalColor} />
                      <Text
                        style={[styles.addFundsBtnText, { color: goalColor }]}
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

      {/* Create / Edit Goal Modal */}
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
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.fg }]}>
                {editingGoal ? "Edit Savings Goal" : "New Savings Goal"}
              </Text>
              <Pressable onPress={() => setCreateModalVisible(false)}>
                <Feather name="x" size={20} color={colors.fgMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo / Icon Picker */}
              <View style={styles.iconPickerRow}>
                <Pressable
                  onPress={() => void pickGoalImage()}
                  style={[
                    styles.goalAvatarCircle,
                    {
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}18`,
                    },
                  ]}
                >
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.modalPhotoImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <Feather name="camera" size={20} color={colors.primary} />
                  )}
                </Pressable>
                <View style={{ flex: 1, gap: 4 }}>
                  <Pressable
                    onPress={() => void pickGoalImage()}
                    style={styles.photoActionLink}
                  >
                    <Text
                      style={[styles.photoActionText, { color: colors.primary }]}
                    >
                      {imageUrl
                        ? "Change photo / logo"
                        : "Upload photo or logo"}
                    </Text>
                  </Pressable>
                  {imageUrl && (
                    <Pressable onPress={() => setImageUrl(undefined)}>
                      <Text
                        style={[
                          styles.photoRemoveText,
                          { color: colors.error },
                        ]}
                      >
                        Remove photo
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Goal Name */}
              <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                GOAL NAME
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. New Laptop, Emergency Fund"
                placeholderTextColor={colors.fgSubtle}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceRecessed, color: colors.fg },
                ]}
              />

              {/* Target Amount */}
              <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                TARGET AMOUNT ({currencySymbol(settings.currency)})
              </Text>
              <TextInput
                value={targetAmount}
                onChangeText={(v) => setTargetAmount(v.replace(/[^0-9.]/g, ""))}
                placeholder="50000"
                placeholderTextColor={colors.fgSubtle}
                keyboardType="decimal-pad"
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceRecessed, color: colors.fg },
                ]}
              />

              {/* Initial Saved */}
              <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                {editingGoal
                  ? `CURRENT SAVED (${currencySymbol(settings.currency)})`
                  : `INITIAL DEPOSIT (OPTIONAL) (${currencySymbol(settings.currency)})`}
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
                  { backgroundColor: colors.surfaceRecessed, color: colors.fg },
                ]}
              />

              {/* Target Date */}
              <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                TARGET DATE (OPTIONAL, YYYY-MM-DD)
              </Text>
              <TextInput
                value={targetDate}
                onChangeText={setTargetDate}
                placeholder="2026-12-31"
                placeholderTextColor={colors.fgSubtle}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceRecessed, color: colors.fg },
                ]}
              />

              <Pressable
                onPress={handleSaveGoal}
                style={[
                  styles.primarySubmitBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.primarySubmitBtnText,
                    { color: colors.onPrimary },
                  ]}
                >
                  {editingGoal ? "Save Changes" : "Create Goal"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Centered Deposit Funds Modal with Account Deduction */}
      <Modal
        visible={depositModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlayCenter}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDepositModalVisible(false)}
          />
          <View
            style={[
              styles.modalCardCenter,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                }}
              >
                <View
                  style={[
                    styles.goalHeaderIconWrap,
                    {
                      backgroundColor: `${selectedGoal?.color || colors.primary}20`,
                    },
                  ]}
                >
                  <Feather
                    name="target"
                    size={18}
                    color={selectedGoal?.color || colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.modalCardTitle, { color: colors.fg }]}
                    numberOfLines={1}
                  >
                    Add Funds
                  </Text>
                  <Text
                    style={[styles.modalCardSub, { color: colors.fgMuted }]}
                    numberOfLines={1}
                  >
                    {selectedGoal?.name}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setDepositModalVisible(false)}
                hitSlop={8}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Feather name="x" size={16} color={colors.fgMuted} />
              </Pressable>
            </View>

            {/* Deposit Amount Input */}
            <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
              DEPOSIT AMOUNT ({currencySymbol(settings.currency)})
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
                { backgroundColor: colors.surfaceRecessed, color: colors.fg },
              ]}
            />

            {/* Quick chips */}
            <View style={styles.quickChipsRow}>
              {[500, 1000, 2500, 5000].map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setDepositAmount(String(amt));
                  }}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.fg }]}>
                    +{amt}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Account Selector Section to Deduct From */}
            {accounts.length > 0 && (
              <View style={{ marginBottom: spacing[4] }}>
                <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                  DEDUCT FROM ACCOUNT
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.accountSelectorScroll}
                >
                  {accounts.map((acc) => {
                    const isSelected = depositAccountId === acc.id;
                    const bal = getAccountBalance(acc.id);
                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setDepositAccountId(acc.id);
                        }}
                        style={[
                          styles.accountSelectorCard,
                          {
                            backgroundColor: isSelected
                              ? `${colors.primary}18`
                              : colors.surfaceRecessed,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                      >
                        <BankLogo
                          accountName={acc.name}
                          size={22}
                          showBorder={false}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.accountSelectorName,
                              {
                                color: isSelected ? colors.primary : colors.fg,
                                fontWeight: isSelected
                                  ? fontWeight.bold
                                  : fontWeight.medium,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {acc.name}
                          </Text>
                          <Text
                            style={[
                              styles.accountSelectorBal,
                              { color: colors.fgMuted },
                            ]}
                          >
                            {money(bal, settings.currency)}
                          </Text>
                        </View>
                        {isSelected && (
                          <Feather
                            name="check-circle"
                            size={14}
                            color={colors.primary}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <Pressable
              onPress={() => void handleConfirmDeposit()}
              style={[
                styles.primarySubmitBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.primarySubmitBtnText,
                  { color: colors.onPrimary },
                ]}
              >
                Confirm & Add Funds
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        title="Delete Savings Goal"
        message={
          goalToDelete
            ? `Are you sure you want to delete "${goalToDelete.name}"? Any accumulated balance in this goal will be removed.`
            : "Are you sure you want to delete this goal?"
        }
        confirmText="Delete Goal"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          setDeleteModalVisible(false);
          setGoalToDelete(null);
        }}
      />
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
    paddingBottom: spacing[3],
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  iconBtn: {
    width: 38,
    height: 38,
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
    borderRadius: radius.full,
  },
  addBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  overviewCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  overviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[3],
  },
  overviewLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing[1],
  },
  overviewAmount: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
  },
  percentageBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  percentageBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  overviewTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: spacing[3],
  },
  overviewFill: {
    height: "100%",
    borderRadius: 3,
  },
  overviewStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewSub: {
    fontSize: fontSize.xs,
  },
  goalsContainer: {
    gap: spacing[3],
  },
  emptyCard: {
    borderRadius: radius.xl,
    padding: spacing[6],
    alignItems: "center",
    gap: spacing[3],
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    marginTop: spacing[2],
  },
  emptyCreateBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  goalCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  rectangularGoalBgContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: radius.xl,
  },
  rectangularGoalBgImage: {
    width: "100%",
    height: "100%",
  },
  rectangularGoalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  goalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  goalTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  goalIconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  goalImage: {
    width: "100%",
    height: "100%",
  },
  goalNameCol: {
    flex: 1,
    gap: 2,
  },
  goalName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  miniPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  miniPillText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
  cardHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  actionIconBtn: {
    padding: spacing[2],
    borderRadius: radius.sm,
  },
  goalAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing[2],
  },
  goalAmountLeft: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  savedValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  targetValue: {
    fontSize: fontSize.sm,
  },
  goalPctBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  goalPctText: {
    fontSize: fontSize.xs,
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
  goalBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  remainingText: {
    fontSize: fontSize.xs,
  },
  addFundsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  addFundsBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  modalSheet: {
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    maxHeight: "85%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[3],
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  iconPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  goalAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  modalPhotoImg: {
    width: "100%",
    height: "100%",
  },
  photoActionLink: {
    paddingVertical: 2,
  },
  photoActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  photoRemoveText: {
    fontSize: fontSize.xs,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing[1],
    marginTop: spacing[3],
  },
  textInput: {
    borderRadius: radius.md,
    padding: spacing[3],
    fontSize: fontSize.base,
  },
  colorRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDotActive: {
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    transform: [{ scale: 1.15 }],
  },
  primarySubmitBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    marginTop: spacing[4],
  },
  primarySubmitBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  quickChipsRow: {
    flexDirection: "row",
    gap: spacing[2],
    marginVertical: spacing[3],
  },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  // Centered Deposit Modal
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  modalCardCenter: {
    width: "100%",
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[5],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  goalHeaderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  modalCardSub: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  accountSelectorScroll: {
    gap: spacing[2],
    paddingVertical: 4,
  },
  accountSelectorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 140,
  },
  accountSelectorName: {
    fontSize: fontSize.xs,
  },
  accountSelectorBal: {
    fontSize: 10,
    marginTop: 1,
  },
});
