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
 * AiScreenSkeleton
 *
 * Visually replicates the Zeno AI Assistant screen:
 * - Top header with Zeno mark
 * - Center mascot glow area
 * - Personalized greeting title & subtitle
 * - 3 Quick prompt cards (Spending insights, Affordability, Saving tips)
 * - Bottom input bar
 */
export function AiScreenSkeleton() {
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
        {/* 1. Header with Zeno AI Brand Mark */}
        <View style={styles.headerRow}>
          <SkeletonCircle size={36} />
          <SkeletonText width={120} height={20} style={{ marginLeft: spacing[2] }} />
        </View>

        {/* 2. Mascot Center Stage */}
        <View style={styles.mascotWrapper}>
          <SkeletonCircle size={180} style={styles.mascotCircle} />
        </View>

        {/* 3. Greeting Typography */}
        <View style={styles.greetingWrapper}>
          <SkeletonText width={170} height={28} style={{ marginBottom: spacing[2] }} />
          <SkeletonText width={240} height={14} />
        </View>

        {/* 4. Quick Cards */}
        <View style={styles.quickCardsCol}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} style={styles.quickCard}>
              <View style={styles.quickCardRow}>
                <SkeletonCircle size={38} />
                <View style={styles.quickCardMeta}>
                  <SkeletonText width={140} height={16} style={{ marginBottom: 4 }} />
                  <SkeletonText width={200} height={11} />
                </View>
                <Skeleton width={18} height={18} borderRadius={6} />
              </View>
            </SkeletonCard>
          ))}
        </View>

        {/* 5. Bottom Input Placeholder */}
        <View style={styles.bottomBarWrapper}>
          <Skeleton
            width="100%"
            height={56}
            borderRadius={radius.full}
            style={{ backgroundColor: colors.surfaceRecessed }}
          />
        </View>
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
    marginBottom: spacing[4],
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[4],
  },
  mascotCircle: {
    opacity: 0.85,
  },
  greetingWrapper: {
    alignItems: 'center',
    marginVertical: spacing[3],
  },
  quickCardsCol: {
    marginVertical: spacing[3],
    gap: spacing[2],
  },
  quickCard: {
    padding: spacing[3],
  },
  quickCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickCardMeta: {
    flex: 1,
    marginLeft: spacing[3],
  },
  bottomBarWrapper: {
    marginTop: spacing[4],
  },
});

