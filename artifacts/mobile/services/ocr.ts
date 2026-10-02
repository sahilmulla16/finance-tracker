import { NativeModules } from 'react-native';
import { OcrError } from './scanTypes';

export interface OcrLine {
  text: string;
}

export interface OcrBlock {
  text: string;
  lines: OcrLine[];
}

export interface OcrResult {
  rawText: string;
  lines: string[];
  blocks?: OcrBlock[];
}

/**
 * On-Device Text Recognition Service
 *
 * Uses native Google ML Kit Text Recognition on Android via PocketflowOcrModule.
 * Completely offline and local-first; no images or data ever leave the device.
 */
export async function recognizeImageText(imageUri: string): Promise<OcrResult> {
  if (!imageUri) {
    throw new OcrError('IMAGE_UNREADABLE', 'No image URI provided for OCR');
  }

  const { PocketflowOcr } = NativeModules;
  if (!PocketflowOcr || typeof PocketflowOcr.recognizeText !== 'function') {
    throw new OcrError(
      'MODULE_UNAVAILABLE',
      'Native OCR module is not available. Build and run a development client to use Scan.',
    );
  }

  try {
    const nativeResult = await PocketflowOcr.recognizeText(imageUri);
    if (!nativeResult || typeof nativeResult.text !== 'string') {
      throw new OcrError('EMPTY_RESULT', 'OCR returned no text from this image.');
    }

    const rawText = nativeResult.text.trim();
    if (rawText.length === 0) {
      throw new OcrError('EMPTY_RESULT', 'No readable text found in this image. Try a clearer photo.');
    }

    const lines: string[] = rawText
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean);

    return {
      rawText,
      lines,
      blocks: nativeResult.blocks || [],
    };
  } catch (err) {
    if (err instanceof OcrError) throw err;
    const message = err instanceof Error ? err.message : 'Unknown OCR error';
    throw new OcrError('OCR_FAILED', `OCR processing failed: ${message}`);
  }
}
