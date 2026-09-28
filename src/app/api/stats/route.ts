import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

let statsCache: { data: any; expiresAt: number } | null = null;
const CACHE_TTL_MS = 2500; // 2.5 seconds micro-cache

/**
 * GET /api/stats
 * Aggregate metrics for Executive Dashboard KPIs with microsecond in-memory caching
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bypassCache = searchParams.has("_t");

  const now = Date.now();
  if (!bypassCache && statsCache && now < statsCache.expiresAt) {
    return NextResponse.json(
      { success: true, data: statsCache.data, cached: true },
      {
        headers: {
          "Cache-Control": "private, no-cache, stale-while-revalidate=5",
          "X-FinGuard-Cache": "HIT",
        },
      }
    );
  }

  try {
    // Ultra-fast single SQL aggregation query directly executed in PostgreSQL engine
    const [summaryResult, recentTx] = await Promise.all([
      prisma.$queryRaw<
        {
          total_volume: number | null;
          tx_count: bigint | number;
          total_balance: number | null;
          flagged_count: bigint | number;
          policies_count: bigint | number;
        }[]
      >`
        SELECT 
          (SELECT COALESCE(SUM("amount"), 0) FROM "Transaction") AS total_volume,
          (SELECT COUNT("id") FROM "Transaction") AS tx_count,
          (SELECT COALESCE(SUM("balance"), 0) FROM "FinancialAccount") AS total_balance,
          (SELECT COUNT("id") FROM "Transaction" WHERE "status" = 'FLAGGED') AS flagged_count,
          (SELECT COUNT("id") FROM "CompliancePolicy" WHERE "isActive" = true) AS policies_count
      `,
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          riskScore: true,
          riskReason: true,
          createdAt: true,
          sourceAccount: { select: { accountNumber: true, accountName: true } },
          destinationAccount: { select: { accountNumber: true, accountName: true } },
        },
      }),
    ]);

    const row = summaryResult[0] || {
      total_volume: 0,
      tx_count: 0,
      total_balance: 0,
      flagged_count: 0,
      policies_count: 0,
    };

    const data = {
      totalVolume: Number(row.total_volume || 0),
      transactionCount: Number(row.tx_count || 0),
      verifiedLedgerBalance: Number(row.total_balance || 0),
      highRiskFlags: Number(row.flagged_count || 0),
      activeComplianceAlerts: Number(row.policies_count || 0),
      recentTransactions: recentTx.map((t) => ({
        ...t,
        amount: t.amount.toString(),
        createdAt: t.createdAt.toISOString(),
      })),
    };

    statsCache = { data, expiresAt: now + CACHE_TTL_MS };

    return NextResponse.json(
      { success: true, data, cached: false },
      {
        headers: {
          "Cache-Control": "private, no-cache, stale-while-revalidate=5",
          "X-FinGuard-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("Failed to load stats from database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to compute stats from Neon PostgreSQL database",
        details: error instanceof Error ? error.message : "Database error",
      },
      { status: 500 }
    );
  }
}
