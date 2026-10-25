import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  NativeModules,
  AppState,
  AppStateStatus,
  Linking,
  ActivityIndicator,
  DeviceEventEmitter,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useVideoPlayer, VideoView } from "expo-video";
import { spacing, radius, fontWeight } from "@/constants/tokens";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export type TutorialFeature = "quick_add" | "smart_track";

export interface TutorialVideoModalProps {
  visible: boolean;
  feature: TutorialFeature;
  onClose: () => void;
  onSuccess: () => void;
}

interface TutorialConfig {
  title: string;
  subtitle: string;
  videoSource: number;
  settingsLabel: string;
  targetSettingName: string;
  openSettings: () => Promise<boolean>;
  checkPermission: () => Promise<boolean>;
}

const TUTORIAL_CONFIGS: Record<TutorialFeature, TutorialConfig> = {
  quick_add: {
    title: "Quick Add Tutorial",
    subtitle:
      "Watch the recording to see how to enable Quick Add in Accessibility Settings.",
    videoSource: require("@/assets/tut-vid/quick_add_tutorial.mp4"),
    settingsLabel: "Accessibility Settings",
    targetSettingName: "Zeno Quick Add (Accessibility)",
    openSettings: async () => {
      if (NativeModules.PocketflowQuickAdd?.openAccessibilitySettings) {
        try {
          await NativeModules.PocketflowQuickAdd.openAccessibilitySettings();
          return true;
        } catch {
          // fallback
        }
      }
      try {
        await Linking.sendIntent("android.settings.ACCESSIBILITY_SETTINGS");
        return true;
      } catch {
        await Linking.openSettings();
        return true;
      }
    },
    checkPermission: async () => {
      if (Platform.OS !== "android") return true;
      try {
        const isEnabled =
          await NativeModules.PocketflowQuickAdd?.isAccessibilityServiceEnabled();
        return Boolean(isEnabled);
      } catch {
        return false;
      }
    },
  },
  smart_track: {
    title: "Smart Auto-Track Tutorial",
    subtitle:
      "Watch the recording to see how to enable Notification Access in Settings.",
    videoSource: require("@/assets/tut-vid/smart_track_tutorial.mp4"),
    settingsLabel: "Notification Access",
    targetSettingName: "Zeno Notification Listener",
    openSettings: async () => {
      if (NativeModules.PocketflowQuickAdd?.openNotificationListenerSettings) {
        try {
          await NativeModules.PocketflowQuickAdd.openNotificationListenerSettings();
          return true;
        } catch {
          // fallback
        }
      }
      try {
        await Linking.sendIntent(
          "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS",
        );
        return true;
      } catch {
        await Linking.openSettings();
        return true;
      }
    },
    checkPermission: async () => {
      if (Platform.OS !== "android") return true;
      try {
        const isEnabled =
          await NativeModules.PocketflowQuickAdd?.isNotificationListenerEnabled();
        return Boolean(isEnabled);
      } catch {
        return false;
      }
    },
  },
};

export function TutorialVideoModal({
  visible,
  feature,
  onClose,
  onSuccess,
}: TutorialVideoModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = colors.isDark;
  const config = TUTORIAL_CONFIGS[feature] || TUTORIAL_CONFIGS.quick_add;

  const [waitingForSettingsReturn, setWaitingForSettingsReturn] =
    useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [pipActive, setPipActive] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoViewRef = useRef<VideoView>(null);

  // Initialize expo-video player
  const player = useVideoPlayer(config.videoSource, (p) => {
    p.loop = true;
    p.muted = false;
    try {
      p.play();
    } catch {
      // autoplay handled safely
    }
  });

  // Track playback state
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener("playingChange", ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });
    return () => {
      sub.remove();
    };
  }, [player]);

  // Restart video and reset state when modal opens
  useEffect(() => {
    if (visible) {
      setPermissionError(false);
      setWaitingForSettingsReturn(false);
      setVideoError(false);
      setPipActive(false);
      if (player) {
        try {
          player.currentTime = 0;
          player.play();
        } catch {
          // graceful fallback
        }
      }
    } else {
      if (player) {
        try {
          player.pause();
        } catch {
          // graceful fallback
        }
      }
    }
  }, [visible, player, feature]);

  // Listen for native Android PiP mode transitions
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "onPictureInPictureModeChanged",
      (inPip: boolean) => {
        setPipActive(Boolean(inPip));
      },
    );
    return () => {
      sub.remove();
    };
  }, []);

  // Android Back button support when sheet is open
  useEffect(() => {
    if (!visible || pipActive) return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [visible, pipActive, onClose]);

  // Handle returning from Android Settings to verify permission
  const checkPermissionState = useCallback(async () => {
    setPipActive(false);
    const isGranted = await config.checkPermission();
    if (isGranted) {
      setWaitingForSettingsReturn(false);
      setPermissionError(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } else {
      setWaitingForSettingsReturn(false);
      setPermissionError(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [config, onSuccess]);

  useEffect(() => {
    if (!waitingForSettingsReturn) return;

    const sub = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          // Exited Settings and returned to Zeno -> verify permission!
          void checkPermissionState();
        }
      },
    );

    return () => sub.remove();
  }, [waitingForSettingsReturn, checkPermissionState]);

  // "Got It" button handler: initiates PiP and opens Settings
  const handleGotIt = async () => {
    void Haptics.selectionAsync();
    setWaitingForSettingsReturn(true);
    setPermissionError(false);

    // 1. Immediately switch to PiP view mode so the transition snapshot is 100% full-opacity video
    setPipActive(true);

    // 2. Attempt Picture-in-Picture if supported on device
    let enteredPip = false;
    if (Platform.OS === "android") {
      try {
        if (videoViewRef.current?.startPictureInPicture) {
          await videoViewRef.current.startPictureInPicture();
          enteredPip = true;
        } else if (NativeModules.PocketflowQuickAdd?.enterPictureInPicture) {
          enteredPip = Boolean(
            await NativeModules.PocketflowQuickAdd.enterPictureInPicture(9, 16),
          );
        }
      } catch {
        enteredPip = false;
      }
    }

    if (!enteredPip) {
      // If PiP is unsupported or denied, restore normal sheet mode
      setPipActive(false);
    }

    // 3. Open the appropriate Android Settings screen
    try {
      await config.openSettings();
    } catch {
      setWaitingForSettingsReturn(false);
      setPermissionError(true);
      setPipActive(false);
    }
  };

  const togglePlayback = () => {
    void Haptics.selectionAsync();
    if (!player) return;
    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      // safe
    }
  };

  if (!visible) return null;

  // When PiP mode is active:
  // Render ONLY the 100% full-bleed video player at 100% opacity with pitch-black background.
  // NO translucent backdrop, NO modal cards, NO text, NO padding, NO buttons.
  // This completely eliminates any reduced opacity or dimming in PiP mode!
  if (pipActive) {
    return (
      <View style={styles.pipFullScreenOverlay} pointerEvents="auto">
        <VideoView
          ref={videoViewRef}
          style={styles.pipVideoElement}
          player={player}
          allowsPictureInPicture={true}
          startsPictureInPictureAutomatically={true}
          contentFit="contain"
          nativeControls={false}
          onPictureInPictureStart={() => setPipActive(true)}
          onPictureInPictureStop={() => setPipActive(false)}
        />
      </View>
    );
  }

  // Normal sheet mode dimensions: optimized 9:16 portrait player
  const videoPlayerWidth = Math.min(SCREEN_WIDTH - 48, 290);
  const videoPlayerHeight = Math.min(SCREEN_HEIGHT * 0.44, 420);

  return (
    <View style={styles.modalRootOverlay} pointerEvents="box-none">
      {/* Semi-transparent dark backdrop dismissable on tap */}
      <Pressable
        style={styles.backdropOverlay}
        onPress={() => {
          void Haptics.selectionAsync();
          onClose();
        }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss tutorial"
      />

      {/* Bottom Sheet Card */}
      <View
        style={[
          styles.modalContentCard,
          {
            backgroundColor: isDark ? "#121714" : "#FFFFFF",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.14)"
              : "rgba(16, 28, 61, 0.12)",
            paddingBottom: insets.bottom + spacing[4],
          },
        ]}
      >
        {/* Top Drag Indicator Pill */}
        <View
          style={[
            styles.dragHandle,
            { backgroundColor: isDark ? "#2A322C" : "#D4DCE6" },
          ]}
        />

        {/* Modal Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.titleBadgeRow}>
              <View
                style={[
                  styles.featureIconBox,
                  {
                    backgroundColor: isDark
                      ? "rgba(61, 220, 151, 0.16)"
                      : "rgba(16, 28, 61, 0.08)",
                  },
                ]}
              >
                <Feather
                  name={feature === "quick_add" ? "zap" : "bell"}
                  size={14}
                  color={colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.modalTitleText,
                  { color: isDark ? "#FFFFFF" : "#101C3D" },
                ]}
              >
                {config.title}
              </Text>
            </View>
            <Text
              style={[
                styles.modalSubtitleText,
                { color: isDark ? "#9AA5A0" : "#5B6575" },
              ]}
            >
              {config.subtitle}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onClose();
            }}
            style={({ pressed }) => [
              styles.closeCircleBtn,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#F0F4F8",
              },
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close tutorial"
          >
            <Feather
              name="x"
              size={18}
              color={isDark ? "#FFFFFF" : "#101C3D"}
            />
          </Pressable>
        </View>

        {/* Permission Not Enabled Alert (shown when user returns without enabling) */}
        {permissionError && (
          <View
            style={[
              styles.errorNoticeBox,
              {
                backgroundColor: isDark
                  ? "rgba(255, 107, 107, 0.12)"
                  : "rgba(226, 55, 68, 0.08)",
                borderColor: isDark
                  ? "rgba(255, 107, 107, 0.35)"
                  : "rgba(226, 55, 68, 0.25)",
              },
            ]}
          >
            <Feather
              name="alert-circle"
              size={16}
              color={isDark ? "#FF6B6B" : "#E23744"}
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.errorNoticeTitle,
                  { color: isDark ? "#FF6B6B" : "#E23744" },
                ]}
              >
                Permission not enabled yet
              </Text>
              <Text
                style={[
                  styles.errorNoticeSubtext,
                  { color: isDark ? "#D2D9D5" : "#4A5568" },
                ]}
              >
                Please follow the highlighted steps in the video and tap
                "Got It" to try again.
              </Text>
            </View>
          </View>
        )}

        {/* Video Player Display Zone */}
        <View
          style={[
            styles.videoFrameContainer,
            {
              width: videoPlayerWidth,
              height: videoPlayerHeight,
              backgroundColor: isDark ? "#0A0D0B" : "#0A0F1D",
              borderColor: isDark
                ? "rgba(61, 220, 151, 0.30)"
                : "rgba(16, 28, 61, 0.18)",
            },
          ]}
        >
          {!videoError ? (
            <VideoView
              ref={videoViewRef}
              style={styles.videoPlayerElement}
              player={player}
              allowsPictureInPicture={true}
              startsPictureInPictureAutomatically={true}
              contentFit="contain"
              nativeControls={false}
              onPictureInPictureStart={() => setPipActive(true)}
              onPictureInPictureStop={() => setPipActive(false)}
            />
          ) : (
            <View style={styles.fallbackPlayerCard}>
              <Feather
                name="video"
                size={36}
                color={colors.primary}
                style={{ marginBottom: 10 }}
              />
              <Text
                style={[
                  styles.fallbackTitle,
                  { color: isDark ? "#FFFFFF" : "#101C3D" },
                ]}
              >
                {config.title}
              </Text>
              <Text style={styles.fallbackSub}>
                Follow the on-screen steps in {config.settingsLabel}.
              </Text>
            </View>
          )}

          {/* Floating Play/Pause Control Overlay */}
          <Pressable
            onPress={togglePlayback}
            style={({ pressed }) => [
              styles.floatingPlayToggle,
              {
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.55)"
                  : "rgba(16, 28, 61, 0.65)",
              },
              pressed && { opacity: 0.8 },
            ]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
          >
            <Feather
              name={isPlaying ? "pause" : "play"}
              size={16}
              color="#FFFFFF"
            />
          </Pressable>

          {/* PiP Indicator Badge */}
          <View style={styles.pipHintBadge}>
            <Feather name="airplay" size={11} color={colors.primary} />
            <Text style={[styles.pipHintText, { color: colors.primary }]}>
              PiP Floating Video
            </Text>
          </View>
        </View>

        {/* Bottom Action Area: "Got It" Primary CTA */}
        <View style={styles.bottomActionsArea}>
          <Pressable
            onPress={handleGotIt}
            disabled={waitingForSettingsReturn}
            style={({ pressed }) => [
              styles.gotItPillBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Got It"
          >
            {waitingForSettingsReturn ? (
              <View style={styles.waitingStatusRow}>
                <ActivityIndicator
                  size="small"
                  color={colors.onPrimary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.gotItBtnText,
                    { color: colors.onPrimary },
                  ]}
                >
                  Checking Setting Status...
                </Text>
              </View>
            ) : (
              <View style={styles.btnContentRow}>
                <Text
                  style={[
                    styles.gotItBtnText,
                    { color: colors.onPrimary },
                  ]}
                >
                  Got It — Open Settings
                </Text>
                <Feather
                  name="arrow-right"
                  size={18}
                  color={colors.onPrimary}
                />
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onClose();
            }}
            style={styles.cancelLinkBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Maybe later"
          >
            <Text
              style={[
                styles.cancelLinkText,
                { color: isDark ? "#9AA5A0" : "#5B6575" },
              ]}
            >
              Maybe later
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full-bleed PiP view: 100% full screen, 100% opaque, pitch black background, zero dimming
  pipFullScreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    opacity: 1,
    zIndex: 999999,
    elevation: 999999,
    justifyContent: "center",
    alignItems: "center",
  },
  pipVideoElement: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    opacity: 1,
  },

  // Normal sheet modal overlay styles
  modalRootOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 99999,
    elevation: 99999,
    justifyContent: "flex-end",
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  modalContentCard: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    paddingTop: 12,
    paddingHorizontal: spacing[5],
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  dragHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  featureIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  modalSubtitleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  errorNoticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  errorNoticeTitle: {
    fontSize: 12.5,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  errorNoticeSubtext: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  videoFrameContainer: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 14,
  },
  videoPlayerElement: {
    width: "100%",
    height: "100%",
  },
  floatingPlayToggle: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  pipHintBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    zIndex: 10,
  },
  pipHintText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  fallbackPlayerCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
  },
  fallbackSub: {
    fontSize: 12,
    color: "#8A9791",
    textAlign: "center",
  },
  bottomActionsArea: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: 8,
  },
  gotItPillBtn: {
    width: "100%",
    height: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waitingStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  gotItBtnText: {
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  cancelLinkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelLinkText: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
  },
});
