import { Feather } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
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
import { useFinance, type TransactionType } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { fontSize, fontWeight, radius, spacing } from "@/constants/tokens";
import { PremiumLoader } from "@/components/ui";
import { money } from "@/utils/format";
import { CategoryVisual } from "@/components/ui/CategoryVisual";
import { haptics } from "@/utils/haptics";
import {
  VoiceState,
  startSpeechRecognition,
  stopSpeechRecognition,
  cancelSpeechRecognition,
  ContinuousVoiceSession,
} from "@/services/voice";
import {
  VoiceTransactionCandidate,
  parseVoiceTranscript,
} from "@/services/voiceTransactionParser";

type VoiceLoggingModalProps = {
  visible: boolean;
  onClose: () => void;
};

const SAMPLE_PROMPTS = [
  "Spent 450 on Swiggy and 200 on Uber",
  "Transfer 2000 from HDFC to savings",
];

export function VoiceLoggingModal({
  visible,
  onClose,
}: VoiceLoggingModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accounts, categories, transactions, settings, addTransactionsBatch } =
    useFinance();

  const [state, setState] = useState<VoiceState>("IDLE");
  const [transcript, setTranscript] = useState("");
  const [candidates, setCandidates] = useState<VoiceTransactionCandidate[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isQuery, setIsQuery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Persistent continuous voice session manager
  const sessionRef = useRef<ContinuousVoiceSession>(
    new ContinuousVoiceSession(),
  );

  // Editing candidate state
  const [editingCandidate, setEditingCandidate] =
    useState<VoiceTransactionCandidate | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMerchant, setEditMerchant] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAccount, setEditAccount] = useState("");
  const [editType, setEditType] = useState<TransactionType>("EXPENSE");

  // Pulse & Waveform animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveHeights = useRef([
    new Animated.Value(12),
    new Animated.Value(24),
    new Animated.Value(36),
    new Animated.Value(48),
    new Animated.Value(36),
    new Animated.Value(24),
    new Animated.Value(12),
  ]).current;

  // Animate pulse while listening
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (state === "LISTENING") {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
        ]),
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      animLoop?.stop();
    };
  }, [state, pulseAnim]);

  // Clean up when modal opens / closes
  useEffect(() => {
    if (visible) {
      setState("IDLE");
      setTranscript("");
      setCandidates([]);
      setErrorMessage("");
      setIsQuery(false);
      setIsSaving(false);
      setEditingCandidate(null);
    } else {
      void sessionRef.current.cancel();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      void sessionRef.current.cancel();
    };
  }, []);

  // Process text into candidate transactions
  const handleProcessTranscript = useCallback(
    (text: string) => {
      if (!text || text.trim().length === 0) {
        setState("ERROR");
        setErrorMessage(
          "No speech was detected. Tap the microphone and try speaking again.",
        );
        return;
      }

      setState("PROCESSING");
      void haptics.low();

      setTimeout(() => {
        const { candidates: parsedCandidates, isQuery: detectedQuery } =
          parseVoiceTranscript(text, accounts, categories, transactions);

        if (detectedQuery) {
          setIsQuery(true);
          setState("IDLE");
          return;
        }

        if (parsedCandidates.length === 0) {
          setState("ERROR");
          setErrorMessage(
            "Could not identify transactions from what you said. Try saying amounts and names clearly, e.g., 'Spent 450 on Swiggy and 200 on Uber'.",
          );
          return;
        }

        setCandidates(parsedCandidates);
        setState("RESULT");
        void haptics.success();
      }, 350);
    },
    [accounts, categories, transactions],
  );

  // Start Voice Recording (Continuous mode)
  const handleStartListening = async () => {
    void haptics.selection();
    setState("LISTENING");
    setTranscript("");
    setErrorMessage("");
    setIsQuery(false);

    const started = await sessionRef.current.start({
      onStart: () => {
        setState("LISTENING");
      },
      onVolumeChanged: (rms) => {
        // Adjust wave height animations based on RMS volume
        const normalized = Math.min(Math.max((rms + 2) * 5, 10), 65);
        waveHeights.forEach((anim, i) => {
          const factor = 1 - Math.abs(3 - i) * 0.15;
          Animated.timing(anim, {
            toValue: normalized * factor,
            duration: 100,
            useNativeDriver: false,
          }).start();
        });
      },
      onTranscriptChange: (liveText) => {
        setTranscript(liveText);
      },
      onError: (err) => {
        // If session is still active (recovering from pause or auto-restarting), do not switch to ERROR state
        if (sessionRef.current.isListening()) {
          return;
        }
        setState("ERROR");
        setErrorMessage(err || "Speech recognition encountered an issue.");
      },
    });

    if (!started) {
      // If start failed, error state handled via callback or fallback
    }
  };

  // Stop / Finish Speaking: ONLY invoked when user taps [ Done ]
  const handleStopListening = async () => {
    void haptics.selection();
    setState("PROCESSING");
    const completeTranscript = await sessionRef.current.finish();
    setTranscript(completeTranscript);

    if (completeTranscript && completeTranscript.trim().length > 0) {
      handleProcessTranscript(completeTranscript);
    } else {
      setState("ERROR");
      setErrorMessage(
        "No clear speech detected. Please speak louder or closer to the microphone.",
      );
    }
  };

  // Cancel Voice Recording
  const handleCancelListening = async () => {
    void haptics.low();
    await sessionRef.current.cancel();
    setState("IDLE");
    setTranscript("");
  };

  // Sample prompt tap
  const handleSelectSample = (sample: string) => {
    void haptics.selection();
    setTranscript(sample);
    handleProcessTranscript(sample);
  };

  // Candidate selection toggle
  const toggleSelectCandidate = (id: string) => {
    void haptics.selection();
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)),
    );
  };

  // Select all / deselect all
  const areAllSelected = useMemo(
    () => candidates.length > 0 && candidates.every((c) => c.selected),
    [candidates],
  );

  const toggleSelectAll = () => {
    void haptics.selection();
    const next = !areAllSelected;
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: next })));
  };

  // Remove single candidate
  const handleRemoveCandidate = (id: string) => {
    void haptics.low();
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  // Open Edit Candidate
  const handleOpenEdit = (cand: VoiceTransactionCandidate) => {
    void haptics.selection();
    setEditingCandidate(cand);
    setEditAmount(cand.amount > 0 ? String(cand.amount) : "");
    setEditMerchant(cand.merchant);
    setEditDescription(cand.description);
    setEditCategory(cand.category);
    setEditAccount(cand.accountId || "");
    setEditType(cand.type);
  };

  // Save Edit Candidate
  const handleSaveEdit = () => {
    if (!editingCandidate) return;
    const parsedAmount = parseFloat(editAmount.replace(/,/g, "").trim());
    const validAmount =
      !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;

    void haptics.success();
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === editingCandidate.id) {
          return {
            ...c,
            amount: validAmount,
            merchant: editMerchant.trim() || c.merchant,
            description: editDescription.trim() || c.description,
            category: editCategory || c.category,
            accountId: editAccount || undefined,
            type: editType,
            requiresReview: validAmount <= 0,
            selected: validAmount > 0,
          };
        }
        return c;
      }),
    );
    setEditingCandidate(null);
  };

  // Selected totals
  const selectedCandidates = useMemo(
    () => candidates.filter((c) => c.selected && c.amount > 0),
    [candidates],
  );

  const totalSelectedAmount = useMemo(
    () => selectedCandidates.reduce((sum, c) => sum + c.amount, 0),
    [selectedCandidates],
  );

  // Commit Batch to FinanceContext
  const handleCommitTransactions = async () => {
    if (selectedCandidates.length === 0) return;
    setIsSaving(true);
    void haptics.success();

    try {
      const nowIso = new Date().toISOString();
      const payload = selectedCandidates.map((c) => {
        const foundCategory = categories.find(
          (cat) => cat.name.toLowerCase() === c.category.toLowerCase(),
        );
        return {
          type: c.type,
          amount: c.amount,
          description: c.description || `${c.merchant} expense`,
          category: c.category,
          categoryId: foundCategory?.id,
          accountId: c.accountId || accounts[0]?.id,
          fromAccountId: c.fromAccountId,
          toAccountId: c.toAccountId,
          date: c.date,
          time: c.time,
        };
      });

      await addTransactionsBatch(payload);
      setIsSaving(false);
      onClose();
    } catch {
      setIsSaving(false);
      setState("ERROR");
      setErrorMessage("Failed to save transactions. Please try again.");
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={[
                  styles.headerIconWrap,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Feather name="mic" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.fg }]}>
                  Voice Logging
                </Text>
                <Text style={[styles.headerSub, { color: colors.fgMuted }]}>
                  Speak natural multi-item expenses
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surfaceRecessed },
              ]}
              hitSlop={8}
              accessibilityLabel="Close"
            >
              <Feather name="x" size={18} color={colors.fgMuted} />
            </Pressable>
          </View>

          {/* STATE 1: IDLE */}
          {state === "IDLE" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.idleContainer}
            >
              {isQuery && (
                <View
                  style={[
                    styles.queryWarningCard,
                    {
                      backgroundColor: `${colors.warning || "#F59E0B"}15`,
                      borderColor: `${colors.warning || "#F59E0B"}30`,
                    },
                  ]}
                >
                  <Feather
                    name="help-circle"
                    size={18}
                    color={colors.warning || "#F59E0B"}
                  />
                  <Text style={[styles.queryWarningText, { color: colors.fg }]}>
                    That sounded like a question! Voice Logging is for recording
                    transactions. To log spending, say things like:
                  </Text>
                </View>
              )}

              {/* Big Mic Button */}
              <View style={styles.micCenterArea}>
                <Pressable
                  onPress={handleStartListening}
                  style={[
                    styles.bigMicBtn,
                    {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                    },
                  ]}
                  accessibilityLabel="Tap to speak"
                >
                  <Feather name="mic" size={38} color={colors.onPrimary} />
                </Pressable>
                <Text style={[styles.tapToSpeakText, { color: colors.fg }]}>
                  Tap to Speak
                </Text>
                <Text style={[styles.micHintText, { color: colors.fgMuted }]}>
                  You can speak one or multiple expenses in a single breath
                </Text>
              </View>

              {/* Sample Prompts */}
              <View style={styles.samplesSection}>
                <Text
                  style={[
                    styles.samplesHeaderTitle,
                    { color: colors.fgSubtle },
                  ]}
                >
                  OR TRY A SAMPLE PHRASE
                </Text>
                <View style={{ gap: spacing[2] }}>
                  {SAMPLE_PROMPTS.map((sample) => (
                    <Pressable
                      key={sample}
                      onPress={() => handleSelectSample(sample)}
                      style={[
                        styles.sampleChip,
                        {
                          backgroundColor: colors.canvas,
                          borderColor: colors.divider,
                        },
                      ]}
                    >
                      <Feather
                        name="corner-down-right"
                        size={13}
                        color={colors.primary}
                        style={{ marginTop: 2 }}
                      />
                      <Text
                        style={[styles.sampleChipText, { color: colors.fg }]}
                        numberOfLines={2}
                      >
                        &ldquo;{sample}&rdquo;
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}

          {/* STATE 2: LISTENING */}
          {state === "LISTENING" && (
            <View style={styles.listeningContainer}>
              {/* Status pill */}
              <View
                style={[
                  styles.listeningBadge,
                  { backgroundColor: `${colors.error || "#EF4444"}18` },
                ]}
              >
                <View
                  style={[
                    styles.pulsingDot,
                    { backgroundColor: colors.error || "#EF4444" },
                  ]}
                />
                <Text
                  style={[
                    styles.listeningBadgeText,
                    { color: colors.error || "#EF4444" },
                  ]}
                >
                  Listening...
                </Text>
              </View>

              {/* Pulsing Mic with Animated Waveform */}
              <View style={styles.waveformContainer}>
                <Animated.View
                  style={[
                    styles.pulsingMicWrapper,
                    {
                      transform: [{ scale: pulseAnim }],
                      backgroundColor: `${colors.primary}20`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.listeningInnerMic,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Feather name="mic" size={32} color={colors.onPrimary} />
                  </View>
                </Animated.View>

                {/* Vertical audio wave bars */}
                <View style={styles.waveBarsRow}>
                  {waveHeights.map((hAnim, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: hAnim,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Streaming Transcript Preview */}
              <View
                style={[
                  styles.liveTranscriptCard,
                  {
                    backgroundColor: colors.canvas,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.liveTranscriptText,
                    {
                      color: transcript ? colors.fg : colors.fgSubtle,
                    },
                  ]}
                  numberOfLines={4}
                >
                  {transcript || "Listening to your voice..."}
                </Text>
              </View>

              {/* Control Action Buttons */}
              <View style={styles.listeningActionsRow}>
                <Pressable
                  onPress={handleCancelListening}
                  style={[
                    styles.listeningActionBtn,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel recording"
                >
                  <Feather name="x" size={18} color={colors.fgMuted} />
                  <Text
                    style={[
                      styles.listeningActionText,
                      { color: colors.fgMuted },
                    ]}
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleStopListening}
                  style={[
                    styles.listeningActionBtn,
                    styles.doneActionBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Done recording"
                >
                  <Feather name="check" size={20} color={colors.onPrimary} />
                  <Text
                    style={[
                      styles.listeningActionText,
                      styles.doneActionText,
                      { color: colors.onPrimary },
                    ]}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STATE 3: PROCESSING */}
          {state === "PROCESSING" && (
            <View style={styles.processingContainer}>
              <PremiumLoader size="large" color={colors.primary} />
              <Text style={[styles.processingTitle, { color: colors.fg }]}>
                Understanding transactions...
              </Text>
              <Text style={[styles.processingSub, { color: colors.fgMuted }]}>
                Extracting amounts, merchants & categories
              </Text>
            </View>
          )}

          {/* STATE 4: RESULT CANDIDATES REVIEW */}
          {state === "RESULT" && (
            <View style={{ flex: 1 }}>
              {/* Review Summary Bar */}
              <View style={styles.resultSummaryBar}>
                <View>
                  <Text style={[styles.resultCountText, { color: colors.fg }]}>
                    {candidates.length} transaction
                    {candidates.length === 1 ? "" : "s"} detected
                  </Text>
                  <Text
                    style={[styles.resultTotalText, { color: colors.fgMuted }]}
                  >
                    Selected: {money(totalSelectedAmount, settings.currency)}
                  </Text>
                </View>

                <Pressable
                  onPress={toggleSelectAll}
                  style={[
                    styles.selectAllBtn,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                >
                  <Text
                    style={[styles.selectAllBtnText, { color: colors.primary }]}
                  >
                    {areAllSelected ? "Deselect All" : "Select All"}
                  </Text>
                </Pressable>
              </View>

              {/* Candidates List */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.candidatesScrollView}
                contentContainerStyle={{
                  gap: spacing[3],
                  paddingBottom: spacing[4],
                }}
              >
                {candidates.map((cand) => {
                  return (
                    <View
                      key={cand.id}
                      style={[
                        styles.candidateCard,
                        {
                          backgroundColor: colors.canvas,
                          borderColor: cand.selected
                            ? `${colors.primary}60`
                            : colors.divider,
                        },
                      ]}
                    >
                      {/* Top Row: Select Checkbox, Category, Merchant, Amount */}
                      <View style={styles.candTopRow}>
                        <Pressable
                          onPress={() => toggleSelectCandidate(cand.id)}
                          style={[
                            styles.checkboxCircle,
                            {
                              backgroundColor: cand.selected
                                ? colors.primary
                                : colors.surfaceRecessed,
                              borderColor: cand.selected
                                ? colors.primary
                                : colors.border,
                            },
                          ]}
                          hitSlop={8}
                        >
                          {cand.selected && (
                            <Feather name="check" size={13} color="#FFFFFF" />
                          )}
                        </Pressable>

                        <CategoryVisual
                          categoryName={cand.category}
                          size="small"
                        />

                        <View style={{ flex: 1, marginLeft: 2 }}>
                          <Text
                            style={[styles.candMerchant, { color: colors.fg }]}
                            numberOfLines={1}
                          >
                            {cand.merchant}
                          </Text>
                          <Text
                            style={[
                              styles.candDescription,
                              { color: colors.fgMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {cand.description}
                          </Text>
                        </View>

                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={[
                              styles.candAmount,
                              {
                                color:
                                  cand.amount > 0
                                    ? cand.type === "INCOME"
                                      ? colors.success || "#10B981"
                                      : colors.fg
                                    : colors.error || "#EF4444",
                              },
                            ]}
                          >
                            {cand.amount > 0
                              ? money(cand.amount, settings.currency)
                              : "Amount Required"}
                          </Text>
                          <View
                            style={[
                              styles.candTypeBadge,
                              {
                                backgroundColor:
                                  cand.type === "INCOME"
                                    ? `${colors.success || "#10B981"}20`
                                    : cand.type === "TRANSFER"
                                      ? `${colors.primary}20`
                                      : `${colors.surfaceRecessed}`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.candTypeBadgeText,
                                {
                                  color:
                                    cand.type === "INCOME"
                                      ? colors.success || "#10B981"
                                      : cand.type === "TRANSFER"
                                        ? colors.primary
                                        : colors.fgMuted,
                                },
                              ]}
                            >
                              {cand.type}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Chips Row: Category, Date, Method */}
                      <View style={styles.candChipsRow}>
                        <View
                          style={[
                            styles.metaChip,
                            { backgroundColor: colors.surfaceRecessed },
                          ]}
                        >
                          <Feather
                            name="tag"
                            size={10}
                            color={colors.fgMuted}
                          />
                          <Text
                            style={[
                              styles.metaChipText,
                              { color: colors.fgMuted },
                            ]}
                          >
                            {cand.category}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.metaChip,
                            { backgroundColor: colors.surfaceRecessed },
                          ]}
                        >
                          <Feather
                            name="calendar"
                            size={10}
                            color={colors.fgMuted}
                          />
                          <Text
                            style={[
                              styles.metaChipText,
                              { color: colors.fgMuted },
                            ]}
                          >
                            {cand.date}
                          </Text>
                        </View>

                        {cand.paymentMethod && (
                          <View
                            style={[
                              styles.metaChip,
                              { backgroundColor: colors.surfaceRecessed },
                            ]}
                          >
                            <Feather
                              name="credit-card"
                              size={10}
                              color={colors.fgMuted}
                            />
                            <Text
                              style={[
                                styles.metaChipText,
                                { color: colors.fgMuted },
                              ]}
                            >
                              {cand.paymentMethod}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Warnings / Duplicate Banner */}
                      {cand.isPossibleDuplicate && (
                        <View
                          style={[
                            styles.warningBanner,
                            {
                              backgroundColor: `${colors.warning || "#F59E0B"}15`,
                            },
                          ]}
                        >
                          <Feather
                            name="alert-triangle"
                            size={12}
                            color={colors.warning || "#F59E0B"}
                          />
                          <Text
                            style={[
                              styles.warningBannerText,
                              { color: colors.warning || "#F59E0B" },
                            ]}
                          >
                            {cand.duplicateReason ||
                              "Possible duplicate transaction"}
                          </Text>
                        </View>
                      )}

                      {cand.requiresReview && !cand.isPossibleDuplicate && (
                        <View
                          style={[
                            styles.warningBanner,
                            {
                              backgroundColor: `${colors.error || "#EF4444"}15`,
                            },
                          ]}
                        >
                          <Feather
                            name="info"
                            size={12}
                            color={colors.error || "#EF4444"}
                          />
                          <Text
                            style={[
                              styles.warningBannerText,
                              { color: colors.error || "#EF4444" },
                            ]}
                          >
                            {cand.reviewReason ||
                              "Review required before saving"}
                          </Text>
                        </View>
                      )}

                      {/* Candidate Footer Actions */}
                      <View style={styles.candFooterRow}>
                        <Pressable
                          onPress={() => handleOpenEdit(cand)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                          hitSlop={6}
                        >
                          <Feather
                            name="edit-2"
                            size={13}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.candFooterActionText,
                              { color: colors.primary },
                            ]}
                          >
                            Edit Details
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => handleRemoveCandidate(cand.id)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                          hitSlop={6}
                        >
                          <Feather
                            name="trash-2"
                            size={13}
                            color={colors.fgSubtle}
                          />
                          <Text
                            style={[
                              styles.candFooterActionText,
                              { color: colors.fgSubtle },
                            ]}
                          >
                            Remove
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Bottom Sticky Action Footer */}
              <View
                style={[
                  styles.resultBottomBar,
                  { borderTopColor: colors.divider },
                ]}
              >
                <Pressable
                  onPress={handleCommitTransactions}
                  disabled={selectedCandidates.length === 0 || isSaving}
                  style={[
                    styles.primarySaveBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity:
                        selectedCandidates.length === 0 || isSaving ? 0.5 : 1,
                    },
                  ]}
                >
                  {isSaving ? (
                    <PremiumLoader size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.primarySaveBtnText}>
                        Save {selectedCandidates.length} Transaction
                        {selectedCandidates.length === 1 ? "" : "s"} (
                        {money(totalSelectedAmount, settings.currency)})
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => setState("IDLE")}
                  style={styles.speakAgainBtn}
                >
                  <Feather name="rotate-ccw" size={13} color={colors.fgMuted} />
                  <Text
                    style={[
                      styles.speakAgainBtnText,
                      { color: colors.fgMuted },
                    ]}
                  >
                    Speak Again
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STATE 5: ERROR */}
          {state === "ERROR" && (
            <View style={styles.errorContainer}>
              <View
                style={[
                  styles.errorIconWrap,
                  { backgroundColor: `${colors.error || "#EF4444"}18` },
                ]}
              >
                <Feather
                  name="alert-circle"
                  size={32}
                  color={colors.error || "#EF4444"}
                />
              </View>
              <Text style={[styles.errorTitle, { color: colors.fg }]}>
                Couldn&apos;t Understand Voice
              </Text>
              <Text style={[styles.errorSub, { color: colors.fgMuted }]}>
                {errorMessage}
              </Text>

              <Pressable
                onPress={handleStartListening}
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              >
                <Feather name="mic" size={16} color={colors.onPrimary} />
                <Text style={styles.retryBtnText}>Try Speaking Again</Text>
              </Pressable>

              <Pressable
                onPress={() => setState("IDLE")}
                style={{ marginTop: 8 }}
              >
                <Text
                  style={[styles.backToStartText, { color: colors.fgSubtle }]}
                >
                  Back to Samples
                </Text>
              </Pressable>
            </View>
          )}

          {/* INLINE EDIT MODAL */}
          {editingCandidate && (
            <Modal
              visible={!!editingCandidate}
              transparent
              animationType="fade"
              onRequestClose={() => setEditingCandidate(null)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.editBackdrop}
              >
                <View
                  style={[
                    styles.editCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.editHeaderRow}>
                    <Text style={[styles.editTitle, { color: colors.fg }]}>
                      Edit Transaction
                    </Text>
                    <Pressable
                      onPress={() => setEditingCandidate(null)}
                      hitSlop={8}
                    >
                      <Feather name="x" size={18} color={colors.fgMuted} />
                    </Pressable>
                  </View>

                  {/* Type Selector */}
                  <View style={styles.editTypeRow}>
                    {(
                      ["EXPENSE", "INCOME", "TRANSFER"] as TransactionType[]
                    ).map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => {
                          void haptics.selection();
                          setEditType(t);
                        }}
                        style={[
                          styles.editTypeBtn,
                          {
                            backgroundColor:
                              editType === t
                                ? colors.primary
                                : colors.surfaceRecessed,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.editTypeBtnText,
                            {
                              color:
                                editType === t ? "#FFFFFF" : colors.fgMuted,
                              fontWeight:
                                editType === t
                                  ? fontWeight.bold
                                  : fontWeight.medium,
                            },
                          ]}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Amount Input */}
                  <View style={styles.editField}>
                    <Text style={[styles.editLabel, { color: colors.fgMuted }]}>
                      Amount ({settings.currency})
                    </Text>
                    <TextInput
                      value={editAmount}
                      onChangeText={setEditAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={colors.fgSubtle}
                      style={[
                        styles.editInput,
                        {
                          color: colors.fg,
                          backgroundColor: colors.canvas,
                          borderColor: colors.border,
                        },
                      ]}
                      autoFocus
                    />
                  </View>

                  {/* Merchant Input */}
                  <View style={styles.editField}>
                    <Text style={[styles.editLabel, { color: colors.fgMuted }]}>
                      Payee / Merchant
                    </Text>
                    <TextInput
                      value={editMerchant}
                      onChangeText={setEditMerchant}
                      placeholder="Swiggy, Uber, Amazon..."
                      placeholderTextColor={colors.fgSubtle}
                      style={[
                        styles.editInput,
                        {
                          color: colors.fg,
                          backgroundColor: colors.canvas,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                  </View>

                  {/* Description Input */}
                  <View style={styles.editField}>
                    <Text style={[styles.editLabel, { color: colors.fgMuted }]}>
                      Description
                    </Text>
                    <TextInput
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="Concise note..."
                      placeholderTextColor={colors.fgSubtle}
                      style={[
                        styles.editInput,
                        {
                          color: colors.fg,
                          backgroundColor: colors.canvas,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                  </View>

                  {/* Category Selector Quick Chips */}
                  <View style={styles.editField}>
                    <Text style={[styles.editLabel, { color: colors.fgMuted }]}>
                      Category
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
                    >
                      {categories.map((cat) => {
                        const isSelected = editCategory === cat.name;
                        return (
                          <Pressable
                            key={cat.id}
                            onPress={() => {
                              void haptics.selection();
                              setEditCategory(cat.name);
                            }}
                            style={[
                              styles.catChoiceChip,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : colors.surfaceRecessed,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: isSelected ? "#FFFFFF" : colors.fg,
                                fontSize: fontSize.xs,
                                fontWeight: isSelected
                                  ? fontWeight.bold
                                  : fontWeight.medium,
                              }}
                            >
                              {cat.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Save Button */}
                  <Pressable
                    onPress={handleSaveEdit}
                    style={[
                      styles.saveEditBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.saveEditBtnText}>Apply Changes</Text>
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "90%",
    minHeight: 460,
    paddingTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150,150,150,0.2)",
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  headerSub: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // IDLE State
  idleContainer: {
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  queryWarningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing[4],
    width: "100%",
  },
  queryWarningText: {
    fontSize: fontSize.xs,
    flex: 1,
    lineHeight: 16,
  },
  micCenterArea: {
    alignItems: "center",
    paddingVertical: spacing[4],
  },
  bigMicBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  tapToSpeakText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing[3],
  },
  micHintText: {
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: spacing[6],
  },
  samplesSection: {
    width: "100%",
    marginTop: spacing[4],
  },
  samplesHeaderTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: spacing[2],
  },
  sampleChip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  sampleChipText: {
    fontSize: fontSize.xs,
    flex: 1,
    lineHeight: 17,
  },

  // LISTENING State
  listeningContainer: {
    alignItems: "center",
    paddingVertical: spacing[4],
  },
  listeningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radius.full,
    marginBottom: spacing[4],
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listeningBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  waveformContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
  },
  pulsingMicWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  listeningInnerMic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  waveBarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 50,
    marginTop: spacing[3],
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  liveTranscriptCard: {
    width: "100%",
    minHeight: 70,
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing[4],
    justifyContent: "center",
  },
  liveTranscriptText: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
  },
  listeningActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    width: "100%",
    marginTop: spacing[4],
  },
  listeningActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    minHeight: 48,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
  },
  listeningActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  doneActionBtn: {
    flex: 1.6,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  doneActionText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },

  // PROCESSING State
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[8],
    gap: spacing[2],
  },
  processingTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginTop: spacing[3],
  },
  processingSub: {
    fontSize: fontSize.xs,
  },

  // RESULT State
  resultSummaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  resultCountText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  resultTotalText: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  selectAllBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  selectAllBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  candidatesScrollView: {
    flex: 1,
  },
  candidateCard: {
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1.5,
    gap: spacing[2],
  },
  candTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  candMerchant: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  candDescription: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  candAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  candTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  candTypeBadgeText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  candChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  warningBannerText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  candFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150,150,150,0.15)",
  },
  candFooterActionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  resultBottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing[3],
    gap: spacing[2],
  },
  primarySaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  primarySaveBtnText: {
    color: "#FFFFFF",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  speakAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  speakAgainBtnText: {
    fontSize: fontSize.xs,
  },

  // ERROR State
  errorContainer: {
    alignItems: "center",
    paddingVertical: spacing[6],
    gap: spacing[2],
  },
  errorIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginTop: spacing[2],
  },
  errorSub: {
    fontSize: fontSize.xs,
    textAlign: "center",
    paddingHorizontal: spacing[4],
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    marginTop: spacing[3],
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  backToStartText: {
    fontSize: fontSize.xs,
  },

  // Inline Edit
  editBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: spacing[4],
  },
  editCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    gap: spacing[3],
  },
  editHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  editTypeRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  editTypeBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radius.sm,
    alignItems: "center",
  },
  editTypeBtnText: {
    fontSize: fontSize.xs,
  },
  editField: {
    gap: 4,
  },
  editLabel: {
    fontSize: fontSize.xs,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSize.sm,
  },
  catChoiceChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  saveEditBtn: {
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing[1],
  },
  saveEditBtnText: {
    color: "#FFFFFF",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
