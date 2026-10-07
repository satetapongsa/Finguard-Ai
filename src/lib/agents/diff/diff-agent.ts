import prisma from "@/lib/prisma";
import { ChangeType } from "@prisma/client";
import { RegulationDiffResult, RegulationChange } from "./types";
import { normalizeClauseText, generateChangeExplanation } from "./clause-matcher";
import { AgentResult, createAgentSuccessResult, createAgentFailureResult } from "../common/types";
import { recordAuditEntry } from "@/lib/security/audit-logger";

/**
 * Agent 2: Versioning & Diff Agent
 * Deterministically compares current regulation version against previous version.
 * Persists changeType and previousContent on RegulationChunk records.
 * Does not overwrite historical versions.
 */
export async function compareRegulationVersions(
  currentRegulationId: string,
  actorId?: string | null
): Promise<AgentResult<RegulationDiffResult>> {
  const startTime = Date.now();

  try {
    // 1. Fetch current regulation and its chunks
    const currentReg = await prisma.regulation.findUnique({
      where: { id: currentRegulationId },
      include: {
        chunks: { orderBy: { chunkIndex: "asc" } },
        supersedes: {
          include: {
            chunks: { orderBy: { chunkIndex: "asc" } },
          },
        },
      },
    });

    if (!currentReg) {
      return createAgentFailureResult(
        "REGULATION_NOT_FOUND",
        `Regulation with id ${currentRegulationId} not found.`,
        startTime
      );
    }

    // 2. Resolve predecessor regulation
    let previousReg = currentReg.supersedes;

    // Fallback if not linked explicitly via supersedesId
    if (!previousReg) {
      const prior = await prisma.regulation.findFirst({
        where: {
          regulationCode: currentReg.regulationCode,
          id: { not: currentReg.id },
          publishedAt: { lte: currentReg.publishedAt },
        },
        orderBy: { publishedAt: "desc" },
        include: {
          chunks: { orderBy: { chunkIndex: "asc" } },
        },
      });
      if (prior) {
        previousReg = prior;
      }
    }

    const oldChunksMap = new Map<string, { clauseRef: string; content: string }>();
    if (previousReg) {
      for (const oldC of previousReg.chunks) {
        oldChunksMap.set(oldC.clauseRef.trim(), {
          clauseRef: oldC.clauseRef,
          content: oldC.content,
        });
      }
    }

    const changes: RegulationChange[] = [];
    let added = 0;
    let modified = 0;
    let deleted = 0;
    let unchanged = 0;

    // 3. Process each current chunk deterministically
    const currentChunkRefs = new Set<string>();

    for (const chunk of currentReg.chunks) {
      const ref = chunk.clauseRef.trim();
      currentChunkRefs.add(ref);

      const oldMatch = oldChunksMap.get(ref);

      let changeType: ChangeType = "UNCHANGED";
      let prevContent: string | null = null;

      if (!oldMatch) {
        changeType = "ADD";
        added++;
      } else {
        prevContent = oldMatch.content;
        const normNew = normalizeClauseText(chunk.content);
        const normOld = normalizeClauseText(oldMatch.content);

        if (normNew === normOld) {
          changeType = "UNCHANGED";
          unchanged++;
        } else {
          changeType = "MODIFY";
          modified++;
        }
      }

      const explanation = generateChangeExplanation(
        chunk.clauseRef,
        changeType,
        prevContent,
        chunk.content
      );

      // Persist diff metadata into chunk if changed or not yet set
      if (chunk.changeType !== changeType || chunk.previousContent !== prevContent) {
        await prisma.regulationChunk.update({
          where: { id: chunk.id },
          data: {
            changeType,
            previousContent: prevContent,
          },
        });
      }

      changes.push({
        clauseRef: chunk.clauseRef,
        chunkIndex: chunk.chunkIndex,
        changeType,
        oldContent: prevContent,
        newContent: chunk.content,
        explanation,
        chunkId: chunk.id,
      });
    }

    // 4. Identify DELETED clauses (existed in old version, but missing in current)
    if (previousReg) {
      for (const [oldRef, oldVal] of oldChunksMap.entries()) {
        if (!currentChunkRefs.has(oldRef)) {
          deleted++;
          const explanation = generateChangeExplanation(oldRef, "DELETE", oldVal.content, null);
          changes.push({
            clauseRef: oldRef,
            changeType: "DELETE",
            oldContent: oldVal.content,
            newContent: null,
            explanation,
          });
        }
      }
    }

    const diffResult: RegulationDiffResult = {
      previousRegulationId: previousReg?.id || null,
      currentRegulationId: currentReg.id,
      previousVersion: previousReg?.version || null,
      currentVersion: currentReg.version,
      regulationCode: currentReg.regulationCode,
      summary: {
        added,
        modified,
        deleted,
        unchanged,
        total: changes.length,
      },
      changes,
    };

    // 5. Cryptographic audit log entry
    await recordAuditEntry({
      actorId: actorId || null,
      actionType: "DIFF_ANALYSIS_COMPLETED",
      targetResource: "Regulation",
      resourceId: currentReg.id,
      details: {
        regulationCode: currentReg.regulationCode,
        currentVersion: currentReg.version,
        previousVersion: previousReg?.version || null,
        summary: diffResult.summary,
      },
    });

    return createAgentSuccessResult<RegulationDiffResult>(diffResult, "COMPLETED", startTime);
  } catch (error: any) {
    console.error("[DiffAgent] Error executing diff:", error);
    return createAgentFailureResult(
      "DIFF_ERROR",
      error?.message || "Failed to compare regulation versions",
      startTime
    );
  }
}
