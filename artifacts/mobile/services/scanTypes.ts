import { type ParsedTransaction } from './transactionParser';

export type DocumentType = 'RECEIPT' | 'BANK_STATEMENT' | 'PAYMENT_RECEIPT' | 'INVOICE' | 'UNKNOWN';

export type ImageProcessingStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export interface ScanDocument {
  id: string;
  localUri: string;
  documentType: DocumentType;
  ocrRawText: string;
  transactions: ParsedTransaction[];
  processingStatus: ImageProcessingStatus;
  error?: string;
}

export type OcrErrorCode =
  | 'MODULE_UNAVAILABLE'
  | 'IMAGE_UNREADABLE'
  | 'EMPTY_RESULT'
  | 'OCR_FAILED';

export class OcrError extends Error {
  code: OcrErrorCode;
  constructor(code: OcrErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'OcrError';
  }
}
