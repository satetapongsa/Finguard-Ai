import crypto from "crypto";

/**
 * Enterprise PDPA & Financial Data Guardrails
 * Provides masking for Personally Identifiable Information (PII)
 * including 13-digit Thai National IDs, 16-digit Account/PAN numbers,
 * phone numbers, and emails.
 */

// Regular expressions for critical financial & regional PII
// Handles formatted: 1-1004-99882-12-9 or unformatted: 1100499882129
const THAI_ID_REGEX = /\b(\d{1})[- ]?(\d{4})[- ]?(\d{5})[- ]?(\d{2})[- ]?(\d{1})\b/g;

// Handles 16-digit PANs formatted (4111 2222 3333 4444) or unformatted (4111222233334444)
const CREDIT_CARD_REGEX = /\b(?:\d{4}[- ]?){3}\d{4}\b|\b\d{15,16}\b/g;

// Handles Thai phone numbers (+66 81-234-5678, 081-234-5678, 0812345678, etc.)
const PHONE_NUMBER_REGEX = /(?:\+66|0)[- ]?([689]\d)[- ]?(\d{3,4})[- ]?(\d{4})\b/g;

// Standard RFC 5322 compliant email regex
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Mask Thai National ID Card (13 Digits)
 * Example: 1-1004-12345-67-8 -> 1-XXXX-XXXXX-XX-8
 * Example: 1100412345678 -> 1-XXXX-XXXXX-XX-8
 */
export function maskThaiNationalId(idString: string): string {
  return idString.replace(THAI_ID_REGEX, (_match, p1, _p2, _p3, _p4, p5) => {
    return `${p1}-XXXX-XXXXX-XX-${p5}`;
  });
}

/**
 * Mask Credit/Debit Card or PAN Number (16 Digits)
 * Example: 4111 2222 3333 4444 -> ****-****-****-4444
 * Example: 4111222233334444 -> ****-****-****-4444
 */
export function maskCreditCard(cardNumber: string): string {
  return cardNumber.replace(CREDIT_CARD_REGEX, (match) => {
    const digitsOnly = match.replace(/[- ]/g, "");
    const last4 = digitsOnly.slice(-4);
    return `****-****-****-${last4}`;
  });
}

/**
 * Mask Mobile Phone Numbers (Thai domestic and international format)
 * Example: 081-234-5678 -> 081-XXX-5678
 */
export function maskPhoneNumber(phone: string): string {
  return phone.replace(PHONE_NUMBER_REGEX, (_match, prefix, _mid, last) => {
    return `0${prefix}-XXX-${last}`;
  });
}

/**
 * Mask Email Addresses
 * Example: satet@bank.com -> s***t@bank.com
 */
export function maskEmail(email: string): string {
  return email.replace(EMAIL_REGEX, (match) => {
    const [name, domain] = match.split("@");
    if (!name || !domain) return match;
    const maskedName =
      name.length <= 2
        ? `${name[0]}*`
        : `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
    return `${maskedName}@${domain}`;
  });
}

/**
 * Complete PII Sanitization for free-form text
 * Applies all PDPA filters sequentially
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== "string") return "";
  let sanitized = input;
  sanitized = maskCreditCard(sanitized);
  sanitized = maskThaiNationalId(sanitized);
  sanitized = maskPhoneNumber(sanitized);
  sanitized = maskEmail(sanitized);
  return sanitized;
}

/**
 * Recursively sanitize objects/arrays prior to LLM submission or logging
 */
export function sanitizePayload<T>(payload: T): T {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (typeof payload === "string") {
    return sanitizeText(payload) as unknown as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item)) as unknown as T;
  }

  if (typeof payload === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      // Sensitive key name detection
      const lowerKey = key.toLowerCase();
      if (
        (lowerKey.includes("password") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("cvv") ||
          lowerKey.includes("pin")) &&
        typeof value === "string"
      ) {
        result[key] = "[REDACTED_SECRET]";
      } else {
        result[key] = sanitizePayload(value);
      }
    }
    return result as T;
  }

  return payload;
}

/**
 * High-Order Function to intercept LLM prompts or application logs
 * and enforce zero data leakage of customer PII.
 */
export function withPiiGuardrail<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const sanitizedArgs = args.map((arg) => sanitizePayload(arg)) as TArgs;
    return await fn(...sanitizedArgs);
  };
}

/**
 * Generate a Cryptographic SHA-256 Hash for Immutable Audit Logging
 */
export function computePayloadHash(payload: unknown, salt?: string): string {
  const secretSalt = salt || process.env.AUDIT_INTEGRITY_SALT || "finguard-default-salt";
  const normalizedString =
    typeof payload === "string" ? payload : JSON.stringify(payload);

  return crypto
    .createHash("sha256")
    .update(`${secretSalt}:${normalizedString}`)
    .digest("hex");
}

// -----------------------------------------------------------------
// BLOCKCHAIN-STYLE CRYPTOGRAPHIC AUDIT LINKED LIST
// -----------------------------------------------------------------

export const GENESIS_PREV_HASH = "0".repeat(64);

export interface AuditEntryHashInput {
  previousHash: string | null;
  payloadHash: string;
  actionType: string;
  targetResource: string;
  resourceId?: string | null;
  createdAt: string | Date;
}

/**
 * Generate a SHA-256 Checksum derived from the transaction data combined with
 * the hash of the previous log entry (Blockchain-style linked list).
 */
export function computeAuditEntryHash(input: AuditEntryHashInput): string {
  const prev = input.previousHash || GENESIS_PREV_HASH;
  const timeStr =
    typeof input.createdAt === "string"
      ? input.createdAt
      : input.createdAt.toISOString();
  const resourceIdStr = input.resourceId || "";
  const content = `${prev}:${input.payloadHash}:${input.actionType}:${input.targetResource}:${resourceIdStr}:${timeStr}`;

  return crypto.createHash("sha256").update(content).digest("hex");
}

export interface VerifyChainLogItem {
  id: string;
  previousHash: string | null;
  entryHash: string;
  payloadHash: string;
  actionType: string;
  targetResource: string;
  resourceId?: string | null;
  createdAt: string | Date;
}

export interface ChainVerificationReport {
  isValid: boolean;
  totalBlocks: number;
  genesisHash: string;
  latestHash: string;
  corruptedBlockId?: string;
  error?: string;
}

/**
 * Validates the cryptographic integrity of an AuditLog chain.
 * Traverses every link and verifies tamper-evidence.
 */
export function verifyAuditChain(logs: VerifyChainLogItem[]): ChainVerificationReport {
  if (logs.length === 0) {
    return {
      isValid: true,
      totalBlocks: 0,
      genesisHash: GENESIS_PREV_HASH,
      latestHash: GENESIS_PREV_HASH,
    };
  }

  // Logs should be ordered chronologically (oldest to newest)
  const sorted = [...logs].sort((a, b) => {
    const tA = new Date(a.createdAt).getTime();
    const tB = new Date(b.createdAt).getTime();
    return tA - tB;
  });

  let expectedPrevHash = GENESIS_PREV_HASH;

  for (let i = 0; i < sorted.length; i++) {
    const block = sorted[i];
    const actualPrevHash = block.previousHash || GENESIS_PREV_HASH;

    // 1. Verify link continuity
    if (actualPrevHash !== expectedPrevHash) {
      return {
        isValid: false,
        totalBlocks: sorted.length,
        genesisHash: sorted[0].entryHash,
        latestHash: sorted[sorted.length - 1].entryHash,
        corruptedBlockId: block.id,
        error: `Broken chain link at block ${block.id}: expected prevHash ${expectedPrevHash.slice(0, 12)}... but got ${actualPrevHash.slice(0, 12)}...`,
      };
    }

    // 2. Recompute cryptographic hash of this block
    const calculatedHash = computeAuditEntryHash({
      previousHash: block.previousHash,
      payloadHash: block.payloadHash,
      actionType: block.actionType,
      targetResource: block.targetResource,
      resourceId: block.resourceId,
      createdAt: block.createdAt,
    });

    if (calculatedHash !== block.entryHash) {
      return {
        isValid: false,
        totalBlocks: sorted.length,
        genesisHash: sorted[0].entryHash,
        latestHash: sorted[sorted.length - 1].entryHash,
        corruptedBlockId: block.id,
        error: `Tampered payload hash at block ${block.id}: expected ${calculatedHash.slice(0, 12)}... but got ${block.entryHash.slice(0, 12)}...`,
      };
    }

    expectedPrevHash = block.entryHash;
  }

  return {
    isValid: true,
    totalBlocks: sorted.length,
    genesisHash: sorted[0].entryHash,
    latestHash: sorted[sorted.length - 1].entryHash,
  };
}

/**
 * Inspection Utility to detect PII Presence
 */
export interface PiiInspectionReport {
  hasPii: boolean;
  detectedTypes: Array<"THAI_ID" | "CREDIT_CARD" | "PHONE" | "EMAIL">;
}

export function inspectPiiPresence(text: string): PiiInspectionReport {
  const detectedTypes: Array<"THAI_ID" | "CREDIT_CARD" | "PHONE" | "EMAIL"> = [];

  if (THAI_ID_REGEX.test(text)) detectedTypes.push("THAI_ID");
  if (CREDIT_CARD_REGEX.test(text)) detectedTypes.push("CREDIT_CARD");
  if (PHONE_NUMBER_REGEX.test(text)) detectedTypes.push("PHONE");
  if (EMAIL_REGEX.test(text)) detectedTypes.push("EMAIL");

  return {
    hasPii: detectedTypes.length > 0,
    detectedTypes,
  };
}
