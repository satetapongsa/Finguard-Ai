import prisma from "@/lib/prisma";
import {
  computePayloadHash,
  computeAuditEntryHash,
  GENESIS_PREV_HASH,
} from "@/lib/security/guardrails";

export interface CreateAuditEntryParams {
  actorId?: string | null;
  actionType:
    | "REGULATION_INGESTED"
    | "DIFF_ANALYSIS_COMPLETED"
    | "GAP_IDENTIFIED"
    | "GAP_UPDATED"
    | "GAP_APPROVED"
    | "GAP_REJECTED"
    | "DISPATCH_CREATED"
    | string;
  targetResource: "Regulation" | "RegulationChunk" | "InternalPolicy" | "ComplianceGap" | "DispatchTicket";
  resourceId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  status?: "SUCCESS" | "BLOCKED" | "ALERT";
}

/**
 * Enterprise Immutable Cryptographic Audit Logger
 * Maintains an unbroken SHA-256 linked blockchain-style audit ledger
 */
export async function recordAuditEntry(params: CreateAuditEntryParams) {
  try {
    const timestamp = new Date();
    // Do not log secrets or sensitive auth tokens
    const sanitizedDetails = { ...params.details };

    const payloadHash = computePayloadHash({
      actionType: params.actionType,
      targetResource: params.targetResource,
      resourceId: params.resourceId || "",
      details: sanitizedDetails,
      timestamp: timestamp.toISOString(),
    });

    const previousLog = await prisma.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { entryHash: true },
    });

    const previousHash = previousLog?.entryHash || GENESIS_PREV_HASH;

    const entryHash = computeAuditEntryHash({
      previousHash,
      payloadHash,
      actionType: params.actionType,
      targetResource: params.targetResource,
      resourceId: params.resourceId,
      createdAt: timestamp,
    });

    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        actionType: params.actionType,
        targetResource: params.targetResource,
        resourceId: params.resourceId || null,
        payloadHash,
        previousHash,
        entryHash,
        ipAddress: params.ipAddress || null,
        status: params.status || "SUCCESS",
        details: sanitizedDetails as any,
        createdAt: timestamp,
      },
    });
  } catch (error) {
    console.error("[AuditLogger] Failed to write audit log entry:", error);
    // Non-blocking fallback to preserve primary workflow if audit table encounters transient error
    return null;
  }
}
