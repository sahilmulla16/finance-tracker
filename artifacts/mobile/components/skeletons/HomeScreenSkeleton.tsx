import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/tokens';
import {
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  SkeletonCard,
} from '@/components/ui/Skeleton';

/**
 * HomeScreenSkeleton
 *
 * Visually replicates Zeno's Home / Wallet screen:
 * - Top header with profile avatar, greeting, & notifications icon
 * - Hero Balance Card with total net worth, stats, and toggle
 * - Debit/Credit Card Deck mockup with EMV chip and card geometry
 * - Quick Action Buttons (Add, Send, Receive, Insights)
 * - Recent Transactions list with category squircles and amount pills
 */
export function HomeScreenSkeleton() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.canvas,
          paddingTop: insets.top + spacing[2],
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header: Avatar + Greeting + Bell */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <SkeletonCircle size={44} />
            <View style={styles.greetingCol}>
              <SkeletonText width={90} height={12} style={{ marginBottom: 6 }} />
              <SkeletonText width={140} height={18} />
            </View>
          </View>
          <SkeletonCircle size={42} />
        </View>

        {/* 2. Hero Net Worth Card */}
        <SkeletonCard style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <SkeletonText width={110} height={13} />
            <SkeletonCircle size={28} />
          </View>

          <SkeletonText width={210} height={40} style={{ marginVertical: spacing[3] }} />

          <View style={styles.heroPillRow}>
            <Skeleton width={80} height={22} borderRadius={radius.full} />
            <SkeletonText width={100} height={12} style={{ marginLeft: spacing[2] }} />
          </View>

          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <SkeletonText width={60} height={11} style={{ marginBottom: 4 }} />
              <SkeletonText width={85} height={16} />
            </View>
            <View style={[styles.statSeparator, { backgroundColor: colors.border }]} />
            <View style={styles.heroStatItem}>
              <SkeletonText width={60} height={11} style={{ marginBottom: 4 }} />
              <SkeletonText width={85} height={16} />
            </View>
          </View>
        </SkeletonCard>

        {/* 3. Simulated Animated Card Deck */}
        <View style={styles.cardDeckContainer}>
          <SkeletonCard
            borderRadius={22}
            style={styles.cardDeckMock}
          >
            <View style={styles.cardTopRow}>
              <SkeletonText width={110} height={16} />
              <Skeleton width={42} height={24} borderRadius={radius.sm} />
            </View>
            <Skeleton
              width={38}
              height={28}
              borderRadius={6}
              style={{ marginTop: spacing[3], marginBottom: spacing[4] }}
            />
            <SkeletonText width={180} height={18} />
            <View style={styles.cardBottomRow}>
              <SkeletonText width={90} height={12} />
              <SkeletonText width={60} height={12} />
            </View>
          </SkeletonCard>
        </View>

        {/* 4. Quick Action Buttons */}
        <View style={styles.quickActionsRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.quickActionItem}>
              <SkeletonCircle size={52} />
              <SkeletonText
                width={48}
                height={11}
                style={{ marginTop: spacing[2] }}
              />
            </View>
          ))}
        </View>

        {/* 5. Recent Transactions Section */}
        <View style={styles.sectionHeaderRow}>
          <SkeletonText width={150} height={20} />
          <Skeleton width={64} height={26} borderRadius={radius.full} />
        </View>

        {/* Transaction Rows */}
        <SkeletonCard style={styles.transactionsCard}>
          {[1, 2, 3, 4].map((idx) => (
            <View
              key={idx}
              style={[
                styles.transactionRow,
                idx > 1 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Skeleton width={44} height={44} borderRadius={14} />
              <View style={styles.transactionDetails}>
                <SkeletonText
                  width={idx % 2 === 0 ? 140 : 110}
                  height={15}
                  style={{ marginBottom: 6 }}
                />
                <SkeletonText width={80} height={11} />
              </View>
              <View style={styles.transactionAmount}>
                <SkeletonText width={70} height={16} style={{ marginBottom: 4 }} />
                <Skeleton width={40} height={10} borderRadius={radius.sm} />
              </View>
            </View>
          ))}
        </SkeletonCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[12],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  greetingCol: {
    justifyContent: 'center',
  },
  heroCard: {
    marginBottom: spacing[4],
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroDivider: {
    height: 1,
    marginVertical: spacing[3],
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statSeparator: {
    width: 1,
    height: 28,
  },
  cardDeckContainer: {
    marginBottom: spacing[4],
  },
  cardDeckMock: {
    height: 175,
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  quickActionItem: {
    alignItems: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  transactionsCard: {
    padding: 0,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
  },
  transactionDetails: {
    flex: 1,
    marginLeft: spacing[3],
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
});

