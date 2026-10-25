import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  ActivityIndicator,
  LayoutAnimation,
  Image,
  TextInput,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Rect } from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import { useFinance } from "@/context/FinanceContext";
import { radius, spacing, fontSize, fontWeight } from "@/constants/tokens";
import { haptics } from "@/utils/haptics";
import { PremiumLoader } from "@/components/ui";
import { AiScreenSkeleton } from "@/components/skeletons";

// 4-Point Curved Diamond Sparkle Star (Mockup Zeno AI brand mark)
function SparkleAIIcon({
  size = 18,
  color = "#10B981",
  style,
}: {
  size?: number;
  color?: string;
  style?: any;
}) {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z"
          fill={color}
        />
        <Path
          d="M19 1.5C19 3.5 20.5 5 22.5 5C20.5 5 19 6.5 19 8.5C19 6.5 17.5 5 15.5 5C17.5 5 19 3.5 19 1.5Z"
          fill={color}
          opacity={0.85}
        />
      </Svg>
    </View>
  );
}

// Spending Insights: 3 analytical rounded pillars
function SpendingInsightsIcon({
  size = 20,
  color = "#10B981",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="11"
        width="4.5"
        height="10"
        rx="2.25"
        fill={color}
        fillOpacity={0.65}
      />
      <Rect x="9.75" y="5" width="4.5" height="16" rx="2.25" fill={color} />
      <Rect
        x="16.5"
        y="8"
        width="4.5"
        height="13"
        rx="2.25"
        fill={color}
        fillOpacity={0.85}
      />
    </Svg>
  );
}

// Can I Afford This: Curved fintech shopping bag with handles
function AffordabilityIcon({
  size = 20,
  color = "#F97316",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8.5C6 7.67157 6.67157 7 7.5 7H16.5C17.3284 7 18 7.67157 18 8.5L19 19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19L6 8.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 7V5.5C9 3.84315 10.3431 2.5 12 2.5C13.6569 2.5 15 3.84315 15 5.5V7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M10 14L11.5 15.5L14.5 12.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Saving Tips: Modern piggy bank vault with coin
function SavingTipsIcon({
  size = 20,
  color = "#8B5CF6",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 13C19 16.3137 16.0899 19 12.5 19C11.6667 19 11 19.5 10 20C9.5 20.25 8.5 20.5 8 20L8 18.2C5.5 17 4 14.8 4 12.5C4 8.91015 7.80558 6 12.5 6C17.1944 6 19 8.91015 19 13Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 2V5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path
        d="M20 12.5C21 12.5 21.5 13 21.5 13.5C21.5 14 21 14.5 20 14.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M7 6L8.5 8.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Rect x="11.5" y="11" width="2" height="2" rx="1" fill={color} />
    </Svg>
  );
}

import {
  AIMessage,
  AIMascotState,
  AIStructuredResponse,
} from "@/services/ai/aiTypes";
import { computeFinancialAggregates } from "@/services/ai/financialDataAggregator";
import {
  checkFinanceScope,
  processLocalZenoQuery,
} from "@/services/ai/localZenoEngine";

import { ZenoAgentMascot } from "@/components/ai/ZenoAgentMascot";
import { Image as ExpoImage } from "expo-image";
import { Asset } from "expo-asset";
import { MASCOT_MAP } from "@/components/MascotGuide";
import { preloadMascots } from "@/utils/mascotPreloader";

const ZENO_AI_HERO_MASCOT = require("@/assets/images/Zeno-Mascot/Hello.webp");
import {
  AIResponseCardRenderer,
  FollowUpChips,
} from "@/components/ai/AIStructuredCards";
import { AITransactionListData } from "@/services/ai/aiTypes";
import { AIChatInput } from "@/components/ai/AIChatInput";
import { QuickAddModal } from "@/components/QuickAddModal";
import { Transaction } from "@/context/FinanceContext";

const BUDGET_STORAGE_KEY = "@pocketflow/monthly_budget";
const CATEGORY_BUDGETS_KEY = "@pocketflow/category_budgets";
const CONTENT_PADDING = 20;

// Suggestion Categories for new layouts
interface SuggestionCategory {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  questions: Array<{ label: string; query: string; subtitle?: string }>;
}

const SUGGESTION_CATEGORIES: SuggestionCategory[] = [
  {
    id: "featured",
    label: "Featured",
    icon: "star",
    questions: [
      {
        label: "How much did I spend this month?",
        query: "How much did I spend this month?",
        subtitle: "Monthly stat overview",
      },
      {
        label: "Where is my money going?",
        query: "Where is my money going?",
        subtitle: "Category breakdown card",
      },
      {
        label: "Compare with last month",
        query: "Compare with last month",
        subtitle: "Month-over-month card",
      },
      {
        label: "How healthy is my budget?",
        query: "How healthy is my budget?",
        subtitle: "Pacing & limits card",
      },
    ],
  },
  {
    id: "budget",
    label: "Budget & Health",
    icon: "shield",
    questions: [
      {
        label: "How healthy is my budget?",
        query: "How healthy is my budget?",
        subtitle: "Budget health & pace card",
      },
      {
        label: "How much can I spend today?",
        query: "How much can I spend today based on my remaining budget?",
        subtitle: "Daily safe limit card",
      },
      {
        label: "Projected month-end spending",
        query:
          "If I continue spending like this, how much will I spend by month-end?",
        subtitle: "Burn rate projection card",
      },
      {
        label: "How much should I limit daily spend?",
        query:
          "How much should I limit my daily spending to stay within budget?",
        subtitle: "Budget cap calculator",
      },
    ],
  },
  {
    id: "categories",
    label: "Categories & Habits",
    icon: "pie-chart",
    questions: [
      {
        label: "Spending by Category",
        query: "Where did I spend the most?",
        subtitle: "Category breakdown card",
      },
      {
        label: "Weekend vs Weekday spending",
        query: "How much did I spend on weekends compared with weekdays?",
        subtitle: "Comparison split card",
      },
      {
        label: "Biggest opportunity for savings",
        query: "Which category has the biggest opportunity for savings?",
        subtitle: "Discretionary cuts card",
      },
      {
        label: "What is my average daily spend?",
        query: "What is my average daily spending this month?",
        subtitle: "Daily pace metric",
      },
    ],
  },
  {
    id: "accounts",
    label: "Balances & Net Worth",
    icon: "credit-card",
    questions: [
      {
        label: "Account balances & net worth",
        query: "What is my total account balance?",
        subtitle: "Cobalt glass hero card",
      },
      {
        label: "Transfers between accounts",
        query: "How much money did I transfer between my accounts?",
        subtitle: "Transfer activity card",
      },
      {
        label: "Show recent transactions",
        query: "Show my recent transactions",
        subtitle: "Transaction ledger card",
      },
      {
        label: "Show biggest expenses",
        query: "Show my biggest expenses",
        subtitle: "Top expenses list",
      },
    ],
  },
  {
    id: "planning",
    label: "Calculators",
    icon: "target",
    questions: [
      {
        label: "Save ₹3,000/mo annual growth",
        query: "If I save ₹3,000 every month, how much will I save in a year?",
        subtitle: "Annual savings calculator",
      },
      {
        label: "Can I afford ₹5,000?",
        query: "Can I afford ₹5,000?",
        subtitle: "Affordability audit card",
      },
      {
        label: "Can I afford ₹15,000?",
        query: "Can I afford ₹15,000?",
        subtitle: "Purchase stress test",
      },
      {
        label: "Net cash flow this month",
        query: "What is my net cash flow?",
        subtitle: "Income vs expense stat",
      },
    ],
  },
];

const ALL_SUGGESTED_QUERIES = SUGGESTION_CATEGORIES.flatMap((c) =>
  c.questions.map((q) => q.query),
);

// ── Markdown and Highlight Parser Component ──
function parseMarkdownTokens(text: string): Array<{
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}> {
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const segments = text.split(regex);
  const result: Array<{
    text: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
  }> = [];

  for (const seg of segments) {
    if (!seg) continue;
    if (seg.startsWith("**") && seg.endsWith("**") && seg.length >= 4) {
      result.push({ text: seg.slice(2, -2), bold: true });
    } else if (seg.startsWith("*") && seg.endsWith("*") && seg.length >= 2) {
      result.push({ text: seg.slice(1, -1), italic: true });
    } else if (seg.startsWith("`") && seg.endsWith("`") && seg.length >= 2) {
      result.push({ text: seg.slice(1, -1), code: true });
    } else {
      // Normalize double dashes
      const cleanSeg = seg.replace(/\s*--\s*/g, " — ");
      result.push({ text: cleanSeg });
    }
  }

  return result;
}

function FormattedMessageText({
  text,
  textColor,
  style,
}: {
  text: string;
  textColor: string;
  style?: any;
}) {
  const colors = useColors();
  const lines = text.split("\n");

  return (
    <View style={styles.formattedTextContainer}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={lineIdx} style={{ height: 6 }} />;
        }

        const isBullet = /^(\u2022|\-|\*|\-\-)\s+/.test(trimmed);
        const content = isBullet
          ? trimmed.replace(/^(\u2022|\-|\*|\-\-)\s+/, "")
          : trimmed;

        const parts = parseMarkdownTokens(content);

        if (isBullet) {
          return (
            <View key={lineIdx} style={styles.bulletRow}>
              <View
                style={[styles.bulletDot, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.bulletText, { color: textColor }, style]}>
                {parts.map((p, pIdx) => (
                  <Text
                    key={pIdx}
                    style={[
                      p.bold && {
                        fontWeight: fontWeight.bold,
                        color: colors.primary || textColor,
                      },
                      p.italic && { fontStyle: "italic" },
                      p.code && {
                        fontFamily:
                          Platform.OS === "ios" ? "Menlo" : "monospace",
                        backgroundColor: colors.surfaceRecessed,
                      },
                    ]}
                  >
                    {p.text}
                  </Text>
                ))}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={lineIdx}
            style={[styles.zenoMessageText, { color: textColor }, style]}
          >
            {parts.map((p, pIdx) => (
              <Text
                key={pIdx}
                style={[
                  p.bold && {
                    fontWeight: fontWeight.bold,
                    color: colors.primary || textColor,
                  },
                  p.italic && { fontStyle: "italic" },
                  p.code && {
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    backgroundColor: colors.surfaceRecessed,
                  },
                ]}
              >
                {p.text}
              </Text>
            ))}
          </Text>
        );
      })}
    </View>
  );
}

export default function AIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.isDark;
  const {
    loading,
    transactions,
    categories,
    accounts,
    settings,
    setVoiceLoggingVisible,
  } = useFinance();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [mascotState, setMascotState] = useState<AIMascotState>("IDLE");
  const [isThinking, setIsThinking] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("featured");
  const [inputText, setInputText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const bottomInputRef = useRef<TextInput>(null);

  // Mascot idle floating and breathing animation
  const mascotFloatAnim = useRef(new Animated.Value(0)).current;
  const mascotBreatheAnim = useRef(new Animated.Value(1)).current;

  // Preload mascot assets for instant rendering and zero layout shift
  useEffect(() => {
    void preloadMascots(["welcome", "thinking", "okay", "sad", "no-money", "idle", "hii"]);
    try {
      const asset = Asset.fromModule(ZENO_AI_HERO_MASCOT);
      void asset.downloadAsync().then(() => {
        if (asset.localUri || asset.uri) {
          void ExpoImage.prefetch(asset.localUri || asset.uri, "memory-disk");
        }
      });
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloatAnim, {
          toValue: -9,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(mascotFloatAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );

    const breatheAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotBreatheAnim, {
          toValue: 1.035,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(mascotBreatheAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );

    floatAnim.start();
    breatheAnim.start();

    return () => {
      floatAnim.stop();
      breatheAnim.stop();
    };
  }, [mascotFloatAnim, mascotBreatheAnim]);

  const userName = useMemo(() => {
    const raw = settings?.profileName?.trim() || "";
    if (!raw) return "there";
    return raw.split(" ")[0] || "there";
  }, [settings?.profileName]);

  // Monitor keyboard visibility for precise bottom composer positioning above tab bar
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 120);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Load monthly budget from storage with multi-level fallbacks
  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(BUDGET_STORAGE_KEY);
        if (stored) {
          const val = parseFloat(stored);
          if (!isNaN(val) && val > 0) {
            setMonthlyBudget(val);
            return;
          }
        }

        // Fallback 1: Sum of category budgets
        const catStored = await AsyncStorage.getItem(CATEGORY_BUDGETS_KEY);
        if (catStored) {
          try {
            const parsed = JSON.parse(catStored);
            const sum = Object.values(parsed).reduce(
              (acc: number, v: any) => acc + (Number(v) || 0),
              0,
            );
            if (sum > 0) {
              setMonthlyBudget(sum);
              return;
            }
          } catch {}
        }

        // Fallback 2: Legacy storage key
        const legacyStored = await AsyncStorage.getItem("@pocketflow/budget");
        if (legacyStored) {
          const val = parseFloat(legacyStored);
          if (!isNaN(val) && val > 0) {
            setMonthlyBudget(val);
          }
        }
      } catch (err) {
        console.warn("Failed to load budget:", err);
      }
    })();
  }, []);

  // Compute up-to-date financial aggregates
  const financialAggregates = useMemo(() => {
    return computeFinancialAggregates(
      transactions,
      categories,
      accounts,
      settings,
      monthlyBudget,
    );
  }, [transactions, categories, accounts, settings, monthlyBudget]);

  // Dynamic time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = settings?.profileName?.trim() || "";
    const greetingWord =
      hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";
    return name ? `${greetingWord}, ${name}` : greetingWord;
  }, [settings?.profileName]);

  // Primary submit function: 100% on-device local deterministic intelligence
  const handleSubmitQuery = async (
    queryText: string,
    source: "suggested" | "manual" = "manual",
  ) => {
    const trimmed = queryText.trim();
    if (!trimmed || isThinking) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Append user message immediately
    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toISOString(),
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // ==========================================
    // GATEKEEPER: FINANCE SCOPE CHECK
    // Deterministic instant redirect for non-finance topics
    // ==========================================
    const scopeCheck = checkFinanceScope(trimmed);
    if (!scopeCheck.inScope) {
      void haptics.low();
      const redirectMsg: AIMessage = {
        id: `zeno-redirect-${Date.now()}`,
        sender: "zeno",
        timestamp: new Date().toISOString(),
        text:
          scopeCheck.redirectText ||
          "I'm here to help with your personal finances! Ask me about your spending, recent transactions, budgets, or account balances.",
        structured: {
          text:
            scopeCheck.redirectText ||
            "I'm here to help with your personal finances! Ask me about your spending, recent transactions, budgets, or account balances.",
          mascotReaction: "IDLE",
          followUps: scopeCheck.suggestedFollowUps,
        },
        status: "done",
      };

      setMessages((prev) => [...prev, redirectMsg]);
      setMascotState("IDLE");
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
      return;
    }

    // ==========================================
    // 100% LOCAL FINANCIAL INTELLIGENCE ENGINE
    // Deterministic, private, instant, zero external API calls
    // ==========================================
    setIsThinking(true);
    setMascotState("THINKING");

    setTimeout(() => {
      try {
        const response: AIStructuredResponse = processLocalZenoQuery(trimmed, {
          transactions,
          categories,
          accounts,
          settings,
          aggregates: financialAggregates,
          monthlyBudget,
        });

        const agentMsg: AIMessage = {
          id: `zeno-${Date.now()}`,
          sender: "zeno",
          timestamp: new Date().toISOString(),
          text: response.text,
          structured: response,
          status: "done",
        };

        setMessages((prev) => [...prev, agentMsg]);
        setMascotState(response.mascotReaction || "SUCCESS");
        void haptics.low();
      } catch (err) {
        console.warn("Local query processing error:", err);
      } finally {
        setIsThinking(false);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    }, 180);
  };

  const handleClearChat = () => {
    void haptics.selection();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages([]);
    setMascotState("IDLE");
  };

  const hasMessages = messages.length > 0;

  if (loading) {
    return <AiScreenSkeleton />;
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: isDark ? colors.canvas : "#F4F7FB",
          paddingTop: insets.top,
        },
      ]}
    >
      {/* ── Modern Fintech Header (matches reference mockup) ─────────── */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: CONTENT_PADDING,
            borderBottomColor: isDark ? "#242E27" : "transparent",
          },
        ]}
      >
        {/* Top-left placeholder: keeps header perfectly balanced without 3-arrow menu */}
        <View style={styles.headerPlaceholderBtn} />

        <View style={styles.headerCenter}>
          <SparkleAIIcon
            size={18}
            color={isDark ? "#B7FF63" : "#10B981"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.headerCenterTitle,
              { color: isDark ? "#FFFFFF" : "#0F1E36" },
            ]}
          >
            Zeno AI
          </Text>
        </View>

        {/* Top-right: Trash/clear when in active chat, clean empty space when idle (no clock icon) */}
        {hasMessages ? (
          <Pressable
            onPress={() => {
              void haptics.selection();
              handleClearChat();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerSquircleBtn,
              {
                backgroundColor: isDark ? "#141816" : "#FFFFFF",
                borderColor: isDark ? "#242E27" : "#E5E9E4",
                boxShadow: isDark ? undefined : "0px 2px 8px rgba(0,0,0,0.03)",
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            accessibilityLabel="Clear conversation"
          >
            <Feather
              name="trash-2"
              size={18}
              color={isDark ? "#FFFFFF" : "#0F1E36"}
            />
          </Pressable>
        ) : (
          <View style={styles.headerPlaceholderBtn} />
        )}
      </View>

      {/* ── Main Chat / Empty Content ─────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        enabled={hasMessages}
        behavior={hasMessages ? (Platform.OS === "ios" ? "padding" : "height") : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollFlex}
          contentContainerStyle={[
            styles.scrollContent,
            !hasMessages && styles.scrollEmptyContent,
            {
              paddingHorizontal: CONTENT_PADDING,
              paddingBottom: hasMessages ? 24 : 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {!hasMessages ? (
            /* ── Clean Hero State (Reference Mockup Hierarchy) ─────── */
            <View style={styles.heroContainer}>
              {/* Heading with festive sparkle accents */}
              <View style={styles.welcomeHeadingRow}>
                <Text
                  style={[
                    styles.heroGreeting,
                    { color: isDark ? "#FFFFFF" : "#0F1E36" },
                  ]}
                >
                  {`Hey ${userName}!`}
                </Text>
                <View style={styles.sparkleAccents}>
                  <View
                    style={[
                      styles.sparkLine,
                      {
                        backgroundColor: isDark ? "#B7FF63" : "#10B981",
                        transform: [{ rotate: "-25deg" }],
                        width: 6,
                        height: 3,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.sparkLine,
                      {
                        backgroundColor: isDark ? "#B7FF63" : "#10B981",
                        transform: [{ rotate: "15deg" }],
                        width: 9,
                        height: 3,
                        top: -5,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.sparkLine,
                      {
                        backgroundColor: isDark ? "#B7FF63" : "#10B981",
                        transform: [{ rotate: "50deg" }],
                        width: 6,
                        height: 3,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text
                style={[
                  styles.heroSubtext,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Your money, made simpler.
              </Text>

              {/* High-res Zeno Mascot holding ₹ coin (enlarged size with fluid floating & breathing animation) */}
              <Animated.View
                style={[
                  styles.heroMascotWrap,
                  {
                    transform: [
                      { translateY: mascotFloatAnim },
                      { scale: mascotBreatheAnim },
                    ],
                  },
                ]}
              >
                <ExpoImage
                  source={ZENO_AI_HERO_MASCOT}
                  style={styles.heroMascotImage}
                  contentFit="contain"
                  priority="high"
                  cachePolicy="memory-disk"
                  recyclingKey="mascot-ai-hero-hello"
                />
              </Animated.View>

              {/* Chat Input Pill (Under mascot: interactive TextInput, stays in place at start) */}
              <View
                style={[
                  styles.heroInputPill,
                  {
                    backgroundColor: isDark ? "#141816" : "#FFFFFF",
                    borderColor: isDark ? "#242E27" : "#E2E8F0",
                    boxShadow: isDark
                      ? "0px 4px 16px rgba(0,0,0,0.4)"
                      : "0px 6px 20px rgba(15, 30, 54, 0.05)",
                  },
                ]}
              >
                <SparkleAIIcon
                  size={17}
                  color={isDark ? "#B7FF63" : "#10B981"}
                  style={{ marginLeft: 6, marginRight: 8 }}
                />
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask Zeno about your money..."
                  placeholderTextColor={isDark ? "#6B7280" : "#94A3B8"}
                  style={[
                    styles.heroTextInput,
                    { color: isDark ? "#FFFFFF" : "#0F1E36" },
                  ]}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (inputText.trim()) {
                      const text = inputText;
                      setInputText("");
                      Keyboard.dismiss();
                      void handleSubmitQuery(text, "manual");
                    }
                  }}
                  editable={!isThinking}
                />
                <Pressable
                  onPress={() => {
                    if (inputText.trim()) {
                      const text = inputText;
                      setInputText("");
                      Keyboard.dismiss();
                      void handleSubmitQuery(text, "manual");
                    }
                  }}
                  disabled={!inputText.trim() || isThinking}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.heroSendBtn,
                    {
                      backgroundColor: isDark ? colors.primary : "#101B2B",
                      opacity: pressed ? 0.8 : inputText.trim() ? 1 : 0.7,
                    },
                  ]}
                  accessibilityLabel="Send question"
                >
                  <Feather
                    name="arrow-up"
                    size={18}
                    color={isDark ? colors.onPrimary : "#FFFFFF"}
                  />
                </Pressable>
              </View>

              {/* Quick Action Cards (3 cards row with premium custom vector logos) */}
              <View style={styles.quickCardsRow}>
                {/* 1. Spending insights */}
                <Pressable
                  onPress={() => {
                    void haptics.selection();
                    void handleSubmitQuery(
                      "Where is my money going?",
                      "suggested",
                    );
                  }}
                  style={({ pressed }) => [
                    styles.quickCard,
                    {
                      backgroundColor: isDark ? "#141816" : "#FFFFFF",
                      borderColor: isDark ? "#242E27" : "#EBF0F5",
                      boxShadow: isDark
                        ? "0px 2px 8px rgba(0,0,0,0.3)"
                        : "0px 4px 14px rgba(15, 30, 54, 0.04)",
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.quickIconBadge,
                      { backgroundColor: isDark ? "#16281E" : "#E6F7F0" },
                    ]}
                  >
                    <SpendingInsightsIcon size={20} color="#10B981" />
                  </View>
                  <Text
                    style={[
                      styles.quickCardTitle,
                      { color: isDark ? "#FFFFFF" : "#0F1E36" },
                    ]}
                    numberOfLines={2}
                  >
                    {"Spending\ninsights"}
                  </Text>
                  <View
                    style={[
                      styles.quickChevronBadge,
                      { backgroundColor: isDark ? "#1E2620" : "#F8FAFC" },
                    ]}
                  >
                    <Feather name="chevron-right" size={13} color="#94A3B8" />
                  </View>
                </Pressable>

                {/* 2. Can I afford this? */}
                <Pressable
                  onPress={() => {
                    void haptics.selection();
                    void handleSubmitQuery("Can I afford ₹5,000?", "suggested");
                  }}
                  style={({ pressed }) => [
                    styles.quickCard,
                    {
                      backgroundColor: isDark ? "#141816" : "#FFFFFF",
                      borderColor: isDark ? "#242E27" : "#EBF0F5",
                      boxShadow: isDark
                        ? "0px 2px 8px rgba(0,0,0,0.3)"
                        : "0px 4px 14px rgba(15, 30, 54, 0.04)",
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.quickIconBadge,
                      { backgroundColor: isDark ? "#2B2117" : "#FFF2E8" },
                    ]}
                  >
                    <AffordabilityIcon size={20} color="#F97316" />
                  </View>
                  <Text
                    style={[
                      styles.quickCardTitle,
                      { color: isDark ? "#FFFFFF" : "#0F1E36" },
                    ]}
                    numberOfLines={2}
                  >
                    {"Can I\nafford this?"}
                  </Text>
                  <View
                    style={[
                      styles.quickChevronBadge,
                      { backgroundColor: isDark ? "#1E2620" : "#F8FAFC" },
                    ]}
                  >
                    <Feather name="chevron-right" size={13} color="#94A3B8" />
                  </View>
                </Pressable>

                {/* 3. Saving tips */}
                <Pressable
                  onPress={() => {
                    void haptics.selection();
                    void handleSubmitQuery(
                      "Which category has the biggest opportunity for savings?",
                      "suggested",
                    );
                  }}
                  style={({ pressed }) => [
                    styles.quickCard,
                    {
                      backgroundColor: isDark ? "#141816" : "#FFFFFF",
                      borderColor: isDark ? "#242E27" : "#EBF0F5",
                      boxShadow: isDark
                        ? "0px 2px 8px rgba(0,0,0,0.3)"
                        : "0px 4px 14px rgba(15, 30, 54, 0.04)",
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.quickIconBadge,
                      { backgroundColor: isDark ? "#251B2E" : "#F3E8FF" },
                    ]}
                  >
                    <SavingTipsIcon size={20} color="#8B5CF6" />
                  </View>
                  <Text
                    style={[
                      styles.quickCardTitle,
                      { color: isDark ? "#FFFFFF" : "#0F1E36" },
                    ]}
                    numberOfLines={2}
                  >
                    {"Saving\ntips"}
                  </Text>
                  <View
                    style={[
                      styles.quickChevronBadge,
                      { backgroundColor: isDark ? "#1E2620" : "#F8FAFC" },
                    ]}
                  >
                    <Feather name="chevron-right" size={13} color="#94A3B8" />
                  </View>
                </Pressable>
              </View>

              {/* Try asking Row */}
              <View style={styles.tryAskingSection}>
                <Text
                  style={[
                    styles.tryAskingLabel,
                    { color: isDark ? "#94A3B8" : "#8896A6" },
                  ]}
                >
                  Try asking
                </Text>
                <Pressable
                  onPress={() => {
                    void haptics.selection();
                    void handleSubmitQuery(
                      "Where did my money go this month?",
                      "suggested",
                    );
                  }}
                  style={({ pressed }) => [
                    styles.tryAskingCard,
                    {
                      backgroundColor: isDark ? "#141816" : "#FFFFFF",
                      borderColor: isDark ? "#242E27" : "#EBF0F5",
                      boxShadow: isDark
                        ? "0px 2px 8px rgba(0,0,0,0.3)"
                        : "0px 4px 14px rgba(15, 30, 54, 0.04)",
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.tryAskingIconWrap,
                      { backgroundColor: isDark ? "#16281E" : "#EBF7F5" },
                    ]}
                  >
                    <Feather name="message-square" size={16} color="#0D9488" />
                  </View>
                  <Text
                    style={[
                      styles.tryAskingText,
                      { color: isDark ? "#FFFFFF" : "#0F1E36" },
                    ]}
                    numberOfLines={1}
                  >
                    Where did my money go this month?
                  </Text>
                  <Feather name="chevron-right" size={17} color="#94A3B8" />
                </Pressable>
              </View>
            </View>
          ) : (
            /* ── Conversation Mode ──────────────────────────── */
            <View style={styles.chatStream}>
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageRow,
                      isUser ? styles.messageRowUser : styles.messageRowZeno,
                    ]}
                  >
                    {isUser ? (
                      /* User Message: Lightweight right-aligned pill */
                      <View
                        style={[
                          styles.userBubble,
                          {
                            backgroundColor: colors.surfaceElevated,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.userMessageText, { color: colors.fg }]}
                        >
                          {msg.text}
                        </Text>
                      </View>
                    ) : (
                      /* Zeno Message: Natural explanation + ONE visual card + follow-ups */
                      <View style={styles.zenoContainer}>
                        <View style={styles.zenoSenderRow}>
                          <ZenoAgentMascot
                            state={
                              msg.structured?.mascotReaction ||
                              (msg.status === "error" ? "ERROR" : "SUCCESS")
                            }
                            mode="compact"
                          />
                          <Text
                            style={[
                              styles.zenoSenderLabel,
                              { color: colors.fgMuted },
                            ]}
                          >
                            ZENO
                          </Text>
                        </View>

                        <FormattedMessageText
                          text={msg.text}
                          textColor={colors.fg}
                        />

                        {/* Structured Visual Cards */}
                        {msg.structured?.cards &&
                          msg.structured.cards.map((card, cardIdx) => (
                            <View
                              key={`${msg.id}-card-${cardIdx}`}
                              style={[
                                styles.cardWrapper,
                                cardIdx > 0 && { marginTop: spacing[3] },
                              ]}
                            >
                              <AIResponseCardRenderer
                                card={card}
                                onPressCategory={(categoryName: string) => {
                                  void handleSubmitQuery(
                                    `Show my spending in ${categoryName}`,
                                    "manual",
                                  );
                                }}
                                onPressBudget={() => {
                                  void handleSubmitQuery(
                                    "How healthy is my budget?",
                                    "suggested",
                                  );
                                }}
                                onPressTransaction={(tx: any) => {
                                  void haptics.selection();
                                  const realTx =
                                    transactions.find((t) => t.id === tx.id) ||
                                    (tx as Transaction);
                                  setSelectedTx(realTx);
                                }}
                                onViewAllTransactions={(
                                  cardData?: AITransactionListData,
                                ) => {
                                  void haptics.selection();
                                  const targetCategory =
                                    cardData?.category ||
                                    (cardData?.transactions &&
                                    cardData.transactions.length > 0 &&
                                    cardData.transactions.every(
                                      (t) =>
                                        t.category &&
                                        t.category.toLowerCase() ===
                                          cardData.transactions[0].category.toLowerCase(),
                                    )
                                      ? cardData.transactions[0].category
                                      : undefined);

                                  router.push({
                                    pathname: "/(tabs)/expenses",
                                    params: {
                                      ...(targetCategory
                                        ? { category: targetCategory }
                                        : {}),
                                      ...(cardData?.filterQuery
                                        ? { query: cardData.filterQuery }
                                        : {}),
                                      ...(cardData?.filterType
                                        ? { type: cardData.filterType }
                                        : {}),
                                    },
                                  });
                                }}
                              />
                            </View>
                          ))}

                        {/* Follow-up chips */}
                        {msg.structured?.followUps &&
                          msg.structured.followUps.length > 0 && (
                            <View style={styles.followUpsWrapper}>
                              <FollowUpChips
                                followUps={msg.structured.followUps}
                                onSelect={(q) => {
                                  const isSuggested =
                                    ALL_SUGGESTED_QUERIES.includes(q);
                                  void handleSubmitQuery(
                                    q,
                                    isSuggested ? "suggested" : "manual",
                                  );
                                }}
                              />
                            </View>
                          )}
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Thinking Indicator */}
              {isThinking && (
                <View style={styles.thinkingContainer}>
                  <View style={styles.zenoSenderRow}>
                    <ZenoAgentMascot state="THINKING" mode="compact" />
                    <Text
                      style={[
                        styles.zenoSenderLabel,
                        { color: colors.fgMuted },
                      ]}
                    >
                      ZENO
                    </Text>
                  </View>
                  <View style={styles.thinkingRow}>
                    <PremiumLoader size="small" color={colors.primary} />
                    <Text
                      style={[styles.thinkingText, { color: colors.fgMuted }]}
                    >
                      Analyzing your finances...
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ── Persistent Bottom Composer (Anchored above Keyboard / Navbar) ── */}
        {hasMessages && (
          <View
            style={[
              styles.composerWrapper,
              {
                paddingBottom: keyboardVisible
                  ? 12
                  : Platform.OS === "ios"
                    ? 92
                    : 88,
                backgroundColor: isDark ? colors.canvas : "#F4F7FB",
              },
            ]}
          >
            <AIChatInput
              value={inputText}
              onChangeText={setInputText}
              onSend={(text) => {
                setInputText("");
                Keyboard.dismiss();
                void handleSubmitQuery(text, "manual");
              }}
              disabled={isThinking}
              placeholder="Ask Zeno about your money..."
              horizontalPadding={CONTENT_PADDING}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Interactive Transaction Details Modal */}
      {selectedTx && (
        <QuickAddModal
          visible={!!selectedTx}
          editingTransaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSquircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerPlaceholderBtn: {
    width: 44,
    height: 44,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  headerCenterTitle: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollFlex: {
    flex: 1,
  },
  composerWrapper: {
    width: "100%",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "transparent",
    zIndex: 10,
    elevation: 5,
  },
  scrollContent: {
    paddingTop: spacing[2],
  },
  scrollEmptyContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  heroContainer: {
    alignItems: "center",
    paddingTop: spacing[1],
    paddingBottom: spacing[4],
  },
  welcomeHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  sparkleAccents: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginLeft: 6,
    height: 24,
    gap: 3,
  },
  sparkLine: {
    borderRadius: 2,
  },
  heroGreeting: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    letterSpacing: -0.8,
  },
  heroSubtext: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  heroMascotWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroMascotImage: {
    width: 215,
    height: 215,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  heroInputPill: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderRadius: radius.hero,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
    minHeight: 52,
    marginBottom: 16,
  },
  heroTextInput: {
    flex: 1,
    fontSize: fontSize.base,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    paddingRight: 8,
  },
  heroSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  quickCardsRow: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
    marginBottom: 16,
  },
  quickCard: {
    flex: 1,
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 12,
    justifyContent: "space-between",
    minHeight: 126,
  },
  quickIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCardTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    lineHeight: 17,
    marginTop: 10,
    marginBottom: 4,
  },
  quickChevronBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  tryAskingSection: {
    width: "100%",
  },
  tryAskingLabel: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    marginBottom: 8,
    marginLeft: 4,
  },
  tryAskingCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tryAskingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  tryAskingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    marginRight: 8,
  },
  chatStream: {
    gap: spacing[5],
  },
  messageRow: {
    width: "100%",
  },
  messageRowUser: {
    alignItems: "flex-end",
  },
  messageRowZeno: {
    alignItems: "flex-start",
  },
  userBubble: {
    maxWidth: "80%",
    paddingHorizontal: spacing[4],
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  userMessageText: {
    fontSize: fontSize.base,
    lineHeight: 21,
  },
  zenoContainer: {
    width: "100%",
  },
  zenoSenderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  zenoSenderLabel: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.8,
  },
  zenoMessageText: {
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  cardWrapper: {
    marginTop: spacing[3],
  },
  followUpsWrapper: {
    marginTop: spacing[3],
  },
  thinkingContainer: {
    width: "100%",
  },
  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  thinkingText: {
    fontSize: fontSize.sm,
  },
  suggestionTabsRow: {
    flexDirection: "row",
    gap: spacing[2],
    paddingBottom: spacing[3],
    paddingHorizontal: 2,
  },
  suggestionTabChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  suggestionTabText: {
    fontSize: 12,
  },
  suggestionTextCol: {
    flex: 1,
    paddingRight: 8,
    gap: 2,
  },
  suggestionSubtext: {
    fontSize: 11,
  },
  formattedTextContainer: {
    gap: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 2,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 22,
  },
});
