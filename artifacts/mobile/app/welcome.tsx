import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Svg, { Path, Polyline } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFinance } from "@/context/FinanceContext";
import { promptGoogleSignInAsync } from "@/services/googleAuth";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signInWithGoogle } = useFinance();
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await promptGoogleSignInAsync();
      if (result.type === "success") {
        await signInWithGoogle(result.profile);
        router.push("/onboarding" as never);
      } else if (result.type === "error") {
        Alert.alert("Sign-In Note", result.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      Alert.alert("Sign-In Note", message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleContinueAsGuest = () => {
    void Haptics.selectionAsync();
    router.push("/onboarding" as never);
  };

  return (
    <View style={[styles.screen, { backgroundColor: "#090B0A" }]}>
      {/* Background ambient radial glow */}
      <View style={styles.ambientGlow} />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing[4],
            paddingBottom: insets.bottom + spacing[4],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>Pocketflow</Text>
            <View style={styles.brandDot} />
          </View>
        </View>

        {/* Hero Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitleWhite}>Your money.</Text>
          <Text style={styles.mainTitleLime}>One clear picture.</Text>
          <Text style={styles.subtitle}>
            Track expenses, understand your spending, and stay in control.
          </Text>
        </View>

        {/* Slanted Perspective Phone Mockup (Pixel-matched to reference image) */}
        <View style={styles.mockupWrapper}>
          <View style={styles.mockupCard}>
            {/* Phone notch / top indicator */}
            <View style={styles.notchPill} />

            {/* Total Balance block */}
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Feather name="map-pin" size={13} color="#777D76" />
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>₹ 24,850</Text>
              <View style={styles.trendBadge}>
                <Feather name="trending-up" size={11} color="#B7FF63" />
                <Text style={styles.trendText}>+12%</Text>
              </View>
            </View>

            {/* Mini trendline chart */}
            <View style={styles.sparklineContainer}>
              <Svg width={180} height={26} viewBox="0 0 180 26">
                <Polyline
                  points="0,20 30,16 60,18 90,10 120,13 150,5 180,8"
                  fill="none"
                  stroke="#B7FF63"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            {/* Transaction Items */}
            <View style={styles.transactionsList}>
              {/* Coffee */}
              <View style={styles.txnItem}>
                <View
                  style={[styles.txnIconWrap, { backgroundColor: "#2A2520" }]}
                >
                  <Feather name="coffee" size={14} color="#FF8C69" />
                </View>
                <Text style={styles.txnName}>Coffee</Text>
                <Text style={styles.txnAmountExpense}>- ₹ 120</Text>
              </View>

              {/* Salary */}
              <View style={styles.txnItem}>
                <View
                  style={[styles.txnIconWrap, { backgroundColor: "#1C2D2B" }]}
                >
                  <Feather name="arrow-up-right" size={14} color="#7CFF66" />
                </View>
                <Text style={styles.txnName}>Salary</Text>
                <Text style={styles.txnAmountIncome}>+ ₹ 25,000</Text>
              </View>

              {/* Groceries */}
              <View style={styles.txnItem}>
                <View
                  style={[styles.txnIconWrap, { backgroundColor: "#23262B" }]}
                >
                  <Feather name="shopping-cart" size={14} color="#86BFFF" />
                </View>
                <Text style={styles.txnName}>Groceries</Text>
                <Text style={styles.txnAmountExpense}>- ₹ 950</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Actions Area */}
        <View style={styles.bottomSection}>
          {/* White Continue with Google Button */}
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={signingIn}
            style={({ pressed }) => [
              styles.googlePillButton,
              (pressed || signingIn) && {
                opacity: 0.85,
                transform: [{ scale: 0.99 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            {signingIn ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text style={styles.googlePillButtonText}>
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          {/* Guest fallback option */}
          <Pressable
            onPress={handleContinueAsGuest}
            disabled={signingIn}
            style={({ pressed }) => [
              styles.guestOption,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.guestOptionText}>
              Continue without signing in
            </Text>
          </Pressable>

          {/* Legal Disclaimer Footer */}
          <View style={styles.legalNotice}>
            <Text style={styles.legalNoticeText}>
              By continuing, you agree to our{" "}
              <Text
                style={styles.legalHighlight}
                onPress={() => router.push("/privacy" as never)}
              >
                Privacy Policy
              </Text>{" "}
              and{" "}
              <Text
                style={styles.legalHighlight}
                onPress={() => router.push("/terms" as never)}
              >
                Terms
              </Text>
              .
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#090B0A",
  },
  ambientGlow: {
    position: "absolute",
    top: "30%",
    left: "15%",
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
    backgroundColor: "rgba(183, 255, 99, 0.07)",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    justifyContent: "space-between",
  },
  brandHeader: {
    alignItems: "center",
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: "#F5F7F3",
    letterSpacing: -0.3,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#B7FF63",
  },
  titleSection: {
    alignItems: "center",
    marginBottom: spacing[4],
  },
  mainTitleWhite: {
    fontSize: 34,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  mainTitleLime: {
    fontSize: 34,
    fontWeight: fontWeight.bold,
    color: "#B7FF63",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: fontSize.sm + 0.5,
    fontWeight: fontWeight.regular,
    color: "#A5AAA3",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: spacing[4],
  },
  mockupWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing[2],
  },
  mockupCard: {
    width: "88%",
    backgroundColor: "#151816",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#2B322D",
    padding: spacing[4],
    transform: [{ rotate: "-4deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  notchPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2B322D",
    alignSelf: "center",
    marginBottom: spacing[3],
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: fontSize.xs,
    color: "#777D76",
    fontWeight: fontWeight.medium,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(183, 255, 99, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  trendText: {
    fontSize: fontSize.xs - 1,
    fontWeight: fontWeight.bold,
    color: "#B7FF63",
  },
  sparklineContainer: {
    marginBottom: spacing[3],
    opacity: 0.85,
  },
  transactionsList: {
    gap: spacing[2],
  },
  txnItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C201D",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
    borderRadius: radius.lg,
  },
  txnIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  txnName: {
    flex: 1,
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.medium,
    color: "#E2E8F0",
  },
  txnAmountExpense: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.semibold,
    color: "#F5F7F3",
  },
  txnAmountIncome: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.semibold,
    color: "#7CFF66",
  },
  bottomSection: {
    gap: spacing[3],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  googlePillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: radius.full,
    backgroundColor: "#FFFFFF",
    gap: spacing[3],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  googlePillButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: "#111827",
  },
  guestOption: {
    alignItems: "center",
    paddingVertical: spacing[1],
  },
  guestOptionText: {
    fontSize: fontSize.xs + 0.5,
    fontWeight: fontWeight.medium,
    color: "#777D76",
  },
  legalNotice: {
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  legalNoticeText: {
    fontSize: fontSize.xs,
    color: "#777D76",
    textAlign: "center",
    lineHeight: 18,
  },
  legalHighlight: {
    color: "#B7FF63",
    fontWeight: fontWeight.medium,
  },
});
