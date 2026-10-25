import React, { useState } from "react";
import { StyleSheet, TextInput, View, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { radius, spacing, fontSize } from "@/constants/tokens";
import { haptics } from "@/utils/haptics";

interface AIChatInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  horizontalPadding?: number;
  inputRef?: React.Ref<TextInput>;
  autoFocus?: boolean;
}

export function AIChatInput({
  value,
  onChangeText,
  onSend,
  disabled = false,
  placeholder = "Ask Zeno anything...",
  horizontalPadding = 20,
  inputRef,
  autoFocus,
}: AIChatInputProps) {
  const colors = useColors();
  const [internalText, setInternalText] = useState("");

  const text = value !== undefined ? value : internalText;
  const setText = onChangeText || setInternalText;

  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    const toSend = text.trim();
    if (value === undefined) {
      setInternalText("");
    }
    void haptics.low();
    onSend(toSend);
  };

  return (
    <View style={[styles.wrapper, { paddingHorizontal: horizontalPadding }]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          autoFocus={autoFocus}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.fgSubtle}
          multiline
          maxLength={400}
          editable={!disabled}
          style={[
            styles.textInput,
            {
              color: colors.fg,
            },
          ]}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={true}
        />

        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            hitSlop={6}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: canSend
                  ? colors.primary
                  : colors.surfaceElevated,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            accessibilityLabel="Send message"
          >
            <Feather
              name="arrow-up"
              size={17}
              color={canSend ? colors.onPrimary : colors.fgSubtle}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 10,
    paddingTop: 6,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.hero,
    borderWidth: 1,
    paddingLeft: spacing[4],
    paddingRight: 6,
    paddingVertical: 5,
    borderCurve: "continuous",
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.base,
    maxHeight: 88,
    minHeight: 36,
    paddingTop: Platform.OS === "ios" ? 8 : 4,
    paddingBottom: Platform.OS === "ios" ? 8 : 4,
    paddingRight: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
});
