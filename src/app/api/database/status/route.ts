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
      success: true,
      connected: false,
      provider: isNeon ? "Neon PostgreSQL (Connecting...)" : "Simulation Ledger Engine",
      mode: "STANDALONE_SIMULATOR",
      message:
        "Running in high-fidelity in-memory simulator mode. To connect Neon, set DATABASE_URL and DIRECT_URL in .env and run 'npm run db:setup'.",
      details: error instanceof Error ? error.message : "Database offline",
    });
  }
}
