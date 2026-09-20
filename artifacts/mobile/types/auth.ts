export type LocalAuthState = {
  isAuthenticated: boolean;
  provider: "google" | "local";
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  lastLoginAt: string;
};

export type OnboardingState = {
  completed: boolean;
  version: number;
  completedAt?: string;
};

export type GoogleUserProfile = {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
};

export const CURRENT_ONBOARDING_VERSION = 1;

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completed: false,
  version: CURRENT_ONBOARDING_VERSION,
};

