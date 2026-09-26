import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuditChain } from "@/lib/security/guardrails";

/**
 * GET /api/audit/verify
 * Cryptographic Tamper-Evidence Verification Endpoint
 * Validates the unbroken SHA-256 blockchain-style chain across all audit blocks.
 */
export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        previousHash: true,
        entryHash: true,
        payloadHash: true,
        actionType: true,
        targetResource: true,
        resourceId: true,
        createdAt: true,
      },
    });

    const report = verifyAuditChain(logs);

    return NextResponse.json({
      success: true,
      verified: report.isValid,
      report,
    });
  } catch (error) {
    console.error("Failed to verify audit chain from database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify audit chain from Neon PostgreSQL database",
        details: error instanceof Error ? error.message : "Database error",
      },
      { status: 500 }
    );
  }
}
