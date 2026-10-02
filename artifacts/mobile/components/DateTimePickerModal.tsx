import React, { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { fontSize, fontWeight, radius, spacing } from "@/constants/tokens";
import { haptics } from "@/utils/haptics";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type DatePickerModalProps = {
  visible: boolean;
  currentDate: string; // "YYYY-MM-DD"
  currentTime?: string; // accepted for backward-compat
  onConfirm: (date: string, time?: string) => void;
  onClose: () => void;
};

export function DatePickerModal({
  visible,
  currentDate,
  currentTime,
  onConfirm,
  onClose,
}: DatePickerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(
    currentDate || new Date().toISOString().split("T")[0],
  );

  // Month and Year for Calendar Navigation
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  useEffect(() => {
    if (visible) {
      const activeDate = currentDate || new Date().toISOString().split("T")[0];
      setSelectedDate(activeDate);

      const d = new Date(activeDate);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      } else {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
      }
    }
  }, [visible, currentDate]);

  // Calendar Helpers
  const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const todayStr = new Date().toISOString().split("T")[0];

  const prevMonth = () => {
    void haptics.selection();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    void haptics.selection();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const setPresetDate = (daysAgo: number) => {
    void haptics.selection();
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const handleSelectDay = (day: number) => {
    void haptics.selection();
    const yStr = viewYear.toString();
    const mStr = (viewMonth + 1).toString().padStart(2, "0");
    const dStr = day.toString().padStart(2, "0");
    setSelectedDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleConfirm = () => {
    void haptics.selection();
    onConfirm(selectedDate, currentTime);
    onClose();
  };

  // Preview formatting
  const previewDateObj = new Date(selectedDate);
  const datePreviewText = isNaN(previewDateObj.getTime())
    ? selectedDate
    : previewDateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.fgSubtle }]} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.fg }]}>
                Select Date
              </Text>
              <Text style={[styles.subtitle, { color: colors.primary }]}>
                {datePreviewText}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Feather name="x" size={18} color={colors.fgMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Quick Preset Date Chips */}
            <View style={styles.presetsRow}>
              <Pressable
                onPress={() => setPresetDate(0)}
                style={[
                  styles.presetChip,
                  selectedDate === todayStr
                    ? { backgroundColor: `${colors.primary}20`, borderColor: colors.primary, borderWidth: 1 }
                    : { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    {
                      color: selectedDate === todayStr ? colors.primary : colors.fg,
                      fontWeight: selectedDate === todayStr ? fontWeight.bold : fontWeight.medium,
                    },
                  ]}
                >
                  Today
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPresetDate(1)}
                style={[
                  styles.presetChip,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.presetText, { color: colors.fg }]}>
                  Yesterday
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPresetDate(2)}
                style={[
                  styles.presetChip,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.presetText, { color: colors.fg }]}>
                  2 Days Ago
                </Text>
              </Pressable>
            </View>

            {/* Calendar Month Navigation */}
            <View style={styles.monthNav}>
              <Pressable
                onPress={prevMonth}
                hitSlop={12}
                style={[styles.navArrow, { backgroundColor: colors.surfaceRecessed }]}
              >
                <Feather name="chevron-left" size={18} color={colors.fg} />
              </Pressable>
              <Text style={[styles.monthTitle, { color: colors.fg }]}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={nextMonth}
                hitSlop={12}
                style={[styles.navArrow, { backgroundColor: colors.surfaceRecessed }]}
              >
                <Feather name="chevron-right" size={18} color={colors.fg} />
              </Pressable>
            </View>

            {/* Weekday Labels */}
            <View style={styles.weekdayRow}>
              {DAYS_OF_WEEK.map((day) => (
                <Text
                  key={day}
                  style={[styles.weekdayLabel, { color: colors.fgSubtle }]}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}
              {Array.from({ length: daysInViewMonth }).map((_, i) => {
                const dayNum = i + 1;
                const mStr = (viewMonth + 1).toString().padStart(2, "0");
                const dStr = dayNum.toString().padStart(2, "0");
                const thisDateStr = `${viewYear}-${mStr}-${dStr}`;
                const isSelected = selectedDate === thisDateStr;
                const isToday = thisDateStr === todayStr;

                return (
                  <Pressable
                    key={`day-${dayNum}`}
                    onPress={() => handleSelectDay(dayNum)}
                    style={[
                      styles.dayCell,
                      isSelected && {
                        backgroundColor: colors.primary,
                        borderRadius: radius.md,
                      },
                      !isSelected && isToday && {
                        borderWidth: 1,
                        borderColor: colors.primary,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: isSelected
                            ? colors.onPrimary
                            : isToday
                              ? colors.primary
                              : colors.fg,
                          fontWeight: isSelected || isToday
                            ? fontWeight.bold
                            : fontWeight.regular,
                        },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Confirm Button */}
          <Pressable
            onPress={handleConfirm}
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="check" size={18} color={colors.onPrimary} />
            <Text style={[styles.confirmBtnText, { color: colors.onPrimary }]}>
              Apply Date
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Keep export alias for any legacy references
export const DateTimePickerModal = DatePickerModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: spacing[4],
  },
  presetsRow: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  presetChip: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    alignItems: "center",
  },
  presetText: {
    fontSize: fontSize.xs,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing[1],
  },
  weekdayLabel: {
    width: 36,
    textAlign: "center",
    fontSize: 11,
    fontWeight: fontWeight.medium,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    rowGap: 4,
    marginBottom: spacing[3],
  },
  dayCell: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: fontSize.sm,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.hero,
    marginTop: spacing[2],
  },
  confirmBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
