import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { GoogleUserProfile } from "@/types/auth";

WebBrowser.maybeCompleteAuthSession();

// Google OAuth Discovery Document
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  userInfoEndpoint: "https://www.googleapis.com/userinfo/v2/me",
};

// Client IDs can be supplied via environment or Google Cloud Console
export const GOOGLE_CONFIG = {
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
  androidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
  scopes: ["openid", "profile", "email"],
};

export type GoogleSignInResult =
  | { type: "success"; profile: GoogleUserProfile; idToken?: string }
  | { type: "cancel" }
  | { type: "requires_modal" }
  | { type: "error"; message: string };

export function isGoogleOAuthConfigured(): boolean {
  return (
    !!GOOGLE_CONFIG.androidClientId ||
    (!!GOOGLE_CONFIG.webClientId &&
      !GOOGLE_CONFIG.webClientId.includes("pocketflow-google-client-id"))
  );
}

/**
 * Initiates native browser Google OpenID Connect authentication.
 * If credentials are not configured in environment, signals the UI
 * to present the Google account picker sheet.
 */
export async function promptGoogleSignInAsync(): Promise<GoogleSignInResult> {
  try {
    if (!isGoogleOAuthConfigured()) {
      // Direct the caller to show the custom Google account selection modal
      return { type: "requires_modal" };
    }

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: process.env.EXPO_PUBLIC_AUTH_SCHEME || "mobile",
      path: "auth",
    });

    // Modern RFC 7636 OAuth 2.0 Authorization Code Flow with PKCE
    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CONFIG.androidClientId || GOOGLE_CONFIG.webClientId,
      scopes: GOOGLE_CONFIG.scopes,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      redirectUri,
      prompt: AuthSession.Prompt.SelectAccount,
      extraParams: {
        prompt: "select_account",
        access_type: "offline",
      },
    });

    const result = await request.promptAsync(discovery);

    let accessToken: string | undefined = undefined;
    let idToken: string | undefined = undefined;

    if (result.type === "success") {
      if (result.params?.code) {
        // Exchange authorization code for tokens securely using PKCE code_verifier
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_CONFIG.androidClientId || GOOGLE_CONFIG.webClientId,
            code: result.params.code,
            extraParams: {
              code_verifier: request.codeVerifier || "",
            },
            redirectUri,
          },
          discovery,
        );
        accessToken = tokenResponse.accessToken;
        idToken = tokenResponse.idToken;
      } else if (result.authentication?.accessToken) {
        // Fallback for direct token response
        accessToken = result.authentication.accessToken;
        idToken = result.authentication.idToken;
      }
    }

    if (accessToken) {
      // Fetch public profile info directly from Google UserInfo endpoint
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!userInfoResponse.ok) {
        throw new Error("Failed to fetch Google user profile.");
      }

      const userData = await userInfoResponse.json();

      return {
        type: "success",
        profile: {
          id: userData.id || userData.sub,
          email: userData.email,
          name:
            userData.name ||
            `${userData.given_name || ""} ${userData.family_name || ""}`.trim(),
          givenName: userData.given_name,
          familyName: userData.family_name,
          picture: userData.picture,
        },
        idToken,
      };
    }

    if (result.type === "cancel" || result.type === "dismiss") {
      return { type: "cancel" };
    }

    return {
      type: "error",
      message:
        result.type === "error"
          ? result.error?.message || "Authentication error"
          : "Sign in not completed",
    };
  } catch (error: any) {
    return {
      type: "error",
      message:
        error?.message || "An unexpected error occurred during Google Sign-In.",
    };
  }
}
