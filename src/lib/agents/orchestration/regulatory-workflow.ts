import prisma from "@/lib/prisma";
import { compareRegulationVersions } from "../diff/diff-agent";
import { analyzeComplianceGaps } from "../gap-analysis/gap-analysis-agent";
import { RegulationDiffResult } from "../diff/types";
import { GapAnalysisResult } from "../gap-analysis/types";
import { AgentResult, createAgentSuccessResult, createAgentFailureResult } from "../common/types";

export interface RegulatoryWorkflowResult {
  regulationId: string;
  regulationCode: string;
  version: string;
  diff: RegulationDiffResult;
  gapAnalysis: GapAnalysisResult;
  status: "WAITING_FOR_HUMAN";
  message: string;
}

/**
 * Autonomous Regulatory Workflow Orchestrator
 * Connects Ingestion -> Diff -> Gap Analysis.
 * CRITICAL: Strictly stops execution at WAITING_FOR_HUMAN before Dispatch.
 * Waits for Human Compliance Officer review and approval.
 */
export async function executeRegulatoryAnalysisWorkflow(
  regulationId: string,
  actorId?: string | null
): Promise<AgentResult<RegulatoryWorkflowResult>> {
  const startTime = Date.now();

  try {
    const regulation = await prisma.regulation.findUnique({
      where: { id: regulationId },
    });

    if (!regulation) {
      return createAgentFailureResult(
        "REGULATION_NOT_FOUND",
        `Regulation ${regulationId} not found.`,
        startTime
      );
    }

    // Step 1: Versioning & Diff Agent
    const diffResult = await compareRegulationVersions(regulation.id, actorId);
    if (!diffResult.success || !diffResult.data) {
      return createAgentFailureResult(
        diffResult.error?.code || "DIFF_FAILED",
        diffResult.error?.message || "Diff agent failed during regulatory comparison.",
        startTime
      );
    }

    // Step 2: Policy Impact & Gap Analysis Agent
    const gapResult = await analyzeComplianceGaps(regulation.id, actorId);
    if (!gapResult.success || !gapResult.data) {
      return createAgentFailureResult(
        gapResult.error?.code || "GAP_ANALYSIS_FAILED",
        gapResult.error?.message || "Gap analysis agent failed.",
        startTime
      );
    }

    // Step 3: Enter Human-in-the-Loop State (Stop for approval)
    const result: RegulatoryWorkflowResult = {
      regulationId: regulation.id,
      regulationCode: regulation.regulationCode,
      version: regulation.version,
      diff: diffResult.data,
      gapAnalysis: gapResult.data,
      status: "WAITING_FOR_HUMAN",
      message: `Autonomous analysis completed. ${diffResult.data.changes.length} clauses analyzed, ${gapResult.data.identifiedGapsCount} compliance gaps identified. Awaiting human compliance officer approval.`,
    };

    return createAgentSuccessResult<RegulatoryWorkflowResult>(result, "WAITING_FOR_HUMAN", startTime);
  } catch (error: any) {
    console.error("[WorkflowOrchestrator] Error running regulatory workflow:", error);
    return createAgentFailureResult(
      "WORKFLOW_ERROR",
      error?.message || "Failed to execute regulatory analysis workflow",
      startTime
    );
  }
}
