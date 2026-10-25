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
 * ExpensesScreenSkeleton
 *
 * Replicates the Transactions & Expenses tab layout:
 * - Header with title & filter button
 * - Search bar placeholder
 * - 4-tab filter pills (All, Income, Expense, Transfer)
 * - Monthly spend overview pill
 * - Grouped date headers ("Today", "Yesterday")
 * - Transaction rows with category squircles and amount tags
 */
export function ExpensesScreenSkeleton() {
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
        {/* 1. Header with title & filter button */}
        <View style={styles.headerRow}>
          <SkeletonText width={160} height={28} />
          <SkeletonCircle size={40} />
        </View>

        {/* 2. Search Bar placeholder */}
        <View style={styles.searchBarWrapper}>
          <Skeleton
            width="100%"
            height={44}
            borderRadius={radius.lg}
            style={{ backgroundColor: colors.surfaceRecessed }}
          />
        </View>

        {/* 3. Filter Segment Tabs (All, Income, Expense, Transfer) */}
        <View style={styles.tabsRow}>
          {['All', 'Income', 'Expense', 'Transfer'].map((tab, idx) => (
            <Skeleton
              key={tab}
              width="23%"
              height={36}
              borderRadius={radius.full}
              style={[
                styles.tabPill,
                idx === 0 && { opacity: 0.95 },
              ]}
            />
          ))}
        </View>

        {/* 4. Monthly Total Stat Card */}
        <SkeletonCard style={styles.statCard}>
          <View style={styles.statRow}>
            <View>
              <SkeletonText width={90} height={12} style={{ marginBottom: 6 }} />
              <SkeletonText width={140} height={24} />
            </View>
            <Skeleton width={70} height={28} borderRadius={radius.full} />
          </View>
        </SkeletonCard>

        {/* 5. Date Group 1: "Today" */}
        <View style={styles.dateGroupHeader}>
          <SkeletonText width={80} height={14} />
          <SkeletonText width={60} height={13} />
        </View>

        <SkeletonCard style={styles.listCard}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.transactionRow,
                i > 1 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Skeleton width={42} height={42} borderRadius={13} />
              <View style={styles.rowDetails}>
                <SkeletonText
                  width={i === 2 ? 150 : 120}
                  height={15}
                  style={{ marginBottom: 6 }}
                />
                <SkeletonText width={85} height={11} />
              </View>
              <View style={styles.rowAmount}>
                <SkeletonText width={65} height={16} style={{ marginBottom: 4 }} />
                <Skeleton width={45} height={10} borderRadius={radius.sm} />
              </View>
            </View>
          ))}
        </SkeletonCard>

        {/* 6. Date Group 2: "Yesterday" */}
        <View style={[styles.dateGroupHeader, { marginTop: spacing[5] }]}>
          <SkeletonText width={95} height={14} />
          <SkeletonText width={55} height={13} />
        </View>

        <SkeletonCard style={styles.listCard}>
          {[1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.transactionRow,
                i > 1 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Skeleton width={42} height={42} borderRadius={13} />
              <View style={styles.rowDetails}>
                <SkeletonText width={130} height={15} style={{ marginBottom: 6 }} />
                <SkeletonText width={75} height={11} />
              </View>
              <View style={styles.rowAmount}>
                <SkeletonText width={60} height={16} style={{ marginBottom: 4 }} />
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
    marginBottom: spacing[3],
  },
  searchBarWrapper: {
    marginVertical: spacing[2],
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing[3],
  },
  tabPill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
  listCard: {
    padding: 0,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
  },
  rowDetails: {
    flex: 1,
    marginLeft: spacing[3],
  },
  rowAmount: {
    alignItems: 'flex-end',
  },
});

