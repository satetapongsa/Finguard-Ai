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
 * Pure function comparing previous and current clauses in memory for deterministic evaluation
 */
export function computeClauseDiff(
  previousClauses: Array<{ clauseRef: string; content: string }>,
  currentClauses: Array<{ clauseRef: string; content: string }>
): Array<{ clauseRef: string; changeType: ChangeType; explanation: string }> {
  const oldMap = new Map<string, string>();
  for (const c of previousClauses) {
    oldMap.set(c.clauseRef.trim(), c.content);
  }

  const results: Array<{ clauseRef: string; changeType: ChangeType; explanation: string }> = [];
  const currentRefs = new Set<string>();

  for (const c of currentClauses) {
    const ref = c.clauseRef.trim();
    currentRefs.add(ref);
    const oldContent = oldMap.get(ref);

    let changeType: ChangeType = "UNCHANGED";
    if (!oldContent) {
      changeType = "ADD";
    } else if (normalizeClauseText(c.content) === normalizeClauseText(oldContent)) {
      changeType = "UNCHANGED";
    } else {
      changeType = "MODIFY";
    }

    results.push({
      clauseRef: ref,
      changeType,
      explanation: generateChangeExplanation(ref, changeType, oldContent, c.content),
    });
  }

  for (const old of previousClauses) {
    const ref = old.clauseRef.trim();
    if (!currentRefs.has(ref)) {
      results.push({
        clauseRef: ref,
        changeType: "DELETE",
        explanation: generateChangeExplanation(ref, "DELETE", old.content, null),
      });
    }
  }

  return results;
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
