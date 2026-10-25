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
 * BudgetsScreenSkeleton
 *
 * Visually replicates the Budgets & Goals screen:
 * - Header with title & Edit Budget action button
 * - Month navigator pill
 * - Large circular progress ring card with stats
 * - Category Budgets section with category progress cards
 */
export function BudgetsScreenSkeleton() {
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
        {/* 1. Header */}
        <View style={styles.headerRow}>
          <SkeletonText width={170} height={28} />
          <Skeleton width={100} height={36} borderRadius={radius.full} />
        </View>

        {/* 2. Month Selector Pill */}
        <View style={styles.monthPillRow}>
          <Skeleton width={150} height={34} borderRadius={radius.full} />
        </View>

        {/* 3. Monthly Budget Hero Card with Circular Ring */}
        <SkeletonCard style={styles.heroCard}>
          <View style={styles.ringCenterContainer}>
            {/* Outer Circular Progress Track Skeleton */}
            <View style={styles.ringContainer}>
              <SkeletonCircle size={140} />
              {/* Inner cutout simulating ring */}
              <View
                style={[
                  styles.ringInnerCutout,
                  { backgroundColor: colors.isDark ? '#141816' : '#FFFFFF' },
                ]}
              >
                <SkeletonText width={48} height={24} style={{ marginBottom: 4 }} />
                <SkeletonText width={34} height={11} />
              </View>
            </View>
          </View>

          {/* Stats below Ring */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <SkeletonText width={70} height={11} style={{ marginBottom: 4 }} />
              <SkeletonText width={80} height={18} />
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <SkeletonText width={70} height={11} style={{ marginBottom: 4 }} />
              <SkeletonText width={80} height={18} />
            </View>
          </View>
        </SkeletonCard>

        {/* 4. Category Budgets Header */}
        <View style={styles.sectionHeaderRow}>
          <SkeletonText width={160} height={20} />
          <Skeleton width={68} height={28} borderRadius={radius.full} />
        </View>

        {/* 5. Category Progress Cards */}
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} style={styles.categoryCard}>
            <View style={styles.categoryTopRow}>
              <View style={styles.categoryLeft}>
                <Skeleton width={42} height={42} borderRadius={13} />
                <View style={styles.categoryMeta}>
                  <SkeletonText
                    width={i === 2 ? 110 : 90}
                    height={15}
                    style={{ marginBottom: 5 }}
                  />
                  <SkeletonText width={60} height={11} />
                </View>
              </View>
              <View style={styles.categoryRight}>
                <SkeletonText width={75} height={16} style={{ marginBottom: 4 }} />
                <SkeletonText width={55} height={11} />
              </View>
            </View>

            {/* Progress Bar Track */}
            <View style={styles.progressBarWrapper}>
              <Skeleton
                width="100%"
                height={8}
                borderRadius={radius.full}
                style={{ backgroundColor: colors.surfaceRecessed }}
              />
            </View>
          </SkeletonCard>
        ))}
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
  monthPillRow: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing[5],
    marginBottom: spacing[4],
  },
  ringCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[2],
  },
  ringContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInnerCutout: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing[4],
    paddingTop: spacing[3],
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  categoryCard: {
    marginBottom: spacing[3],
    padding: spacing[3],
  },
  categoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryMeta: {
    marginLeft: spacing[3],
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  progressBarWrapper: {
    marginTop: spacing[1],
  },
});

