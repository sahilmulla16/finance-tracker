import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { NotificationItem, useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { fontSize, fontWeight, radius, spacing } from "@/constants/tokens";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useFinance();

  const handleNotificationPress = async (item: NotificationItem) => {
    void Haptics.selectionAsync();
    await markNotificationRead(item.id);
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  const handleDelete = async (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await deleteNotification(id);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    return (
      <Pressable
        onPress={() => void handleNotificationPress(item)}
        style={({ pressed }) => [
          styles.notifCard,
          {
            backgroundColor: colors.surface,
            borderColor: item.read ? colors.border : `${colors.primary}40`,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            {!item.read && (
              <View
                style={[styles.unreadDot, { backgroundColor: colors.primary }]}
              />
            )}
            <Text
              style={[
                styles.notifTitle,
                {
                  color: colors.fg,
                  fontWeight: item.read
                    ? fontWeight.medium
                    : fontWeight.semibold,
                },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.notifTime, { color: colors.fgSubtle }]}>
              {item.time}
            </Text>
            <Pressable
              onPress={() => void handleDelete(item.id)}
              hitSlop={8}
              style={styles.deleteBtn}
              accessibilityLabel="Dismiss notification"
            >
              <Feather name="x" size={14} color={colors.fgSubtle} />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.notifMessage, { color: colors.fgMuted }]}>
          {item.message}
        </Text>

        {item.route && (
          <View style={styles.cardFooter}>
            <Text style={[styles.actionLink, { color: colors.primary }]}>
              View details
            </Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* App Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing[3],
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={20} color={colors.fg} />
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, { color: colors.fg }]}>
              Notifications
            </Text>
            {unreadNotificationsCount > 0 && (
              <Text style={[styles.headerSubtitle, { color: colors.fgSubtle }]}>
                {unreadNotificationsCount} unread
              </Text>
            )}
          </View>
        </View>

        {unreadNotificationsCount > 0 && (
          <Pressable
            onPress={() => void handleMarkAllRead()}
            style={styles.markAllBtn}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.fg }]}>
              No notifications
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.fgSubtle }]}>
              You're all caught up! New updates, milestones, and alerts will
              appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  markAllBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  markAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  notifCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flex: 1,
    paddingRight: spacing[2],
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  notifTitle: {
    fontSize: fontSize.base,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  notifTime: {
    fontSize: fontSize.xs,
  },
  deleteBtn: {
    padding: 2,
  },
  notifMessage: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    marginTop: spacing[3],
    paddingTop: spacing[2],
  },
  actionLink: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[6],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
  },
});
