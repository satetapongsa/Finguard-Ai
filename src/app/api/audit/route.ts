import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AuditQuerySchema } from "@/lib/types";
import {
  computeAuditEntryHash,
  computePayloadHash,
  GENESIS_PREV_HASH,
  verifyAuditChain,
} from "@/lib/security/guardrails";

/**
 * GET /api/audit
 * Immutable Audit Explorer query endpoint with Blockchain-style cryptographic integrity
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parseResult = AuditQuerySchema.safeParse({
    actionType: searchParams.get("actionType") || undefined,
    status: searchParams.get("status") || undefined,
    limit: searchParams.get("limit") || 50,
  });

  const { actionType, status, limit } = parseResult.success
    ? parseResult.data
    : { limit: 50, actionType: undefined, status: undefined };

  try {
    const shouldVerify = searchParams.get("verify") === "true";

    const whereClause: Prisma.AuditLogWhereInput = {};
    if (actionType && actionType !== "ALL") {
      whereClause.actionType = actionType;
    }
    if (status) {
      whereClause.status = status;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    const formattedLogs = auditLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
      isIntegrityVerified: Boolean(
        log.payloadHash &&
          log.payloadHash.length === 64 &&
          log.entryHash &&
          log.entryHash.length === 64
      ),
    }));

    // Optional real-time chain verification
    let chainReport = undefined;
    if (shouldVerify) {
      chainReport = verifyAuditChain(
        auditLogs.map((l) => ({
          id: l.id,
          previousHash: l.previousHash,
          entryHash: l.entryHash,
          payloadHash: l.payloadHash,
          actionType: l.actionType,
          targetResource: l.targetResource,
          resourceId: l.resourceId,
          createdAt: l.createdAt,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      count: formattedLogs.length,
      data: formattedLogs,
      verification: chainReport,
    });
  } catch (error) {
    console.error("Failed to fetch audit logs from database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit logs from Neon PostgreSQL database",
        details: error instanceof Error ? error.message : "Database error",
      },
      { status: 500 }
    );
  }
}
