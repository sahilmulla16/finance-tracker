import React, { useState, useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { CategoryVisual } from "@/components/ui/CategoryVisual";
import { haptics } from "@/utils/haptics";
import { useFinance } from "@/context/FinanceContext";

export interface MerchantMemoryModalProps {
  visible?: boolean;
  merchantName?: string;
  categoryName?: string;
  count?: number;
  alreadyCategorizedCount?: number;
  onAlwaysUse?: () => void | Promise<void>;
  onApplyToPrevious?: (overwriteExisting: boolean) => void | Promise<void>;
  onNotNow?: () => void | Promise<void>;
  onDismiss?: () => void;
}

export function MerchantMemoryModal({
  visible,
  merchantName,
  categoryName,
  count,
  alreadyCategorizedCount,
  onAlwaysUse,
  onApplyToPrevious,
  onNotNow,
  onDismiss,
}: MerchantMemoryModalProps = {}) {
  const finance = useFinance();
  const colors = useColors();

  const prompt = finance?.merchantMemoryPrompt;
  const isVisible = visible !== undefined ? visible : Boolean(prompt);

  const resolvedMerchant = merchantName ?? prompt?.merchant ?? "";
  const resolvedCategory = categoryName ?? prompt?.category?.name ?? "";
  const resolvedCount = count ?? prompt?.count ?? 0;
  const resolvedAlreadyCategorizedCount =
    alreadyCategorizedCount ?? prompt?.alreadyCategorizedCount ?? 0;

  const [step, setStep] = useState<"APPLY_HISTORY" | "ALWAYS_USE_FUTURE">(
    "APPLY_HISTORY",
  );
  const [overwrite, setOverwrite] = useState(false);
  const [isApplyingHistory, setIsApplyingHistory] = useState(false);

  useEffect(() => {
    if (isVisible) {
      if (resolvedCount > 0 || resolvedAlreadyCategorizedCount > 0) {
        setStep("APPLY_HISTORY");
      } else {
        setStep("ALWAYS_USE_FUTURE");
      }
      setOverwrite(false);
      setIsApplyingHistory(false);
    }
  }, [isVisible, resolvedCount, resolvedAlreadyCategorizedCount]);

  if (!isVisible || !resolvedMerchant) return null;

  const handleApplyHistory = async () => {
    setIsApplyingHistory(true);
    void haptics.strong();
    try {
      if (onApplyToPrevious) {
        await onApplyToPrevious(overwrite);
      } else if (prompt && finance) {
        await finance.bulkCategorizeTransactions(
          prompt.merchant,
          prompt.category.id,
          prompt.category.name,
          overwrite,
        );
      }
    } finally {
      setIsApplyingHistory(false);
      // Advance sequentially to Step 2: "Always use for future transactions"
      setStep("ALWAYS_USE_FUTURE");
    }
  };

  const handleSkipHistory = () => {
    void haptics.selection();
    // Skip historical updates, advance to Step 2
    setStep("ALWAYS_USE_FUTURE");
  };

  const handleAlwaysUse = async () => {
    void haptics.success();
    if (onAlwaysUse) {
      await onAlwaysUse();
    } else if (prompt && finance) {
      await finance.saveMerchantRule(
        prompt.merchant,
        prompt.category.id,
        prompt.category.name,
      );
      finance.dismissMerchantMemory();
    }
  };

  const handleNotNow = async () => {
    void haptics.selection();
    if (onNotNow) {
      await onNotNow();
    } else if (finance) {
      finance.dismissMerchantMemory();
    }
  };

  const handleBackdropDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      void handleNotNow();
    }
  };

  const hasHistory = resolvedCount > 0 || resolvedAlreadyCategorizedCount > 0;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropDismiss}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropDismiss}
          accessibilityLabel="Dismiss merchant memory"
        />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {step === "APPLY_HISTORY" ? (
            <>
              {/* STEP 1: Apply to previous transactions */}
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: `${colors.primary}18` },
                  ]}
                >
                  <Feather name="clock" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eyebrow, { color: colors.primary }]}>
                    STEP 1 OF 2 · PREVIOUS TRANSACTIONS
                  </Text>
                  <Text style={[styles.title, { color: colors.fg }]}>
                    Apply to previous transactions?
                  </Text>
                </View>
              </View>

              <Text style={[styles.body, { color: colors.fgMuted }]}>
                Found {resolvedCount} previous{" "}
                <Text
                  style={{
                    fontWeight: fontWeight.semibold,
                    color: colors.fg,
                  }}
                >
                  {resolvedMerchant}
                </Text>{" "}
                {resolvedCount === 1 ? "transaction" : "transactions"}. Apply{" "}
                <Text
                  style={{
                    fontWeight: fontWeight.semibold,
                    color: colors.primary,
                  }}
                >
                  {resolvedCategory}
                </Text>{" "}
                to these transactions?
              </Text>

              {resolvedAlreadyCategorizedCount > 0 && (
                <View
                  style={[
                    styles.overwriteBox,
                    {
                      backgroundColor: colors.surfaceRecessed,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1, marginRight: spacing[3] }}>
                    <Text
                      style={[styles.overwriteTitle, { color: colors.fg }]}
                    >
                      Overwrite categorized
                    </Text>
                    <Text
                      style={[
                        styles.overwriteSubtitle,
                        { color: colors.fgMuted },
                      ]}
                    >
                      Also update {resolvedAlreadyCategorizedCount} transactions that
                      already have a category
                    </Text>
                  </View>
                  <Switch
                    value={overwrite}
                    onValueChange={setOverwrite}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              )}

              {/* Action Buttons for Step 1 */}
              <View style={styles.verticalActionCol}>
                <Pressable
                  onPress={handleApplyHistory}
                  disabled={isApplyingHistory}
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  accessibilityRole="button"
                >
                  <Feather
                    name="check"
                    size={16}
                    color={colors.onPrimary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[styles.primaryBtnText, { color: colors.onPrimary }]}
                  >
                    {isApplyingHistory
                      ? "Applying..."
                      : `Apply to ${
                          overwrite
                            ? resolvedCount + resolvedAlreadyCategorizedCount
                            : resolvedCount
                        } transactions`}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSkipHistory}
                  style={[
                    styles.secondaryBtn,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[styles.secondaryBtnText, { color: colors.fg }]}
                  >
                    Skip (Don't update previous)
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleNotNow}
                  style={styles.ghostBtn}
                  accessibilityRole="button"
                >
                  <Text style={[styles.ghostBtnText, { color: colors.fgMuted }]}>
                    Not now
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {/* STEP 2: Always use for future transactions */}
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: `${colors.primary}18` },
                  ]}
                >
                  <CategoryVisual categoryName={resolvedCategory} size="small" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eyebrow, { color: colors.primary }]}>
                    {hasHistory
                      ? "STEP 2 OF 2 · FUTURE TRANSACTIONS"
                      : "MERCHANT MEMORY"}
                  </Text>
                  <Text style={[styles.title, { color: colors.fg }]}>
                    Remember {resolvedMerchant}?
                  </Text>
                </View>
              </View>

              <Text style={[styles.body, { color: colors.fgMuted }]}>
                Always use{" "}
                <Text
                  style={{
                    fontWeight: fontWeight.semibold,
                    color: colors.primary,
                  }}
                >
                  {resolvedCategory}
                </Text>{" "}
                for future transactions from{" "}
                <Text
                  style={{
                    fontWeight: fontWeight.semibold,
                    color: colors.fg,
                  }}
                >
                  {resolvedMerchant}
                </Text>{" "}
                as well?
              </Text>

              {/* Action Buttons for Step 2 */}
              <View style={styles.verticalActionCol}>
                <Pressable
                  onPress={handleAlwaysUse}
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  accessibilityRole="button"
                >
                  <Feather
                    name="zap"
                    size={16}
                    color={colors.onPrimary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[styles.primaryBtnText, { color: colors.onPrimary }]}
                  >
                    Always use {resolvedCategory}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleNotNow}
                  style={styles.ghostBtn}
                  accessibilityRole="button"
                >
                  <Text style={[styles.ghostBtnText, { color: colors.fgMuted }]}>
                    Not now
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  card: {
    width: "100%",
    maxWidth: 390,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[5],
    gap: spacing[4],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    lineHeight: 22,
  },
  body: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  verticalActionCol: {
    gap: spacing[2],
    marginTop: spacing[1],
  },
  secondaryBtn: {
    flexDirection: "row",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  primaryBtn: {
    flexDirection: "row",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  ghostBtn: {
    paddingVertical: spacing[2],
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  overwriteBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  overwriteTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  overwriteSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});
