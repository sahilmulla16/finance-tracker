import { Image as ExpoImage } from "expo-image";
import { Asset } from "expo-asset";
import { MASCOT_MAP, MascotType } from "@/components/MascotGuide";

let isPreloaded = false;

/**
 * Pre-warms and preloads mascot image assets into memory and disk cache.
 * Can be called during app boot or screen initialization to ensure 0ms mascot render times.
 */
export async function preloadMascots(mascotsToPreload?: MascotType[]): Promise<void> {
  if (isPreloaded && !mascotsToPreload) {
    return;
  }

  try {
    const keys: MascotType[] = mascotsToPreload ?? [
      "welcome",
      "thinking",
      "checklist",
      "okay",
      "completed",
      "hii",
      "idle",
      "sad",
      "no-money",
    ];

    const preloadPromises = keys.map(async (key) => {
      try {
        const source = MASCOT_MAP[key];
        if (typeof source === "number") {
          const asset = Asset.fromModule(source);
          await asset.downloadAsync();
          if (asset.localUri || asset.uri) {
            await ExpoImage.prefetch(asset.localUri || asset.uri, "memory-disk");
          }
        }
      } catch {
        // Non-blocking catch to ensure app startup is never interrupted
      }
    });

    await Promise.all(preloadPromises);
    if (!mascotsToPreload) {
      isPreloaded = true;
    }
  } catch {
    // Fail-safe
  }
}

