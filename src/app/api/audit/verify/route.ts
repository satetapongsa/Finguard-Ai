import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuditChain } from "@/lib/security/guardrails";
import { simLedgerStore } from "@/lib/ledger/simulation-store";

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
  } catch (_error) {
    const simLogs = simLedgerStore.getAuditLogs(100);
    const report = verifyAuditChain(
      simLogs.map((l) => ({
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

    return NextResponse.json({
      success: true,
      verified: report.isValid,
      report,
      isSimulation: true,
    });
  }
}
