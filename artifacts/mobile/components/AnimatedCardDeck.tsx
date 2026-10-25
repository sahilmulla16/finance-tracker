import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle as SvgCircle, Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFinance, type Account } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { money, currencySymbol } from "@/utils/format";
import { fontWeight, spacing } from "@/constants/tokens";
import { motion } from "@/constants/motion";
import { AccountCard, getCardTheme } from "./ui/AccountCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive card dimensions — comfortably wide on small, normal, and large devices
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 96, 276);
const CARD_HEIGHT = 176;
const PEEK_OFFSET_1 = 38;
const PEEK_OFFSET_2 = 72;
const VERTICAL_OFFSET_1 = 7;
const VERTICAL_OFFSET_2 = 14;
const SWIPE_THRESHOLD = CARD_WIDTH * 0.28;

// Contactless wave SVG symbol (Wi-Fi payment symbol)
function ContactlessIcon({
  color = "#FFFFFF",
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 8.5C8.5 5.5 13.5 5.5 16.5 8.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Path
        d="M7.5 11.5C9.5 9.5 12.5 9.5 14.5 11.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Path
        d="M9.5 14.5C10.5 13.5 11.5 13.5 12.5 14.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Generate deterministic 4-digit numeric string for card numbers (never words or letters like 'llet')
function getCardLast4(accId: string, index: number = 0): string {
  const digits = accId.replace(/\D/g, "");
  if (digits.length >= 4) {
    return digits.slice(-4);
  }
  let hash = 0;
  for (let i = 0; i < accId.length; i++) {
    hash = (hash << 5) - hash + accId.charCodeAt(i);
    hash |= 0;
  }
  const deterministicNum = ((Math.abs(hash) + index * 997) % 9000) + 1000;
  return deterministicNum.toString();
}

export function getDeterministicCardDigits(accId: string, index: number = 0): { prefix: string; last4: string } {
  return {
    prefix: "5274",
    last4: getCardLast4(accId, index),
  };
}

// Mastercard / Visa network badge
function CardNetworkBadge({
  isLime = false,
  network = "mastercard",
}: {
  isLime?: boolean;
  network?: "mastercard" | "visa";
}) {
  if (network === "visa") {
    return (
      <Text
        style={[
          styles.visaText,
          { color: isLime ? "#070B06" : "rgba(255, 255, 255, 0.9)" },
        ]}
      >
        VISA
      </Text>
    );
  }

  // Mastercard overlapping dual circles
  return (
    <Svg width={36} height={22} viewBox="0 0 38 24">
      <SvgCircle
        cx="14"
        cy="12"
        r="10"
        fill={isLime ? "rgba(7, 11, 6, 0.55)" : "rgba(255, 255, 255, 0.38)"}
      />
      <SvgCircle
        cx="24"
        cy="12"
        r="10"
        fill={isLime ? "rgba(7, 11, 6, 0.32)" : "rgba(255, 255, 255, 0.22)"}
      />
    </Svg>
  );
}

// Minimal, lightweight, clean geometric Account Logo Mark
function AccountLogoMark({
  type,
  isLime = false,
}: {
  type?: string;
  isLime?: boolean;
}) {
  const iconColor = isLime ? "#070B06" : "#FFFFFF";
  const bg = isLime ? "rgba(7, 11, 6, 0.12)" : "rgba(255, 255, 255, 0.14)";
  const border = isLime ? "rgba(7, 11, 6, 0.18)" : "rgba(255, 255, 255, 0.22)";

  let iconName: "pocket" | "credit-card" | "shield" | "smartphone" = "pocket";
  if (type === "BANK") iconName = "credit-card";
  else if (type === "SAVINGS") iconName = "shield";
  else if (type === "UPI") iconName = "smartphone";

  return (
    <View
      style={[
        styles.accountLogoBadge,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      <Feather name={iconName} size={12} color={iconColor} />
    </View>
  );
}

// Card Entity Model: all properties permanently bound to this card instance
export interface CardEntity {
  id: string;
  account: Account | null;
  isDemo?: boolean;
  name: string;
  type: string;
  currency: string;
  balance: number;
  last4: string;
  network: "mastercard" | "visa";
  themeIndex?: number;
  theme: {
    isLime: boolean;
    colors: [string, string, ...string[]];
    specular: [string, string, ...string[]];
    textColor: string;
    subTextColor: string;
    borderColor: string;
    shadowColor: string;
  };
}

interface AnimatedCardDeckProps {
  accounts: Account[];
  accountsVisible: boolean;
  onPressAccount: (account?: Account) => void;
}

export function AnimatedCardDeck({
  accounts,
  accountsVisible,
  onPressAccount,
}: AnimatedCardDeckProps) {
  const { settings, getAccountBalance, transactions } = useFinance();
  const colors = useColors();
  const isLight = !colors.isDark || colors.canvas === "#FFFFFF";

  // Build the individual Card Entities. Each card permanently owns its visual identity/color.
  const cards: CardEntity[] = useMemo(() => {
    // Theme 0: Dark Metallic Graphite (Dark) or Navy Blue (Light)
    const themeBlack: CardEntity["theme"] = isLight
      ? {
          isLime: false,
          colors: ["#1B3050", "#122037", "#0A1322"],
          specular: [
            "rgba(220, 235, 255, 0.38)",
            "rgba(220, 235, 255, 0.1)",
            "transparent",
          ],
          textColor: "#FFFFFF",
          subTextColor: "rgba(220, 235, 255, 0.78)",
          borderColor: "rgba(100, 150, 220, 0.28)",
          shadowColor: "#000000",
        }
      : {
          isLime: false,
          colors: ["#242826", "#171A18", "#0E100F"],
          specular: ["rgba(255, 255, 255, 0.14)", "transparent"],
          textColor: "#FFFFFF",
          subTextColor: "rgba(255, 255, 255, 0.65)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          shadowColor: "#000000",
        };

    // Theme 1: Gradiently Darker Rich Athletic Lime Green (Dark) or Deep Black (Light)
    const themeGreen: CardEntity["theme"] = isLight
      ? {
          isLime: false,
          colors: ["#373C44", "#20242B", "#111418"],
          specular: [
            "rgba(255, 255, 255, 0.35)",
            "rgba(255, 255, 255, 0.08)",
            "transparent",
          ],
          textColor: "#FFFFFF",
          subTextColor: "rgba(255, 255, 255, 0.72)",
          borderColor: "rgba(255, 255, 255, 0.16)",
          shadowColor: "#000000",
        }
      : {
          isLime: true,
          colors: ["#7ED92A", "#5EB516", "#3D7D09"],
          specular: ["rgba(255, 255, 255, 0.28)", "transparent"],
          textColor: "#070B06",
          subTextColor: "rgba(7, 11, 6, 0.74)",
          borderColor: "rgba(126, 217, 42, 0.45)",
          shadowColor: "rgba(126, 217, 42, 0.3)",
        };

    // Theme 2: Deep Obsidian Emerald (Dark) or Slate Charcoal (Light)
    const themeObsidian: CardEntity["theme"] = isLight
      ? {
          isLime: false,
          colors: ["#252A33", "#191D24", "#0D0F13"],
          specular: ["rgba(255, 255, 255, 0.16)", "transparent"],
          textColor: "#FFFFFF",
          subTextColor: "rgba(255, 255, 255, 0.65)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          shadowColor: "#000000",
        }
      : {
          isLime: false,
          colors: ["#1C2A22", "#121C16", "#0A100D"],
          specular: ["rgba(255, 255, 255, 0.09)", "transparent"],
          textColor: "#FFFFFF",
          subTextColor: "rgba(255, 255, 255, 0.62)",
          borderColor: "rgba(183, 255, 99, 0.16)",
          shadowColor: "#000000",
        };

    const themePalette = [themeBlack, themeGreen, themeObsidian];

    const effectiveCurrency = settings.currency || "INR";

    // 1 Account = 1 Card. Strictly no demo card padding.
    // If user has accounts, return an exact 1-to-1 card entity for each account.
    if (accounts.length > 0) {
      return accounts.map((acc, index) => {
        const themeIndex = acc.colorThemeIndex !== undefined
          ? acc.colorThemeIndex
          : index % 3;
        return {
          id: acc.id,
          account: acc,
          name: acc.name,
          type: acc.type,
          currency: settings.currency || acc.currency || effectiveCurrency,
          balance: getAccountBalance(acc.id),
          last4: acc.cardLast4 || acc.accountNumberLast4 || getCardLast4(acc.id, index),
          network: index % 2 === 0 ? "mastercard" : "visa",
          themeIndex: themeIndex,
          theme: getCardTheme(index, isLight, themeIndex),
        };
      });
    }

    // Fallback if 0 accounts exist (only 1 clean placeholder card)
    let fallbackBalance = 0;
    for (const txn of transactions) {
      const amount = Math.abs(Number(txn.amount)) || 0;
      const type = (txn.type || "EXPENSE").trim().toUpperCase();
      if (type === "INCOME") fallbackBalance += amount;
      else if (type === "EXPENSE") fallbackBalance -= amount;
    }

    return [
      {
        id: "primary-wallet",
        account: null,
        isDemo: false,
        name: "Main Wallet",
        type: "CASH",
        currency: effectiveCurrency,
        balance: fallbackBalance,
        last4: "5274",
        network: "mastercard",
        theme: themeBlack,
      },
    ];
  }, [accounts, getAccountBalance, settings.currency, isLight, transactions]);

  // Order of card IDs in the stack:
  // order[0] is Front (Position 0)
  // order[1] is Second (Position 1)
  // order[2] is Third (Position 2)
  const [order, setOrder] = useState<string[]>(() => cards.map((c) => c.id));

  // Reconcile order if cards change
  useEffect(() => {
    setOrder((prevOrder) => {
      const currentIds = cards.map((c) => c.id);
      const preserved = prevOrder.filter((id) => currentIds.includes(id));
      const added = currentIds.filter((id) => !preserved.includes(id));
      return [...preserved, ...added];
    });
  }, [cards]);

  const dragX = useRef(new Animated.Value(0)).current;
  const isTransitioning = useRef(false);

  // Cycle forward: Front card flies off left and moves to the back of the stack.
  // Next card (e.g. Green) physically becomes the front card with its own green background.
  const cycleForward = () => {
    if (isTransitioning.current || cards.length <= 1) return;
    isTransitioning.current = true;

    Animated.timing(dragX, {
      toValue: -SCREEN_WIDTH * 0.85,
      duration: 170,
      easing: motion.easingDecelerate,
      useNativeDriver: true,
    }).start(() => {
      dragX.setValue(0);
      setOrder((prev) => {
        if (prev.length <= 1) return prev;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
      void Haptics.selectionAsync();
      isTransitioning.current = false;
    });
  };

  // Cycle backward: Previous card from the back swooshes into the front position.
  const cycleBackward = () => {
    if (isTransitioning.current || cards.length <= 1) return;
    isTransitioning.current = true;

    dragX.setValue(-SCREEN_WIDTH * 0.85);
    setOrder((prev) => {
      if (prev.length <= 1) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, prev.length - 1);
      return [last, ...rest];
    });
    void Haptics.selectionAsync();

    Animated.spring(dragX, {
      toValue: 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start(() => {
      isTransitioning.current = false;
    });
  };

  // PanResponder to handle smooth card swiping
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isTransitioning.current || cards.length <= 1) return false;
        return (
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderGrant: () => {
        dragX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        dragX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD || gestureState.vx < -0.4) {
          cycleForward();
        } else if (gestureState.dx > SWIPE_THRESHOLD || gestureState.vx > 0.4) {
          cycleBackward();
        } else {
          Animated.spring(dragX, {
            toValue: 0,
            friction: 8,
            tension: 50,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  // Active front card ID
  const activeId = order[0] || cards[0]?.id;

  // Max peek offset depends on available cards:
  // 1 card -> 0 peek (centered)
  // 2 cards -> PEEK_OFFSET_1
  // 3+ cards -> PEEK_OFFSET_2 (max 3 allowed in the visible stack)
  const currentMaxPeek =
    cards.length <= 1 ? 0 : cards.length === 2 ? PEEK_OFFSET_1 : PEEK_OFFSET_2;
  const currentMaxVert =
    cards.length <= 1
      ? 0
      : cards.length === 2
        ? VERTICAL_OFFSET_1
        : VERTICAL_OFFSET_2;

  const deckPaddingLeft = Math.max(
    (SCREEN_WIDTH - (CARD_WIDTH + currentMaxPeek)) / 2 +
      (currentMaxPeek > 0 ? 10 : 0),
    16,
  );
  const deckPaddingRight = Math.max(
    (SCREEN_WIDTH - (CARD_WIDTH + currentMaxPeek)) / 2 -
      (currentMaxPeek > 0 ? 10 : 0),
    16,
  );

  return (
    <View
      style={[
        styles.deckContainer,
        {
          paddingLeft: deckPaddingLeft,
          paddingRight: deckPaddingRight,
        },
      ]}
    >
      <View
        style={[
          styles.stackStage,
          {
            width: CARD_WIDTH + currentMaxPeek,
            height: CARD_HEIGHT + currentMaxVert + 8,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {cards.map((card) => {
          const position = order.indexOf(card.id);

          // If card is further than position 2, hide it behind
          if (position > 2 || position === -1) {
            return null;
          }

          let animatedStyle: any = {};
          let zIndex = 10;
          let elevation = 2;

          if (position === 0) {
            // Front Card: follows finger dragX with gentle tilt
            const rotate = dragX.interpolate({
              inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
              outputRange: ["-8deg", "0deg", "8deg"],
              extrapolate: "clamp",
            });
            const opacity = dragX.interpolate({
              inputRange: [-SCREEN_WIDTH * 0.7, -SCREEN_WIDTH * 0.35, 0],
              outputRange: [0.35, 0.85, 1.0],
              extrapolate: "clamp",
            });

            animatedStyle = {
              left: 0,
              top: 0,
              transform: [
                { translateX: dragX },
                { translateY: 0 },
                { rotate },
                { scale: 1.0 },
              ],
              opacity,
            };
            zIndex = 30;
            elevation = 10;
          } else if (position === 1) {
            // Second Card: peeks at PEEK_OFFSET_1. As front card is dragged left,
            // this card smoothly glides forward to position 0!
            const translateX = dragX.interpolate({
              inputRange: [-CARD_WIDTH * 0.85, 0],
              outputRange: [-PEEK_OFFSET_1, 0],
              extrapolate: "clamp",
            });
            const translateY = dragX.interpolate({
              inputRange: [-CARD_WIDTH * 0.85, 0],
              outputRange: [-VERTICAL_OFFSET_1, 0],
              extrapolate: "clamp",
            });
            const scale = dragX.interpolate({
              inputRange: [-CARD_WIDTH * 0.85, 0],
              outputRange: [1.0, 0.97],
              extrapolate: "clamp",
            });

            animatedStyle = {
              left: PEEK_OFFSET_1,
              top: VERTICAL_OFFSET_1,
              transform: [{ translateX }, { translateY }, { scale }],
            };
            zIndex = 20;
            elevation = 6;
          } else if (position === 2) {
            // Third Card: peeks at PEEK_OFFSET_2. As front card is dragged left,
            // this card glides smoothly into position 1!
            const translateX = dragX.interpolate({
              inputRange: [-CARD_WIDTH * 0.85, 0],
              outputRange: [-(PEEK_OFFSET_2 - PEEK_OFFSET_1), 0],
              extrapolate: "clamp",
            });
            const translateY = dragX.interpolate({
              inputRange: [-CARD_WIDTH * 0.85, 0],
              outputRange: [-(VERTICAL_OFFSET_2 - VERTICAL_OFFSET_1), 0],
              extrapolate: "clamp",
            });
            const scale = dragX.interpolate({
              inputRange: [-CARD_WIDTH * 0.85, 0],
              outputRange: [0.97, 0.94],
              extrapolate: "clamp",
            });

            animatedStyle = {
              left: PEEK_OFFSET_2,
              top: VERTICAL_OFFSET_2,
              transform: [{ translateX }, { translateY }, { scale }],
            };
            zIndex = 10;
            elevation = 3;
          }

          return (
            <Animated.View
              key={card.id}
              style={[
                styles.cardAbsoluteWrapper,
                animatedStyle,
                { zIndex, elevation },
              ]}
            >
              <Pressable
                onPress={() => {
                  if (position === 0) {
                    onPressAccount(
                      card.isDemo ? undefined : card.account || undefined,
                    );
                  } else {
                    cycleForward();
                  }
                }}
                style={({ pressed }) => [
                  styles.cardPressable,
                  pressed && { opacity: 0.95 },
                ]}
              >
                <AccountCard
                  name={card.name}
                  displayName={card.account?.displayName}
                  type={card.type}
                  balance={card.balance}
                  currency={(settings.currency || card.currency) as any}
                  last4={card.last4}
                  network={card.network}
                  colorThemeIndex={card.themeIndex ?? (order.indexOf(card.id) % 3)}
                  accountsVisible={accountsVisible}
                  width={CARD_WIDTH}
                  height={CARD_HEIGHT}
                  isDefault={card.account?.isDefault}
                />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Subtle indicator dots */}
      {cards.length > 1 && (
        <View style={styles.dotsRow}>
          {cards.map((c) => (
            <View
              key={c.id}
              style={[
                styles.dot,
                c.id === activeId ? styles.activeDot : styles.inactiveDot,
                c.id === activeId && isLight && { backgroundColor: colors.primary },
                c.id !== activeId && isLight && { backgroundColor: "rgba(16, 28, 61, 0.18)" },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  deckContainer: {
    marginTop: spacing[2],
    alignItems: "center",
  },
  stackStage: {
    position: "relative",
    justifyContent: "center",
  },
  cardAbsoluteWrapper: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.3,
  },
  cardPressable: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    justifyContent: "space-between",
    overflow: "hidden",
  },

  // Card Header: Minimal Account Logo + Name
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    maxWidth: "80%",
  },
  accountLogoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bankTitleText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },

  // Card Center: Prominent Money Amount
  cardCenter: {
    marginVertical: 4,
    gap: 2,
  },
  moneyAmountText: {
    fontSize: 23,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  accountSubtitleText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Card Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    gap: 1,
  },
  cardMaskDots: {
    fontSize: 9,
    letterSpacing: 1.5,
    lineHeight: 11,
  },
  cardMaskNumber: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.2,
    fontVariant: ["tabular-nums"],
  },

  visaText: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
    fontStyle: "italic",
  },

  // Indicator dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  activeDot: {
    width: 18,
    backgroundColor: "#7ED92A",
  },
  inactiveDot: {
    width: 4,
    backgroundColor: "rgba(128, 128, 128, 0.3)",
  },
});
