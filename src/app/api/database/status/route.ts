import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  const isNeon = dbUrl.includes("neon.tech");

  const startTime = Date.now();
  try {
    // Ultra-fast single round-trip ping & table counts
    const counts = await prisma.$queryRaw<
      { accounts: bigint | number; transactions: bigint | number; audits: bigint | number }[]
    >`
      SELECT 
        (SELECT COUNT("id") FROM "FinancialAccount") AS accounts,
        (SELECT COUNT("id") FROM "Transaction") AS transactions,
        (SELECT COUNT("id") FROM "AuditLog") AS audits
    `;

    const latencyMs = Date.now() - startTime;
    const c = counts[0] || { accounts: 0, transactions: 0, audits: 0 };

    return NextResponse.json({
      success: true,
      connected: true,
      provider: isNeon ? "Neon Serverless PostgreSQL (pgvector)" : "PostgreSQL Database",
      latencyMs,
      stats: {
        accounts: Number(c.accounts),
        transactions: Number(c.transactions),
        auditLogs: Number(c.audits),
      },
      message: isNeon
        ? "Connected directly to Neon PostgreSQL with active connection pooler"
        : "Connected to local / custom PostgreSQL instance",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      connected: false,
      provider: isNeon ? "Neon PostgreSQL" : "PostgreSQL Database",
      message: "Database connection unreachable. Verify DATABASE_URL in environment variables.",
      details: error instanceof Error ? error.message : "Database connection offline",
    });
  }
}
