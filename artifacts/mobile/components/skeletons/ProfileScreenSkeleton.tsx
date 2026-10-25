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
 * ProfileScreenSkeleton
 *
 * Visually replicates the Profile screen:
 * - Header title
 * - User Profile Card (large avatar, name, email, edit action)
 * - Accounts & Wallets section
 * - Preferences & Settings card rows
 * - Security & Data section
 */
export function ProfileScreenSkeleton() {
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
          <SkeletonText width={110} height={28} />
        </View>

        {/* 2. User Profile Card */}
        <SkeletonCard style={styles.userCard}>
          <View style={styles.userCenterRow}>
            <SkeletonCircle size={76} />
            <View style={styles.userInfoCol}>
              <SkeletonText width={140} height={20} style={{ marginBottom: 6 }} />
              <SkeletonText width={100} height={13} style={{ marginBottom: 10 }} />
              <Skeleton width={96} height={28} borderRadius={radius.full} />
            </View>
          </View>
        </SkeletonCard>

        {/* 3. Accounts Section */}
        <View style={styles.sectionHeaderRow}>
          <SkeletonText width={130} height={14} />
          <Skeleton width={50} height={22} borderRadius={radius.full} />
        </View>

        <SkeletonCard style={styles.settingsGroupCard}>
          {[1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.rowItem,
                i > 1 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Skeleton width={38} height={38} borderRadius={10} />
              <View style={styles.rowItemContent}>
                <SkeletonText width={110} height={15} style={{ marginBottom: 4 }} />
                <SkeletonText width={70} height={11} />
              </View>
              <SkeletonText width={60} height={15} />
            </View>
          ))}
        </SkeletonCard>

        {/* 4. Preferences Section */}
        <View style={styles.sectionHeaderRow}>
          <SkeletonText width={100} height={14} />
        </View>

        <SkeletonCard style={styles.settingsGroupCard}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.rowItem,
                i > 1 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Skeleton width={38} height={38} borderRadius={10} />
              <View style={styles.rowItemContent}>
                <SkeletonText width={130} height={15} style={{ marginBottom: 4 }} />
                <SkeletonText width={80} height={11} />
              </View>
              <Skeleton width={20} height={20} borderRadius={6} />
            </View>
          ))}
        </SkeletonCard>

        {/* 5. Security & Data Section */}
        <View style={styles.sectionHeaderRow}>
          <SkeletonText width={120} height={14} />
        </View>

        <SkeletonCard style={styles.settingsGroupCard}>
          {[1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.rowItem,
                i > 1 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Skeleton width={38} height={38} borderRadius={10} />
              <View style={styles.rowItemContent}>
                <SkeletonText width={115} height={15} style={{ marginBottom: 4 }} />
                <SkeletonText width={85} height={11} />
              </View>
              <Skeleton width={18} height={18} borderRadius={6} />
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
    marginBottom: spacing[4],
  },
  userCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  userCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoCol: {
    marginLeft: spacing[4],
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
  settingsGroupCard: {
    padding: 0,
    marginBottom: spacing[2],
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
  },
  rowItemContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
});

