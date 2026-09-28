import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

let statsCache: { data: any; expiresAt: number } | null = null;
const CACHE_TTL_MS = 2500; // 2.5 seconds micro-cache

/**
 * GET /api/stats
 * Aggregate metrics for Executive Dashboard KPIs with microsecond in-memory caching
 */
export async function GET() {
  const now = Date.now();
  if (statsCache && now < statsCache.expiresAt) {
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
    const [totalTransactions, flaggedCount, accounts, policiesCount, recentTx] =
      await Promise.all([
        prisma.transaction.aggregate({
          _sum: { amount: true },
          _count: { id: true },
        }),
        prisma.transaction.count({
          where: { status: "FLAGGED" },
        }),
        prisma.financialAccount.findMany({
          select: { balance: true, status: true },
        }),
        prisma.compliancePolicy.count({
          where: { isActive: true },
        }),
        prisma.transaction.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            sourceAccount: { select: { accountNumber: true, accountName: true } },
            destinationAccount: { select: { accountNumber: true, accountName: true } },
          },
        }),
      ]);

    const totalBalance = accounts.reduce((acc, curr) => {
      return acc + parseFloat(curr.balance.toString());
    }, 0);

    const totalVolume = totalTransactions._sum.amount
      ? parseFloat(totalTransactions._sum.amount.toString())
      : 0;

    const data = {
      totalVolume,
      transactionCount: totalTransactions._count.id,
      verifiedLedgerBalance: totalBalance,
      highRiskFlags: flaggedCount,
      activeComplianceAlerts: policiesCount,
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
