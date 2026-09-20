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
  // Replace with your Google Cloud Web Client ID or Android Client ID
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "pocketflow-google-client-id.apps.googleusercontent.com",
  androidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
  scopes: ["openid", "profile", "email"],
};

export type GoogleSignInResult =
  | { type: "success"; profile: GoogleUserProfile; idToken?: string }
  | { type: "cancel" }
  | { type: "error"; message: string };

/**
 * Initiates native browser Google OpenID Connect authentication.
 * Requests ONLY minimal identity scopes (openid, profile, email).
 * Zero financial records or files are accessed or transmitted.
 */
export async function promptGoogleSignInAsync(): Promise<GoogleSignInResult> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: "mobile",
      path: "auth",
    });

    const isDevelopmentPlaceholder =
      GOOGLE_CONFIG.webClientId.includes("pocketflow-google-client-id");

    // If client ID is the placeholder (unregistered Google Cloud project in dev),
    // allow seamless demo/developer login so the user can test the onboarding flow
    if (isDevelopmentPlaceholder && !GOOGLE_CONFIG.androidClientId) {
      return {
        type: "success",
        profile: {
          id: "google-dev-user-" + Date.now().toString(36),
          email: "sahilmulla16@gmail.com",
          name: "Sahil Mulla",
          givenName: "Sahil",
          familyName: "Mulla",
          picture:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80",
        },
      };
    }

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CONFIG.androidClientId || GOOGLE_CONFIG.webClientId,
      scopes: GOOGLE_CONFIG.scopes,
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
    });

    const result = await request.promptAsync(discovery);

    if (result.type === "success" && result.authentication?.accessToken) {
      // Fetch public profile info directly from Google
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: {
            Authorization: `Bearer ${result.authentication.accessToken}`,
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
          name: userData.name || `${userData.given_name || ""} ${userData.family_name || ""}`.trim(),
          givenName: userData.given_name,
          familyName: userData.family_name,
          picture: userData.picture,
        },
        idToken: result.authentication.idToken,
      };
    }

    if (result.type === "cancel" || result.type === "dismiss") {
      return { type: "cancel" };
    }

    return {
      type: "error",
      message: result.type === "error" ? result.error?.message || "Authentication error" : "Sign in not completed",
    };
  } catch (error: any) {
    return {
      type: "error",
      message: error?.message || "An unexpected error occurred during Google Sign-In.",
    };
  }
}

