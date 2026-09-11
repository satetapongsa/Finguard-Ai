import crypto from "crypto";

/**
 * Enterprise PDPA & Financial Data Guardrails
 * Provides masking for Personally Identifiable Information (PII)
 * including Thai National ID, Credit Card Numbers, and Phone Numbers.
 */

// Regular expressions for critical financial & regional PII
const THAI_ID_REGEX = /\b(\d{1})[- ]?(\d{4})[- ]?(\d{5})[- ]?(\d{2})[- ]?(\d{1})\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[- ]?){3}\d{4}\b|\b\d{15,16}\b/g;
const PHONE_NUMBER_REGEX = /(?:\+66|0)[- ]?([689]\d)[- ]?(\d{3,4})[- ]?(\d{4})\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Mask Thai National ID Card (13 Digits)
 * Example: 1-1004-12345-67-8 -> 1-XXXX-XXXXX-XX-8
 */
export function maskThaiNationalId(idString: string): string {
  return idString.replace(THAI_ID_REGEX, (_match, p1, _p2, _p3, _p4, p5) => {
    return `${p1}-XXXX-XXXXX-XX-${p5}`;
  });
}

/**
 * Mask Credit/Debit Card Number (16 Digits)
 * Example: 4111 2222 3333 4444 -> ****-****-****-4444
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
