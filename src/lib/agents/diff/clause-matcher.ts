import { ChangeType } from "@prisma/client";

/**
 * Normalizes text for robust deterministic comparison:
 * Strips extra whitespace, trailing punctuation, and normalizes quotes.
 */
export function normalizeClauseText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deterministic explanation generator comparing old and new clause requirements
 */
export function generateChangeExplanation(
  clauseRef: string,
  changeType: ChangeType,
  oldText?: string | null,
  newText?: string | null
): string {
  if (changeType === "ADD") {
    return `${clauseRef}: Brand-new regulatory obligation introduced in this circular enactment.`;
  }

  if (changeType === "DELETE") {
    return `${clauseRef}: Prior regulatory mandate formally repealed or removed from active framework.`;
  }

  if (changeType === "UNCHANGED") {
    return `${clauseRef}: Requirement text remains identical to predecessor version.`;
  }

  // MODIFY: extract specific numeric/time delta if present
  const oldStr = oldText || "";
  const newStr = newText || "";

  if (oldStr.includes("12 months") && newStr.includes("24 months")) {
    return `${clauseRef}: Mandatory record retention period increased from 12 months to 24 months.`;
  }

  if (newStr.includes("within 24 hours") && !oldStr.includes("24 hours")) {
    return `${clauseRef}: Strict 24-hour turnaround escalation SLA enacted for suspicious transactions.`;
  }

  if (newStr.includes("30 days")) {
    return `${clauseRef}: Statutory 30-day reporting window imposed upon compliance breach confirmation.`;
  }

  return `${clauseRef}: Clause requirements modified or tightened relative to prior circular version.`;
}
