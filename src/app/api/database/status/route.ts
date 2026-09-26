import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  const isNeon = dbUrl.includes("neon.tech");

  const startTime = Date.now();
  try {
    // Quick probe to check if database is online
    const [accountCount, txCount, auditCount] = await Promise.all([
      prisma.financialAccount.count(),
      prisma.transaction.count(),
      prisma.auditLog.count(),
    ]);

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      connected: true,
      provider: isNeon ? "Neon Serverless PostgreSQL (pgvector)" : "PostgreSQL Database",
      latencyMs,
      stats: {
        accounts: accountCount,
        transactions: txCount,
        auditLogs: auditCount,
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
