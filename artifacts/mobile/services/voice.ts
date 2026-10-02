import { NativeEventEmitter, NativeModules, Platform, PermissionsAndroid } from "react-native";

const { PocketflowVoice } = NativeModules;
const voiceEmitter = PocketflowVoice ? new NativeEventEmitter(PocketflowVoice) : null;

export type VoiceState = "IDLE" | "LISTENING" | "PROCESSING" | "RESULT" | "ERROR";

export type SpeechCallbacks = {
  onStart?: () => void;
  onSpeaking?: () => void;
  onVolumeChanged?: (rms: number) => void;
  onPartialResult?: (text: string) => void;
  onResult?: (text: string, allResults: string[]) => void;
  onError?: (error: string, code?: number) => void;
  onEnd?: () => void;
};

let activeSubscriptions: Array<{ remove: () => void }> = [];

/**
 * Requests RECORD_AUDIO runtime permission on Android.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: "Microphone Access Required",
        message:
          "Zeno needs microphone access to listen to your voice and log transactions automatically.",
        buttonPositive: "Grant Permission",
        buttonNegative: "Cancel",
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Checks if on-device speech recognition is available.
 */
export async function isSpeechAvailable(): Promise<boolean> {
  if (!PocketflowVoice) {
    return false;
  }
  try {
    return await PocketflowVoice.isAvailable();
  } catch {
    return false;
  }
}

/**
 * Starts speech recognition session for a single segment.
 */
export async function startSpeechRecognition(
  callbacks: SpeechCallbacks,
  locale?: string,
): Promise<boolean> {
  // Clear any existing event subscriptions
  stopEventSubscriptions();

  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) {
    callbacks.onError?.("Microphone permission was denied. Please grant microphone access in settings.");
    return false;
  }

  if (!PocketflowVoice) {
    callbacks.onError?.("Native speech recognition module is not available in this environment.");
    return false;
  }

  if (voiceEmitter) {
    if (callbacks.onStart) {
      activeSubscriptions.push(
        voiceEmitter.addListener("onSpeechStart", () => callbacks.onStart?.()),
      );
    }
    if (callbacks.onSpeaking) {
      activeSubscriptions.push(
        voiceEmitter.addListener("onSpeechSpeaking", () => callbacks.onSpeaking?.()),
      );
    }
    if (callbacks.onVolumeChanged) {
      activeSubscriptions.push(
        voiceEmitter.addListener("onSpeechVolumeChanged", (event: { rms: number }) => {
          callbacks.onVolumeChanged?.(event.rms);
        }),
      );
    }
    if (callbacks.onPartialResult) {
      activeSubscriptions.push(
        voiceEmitter.addListener("onSpeechPartialResults", (event: { partialText: string }) => {
          callbacks.onPartialResult?.(event.partialText);
        }),
      );
    }
    if (callbacks.onResult) {
      activeSubscriptions.push(
        voiceEmitter.addListener("onSpeechResults", (event: { text: string; results?: string[] }) => {
          callbacks.onResult?.(event.text, event.results || [event.text]);
        }),
      );
    }
    if (callbacks.onError) {
      activeSubscriptions.push(
        voiceEmitter.addListener("onSpeechError", (event: { code: number; message: string }) => {
          callbacks.onError?.(event.message || `Speech recognition error (${event.code})`, event.code);
        }),
      );
    }
    if (callbacks.onEnd) {
      activeSubscriptions.push(
        voiceEmitter.addListener("onSpeechEnd", () => callbacks.onEnd?.()),
      );
    }
  }

  try {
    await PocketflowVoice.startSpeech(locale || null);
    return true;
  } catch (err: any) {
    callbacks.onError?.(err?.message || "Failed to start speech recognition.");
    stopEventSubscriptions();
    return false;
  }
}

/**
 * Stops listening and finalizes transcription.
 */
export async function stopSpeechRecognition(): Promise<void> {
  if (PocketflowVoice) {
    try {
      await PocketflowVoice.stopSpeech();
    } catch {
      // ignore
    }
  }
}

/**
 * Cancels current speech recognition and cleans up listeners.
 */
export async function cancelSpeechRecognition(): Promise<void> {
  stopEventSubscriptions();
  if (PocketflowVoice) {
    try {
      await PocketflowVoice.cancelSpeech();
    } catch {
      // ignore
    }
  }
}

function stopEventSubscriptions(): void {
  for (const sub of activeSubscriptions) {
    try {
      sub.remove();
    } catch {
      // ignore
    }
  }
  activeSubscriptions = [];
}

/**
 * Safely appends a newly finalized speech segment without duplicate clauses.
 */
export function appendSegment(segments: string[], newSegment: string): void {
  const clean = newSegment.trim();
  if (!clean) return;

  if (segments.length === 0) {
    segments.push(clean);
    return;
  }

  const lastIdx = segments.length - 1;
  const last = segments[lastIdx];
  const lastLower = last.toLowerCase().trim();
  const cleanLower = clean.toLowerCase();

  // 1. Exact duplicate segment
  if (lastLower === cleanLower) return;

  // 2. Last segment already contains or ends with the new segment
  if (lastLower.endsWith(cleanLower)) return;

  // 3. New segment is a more complete expansion of the last segment
  if (cleanLower.startsWith(lastLower)) {
    segments[lastIdx] = clean;
    return;
  }

  segments.push(clean);
}

/**
 * Combines accumulated transcript segments with proper punctuation and natural phrasing.
 */
export function combineSegments(segments: string[]): string {
  if (segments.length === 0) return "";
  if (segments.length === 1) return segments[0].trim();

  let result = "";
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i].trim();
    if (!s) continue;

    if (!result) {
      result = s;
    } else {
      const lastChar = result[result.length - 1];
      const hasTerminal = lastChar === "." || lastChar === "," || lastChar === ";" || lastChar === "!";
      const firstWord = s.split(/\s+/)[0]?.toLowerCase();

      // Connect naturally if next segment starts with a conjunction
      if (firstWord === "then" || firstWord === "and" || firstWord === "also" || firstWord === "plus") {
        result += (hasTerminal ? " " : ", ") + s;
      } else {
        result += (hasTerminal ? " " : ", ") + s;
      }
    }
  }

  return result.trim();
}

export type ContinuousVoiceCallbacks = {
  onStart?: () => void;
  onSpeaking?: () => void;
  onVolumeChanged?: (rms: number) => void;
  onTranscriptChange?: (liveTranscript: string) => void;
  onError?: (error: string) => void;
};

/**
 * Continuous Voice Session Manager
 *
 * Keeps Zeno listening continuously across pauses and sentences.
 * - Does NOT stop on silence or pause timeouts (SpeechRecognizer.ERROR_SPEECH_TIMEOUT / ERROR_NO_MATCH).
 * - Does NOT stop on onEndOfSpeech.
 * - Accumulates finalized segments into a single cohesive transcript.
 * - Displays in-flight interim results for live visual feedback.
 * - The session finishes ONLY when the user explicitly calls finish() (taps Done).
 */
export class ContinuousVoiceSession {
  private isActive: boolean = false;
  private isRestarting: boolean = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private segments: string[] = [];
  private currentPartial: string = "";
  private callbacks: ContinuousVoiceCallbacks = {};
  private locale?: string;

  public isListening(): boolean {
    return this.isActive;
  }

  public async start(callbacks: ContinuousVoiceCallbacks, locale?: string): Promise<boolean> {
    this.isActive = true;
    this.isRestarting = false;
    this.segments = [];
    this.currentPartial = "";
    this.callbacks = callbacks;
    this.locale = locale;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    return await this.startNativeRecognizer();
  }

  private async startNativeRecognizer(): Promise<boolean> {
    if (!this.isActive) return false;

    return await startSpeechRecognition(
      {
        onStart: () => {
          if (!this.isActive) return;
          this.callbacks.onStart?.();
        },
        onSpeaking: () => {
          if (!this.isActive) return;
          this.callbacks.onSpeaking?.();
        },
        onVolumeChanged: (rms) => {
          if (!this.isActive) return;
          this.callbacks.onVolumeChanged?.(rms);
        },
        onPartialResult: (partialText) => {
          if (!this.isActive) return;
          this.currentPartial = partialText;
          const live = this.getCombinedTranscript();
          this.callbacks.onTranscriptChange?.(live);
        },
        onResult: (finalText) => {
          if (!this.isActive) return;
          if (finalText && finalText.trim().length > 0) {
            appendSegment(this.segments, finalText);
          }
          this.currentPartial = "";
          const live = this.getCombinedTranscript();
          this.callbacks.onTranscriptChange?.(live);

          // Android segment finished, but user HAS NOT TAPPED DONE.
          // Safely restart recognition to continue listening for next sentence.
          this.scheduleRestart();
        },
        onError: (errMsg, code) => {
          if (!this.isActive) return;

          // Benign pause / timeout codes on Android
          const isBenignPause =
            code === 6 || // ERROR_SPEECH_TIMEOUT (no speech input detected while waiting)
            code === 7 || // ERROR_NO_MATCH (short pause)
            code === 8 || // ERROR_RECOGNIZER_BUSY
            errMsg.toLowerCase().includes("no speech") ||
            errMsg.toLowerCase().includes("no match") ||
            errMsg.toLowerCase().includes("timeout") ||
            errMsg.toLowerCase().includes("busy");

          if (isBenignPause) {
            // User paused naturally. Keep voice mode active and restart safely.
            this.scheduleRestart();
          } else {
            // Fatal error (permission revoked, hardware unavail, etc.)
            this.isActive = false;
            this.callbacks.onError?.(errMsg);
          }
        },
        onEnd: () => {
          // Native segment ended. Ensure continuous listening if session is still active.
          if (this.isActive) {
            this.scheduleRestart();
          }
        },
      },
      this.locale,
    );
  }

  private scheduleRestart(): void {
    if (!this.isActive || this.isRestarting) return;
    this.isRestarting = true;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
    }

    this.restartTimer = setTimeout(async () => {
      this.restartTimer = null;
      if (!this.isActive) {
        this.isRestarting = false;
        return;
      }
      try {
        await this.startNativeRecognizer();
      } catch {
        if (this.isActive) {
          this.restartTimer = setTimeout(() => {
            if (this.isActive) void this.startNativeRecognizer();
            this.isRestarting = false;
          }, 250);
          return;
        }
      }
      this.isRestarting = false;
    }, 70);
  }

  public getCombinedTranscript(): string {
    const all = [...this.segments];
    if (this.currentPartial && this.currentPartial.trim().length > 0) {
      const cleanPartial = this.currentPartial.trim();
      const last = all[all.length - 1];
      if (
        !last ||
        (!last.toLowerCase().endsWith(cleanPartial.toLowerCase()) &&
          last.toLowerCase() !== cleanPartial.toLowerCase())
      ) {
        all.push(cleanPartial);
      }
    }
    return combineSegments(all);
  }

  /**
   * The user tapped Done.
   * 1. Stop active recognizer.
   * 2. Finalize all pending recognition results.
   * 3. Commit in-flight interim text if any.
   * 4. Return the complete session transcript.
   */
  public async finish(): Promise<string> {
    this.isActive = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    try {
      await stopSpeechRecognition();
    } catch {}

    if (this.currentPartial && this.currentPartial.trim().length > 0) {
      appendSegment(this.segments, this.currentPartial);
      this.currentPartial = "";
    }

    return combineSegments(this.segments);
  }

  /**
   * Cancel and discard current voice session.
   */
  public async cancel(): Promise<void> {
    this.isActive = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.segments = [];
    this.currentPartial = "";
    try {
      await cancelSpeechRecognition();
    } catch {}
  }
}
