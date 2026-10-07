import prisma from "@/lib/prisma";
import crypto from "crypto";
import { RegulatoryDocumentInput, IngestionResult } from "./types";
import { AgentResult, createAgentSuccessResult, createAgentFailureResult } from "../common/types";
import { recordAuditEntry } from "@/lib/security/audit-logger";

function computeContentHash(text: string): string {
  return crypto.createHash("sha256").update(text.trim()).digest("hex");
}

/**
 * Agent 1: Ingestion Agent
 * Ingests a validated regulatory document into normalized database models.
 * Strictly idempotent: will not create duplicate (regulationCode, version).
 */
export async function ingestRegulatoryDocument(
  input: RegulatoryDocumentInput,
  actorId?: string | null
): Promise<AgentResult<IngestionResult>> {
  const startTime = Date.now();

  try {
    if (!input.regulationCode || !input.version || !input.title) {
      return createAgentFailureResult(
        "INVALID_INPUT",
        "regulationCode, version, and title are required.",
        startTime
      );
    }

    if (!input.clauses || input.clauses.length === 0) {
      return createAgentFailureResult(
        "EMPTY_CLAUSES",
        "Document must contain at least one clause.",
        startTime
      );
    }

    // 1. Idempotency Check: (regulationCode, version)
    const existing = await prisma.regulation.findUnique({
      where: {
        regulationCode_version: {
          regulationCode: input.regulationCode,
          version: input.version,
        },
      },
      include: {
        chunks: true,
      },
    });

    if (existing) {
      return createAgentSuccessResult<IngestionResult>(
        {
          regulationId: existing.id,
          regulationCode: existing.regulationCode,
          version: existing.version,
          isNew: false,
          chunksCount: existing.chunks.length,
          supersededRegulationId: existing.supersedesId,
        },
        "COMPLETED",
        startTime
      );
    }

    // 2. Resolve Previous Superseded Version if specified or if an older version exists
    let supersedesId: string | null = null;
    if (input.supersedesRegulationCode && input.supersedesVersion) {
      const pred = await prisma.regulation.findUnique({
        where: {
          regulationCode_version: {
            regulationCode: input.supersedesRegulationCode,
            version: input.supersedesVersion,
          },
        },
      });
      if (pred) supersedesId = pred.id;
    } else {
      // Find latest prior version of same code
      const prior = await prisma.regulation.findFirst({
        where: {
          regulationCode: input.regulationCode,
          version: { not: input.version },
        },
        orderBy: { publishedAt: "desc" },
      });
      if (prior) supersedesId = prior.id;
    }

    // 3. Atomically create Regulation and Chunks
    const effectiveFrom = new Date(input.effectiveFrom);
    const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;
    const publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date();

    const createdRegulation = await prisma.$transaction(async (tx) => {
      // If supersedesId found, mark previous version as REVOKED if currently ACTIVE
      if (supersedesId) {
        await tx.regulation.update({
          where: { id: supersedesId },
          data: {
            status: "REVOKED",
            effectiveTo: effectiveTo || new Date(),
          },
        });
      }

      const reg = await tx.regulation.create({
        data: {
          regulationCode: input.regulationCode,
          title: input.title,
          version: input.version,
          issuer: input.issuer || "Bank of Thailand",
          sourceType: input.sourceType || "SYNTHETIC_DEMO",
          sourceDocumentId: input.sourceDocumentId || null,
          sourceUrl: input.sourceUrl || null,
          documentUrl: input.documentUrl || null,
          documentHash: input.documentHash || null,
          language: input.language || "EN",
          publishedAt,
          effectiveFrom,
          effectiveTo,
          status: input.status || "ACTIVE",
          supersedesId,
        },
      });

      // Insert chunks sequentially preserving chunkIndex
      for (let i = 0; i < input.clauses.length; i++) {
        const cl = input.clauses[i];
        const hash = computeContentHash(cl.content);

        await tx.regulationChunk.create({
          data: {
            regulationId: reg.id,
            chunkIndex: i,
            clauseRef: cl.clauseRef,
            heading: cl.heading || null,
            content: cl.content,
            contentHash: hash,
            changeType: "UNCHANGED",
          },
        });
      }

      return reg;
    });

    // 4. Record Cryptographic Audit Log
    await recordAuditEntry({
      actorId: actorId || null,
      actionType: "REGULATION_INGESTED",
      targetResource: "Regulation",
      resourceId: createdRegulation.id,
      details: {
        regulationCode: createdRegulation.regulationCode,
        version: createdRegulation.version,
        chunksCount: input.clauses.length,
        supersedesId,
      },
    });

    return createAgentSuccessResult<IngestionResult>(
      {
        regulationId: createdRegulation.id,
        regulationCode: createdRegulation.regulationCode,
        version: createdRegulation.version,
        isNew: true,
        chunksCount: input.clauses.length,
        supersededRegulationId: supersedesId,
      },
      "COMPLETED",
      startTime
    );
  } catch (error: any) {
    console.error("[IngestionAgent] Execution failed:", error);
    return createAgentFailureResult(
      "INGESTION_ERROR",
      error?.message || "Failed to ingest regulatory document",
      startTime
    );
  }
}
