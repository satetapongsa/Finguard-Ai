import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AuditQuerySchema } from "@/lib/types";

/**
 * GET /api/audit
 * Immutable Audit Explorer query endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parseResult = AuditQuerySchema.safeParse({
      actionType: searchParams.get("actionType") || undefined,
      status: searchParams.get("status") || undefined,
      limit: searchParams.get("limit") || 50,
    });

    const { actionType, status, limit } = parseResult.success
      ? parseResult.data
      : { limit: 50, actionType: undefined, status: undefined };

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
      isIntegrityVerified: Boolean(log.payloadHash && log.payloadHash.length === 64),
    }));

    return NextResponse.json({
      success: true,
      count: formattedLogs.length,
      data: formattedLogs,
    });
  } catch (error) {
    console.error("Failed to query audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Audit log retrieval failed" },
      { status: 500 }
    );
  }
}
