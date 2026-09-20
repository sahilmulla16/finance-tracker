import React, { useState } from "react";
import {
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
import Svg, { Circle, G, Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNext = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSlideIndex < 2) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      router.push("/basic-setup" as never);
    }
  };

  const handleSkip = () => {
    void Haptics.selectionAsync();
    router.push("/basic-setup" as never);
  };

  return (
    <View style={[styles.screen, { backgroundColor: "#090B0A" }]}>
      {/* Top Header with Skip Button */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + spacing[3],
            paddingHorizontal: spacing[5],
          },
        ]}
      >
        <View style={{ width: 40 }} />
        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && { opacity: 0.6 },
          ]}
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: insets.bottom + spacing[4],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ====================================================
            SLIDE 1: Everything in one place.
           ==================================================== */}
        {currentSlideIndex === 0 && (
          <View style={styles.slideWrapper}>
            <View style={styles.titleSection}>
              <Text style={styles.slideHeadline}>
                Everything{"\n"}in one place.
              </Text>
              <Text style={styles.slideSubtitle}>
                Track expenses, income and transfers without jumping between
                apps.
              </Text>
            </View>

            {/* Visual: 3 stacked cards with colored icons */}
            <View style={styles.feature1Visual}>
              <View style={styles.ambientWaveBackdrop} />

              {/* Income card */}
              <View style={styles.stackedCard}>
                <View
                  style={[
                    styles.stackedIconSquare,
                    { backgroundColor: "#10B981" },
                  ]}
                >
                  <Feather name="arrow-up-right" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.stackedCardText}>
                  <Text style={styles.stackedCardLabel}>Income</Text>
                  <Text style={styles.stackedCardAmount}>₹ 25,000</Text>
                </View>
              </View>

              {/* Expenses card */}
              <View style={styles.stackedCard}>
                <View
                  style={[
                    styles.stackedIconSquare,
                    { backgroundColor: "#F43F5E" },
                  ]}
                >
                  <Feather name="arrow-down-right" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.stackedCardText}>
                  <Text style={styles.stackedCardLabel}>Expenses</Text>
                  <Text style={styles.stackedCardAmount}>₹ 8,450</Text>
                </View>
              </View>

              {/* Transfers card */}
              <View style={styles.stackedCard}>
                <View
                  style={[
                    styles.stackedIconSquare,
                    { backgroundColor: "#8B5CF6" },
                  ]}
                >
                  <Feather name="repeat" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.stackedCardText}>
                  <Text style={styles.stackedCardLabel}>Transfers</Text>
                  <Text style={styles.stackedCardAmount}>₹ 2,300</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ====================================================
            SLIDE 2: Track expenses in seconds.
           ==================================================== */}
        {currentSlideIndex === 1 && (
          <View style={styles.slideWrapper}>
            <View style={styles.titleSection}>
              <Text style={styles.slideHeadline}>
                Track expenses{"\n"}in seconds.
              </Text>
              <Text style={styles.slideSubtitle}>
                Double-press Volume Down. Enter the amount. Done.
              </Text>
            </View>

            {/* Visual: Phone side volume rocker + 2x Vol Down + Amount + Saved */}
            <View style={styles.feature2Visual}>
              <View style={styles.phoneEdgeContainer}>
                {/* Phone side edge silhouette */}
                <View style={styles.phoneEdgeBody}>
                  <View style={styles.volumeUpBtn} />
                  <View style={styles.volumeDownBtn}>
                    <View style={styles.volumePulseAura} />
                  </View>
                </View>

                {/* 2x Volume Down pill badge */}
                <View style={styles.volumeTriggerBadge}>
                  <Text style={styles.volumeTriggerText}>2x Volume Down</Text>
                </View>
              </View>

              {/* Downward connector arrow */}
              <View style={styles.flowArrowContainer}>
                <Feather name="arrow-down" size={18} color="#B7FF63" />
              </View>

              {/* Amount card */}
              <View style={styles.quickAmountCard}>
                <Text style={styles.quickAmountText}>₹ 500</Text>
              </View>

              {/* Downward connector arrow */}
              <View style={styles.flowArrowContainer}>
                <Feather name="arrow-down" size={18} color="#B7FF63" />
              </View>

              {/* Saved badge with sparkles */}
              <View style={styles.savedPillBadge}>
                <View style={styles.savedCheckCircle}>
                  <Feather name="check" size={14} color="#000000" />
                </View>
                <Text style={styles.savedText}>Saved!</Text>
                <Feather
                  name="zap"
                  size={14}
                  color="#B7FF63"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>
          </View>
        )}

        {/* ====================================================
            SLIDE 3: See where your money goes.
           ==================================================== */}
        {currentSlideIndex === 2 && (
          <View style={styles.slideWrapper}>
            <View style={styles.titleSection}>
              <Text style={styles.slideHeadline}>
                See where{"\n"}your money goes.
              </Text>
              <Text style={styles.slideSubtitle}>
                Insights, categories and budgets help you understand your
                spending.
              </Text>
            </View>

            {/* Visual: Donut Chart with center text and category percentages */}
            <View style={styles.feature3Visual}>
              <View style={styles.donutContainer}>
                {/* Multi-segment Donut Chart */}
                <Svg width={160} height={160} viewBox="0 0 100 100">
                  <G transform="rotate(-90 50 50)">
                    {/* Food: 28% (Orange #FB923C) */}
                    <Circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#FB923C"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray="66.8 238.7"
                      strokeDashoffset="0"
                    />
                    {/* Transport: 18% (Blue #38BDF8) */}
                    <Circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#38BDF8"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray="43.0 238.7"
                      strokeDashoffset="-66.8"
                    />
                    {/* Shopping: 16% (Purple #A855F7) */}
                    <Circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#A855F7"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray="38.2 238.7"
                      strokeDashoffset="-109.8"
                    />
                    {/* Bills: 12% (Green #4ADE80) */}
                    <Circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#4ADE80"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray="28.6 238.7"
                      strokeDashoffset="-148.0"
                    />
                    {/* Others: 26% (Gray #64748B) */}
                    <Circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#64748B"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray="62.1 238.7"
                      strokeDashoffset="-176.6"
                    />
                  </G>
                </Svg>

                {/* Center text inside donut */}
                <View style={styles.donutCenter}>
                  <Text style={styles.donutCenterAmount}>₹ 8,450</Text>
                  <Text style={styles.donutCenterLabel}>This Month</Text>
                </View>
              </View>

              {/* Category Breakdown items */}
              <View style={styles.categoryLegendList}>
                <View style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#FB923C" }]}
                  >
                    <Feather name="coffee" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.legendName}>Food</Text>
                  <Text style={styles.legendPercent}>28%</Text>
                </View>

                <View style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#38BDF8" }]}
                  >
                    <Feather name="navigation" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.legendName}>Transport</Text>
                  <Text style={styles.legendPercent}>18%</Text>
                </View>

                <View style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#A855F7" }]}
                  >
                    <Feather name="shopping-bag" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.legendName}>Shopping</Text>
                  <Text style={styles.legendPercent}>16%</Text>
                </View>

                <View style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#4ADE80" }]}
                  >
                    <Feather name="file-text" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.legendName}>Bills</Text>
                  <Text style={styles.legendPercent}>12%</Text>
                </View>

                <View style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#64748B" }]}
                  >
                    <Feather name="more-horizontal" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.legendName}>Others</Text>
                  <Text style={styles.legendPercent}>26%</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bottom Pagination & Next Button Area */}
        <View style={styles.bottomBar}>
          {/* Pagination 3 Dots (Exact match to reference image) */}
          <View style={styles.indicatorContainer}>
            {[0, 1, 2].map((idx) => {
              const isActive = idx === currentSlideIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.indicatorDot,
                    {
                      backgroundColor: isActive ? "#B7FF63" : "#303431",
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Full-width Lime Pill Button "Next" */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextPillButton,
              pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Next slide"
          >
            <Text style={styles.nextPillButtonText}>Next</Text>
          </Pressable>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing[1],
  },
  skipButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  skipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: "#A5AAA3",
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    justifyContent: "space-between",
  },
  slideWrapper: {
    flex: 1,
    justifyContent: "space-around",
    paddingVertical: spacing[2],
  },
  titleSection: {
    alignItems: "center",
    marginBottom: spacing[4],
  },
  slideHeadline: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: spacing[2],
  },
  slideSubtitle: {
    fontSize: fontSize.sm + 0.5,
    fontWeight: fontWeight.regular,
    color: "#A5AAA3",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing[4],
  },
  /* Feature 1 */
  feature1Visual: {
    gap: spacing[3],
    marginVertical: spacing[4],
  },
  ambientWaveBackdrop: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(183, 255, 99, 0.04)",
    borderRadius: radius.hero,
  },
  stackedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171A18",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#282D29",
    padding: spacing[4],
    gap: spacing[4],
  },
  stackedIconSquare: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  stackedCardText: {
    flex: 1,
  },
  stackedCardLabel: {
    fontSize: fontSize.sm,
    color: "#A5AAA3",
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  stackedCardAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  /* Feature 2 */
  feature2Visual: {
    alignItems: "center",
    marginVertical: spacing[2],
    gap: spacing[3],
  },
  phoneEdgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    marginVertical: spacing[2],
  },
  phoneEdgeBody: {
    width: 14,
    height: 90,
    backgroundColor: "#2B322D",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#4A544D",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  volumeUpBtn: {
    width: 4,
    height: 20,
    backgroundColor: "#777D76",
    borderRadius: 2,
  },
  volumeDownBtn: {
    width: 4,
    height: 20,
    backgroundColor: "#B7FF63",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  volumePulseAura: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(183, 255, 99, 0.35)",
  },
  volumeTriggerBadge: {
    backgroundColor: "#171A18",
    paddingHorizontal: spacing[3] + 2,
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: "#B7FF63",
  },
  volumeTriggerText: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
  },
  flowArrowContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  quickAmountCard: {
    backgroundColor: "#171A18",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: "#2B322D",
    alignItems: "center",
  },
  quickAmountText: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  savedPillBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171A18",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#2B322D",
    gap: spacing[2],
  },
  savedCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#B7FF63",
    alignItems: "center",
    justifyContent: "center",
  },
  savedText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
  },
  /* Feature 3 */
  feature3Visual: {
    alignItems: "center",
    marginVertical: spacing[2],
    width: "100%",
  },
  donutContainer: {
    position: "relative",
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenterAmount: {
    fontSize: fontSize.lg + 1,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  donutCenterLabel: {
    fontSize: fontSize.xs - 1,
    color: "#A5AAA3",
    marginTop: 2,
  },
  categoryLegendList: {
    width: "88%",
    gap: spacing[2],
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  legendDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  legendName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: "#F5F7F3",
  },
  legendPercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: "#A5AAA3",
  },
  /* Bottom */
  bottomBar: {
    gap: spacing[4],
    marginTop: spacing[4],
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextPillButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: radius.full,
    backgroundColor: "#B7FF63",
    shadowColor: "#B7FF63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  nextPillButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: "#000000",
  },
});
