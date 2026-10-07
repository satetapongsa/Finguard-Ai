import { URL } from "url";

// Trusted official regulatory hosts allowlist
const TRUSTED_BOT_HOSTS = new Set([
  "www.bot.or.th",
  "bot.or.th",
  "app.bot.or.th",
  "fipcs.bot.or.th",
]);

/**
 * SSRF Guard for Regulatory Document Fetching
 * Strictly validates URLs before initiating server-side HTTP downloads.
 * Prevents DNS rebinding, private IP traversal, and unauthorized scheme execution.
 */
export function validateRegulatoryUrl(urlStr: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(urlStr);

    // 1. Only HTTPS allowed
    if (parsed.protocol !== "https:") {
      return { valid: false, error: `Insecure protocol '${parsed.protocol}'. Only HTTPS is permitted.` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Reject loopback, private ranges, internal names
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    ) {
      return { valid: false, error: `SSRF detected: Forbidden internal or private host '${hostname}'.` };
    }

    // 3. Strict host allowlist
    if (!TRUSTED_BOT_HOSTS.has(hostname)) {
      return {
        valid: false,
        error: `Host '${hostname}' is not in the trusted Bank of Thailand allowlist (${Array.from(TRUSTED_BOT_HOSTS).join(", ")}).`,
      };
    }

    return { valid: true };
  } catch (_e) {
    return { valid: false, error: "Malformed URL syntax." };
  }
}
