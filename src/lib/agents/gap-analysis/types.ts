import { RiskLevel, GapStatus } from "@prisma/client";

export interface GapAnalysisFinding {
  clauseRef: string;
  chunkId: string;
  policyCode: string;
  policyId: string;
  gapTitle: string;
  finding: string;
  actionItem: string;
  riskLevel: RiskLevel;
  confidence: number;
  reasoning: string;
  regulationSnippet: string;
  policySnippet: string;
}

export interface GapAnalysisResult {
  regulationId: string;
  regulationCode: string;
  version: string;
  analyzedClausesCount: number;
  identifiedGapsCount: number;
  findings: GapAnalysisFinding[];
  status: "WAITING_FOR_HUMAN";
}
