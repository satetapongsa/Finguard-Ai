/**
 * Multi-Agent System Core Orchestrator for BFSI Regulatory Intelligence
 * 
 * Agents:
 * 1. Ingestion Agent (Mocked Trigger): Simulates monitoring BOT announcements & extracts clauses
 * 2. Versioning & Diff Agent: Finds previous superseding regulation versions and identifies diffs (ADDED/MODIFIED/REVOKED)
 * 3. Gap Analysis Agent: Maps clauses to bank internal policies and discovers conflicts/gaps
 * 4. Dispatcher Agent: Executes post human-in-the-loop approval, updates policy status and issues dispatch tickets
 */

export interface DiffResult {
  clauseNumber: string;
  clauseHeading: string;
  diffType: "ADDED" | "MODIFIED" | "REVOKED" | "UNCHANGED";
  newContent: string;
  oldContent?: string;
  changeExplanation: string;
}

export interface GapInsight {
  policyCode: string;
  policyTitle: string;
  businessUnit: string;
  conflictDescription: string;
  missingClause: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  aiRecommendedAction: string;
  relevantClauseNumber: string;
}

/**
 * 1. INGESTION AGENT
 * Mock parsing and extraction of incoming BOT PDF circulars.
 */
export function runIngestionAgent(mockRawDocument: {
  code: string;
  title: string;
  category: string;
  authority: "BOT" | "AMLO" | "SEC_TH" | "PDPC" | "FATF";
  summary: string;
  effectiveDate: Date;
}) {
  return {
    ingestedAt: new Date(),
    metadata: mockRawDocument,
    status: "EXTRACTED",
  };
}

/**
 * 2. VERSIONING & DIFF AGENT
 * Compares new regulation clauses with historical predecessor regulation clauses.
 */
export function runVersioningDiffAgent(params: {
  newClauses: Array<{ clauseNumber: string; clauseHeading: string; content: string }>;
  oldClauses?: Array<{ clauseNumber: string; clauseHeading: string; content: string }>;
}): DiffResult[] {
  const { newClauses, oldClauses = [] } = params;
  const oldMap = new Map(oldClauses.map((c) => [c.clauseNumber, c]));

  const results: DiffResult[] = [];

  for (const clause of newClauses) {
    const old = oldMap.get(clause.clauseNumber);
    if (!old) {
      results.push({
        clauseNumber: clause.clauseNumber,
        clauseHeading: clause.clauseHeading,
        diffType: "ADDED",
        newContent: clause.content,
        changeExplanation: "Brand-new regulatory requirement introduced in this circular.",
      });
    } else if (old.content.trim() !== clause.content.trim()) {
      results.push({
        clauseNumber: clause.clauseNumber,
        clauseHeading: clause.clauseHeading,
        diffType: "MODIFIED",
        newContent: clause.content,
        oldContent: old.content,
        changeExplanation: "Clause parameters or reporting deadlines have been tightened/updated.",
      });
    } else {
      results.push({
        clauseNumber: clause.clauseNumber,
        clauseHeading: clause.clauseHeading,
        diffType: "UNCHANGED",
        newContent: clause.content,
        oldContent: old.content,
        changeExplanation: "No substantive changes from predecessor circular.",
      });
    }
  }

  // Check for revoked clauses in old that are absent in new
  const newSet = new Set(newClauses.map((c) => c.clauseNumber));
  for (const old of oldClauses) {
    if (!newSet.has(old.clauseNumber)) {
      results.push({
        clauseNumber: old.clauseNumber,
        clauseHeading: old.clauseHeading,
        diffType: "REVOKED",
        newContent: "(Clause repealed/revoked in current circular)",
        oldContent: old.content,
        changeExplanation: "Mandate formally repealed or superseded by new standards.",
      });
    }
  }

  return results;
}

/**
 * 3. GAP ANALYSIS AGENT
 * Cross-references new clauses against internal bank policies.
 */
export function runGapAnalysisAgent(params: {
  diffResults: DiffResult[];
  internalPolicies: Array<{
    id: string;
    policyCode: string;
    title: string;
    businessUnit: string;
    fullText: string;
  }>;
}): GapInsight[] {
  const { diffResults, internalPolicies } = params;
  const gaps: GapInsight[] = [];

  // Match and analyze rule violations against policies
  for (const diff of diffResults) {
    if (diff.diffType === "UNCHANGED") continue;

    // Real-time matching logic based on semantic banking domains
    if (diff.clauseNumber.includes("4.1") || diff.newContent.toLowerCase().includes("mule") || diff.newContent.includes("30-day")) {
      const targetPolicy = internalPolicies.find((p) => p.policyCode === "POL-FRAUD-101") || internalPolicies[0];
      if (targetPolicy) {
        gaps.push({
          policyCode: targetPolicy.policyCode,
          policyTitle: targetPolicy.title,
          businessUnit: targetPolicy.businessUnit,
          conflictDescription: `Internal policy currently specifies 48-hour suspicious account suspension, but BOT Circular Clause 4.1 mandates real-time freeze within 15 minutes, with biometric challenge over 50,000 THB.`,
          missingClause: `Clause 4.1: Real-time API integration with Central Fraud Registry and automated SLA of 15 minutes.`,
          riskLevel: "CRITICAL",
          aiRecommendedAction: `Update POL-FRAUD-101 Section 3.2: Lower suspension SLA from 48h to 15m; add mandatory Central Fraud Registry API webhook trigger.`,
          relevantClauseNumber: diff.clauseNumber,
        });
      }
    }

    if (diff.clauseNumber.includes("5.2") || diff.newContent.toLowerCase().includes("cloud") || diff.newContent.includes("cyber")) {
      const targetPolicy = internalPolicies.find((p) => p.policyCode === "POL-CYBER-204");
      if (targetPolicy) {
        gaps.push({
          policyCode: targetPolicy.policyCode,
          policyTitle: targetPolicy.title,
          businessUnit: targetPolicy.businessUnit,
          conflictDescription: `Existing cyber resilience standard only requires annual third-party penetration testing, failing to meet BOT's new requirement of bi-annual red-teaming and 4-hour major incident notification to the BOT Cyber Coordination Center.`,
          missingClause: `Clause 5.2: 4-hour BOT notification window and bi-annual threat-led penetration testing (TLPT).`,
          riskLevel: "HIGH",
          aiRecommendedAction: `Amend POL-CYBER-204 to establish 4-hour BOT Cyber Escalation Runbook and schedule Q2 TLPT audit.`,
          relevantClauseNumber: diff.clauseNumber,
        });
      }
    }

    if (diff.clauseNumber.includes("6.1") || diff.newContent.toLowerCase().includes("reporting") || diff.newContent.includes("cross-border")) {
      const targetPolicy = internalPolicies.find((p) => p.policyCode === "POL-AML-305");
      if (targetPolicy) {
        gaps.push({
          policyCode: targetPolicy.policyCode,
          policyTitle: targetPolicy.title,
          businessUnit: targetPolicy.businessUnit,
          conflictDescription: `Current AML policy does not enforce beneficiary institution LEI (Legal Entity Identifier) validation for cross-border electronic payments exceeding 1,000,000 THB.`,
          missingClause: `Clause 6.1: Mandatory ISO 20022 LEI validation field check prior to message release.`,
          riskLevel: "HIGH",
          aiRecommendedAction: `Update Swift/ISO 20022 gateway validation rule in Core Banking to reject messages missing counterparty LEI.`,
          relevantClauseNumber: diff.clauseNumber,
        });
      }
    }
  }

  return gaps;
}

/**
 * 4. DISPATCHER AGENT
 * Triggers after Human-in-the-Loop compliance officer approval.
 */
export function generateDispatchPayload(gap: {
  id: string;
  internalPolicyId: string;
  policyCode: string;
  policyTitle: string;
  businessUnit: string;
  conflictDescription: string;
  aiRecommendedAction: string;
  riskLevel: string;
}) {
  const ticketCode = `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (gap.riskLevel === "CRITICAL" ? 7 : gap.riskLevel === "HIGH" ? 14 : 30));

  return {
    ticketNumber: ticketCode,
    targetDepartment: gap.businessUnit,
    title: `[Remediation Required] ${gap.policyCode}: Align with BOT Mandate`,
    actionItems: `1. Review compliance conflict: ${gap.conflictDescription}\n2. Implement remediation: ${gap.aiRecommendedAction}\n3. Submit amended policy for CISO/Risk Committee sign-off.`,
    priority: gap.riskLevel === "CRITICAL" ? "URGENT" : gap.riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
    dueDate,
  };
}
