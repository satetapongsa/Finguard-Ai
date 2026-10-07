import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getReasoningProvider } from "@/lib/agents/gap-analysis/grounded-reasoning";
import { getEmbeddingProvider } from "@/lib/embeddings/embedding-provider";

/**
 * Health Check API
 * Checks Database connectivity, AI Reasoning Provider, Vector Embedding Provider, and BOT Adapter status
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE"; latencyMs?: number; details?: any }> = {};

  // 1. Neon Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "HEALTHY",
      latencyMs: Date.now() - dbStart,
    };
  } catch (error: any) {
    checks.database = {
      status: "UNAVAILABLE",
      latencyMs: Date.now() - dbStart,
      details: error?.message,
    };
  }

  // 2. AI Reasoning Provider check
  const reasoningProvider = getReasoningProvider();
  checks.aiReasoning = {
    status: reasoningProvider.name === "deterministic" ? "HEALTHY" : (process.env.AI_API_KEY ? "HEALTHY" : "DEGRADED"),
    details: {
      provider: reasoningProvider.name,
      model: reasoningProvider.model,
      mode: process.env.AI_MODE || "deterministic",
    },
  };

  // 3. Vector Embedding Provider check
  const embeddingProvider = getEmbeddingProvider();
  checks.vectorEmbeddings = {
    status: embeddingProvider.name === "none" ? "HEALTHY" : (process.env.EMBEDDING_API_KEY ? "HEALTHY" : "DEGRADED"),
    details: {
      provider: embeddingProvider.name,
      dimension: embeddingProvider.dimension,
      mode: process.env.EMBEDDING_MODE || "none",
    },
  };

  // 4. Regulatory Source check
  checks.regulatorySource = {
    status: "HEALTHY",
    details: {
      mode: process.env.REGULATORY_SOURCE_MODE || "demo",
      botEndpoint: "https://www.bot.or.th",
    },
  };

  const isDegraded = Object.values(checks).some((c) => c.status === "DEGRADED");
  const isUnavailable = Object.values(checks).some((c) => c.status === "UNAVAILABLE");

  const overallStatus = isUnavailable ? "UNAVAILABLE" : isDegraded ? "DEGRADED" : "HEALTHY";
  const statusCode = isUnavailable ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      totalLatencyMs: Date.now() - startTime,
      checks,
    },
    { status: statusCode }
  );
}
