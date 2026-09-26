import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/stats
 * Aggregate metrics for Executive Dashboard KPIs
 */
export async function GET() {
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

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
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
