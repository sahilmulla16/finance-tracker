import * as FileSystem from "expo-file-system/legacy";

const PROFILE_DIR_NAME = "user_profile";
const GOALS_DIR_NAME = "goal_images";
const CATEGORIES_DIR_NAME = "category_images";

/**
 * Returns the durable directory path for storing images in FileSystem.documentDirectory,
 * which is NEVER cleared by OS cache maintenance.
 */
function getDurableDirectory(subDir: string): string {
  if (!FileSystem.documentDirectory) {
    throw new Error("Persistent documentDirectory is not available on this device.");
  }
  return `${FileSystem.documentDirectory}${subDir}/`;
}

/**
 * Ensures the target durable directory exists.
 */
async function ensureDirectory(subDir: string): Promise<string> {
  const dir = getDurableDirectory(subDir);
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Extracts a safe file extension from a URI or URL.
 */
function extractExtension(uri: string): string {
  try {
    const cleanUri = uri.split("?")[0].split("#")[0];
    const match = cleanUri.match(/\.([a-zA-Z0-9]{3,4})$/);
    if (match && match[1]) {
      const ext = match[1].toLowerCase();
      if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        return ext === "jpeg" ? "jpg" : ext;
      }
    }
  } catch {
    // Fallback to jpg
  }
  return "jpg";
}

/**
 * Saves an image to durable app document storage.
 *
 * @param sourceUri The temporary file URI or remote URL
 * @param subDir The subfolder in documentDirectory (e.g. "user_profile", "goal_images")
 * @param filePrefix Optional filename prefix
 * @returns The durable, permanent file URI in FileSystem.documentDirectory
 */
export async function saveDurableImage(
  sourceUri: string,
  subDir: string = PROFILE_DIR_NAME,
  filePrefix: string = "avatar"
): Promise<string> {
  if (!sourceUri || typeof sourceUri !== "string" || !sourceUri.trim()) {
    throw new Error("Invalid source URI provided for durable storage.");
  }

  const trimmed = sourceUri.trim();
  const targetDir = await ensureDirectory(subDir);

  // If already stored in our persistent target directory and exists, reuse it
  if (trimmed.startsWith(targetDir)) {
    const currentInfo = await FileSystem.getInfoAsync(trimmed);
    if (currentInfo.exists && (currentInfo.size ?? 0) > 0) {
      return trimmed;
    }
  }

  const ext = extractExtension(trimmed);
  const targetFilename = `${filePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
  const targetUri = `${targetDir}${targetFilename}`;

  // Handle remote URL (e.g. Google Sign-In avatar)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const downloadResult = await FileSystem.downloadAsync(trimmed, targetUri);
    if (downloadResult.status < 200 || downloadResult.status >= 300) {
      throw new Error(`Failed to download image. HTTP status: ${downloadResult.status}`);
    }
  } else {
    // Local file URI (from ImagePicker or camera)
    await FileSystem.copyAsync({
      from: trimmed,
      to: targetUri,
    });
  }

  // Verification step: Ensure target file exists and is non-empty
  const targetInfo = await FileSystem.getInfoAsync(targetUri);
  if (!targetInfo.exists || (targetInfo.size ?? 0) <= 0) {
    try {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    } catch {}
    throw new Error("Image persistence verification failed: target file is missing or empty.");
  }

  // For profile pictures, clean up older avatar files in the user_profile directory
  if (subDir === PROFILE_DIR_NAME) {
    try {
      const allFiles = await FileSystem.readDirectoryAsync(targetDir);
      for (const file of allFiles) {
        if (file !== targetFilename && file.startsWith("avatar_")) {
          await FileSystem.deleteAsync(`${targetDir}${file}`, { idempotent: true });
        }
      }
    } catch {
      // Non-critical cleanup
    }
  }

  return targetUri;
}

/**
 * Permanently stores a selected profile picture in app document storage.
 */
export async function saveProfileImage(sourceUri: string): Promise<string> {
  return saveDurableImage(sourceUri, PROFILE_DIR_NAME, "avatar");
}

/**
 * Permanently stores a goal photo in app document storage.
 */
export async function saveGoalImage(sourceUri: string): Promise<string> {
  return saveDurableImage(sourceUri, GOALS_DIR_NAME, "goal");
}

/**
 * Permanently stores a category photo in app document storage.
 */
export async function saveCategoryImage(sourceUri: string): Promise<string> {
  return saveDurableImage(sourceUri, CATEGORIES_DIR_NAME, "category");
}

/**
 * Checks whether the stored profile image reference is currently valid on disk.
 * If the file is missing or corrupted, returns null so the UI can gracefully fallback.
 */
export async function getValidProfileImageUri(storedUri: string | null | undefined): Promise<string | null> {
  if (!storedUri || typeof storedUri !== "string") {
    return null;
  }

  const trimmed = storedUri.trim();
  if (!trimmed) return null;

  // Remote URLs (e.g., https://)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Local file URIs
  try {
    const info = await FileSystem.getInfoAsync(trimmed);
    if (info.exists && (info.size ?? 0) > 0) {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Safely removes the stored profile image from persistent storage.
 */
export async function deleteProfileImage(currentUri: string | null | undefined): Promise<void> {
  if (!currentUri) return;
  try {
    const profileDir = getDurableDirectory(PROFILE_DIR_NAME);
    if (currentUri.startsWith(profileDir)) {
      await FileSystem.deleteAsync(currentUri, { idempotent: true });
    }
  } catch {
    // Ignore deletion errors
  }
}
