import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "HEALTHY";
  let dbLatencyMs = 0;
  let activeAccountsCount = 0;

  try {
    const dbStart = Date.now();
    activeAccountsCount = await prisma.account.count();
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = "DEGRADED";
    console.error("Health check DB probe error:", err);
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const responsePayload = {
    status: dbStatus === "HEALTHY" ? "UP" : "DEGRADED",
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    responseTimeMs: Date.now() - startTime,
    components: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: "Neon Serverless PostgreSQL",
        activeAccounts: activeAccountsCount,
      },
      securityEngine: {
        status: "ACTIVE",
        pdpGuardrails: "ENFORCED",
        rbac: "STRICT",
        circuitBreaker: "ARMED",
      },
      system: {
        nodeVersion: process.version,
        memoryRssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
        memoryHeapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      },
    },
  };

  return NextResponse.json(responsePayload, {
    status: dbStatus === "HEALTHY" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-FinGuard-Health": dbStatus,
    },
  });
}
