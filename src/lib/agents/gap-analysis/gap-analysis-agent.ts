import prisma from "@/lib/prisma";
import { GapAnalysisResult, GapAnalysisFinding } from "./types";
import { retrieveRelevantPolicies } from "./policy-retriever";
import { getReasoningProvider, REGULATORY_GAP_PROMPT_VERSION } from "./grounded-reasoning";
import { AgentResult, createAgentSuccessResult, createAgentFailureResult } from "../common/types";
import { recordAuditEntry } from "@/lib/security/audit-logger";

/**
 * Agent 3: Policy Impact & Gap Analysis Agent (Phase 4 Grounded Edition)
 * Maps changed regulatory clauses to bank internal policies using grounded evidence.
 * Idempotent: respects existing ComplianceGap records and preserves Human decisions (APPROVED, REVIEWED, DISMISSED).
 * Stops execution and sets status to WAITING_FOR_HUMAN.
 */
export async function analyzeComplianceGaps(
  regulationId: string,
  actorId?: string | null
): Promise<AgentResult<GapAnalysisResult>> {
  const startTime = Date.now();
  const reasoningEngine = getReasoningProvider();

  try {
    const regulation = await prisma.regulation.findUnique({
      where: { id: regulationId },
      include: {
        chunks: {
          where: {
            changeType: { in: ["MODIFY", "ADD"] },
          },
          orderBy: { chunkIndex: "asc" },
        },
      },
    });

    if (!regulation) {
      return createAgentFailureResult(
        "REGULATION_NOT_FOUND",
        `Regulation with id ${regulationId} not found.`,
        startTime
      );
    }

    const findings: GapAnalysisFinding[] = [];

    // Analyze each changed chunk against bank policies
    for (const chunk of regulation.chunks) {
      const candidates = await retrieveRelevantPolicies({
        clauseRef: chunk.clauseRef,
        clauseContent: chunk.content,
      });

      for (const policy of candidates) {
        const assessment = await reasoningEngine.analyzeGap({
          clauseRef: chunk.clauseRef,
          clauseContent: chunk.content,
          previousContent: chunk.previousContent,
          policyCode: policy.policyCode,
          policyTitle: policy.title,
          policyContent: policy.content,
          policyDepartment: policy.ownerDepartment,
        });

        // Only persist if a real compliance gap was detected
        if (assessment.gapDetected) {
          // Check if an existing gap already exists for (regulationChunkId, internalPolicyId)
          const existingGap = await prisma.complianceGap.findFirst({
            where: {
              regulationId: regulation.id,
              regulationChunkId: chunk.id,
              internalPolicyId: policy.id,
            },
          });

          if (existingGap) {
            // Protect Human Decisions: do NOT reset status if APPROVED, REVIEWED, or DISMISSED
            if (existingGap.status === "OPEN") {
              await prisma.complianceGap.update({
                where: { id: existingGap.id },
                data: {
                  gapTitle: `${chunk.clauseRef} ↔ ${policy.policyCode} Compliance Conflict`,
                  finding: assessment.finding,
                  actionItem: assessment.actionItem,
                  riskLevel: assessment.riskLevel,
                  confidence: assessment.confidence,
                  reasoning: assessment.reasoning,
                  evidenceRegulation: assessment.evidence.regulationExcerpt,
                  evidencePolicy: assessment.evidence.policyExcerpt,
                  reasoningProvider: reasoningEngine.name,
                  promptVersion: REGULATORY_GAP_PROMPT_VERSION,
                },
              });
            }
          } else {
            // Create new ComplianceGap with Grounded Provenance
            await prisma.complianceGap.create({
              data: {
                regulationId: regulation.id,
                regulationChunkId: chunk.id,
                internalPolicyId: policy.id,
                gapTitle: `${chunk.clauseRef} ↔ ${policy.policyCode} Compliance Conflict`,
                finding: assessment.finding,
                actionItem: assessment.actionItem,
                riskLevel: assessment.riskLevel,
                status: "OPEN",
                confidence: assessment.confidence,
                reasoning: assessment.reasoning,
                evidenceRegulation: assessment.evidence.regulationExcerpt,
                evidencePolicy: assessment.evidence.policyExcerpt,
                reasoningProvider: reasoningEngine.name,
                promptVersion: REGULATORY_GAP_PROMPT_VERSION,
              },
            });
          }

          findings.push({
            clauseRef: chunk.clauseRef,
            chunkId: chunk.id,
            policyCode: policy.policyCode,
            policyId: policy.id,
            gapTitle: `${chunk.clauseRef} ↔ ${policy.policyCode} Compliance Conflict`,
            finding: assessment.finding,
            actionItem: assessment.actionItem,
            riskLevel: assessment.riskLevel,
            confidence: assessment.confidence,
            reasoning: assessment.reasoning,
            regulationSnippet: assessment.evidence.regulationExcerpt,
            policySnippet: assessment.evidence.policyExcerpt,
          });
        }
      }
    }

    // Cryptographic audit log entry
    await recordAuditEntry({
      actorId: actorId || null,
      actionType: "GAP_IDENTIFIED",
      targetResource: "Regulation",
      resourceId: regulation.id,
      details: {
        regulationCode: regulation.regulationCode,
        version: regulation.version,
        gapsIdentified: findings.length,
        status: "WAITING_FOR_HUMAN",
      },
    });

    const result: GapAnalysisResult = {
      regulationId: regulation.id,
      regulationCode: regulation.regulationCode,
      version: regulation.version,
      analyzedClausesCount: regulation.chunks.length,
      identifiedGapsCount: findings.length,
      findings,
      status: "WAITING_FOR_HUMAN",
    };

    return createAgentSuccessResult<GapAnalysisResult>(result, "WAITING_FOR_HUMAN", startTime);
  } catch (error: any) {
    console.error("[GapAnalysisAgent] Error analyzing compliance gaps:", error);
    return createAgentFailureResult(
      "GAP_ANALYSIS_ERROR",
      error?.message || "Failed to analyze compliance gaps",
      startTime
    );
  }
}
