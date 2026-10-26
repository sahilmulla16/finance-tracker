import { BankInstitution } from "./types";
import {
  INSTITUTION_REGISTRY,
  SENDER_PREFIX_MAP,
  CODE_MAP,
} from "./institutionRegistry";

export interface BankIdentificationResult {
  institution: BankInstitution | null;
  confidence: number;
  matchedBy: "sender_id" | "body_keyword" | "none";
}

/**
 * Identifies the bank/financial institution from SMS sender ID and/or message body.
 */
export function identifyBank(
  cleanedText: string,
  normalizedSenderId?: string,
): BankIdentificationResult {
  // 1. Try exact or prefix match on normalized sender ID
  if (normalizedSenderId) {
    const sender = normalizedSenderId.toUpperCase();
    const exact = SENDER_PREFIX_MAP.get(sender);
    if (exact) {
      return {
        institution: exact,
        confidence: 0.98,
        matchedBy: "sender_id",
      };
    }

    // Try substring matching on sender prefixes
    for (const [prefix, inst] of SENDER_PREFIX_MAP.entries()) {
      if (sender.includes(prefix) || prefix.includes(sender)) {
        return {
          institution: inst,
          confidence: 0.92,
          matchedBy: "sender_id",
        };
      }
    }
  }

  // 2. Try body keyword matching
  const lower = cleanedText.toLowerCase();

  // Match standalone credit card issuers first to avoid generic parent bank overlap
  const creditCardIssuers = INSTITUTION_REGISTRY.filter(
    (i) => i.category === "CREDIT_CARD_ISSUER",
  );
  for (const inst of creditCardIssuers) {
    for (const kw of inst.bodyKeywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(lower)) {
        return {
          institution: inst,
          confidence: 0.88,
          matchedBy: "body_keyword",
        };
      }
    }
  }

  // Explicit source bank check: "from <Bank>", "in <Bank>", "through <Bank>", "via <Bank>"
  const fromMatch = lower.match(
    /\b(?:from|in|through|via)\s+([a-z\s&.-]{3,35}?)(?:\s+a\/?c|\s+account|\.|\,|$|\s+towards|\s+to|\s+on|\s+dated)/i,
  );
  if (fromMatch) {
    const cand = fromMatch[1].trim();
    for (const inst of INSTITUTION_REGISTRY) {
      const matchesAlias = inst.aliases.some((a) => {
        const esc = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${esc}\\b`, "i").test(cand);
      });
      const matchesKeyword = inst.bodyKeywords.some((kw) => {
        const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${esc}\\b`, "i").test(cand);
      });
      if (matchesAlias || matchesKeyword) {
        return {
          institution: inst,
          confidence: 0.95,
          matchedBy: "body_keyword",
        };
      }
    }
  }

  // Match all other institutions in the registry and pick earliest occurrence in text
  let bestMatch: { inst: (typeof INSTITUTION_REGISTRY)[0]; index: number } | null = null;
  for (const inst of INSTITUTION_REGISTRY) {
    if (inst.category === "CREDIT_CARD_ISSUER") continue;
    for (const kw of inst.bodyKeywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      const m = lower.match(regex);
      if (m && m.index !== undefined) {
        if (!bestMatch || m.index < bestMatch.index) {
          bestMatch = { inst, index: m.index };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      institution: bestMatch.inst,
      confidence: 0.85,
      matchedBy: "body_keyword",
    };
  }

  return {
    institution: null,
    confidence: 0,
    matchedBy: "none",
  };
}

/**
 * Returns comprehensive bank aliases for matching account names against bank names or institution codes.
 */
export function getUniversalBankAliases(bankNameOrCode: string): string[] {
  if (!bankNameOrCode) return [];
  const lower = bankNameOrCode.trim().toLowerCase();

  // Check code map
  const byCode = CODE_MAP.get(bankNameOrCode.toUpperCase());
  if (byCode) {
    return Array.from(new Set([...byCode.aliases, byCode.code.toLowerCase(), byCode.name.toLowerCase()]));
  }

  // Check registry by name or alias match
  for (const inst of INSTITUTION_REGISTRY) {
    if (
      inst.name.toLowerCase() === lower ||
      inst.code.toLowerCase() === lower ||
      inst.aliases.some((a) => lower.includes(a) || a.includes(lower))
    ) {
      return Array.from(new Set([...inst.aliases, inst.code.toLowerCase(), inst.name.toLowerCase()]));
    }
  }

  // Fallback: tokenize words
  const words = lower
    .split(/\s+/)
    .filter((w) => w.length >= 3 && w !== "bank");
  return words.length > 0 ? words : [lower];
}

