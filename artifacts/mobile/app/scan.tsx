import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { BankLogo, CategoryVisual } from "@/components/ui";
import { radius, spacing } from "@/constants/tokens";
import {
  useFinance,
  type Account,
  type Category,
  type Currency,
} from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { flagDuplicates } from "@/services/duplicateDetector";
import { recognizeImageText } from "@/services/ocr";
import { OcrError } from "@/services/scanTypes";
import {
  parseOcrText,
  type ParsedTransaction,
} from "@/services/transactionParser";
import { currencySymbol, money } from "@/utils/format";
import { haptics } from "@/utils/haptics";

type ScanStep = "PICK" | "PROCESSING" | "REVIEW" | "SUCCESS";

interface QueuedImage {
  id: string;
  uri: string;
  status?: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  error?: string;
}

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    settings,
    accounts,
    categories,
    transactions: existingTransactions,
    addTransactionsBatch,
  } = useFinance();

  const [step, setStep] = useState<ScanStep>("PICK");
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  // Review state
  const [parsedTransactions, setParsedTransactions] = useState<
    ParsedTransaction[]
  >([]);
  const [selectedTxnIds, setSelectedTxnIds] = useState<Set<string>>(new Set());
  const [editingTxn, setEditingTxn] = useState<ParsedTransaction | null>(null);

  // Edit Modal internal form state
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAccountId, setEditAccountId] = useState(accounts[0]?.id || "");
  const [editType, setEditType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">(
    "EXPENSE",
  );
  const [editNotes, setEditNotes] = useState("");

  // Success summary state
  const [savedCount, setSavedCount] = useState(0);
  const [savedTotal, setSavedTotal] = useState(0);

  const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];

  // ─── Camera Mode ─────────────────────────────────────────────────────────────
  const handleLaunchCamera = async () => {
    void haptics.selection();
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera Permission Needed",
        "Please grant camera access in Settings to scan receipts directly.",
        [{ text: "OK" }],
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImage: QueuedImage = {
          id:
            "img-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
          uri: result.assets[0].uri,
        };
        const updated = [...queuedImages, newImage];
        setQueuedImages(updated);
        void haptics.low();

        // Prompt to scan next or finish
        Alert.alert(
          `Document Captured (${updated.length})`,
          "Would you like to scan another receipt or process now?",
          [
            {
              text: "+ Scan Next",
              onPress: () => {
                void handleLaunchCamera();
              },
            },
            {
              text: `Process (${updated.length})`,
              style: "default",
              onPress: () => {
                void processImages(updated);
              },
            },
          ],
        );
      }
    } catch (e) {
      console.warn("Camera launch error:", e);
      Alert.alert("Camera Error", "Could not capture image. Please try again.");
    }
  };

  // ─── Gallery Mode (Multi-selection) ──────────────────────────────────────────
  const handlePickFromGallery = async () => {
    void haptics.selection();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Gallery Permission Needed",
        "Please grant media library access in Settings to select receipt images.",
        [{ text: "OK" }],
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        selectionLimit: 20,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages: QueuedImage[] = result.assets.map((asset, i) => ({
          id:
            "img-" +
            Date.now() +
            "-" +
            i +
            "-" +
            Math.random().toString(36).slice(2, 6),
          uri: asset.uri,
        }));
        const combined = [...queuedImages, ...newImages];
        setQueuedImages(combined);
        void haptics.low();
      }
    } catch (e) {
      console.warn("Gallery picker error:", e);
      Alert.alert("Gallery Error", "Could not pick images. Please try again.");
    }
  };

  const handleRemoveQueuedImage = (id: string) => {
    void haptics.low();
    setQueuedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // ─── Processing Pipeline ─────────────────────────────────────────────────────
  const processImages = async (imagesToProcess = queuedImages) => {
    if (imagesToProcess.length === 0) {
      Alert.alert(
        "No Documents",
        "Please capture or choose at least one receipt first.",
      );
      return;
    }

    setStep("PROCESSING");
    setTotalToProcess(imagesToProcess.length);
    setProcessingIndex(0);

    const allDetected: ParsedTransaction[] = [];
    const defaultCurr = settings.currency || "INR";

    for (let i = 0; i < imagesToProcess.length; i++) {
      setProcessingIndex(i + 1);
      const img = imagesToProcess[i];

      try {
        const ocrResult = await recognizeImageText(img.uri);
        if (ocrResult.lines && ocrResult.lines.length > 0) {
          const parsed = parseOcrText(
            ocrResult.lines,
            defaultCurr,
            categories,
            img.uri,
          );
          if (parsed.length > 0) {
            allDetected.push(...parsed);
            setQueuedImages((prev) =>
              prev.map((item) =>
                item.id === img.id ? { ...item, status: "SUCCESS" } : item,
              ),
            );
          } else {
            setQueuedImages((prev) =>
              prev.map((item) =>
                item.id === img.id
                  ? {
                      ...item,
                      status: "FAILED",
                      error: "No transaction details found",
                    }
                  : item,
              ),
            );
          }
        } else {
          setQueuedImages((prev) =>
            prev.map((item) =>
              item.id === img.id
                ? { ...item, status: "FAILED", error: "No text found" }
                : item,
            ),
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "OCR failed";
        setQueuedImages((prev) =>
          prev.map((item) =>
            item.id === img.id
              ? { ...item, status: "FAILED", error: errorMessage }
              : item,
          ),
        );
        if (err instanceof OcrError && err.code === "MODULE_UNAVAILABLE") {
          Alert.alert(
            "Native OCR Module Required",
            "On-device OCR runs via the native Android Google ML Kit module. Please run via a custom development build to scan receipts with camera.\n\n" +
              err.message,
            [{ text: "OK" }],
          );
          setStep("PICK");
          return;
        }
      }
    }

    // Duplicate detection against existing local transactions and batch items
    const flagged = flagDuplicates(allDetected, existingTransactions);

    setParsedTransactions(flagged);
    // Initially select all non-duplicates or all items
    const defaultSelected = new Set(
      flagged.filter((t) => !t.isPossibleDuplicate).map((t) => t.id),
    );
    // If all are duplicates, select all so user isn't stuck with empty
    if (defaultSelected.size === 0 && flagged.length > 0) {
      flagged.forEach((t) => defaultSelected.add(t.id));
    }
    setSelectedTxnIds(defaultSelected);

    setStep("REVIEW");
    void haptics.selection();
  };

  // ─── Review Selection Controls ───────────────────────────────────────────────
  const toggleSelectTxn = (id: string) => {
    void haptics.selection();
    setSelectedTxnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    void haptics.selection();
    if (selectedTxnIds.size === parsedTransactions.length) {
      setSelectedTxnIds(new Set());
    } else {
      setSelectedTxnIds(new Set(parsedTransactions.map((t) => t.id)));
    }
  };

  // ─── Inline Transaction Editing ──────────────────────────────────────────────
  const handleOpenEdit = (txn: ParsedTransaction) => {
    void haptics.selection();
    setEditingTxn(txn);
    setEditMerchant(txn.merchant);
    setEditAmount(txn.amount.toString());
    setEditDate(txn.date);
    setEditCategory(txn.category);
    setEditAccountId(
      txn.accountId || defaultAccount?.id || accounts[0]?.id || "",
    );
    setEditType(txn.type);
    setEditNotes(txn.notes || "");
  };

  const handleSaveEdit = () => {
    if (!editingTxn) return;
    void haptics.low();

    const parsedNum = parseFloat(editAmount) || editingTxn.amount;
    const catObj = categories.find(
      (c) => c.name.toLowerCase() === editCategory.toLowerCase(),
    );

    setParsedTransactions((prev) =>
      prev.map((t) => {
        if (t.id === editingTxn.id) {
          return {
            ...t,
            merchant: editMerchant.trim() || t.merchant,
            amount: parsedNum,
            date: editDate.trim() || t.date,
            category: editCategory.trim() || t.category,
            categoryId: catObj?.id || t.categoryId,
            accountId: editAccountId,
            type: editType,
            notes: editNotes.trim(),
            confidence: "HIGH",
            confidenceLabel: "✓ Looks good",
            requiresReview: false,
          };
        }
        return t;
      }),
    );
    setEditingTxn(null);
  };

  const handleDeleteParsedTxn = (id: string) => {
    void haptics.strong();
    setParsedTransactions((prev) => prev.filter((t) => t.id !== id));
    setSelectedTxnIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setEditingTxn(null);
  };

  // ─── Batch Save ──────────────────────────────────────────────────────────────
  const handleBatchSave = async () => {
    const selected = parsedTransactions.filter((t) => selectedTxnIds.has(t.id));
    if (selected.length === 0) {
      Alert.alert(
        "Nothing Selected",
        "Please select at least one transaction to save.",
      );
      return;
    }

    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    const payload = selected.map((t) => ({
      amount: t.amount,
      description: t.merchant,
      category: t.category,
      categoryId: t.categoryId,
      accountId: t.accountId || defaultAccount?.id || accounts[0]?.id || "",
      type: t.type,
      date: t.date,
      time: currentTime,
      notes: t.notes,
    }));

    const count = await addTransactionsBatch(payload);
    const sum = selected.reduce((s, t) => s + t.amount, 0);

    setSavedCount(count);
    setSavedTotal(sum);
    setStep("SUCCESS");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Total amount of selected transactions
  const selectedTotal = parsedTransactions
    .filter((t) => selectedTxnIds.has(t.id))
    .reduce((sum, t) => sum + t.amount, 0);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Stage 1 — Document Capture / Pick
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "PICK") {
    return (
      <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          >
            <Feather name="arrow-left" size={20} color={colors.fg} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.fg }]}>
            Scan Transactions
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.heroIconBadge,
                { backgroundColor: `${colors.primary}20` },
              ]}
            >
              <Feather name="maximize" size={24} color={colors.primary} />
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={[styles.heroTitle, { color: colors.fg }]}>
                Instant Multi-Scan
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.fgMuted }]}>
                Scan receipts or bank statements and add multiple transactions
                at once. 100% on-device & offline.
              </Text>
            </View>
          </View>

          {/* Primary Action Buttons */}
          <View style={styles.actionCardsRow}>
            {/* Camera */}
            <Pressable
              onPress={() => void handleLaunchCamera()}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: `${colors.primary}30`,
                },
              ]}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Feather name="camera" size={26} color={colors.primary} />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.fg }]}>
                Scan with Camera
              </Text>
              <Text style={[styles.actionCardSub, { color: colors.fgMuted }]}>
                Continuous scanning for 1 or more receipts
              </Text>
            </Pressable>

            {/* Gallery */}
            <Pressable
              onPress={() => void handlePickFromGallery()}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Feather name="image" size={26} color={colors.fg} />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.fg }]}>
                Choose from Gallery
              </Text>
              <Text style={[styles.actionCardSub, { color: colors.fgMuted }]}>
                Select up to 20 images at once
              </Text>
            </Pressable>
          </View>

          {/* Queued Images Preview */}
          {queuedImages.length > 0 && (
            <View style={styles.queueSection}>
              <View style={styles.queueHeader}>
                <Text style={[styles.queueTitle, { color: colors.fg }]}>
                  Captured Documents ({queuedImages.length})
                </Text>
                <Pressable
                  onPress={() => {
                    void haptics.low();
                    setQueuedImages([]);
                  }}
                >
                  <Text
                    style={[styles.clearAllText, { color: colors.fgMuted }]}
                  >
                    Clear All
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailStrip}
              >
                {queuedImages.map((img, idx) => (
                  <View key={img.id} style={styles.thumbnailWrapper}>
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.thumbnailImg}
                    />
                    <Pressable
                      style={styles.thumbnailRemoveBtn}
                      onPress={() => handleRemoveQueuedImage(img.id)}
                    >
                      <Feather name="x" size={12} color="#FFFFFF" />
                    </Pressable>
                    <View
                      style={[
                        styles.thumbnailBadge,
                        img.status === "FAILED"
                          ? { backgroundColor: "#EF4444" }
                          : img.status === "SUCCESS"
                            ? { backgroundColor: "#10B981" }
                            : undefined,
                      ]}
                    >
                      <Text style={styles.thumbnailBadgeText}>
                        {img.status === "SUCCESS"
                          ? "✓"
                          : img.status === "FAILED"
                            ? "!"
                            : idx + 1}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Quick Add More Card */}
                <Pressable
                  style={[
                    styles.thumbnailAddMore,
                    {
                      backgroundColor: colors.surfaceRecessed,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => void handleLaunchCamera()}
                >
                  <Feather name="plus" size={20} color={colors.primary} />
                  <Text style={[styles.addMoreText, { color: colors.primary }]}>
                    Add More
                  </Text>
                </Pressable>
              </ScrollView>

              {/* Start Extraction CTA */}
              <Pressable
                onPress={() => void processImages()}
                style={[styles.primaryCta, { backgroundColor: colors.primary }]}
              >
                <Feather name="zap" size={18} color={colors.onPrimary} />
                <Text
                  style={[styles.primaryCtaText, { color: colors.onPrimary }]}
                >
                  Process All ({queuedImages.length}) Documents
                </Text>
              </Pressable>
            </View>
          )}

          {/* Guidelines info card */}
          <View
            style={[
              styles.tipsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radius.md,
              },
            ]}
          >
            <View style={styles.tipRow}>
              <Feather
                name="check"
                size={16}
                color={colors.primary}
                style={{ marginTop: 2 }}
              />
              <Text style={[styles.tipText, { color: colors.fgMuted }]}>
                Hold the camera steady with good lighting for highest accuracy.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Feather
                name="check"
                size={16}
                color={colors.primary}
                style={{ marginTop: 2 }}
              />
              <Text style={[styles.tipText, { color: colors.fgMuted }]}>
                Bank statements with multiple transaction rows are automatically
                split.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Feather
                name="check"
                size={16}
                color={colors.primary}
                style={{ marginTop: 2 }}
              />
              <Text style={[styles.tipText, { color: colors.fgMuted }]}>
                No photos or financial data leave your phone. 100% private.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Stage 2 — Processing Animation
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "PROCESSING") {
    return (
      <View
        style={[
          styles.screen,
          styles.centerContent,
          { backgroundColor: colors.canvas },
        ]}
      >
        <View
          style={[
            styles.processingCircle,
            {
              backgroundColor: `${colors.primary}18`,
              borderColor: `${colors.primary}40`,
            },
          ]}
        >
          <Feather name="maximize" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.processingTitle, { color: colors.fg }]}>
          Scanning Receipts...
        </Text>
        <Text style={[styles.processingSub, { color: colors.fgMuted }]}>
          Processing document {processingIndex} of {totalToProcess}
        </Text>

        {/* Progress bar */}
        <View
          style={[
            styles.progressBarTrack,
            { backgroundColor: colors.surfaceRecessed },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.round((processingIndex / Math.max(totalToProcess, 1)) * 100)}%`,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Stage 4 — Success Summary
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "SUCCESS") {
    return (
      <View
        style={[
          styles.screen,
          styles.centerContent,
          { backgroundColor: colors.canvas },
        ]}
      >
        <View
          style={[
            styles.successCircle,
            { backgroundColor: `${colors.primary}20` },
          ]}
        >
          <Feather name="check" size={44} color={colors.primary} />
        </View>

        <Text style={[styles.successTitle, { color: colors.fg }]}>
          {savedCount} {savedCount === 1 ? "Expense" : "Expenses"} Added!
        </Text>
        <Text style={[styles.successTotal, { color: colors.primary }]}>
          Total: {money(savedTotal, settings.currency)}
        </Text>
        <Text style={[styles.successSub, { color: colors.fgMuted }]}>
          Saved directly to your local Zeno ledger.
        </Text>

        <View style={styles.successActions}>
          <Pressable
            onPress={() => {
              void haptics.selection();
              router.replace("/(tabs)/expenses");
            }}
            style={[
              styles.successBtnSecondary,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.successBtnSecondaryText, { color: colors.fg }]}
            >
              View Transactions
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void haptics.low();
              router.replace("/(tabs)");
            }}
            style={[
              styles.primaryCta,
              { backgroundColor: colors.primary, flex: 1 },
            ]}
          >
            <Text style={[styles.primaryCtaText, { color: colors.onPrimary }]}>
              Back to Home
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Stage 3 — Review Screen
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Pressable
          onPress={() => setStep("PICK")}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.fg }]}>
            Review Transactions
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.fgMuted }]}>
            {parsedTransactions.length} found · {selectedTxnIds.size} selected
          </Text>
        </View>
        <Pressable
          onPress={handleSelectAll}
          style={[styles.selectAllBtn, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.selectAllText, { color: colors.primary }]}>
            {selectedTxnIds.size === parsedTransactions.length
              ? "Deselect All"
              : "Select All"}
          </Text>
        </Pressable>
      </View>

      {/* Empty State if no transactions detected */}
      {parsedTransactions.length === 0 ? (
        <View style={[styles.content, styles.centerContent, { flex: 1 }]}>
          <View
            style={[
              styles.emptyIconBadge,
              { backgroundColor: `${colors.primary}15` },
            ]}
          >
            <Feather name="alert-circle" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.fg }]}>
            Couldn't find any transactions
          </Text>
          <Text style={[styles.emptySub, { color: colors.fgMuted }]}>
            Try taking a clearer, well-lit photo or choose another document.
          </Text>
          <Pressable
            onPress={() => setStep("PICK")}
            style={[
              styles.primaryCta,
              { backgroundColor: colors.primary, marginTop: spacing[4] },
            ]}
          >
            <Feather name="refresh-cw" size={16} color={colors.onPrimary} />
            <Text style={[styles.primaryCtaText, { color: colors.onPrimary }]}>
              Scan Again
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.reviewList,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {parsedTransactions.map((txn) => {
            const isSelected = selectedTxnIds.has(txn.id);

            return (
              <Pressable
                key={txn.id}
                onPress={() => handleOpenEdit(txn)}
                style={[
                  styles.reviewCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected
                      ? `${colors.primary}60`
                      : colors.border,
                  },
                ]}
              >
                {/* Selection Checkbox */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleSelectTxn(txn.id);
                  }}
                  hitSlop={12}
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : "transparent",
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {isSelected && (
                    <Feather name="check" size={14} color={colors.onPrimary} />
                  )}
                </Pressable>

                {/* Merchant Visual */}
                <CategoryVisual
                  categoryName={txn.category}
                  iconName={
                    categories.find(
                      (c) =>
                        c.name.toLowerCase() === txn.category.toLowerCase(),
                    )?.icon || "shopping-bag"
                  }
                  size="small"
                />

                {/* Details */}
                <View style={styles.cardDetails}>
                  <View style={styles.cardTopRow}>
                    <Text
                      style={[styles.cardMerchant, { color: colors.fg }]}
                      numberOfLines={1}
                    >
                      {txn.merchant}
                    </Text>
                    <Text style={[styles.cardAmount, { color: colors.fg }]}>
                      {money(
                        txn.amount,
                        (txn.currency as Currency) || settings.currency,
                      )}
                    </Text>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <View style={styles.categoryPill}>
                      <Text
                        style={[
                          styles.categoryPillText,
                          { color: colors.fgMuted },
                        ]}
                      >
                        {txn.category}
                      </Text>
                    </View>
                    <Text style={[styles.cardDate, { color: colors.fgMuted }]}>
                      {txn.date}
                    </Text>
                  </View>

                  {/* Confidence Badge & Duplicate Warnings */}
                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.confidenceBadge,
                        {
                          backgroundColor:
                            txn.confidence === "HIGH"
                              ? `${colors.primary}18`
                              : `${colors.secondary}18`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.confidenceText,
                          {
                            color:
                              txn.confidence === "HIGH"
                                ? colors.primary
                                : colors.secondary,
                          },
                        ]}
                      >
                        {txn.confidenceLabel}
                      </Text>
                    </View>

                    {txn.sourceType && (
                      <View
                        style={[
                          styles.confidenceBadge,
                          { backgroundColor: colors.surfaceRecessed },
                        ]}
                      >
                        <Text
                          style={[
                            styles.confidenceText,
                            { color: colors.fgMuted },
                          ]}
                        >
                          {txn.sourceType === "STATEMENT_ROW"
                            ? "Statement"
                            : txn.sourceType === "PAYMENT_RECEIPT"
                              ? "UPI"
                              : txn.sourceType === "INVOICE"
                                ? "Invoice"
                                : "Receipt"}
                        </Text>
                      </View>
                    )}

                    {txn.isPossibleDuplicate && (
                      <View style={styles.duplicateBadge}>
                        <Feather
                          name="alert-triangle"
                          size={11}
                          color="#EF4444"
                        />
                        <Text style={styles.duplicateBadgeText}>
                          Possible Duplicate
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Edit Icon */}
                <Feather name="edit-2" size={16} color={colors.fgSubtle} />
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Sticky Bottom Save Action Bar */}
      {parsedTransactions.length > 0 && (
        <View
          style={[
            styles.bottomActionBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, spacing[3]),
            },
          ]}
        >
          <View style={styles.bottomTotalRow}>
            <View>
              <Text
                style={[styles.bottomTotalLabel, { color: colors.fgMuted }]}
              >
                Selected Total
              </Text>
              <Text
                style={[styles.bottomTotalValue, { color: colors.primary }]}
              >
                {money(selectedTotal, settings.currency)}
              </Text>
            </View>

            <Pressable
              onPress={() => void handleBatchSave()}
              disabled={selectedTxnIds.size === 0}
              style={[
                styles.batchSaveBtn,
                {
                  backgroundColor:
                    selectedTxnIds.size > 0
                      ? colors.primary
                      : colors.surfaceRecessed,
                  opacity: selectedTxnIds.size > 0 ? 1 : 0.6,
                },
              ]}
            >
              <Text
                style={[styles.batchSaveBtnText, { color: colors.onPrimary }]}
              >
                Save {selectedTxnIds.size}{" "}
                {selectedTxnIds.size === 1 ? "Txn" : "Txns"}
              </Text>
              <Feather name="arrow-right" size={16} color={colors.onPrimary} />
            </Pressable>
          </View>
        </View>
      )}

      {/* ─── Inline Edit Transaction Modal ────────────────────────────────────── */}
      <Modal
        visible={!!editingTxn}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingTxn(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setEditingTxn(null)}
          />
          <View style={[styles.editSheet, { backgroundColor: colors.surface }]}>
            <View
              style={[styles.sheetHandle, { backgroundColor: colors.fgSubtle }]}
            />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.fg }]}>
                Edit Transaction
              </Text>
              <Pressable onPress={() => setEditingTxn(null)}>
                <Feather name="x" size={20} color={colors.fgMuted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 420 }}
            >
              {/* Merchant / Description */}
              <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
                Merchant / Description
              </Text>
              <TextInput
                value={editMerchant}
                onChangeText={setEditMerchant}
                style={[
                  styles.fieldInput,
                  {
                    backgroundColor: colors.surfaceRecessed,
                    color: colors.fg,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Merchant"
                placeholderTextColor={colors.fgSubtle}
              />

              {/* Amount */}
              <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
                Amount ({currencySymbol(settings.currency)})
              </Text>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                style={[
                  styles.fieldInput,
                  {
                    backgroundColor: colors.surfaceRecessed,
                    color: colors.fg,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.fgSubtle}
              />

              {/* Date */}
              <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
                Date (YYYY-MM-DD)
              </Text>
              <TextInput
                value={editDate}
                onChangeText={setEditDate}
                style={[
                  styles.fieldInput,
                  {
                    backgroundColor: colors.surfaceRecessed,
                    color: colors.fg,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="2026-09-22"
                placeholderTextColor={colors.fgSubtle}
              />

              {/* Category Pills */}
              <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pillsScroll}
              >
                {categories.map((cat) => {
                  const isCatSelected =
                    cat.name.toLowerCase() === editCategory.toLowerCase();
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setEditCategory(cat.name)}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: isCatSelected
                            ? colors.primary
                            : colors.surfaceRecessed,
                          borderColor: isCatSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          {
                            color: isCatSelected ? colors.onPrimary : colors.fg,
                          },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Transaction Type */}
              <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
                Transaction Type
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pillsScroll}
              >
                {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => {
                  const isSelected = editType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setEditType(t)}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceRecessed,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          {
                            color: isSelected ? colors.onPrimary : colors.fg,
                          },
                        ]}
                      >
                        {t === "EXPENSE"
                          ? "Expense"
                          : t === "INCOME"
                            ? "Income"
                            : "Transfer"}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Account Selection */}
              {accounts.length > 0 && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
                    Account
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.pillsScroll}
                  >
                    {accounts.map((acc) => {
                      const isAccSelected = acc.id === editAccountId;
                      return (
                        <Pressable
                          key={acc.id}
                          onPress={() => setEditAccountId(acc.id)}
                          style={[
                            styles.catPill,
                            {
                              backgroundColor: isAccSelected
                                ? colors.primary
                                : colors.surfaceRecessed,
                              borderColor: isAccSelected
                                ? colors.primary
                                : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.catPillText,
                              {
                                color: isAccSelected
                                  ? colors.onPrimary
                                  : colors.fg,
                              },
                            ]}
                          >
                            {acc.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Notes */}
              <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
                Notes
              </Text>
              <TextInput
                value={editNotes}
                onChangeText={setEditNotes}
                style={[
                  styles.fieldInput,
                  {
                    backgroundColor: colors.surfaceRecessed,
                    color: colors.fg,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Optional notes"
                placeholderTextColor={colors.fgSubtle}
              />
            </ScrollView>

            {/* Sheet Actions */}
            <View style={styles.sheetActionsRow}>
              {editingTxn && (
                <Pressable
                  onPress={() => handleDeleteParsedTxn(editingTxn.id)}
                  style={[styles.deleteBtn, { backgroundColor: "#EF444420" }]}
                >
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </Pressable>
              )}
              <Pressable
                onPress={handleSaveEdit}
                style={[
                  styles.primaryCta,
                  { backgroundColor: colors.primary, flex: 1 },
                ]}
              >
                <Text
                  style={[styles.primaryCtaText, { color: colors.onPrimary }]}
                >
                  Confirm Changes
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[5],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  selectAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: radius.xl,
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionCardsRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  actionCard: {
    flex: 1,
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  actionCardSub: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
  queueSection: {
    marginBottom: spacing[4],
  },
  queueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  clearAllText: {
    fontSize: 12,
  },
  thumbnailStrip: {
    flexDirection: "row",
    gap: spacing[2],
    paddingVertical: spacing[2],
    marginBottom: spacing[3],
  },
  thumbnailWrapper: {
    width: 80,
    height: 100,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
  },
  thumbnailRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  thumbnailBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  thumbnailAddMore: {
    width: 80,
    height: 100,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addMoreText: {
    fontSize: 11,
    fontWeight: "700",
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    height: 50,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
  },
  primaryCtaText: {
    fontSize: 15,
    fontWeight: "700",
  },
  tipsCard: {
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
  },
  tipText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  processingCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  processingSub: {
    fontSize: 13,
    marginBottom: spacing[4],
  },
  progressBarTrack: {
    width: "80%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  successTotal: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  successSub: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing[5],
  },
  successActions: {
    flexDirection: "row",
    gap: spacing[3],
    width: "100%",
    paddingHorizontal: spacing[4],
  },
  successBtnSecondary: {
    paddingHorizontal: spacing[4],
    height: 50,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  successBtnSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  reviewList: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    gap: spacing[3],
  },
  reviewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing[3],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetails: {
    flex: 1,
    gap: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMerchant: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: spacing[2],
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: 2,
  },
  categoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: "rgba(128,128,128,0.12)",
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardDate: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: 4,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: "700",
  },
  duplicateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EF444415",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  duplicateBadgeText: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "700",
  },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  bottomTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomTotalLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  bottomTotalValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  batchSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[4],
    height: 46,
    borderRadius: radius.lg,
  },
  batchSaveBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  editSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing[3],
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing[3],
    marginBottom: 4,
  },
  fieldInput: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    fontSize: 14,
  },
  pillsScroll: {
    flexDirection: "row",
    paddingVertical: 4,
    gap: spacing[2],
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing[2],
  },
  catPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sheetActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[4],
  },
  deleteBtn: {
    width: 48,
    height: 50,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
