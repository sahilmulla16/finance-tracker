type PostHogExtra = {
  posthogProjectToken?: string;
  posthogHost?: string;
};

let extra: PostHogExtra | undefined = undefined;
try {
  // Safe dynamic access to expo-constants that degrades cleanly in pure Node/test environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Constants = require("expo-constants").default || require("expo-constants");
  extra = Constants?.expoConfig?.extra as PostHogExtra | undefined;
} catch {
  // In pure unit test environments without Expo native runtime
}

const projectToken =
  extra?.posthogProjectToken ||
  process.env.POSTHOG_PROJECT_TOKEN ||
  process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN;

const host =
  extra?.posthogHost ||
  process.env.POSTHOG_HOST ||
  process.env.EXPO_PUBLIC_POSTHOG_HOST ||
  "https://us.i.posthog.com";

const isDev =
  typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

if (isDev && !projectToken && !process.env.CI) {
  console.warn(
    "[PostHog] POSTHOG_PROJECT_TOKEN is not configured. Product analytics will remain disabled.",
  );
}

// Single instance initialization
let client: any = undefined;

if (projectToken && host) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PostHog = require("posthog-react-native").default || require("posthog-react-native");
    client = new PostHog(projectToken, {
      host,
      defaultOptIn: false, // Critical: Starts opted-out by default for DPDP compliance until consent is confirmed
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
        },
      },
      logs: {
        serviceName: "zeno-mobile",
        environment: isDev ? "development" : "production",
      },
    });
  } catch (initErr) {
    if (isDev) {
      console.warn("[PostHog] Initialization error (e.g. running in test runner):", initErr);
    }
  }
}

export const posthog = client;

export function isPostHogConfigured(): boolean {
  return Boolean(posthog);
}

export async function optInPostHog(): Promise<void> {
  if (!posthog) return;
  try {
    await posthog.optIn();
  } catch (err) {
    if (__DEV__) {
      console.warn("[PostHog] optIn error:", err);
    }
  }
}

export async function optOutPostHog(): Promise<void> {
  if (!posthog) return;
  try {
    await posthog.optOut();
  } catch (err) {
    if (__DEV__) {
      console.warn("[PostHog] optOut error:", err);
    }
  }
}

export function resetPostHog(): void {
  if (!posthog) return;
  try {
    posthog.reset();
  } catch (err) {
    if (__DEV__) {
      console.warn("[PostHog] reset error:", err);
    }
  }
}

export function identifyPostHog(userId: string): void {
  if (!posthog || !userId) return;
  try {
    // Only pass non-PII internal distinctId. Never pass email or name.
    posthog.identify(userId);
  } catch (err) {
    if (__DEV__) {
      console.warn("[PostHog] identify error:", err);
    }
  }
}
