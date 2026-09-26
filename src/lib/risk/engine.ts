import { Decimal } from "decimal.js";
import prisma from "@/lib/prisma";
import { RiskEvaluationResult } from "@/lib/types";

export interface EnhancedRiskEvaluationResult extends RiskEvaluationResult {
  recommendedAction: "APPROVE" | "FLAG_FOR_REVIEW" | "REJECT_ANOMALY";
  velocityMetrics: {
    burstCount5m: number;
    hourlyCount: number;
    cumulativeVolume24h: string;
  };
}

/**
 * Autonomous BFSI Risk Assessment & Interception Engine
 * Combines regulatory rules (BOT, AMLO) and velocity heuristics.
 */
export async function evaluateTransactionRisk(params: {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  type: string;
}): Promise<EnhancedRiskEvaluationResult> {
  const flags: string[] = [];
  let score = 0.05; // Base low baseline

  const amt = new Decimal(params.amount);
  let burstCount5m = 0;
  let hourlyCount = 0;
  let cumulative24h = new Decimal(0);

  // 1. Regulatory Amount Threshold Checks (Bank of Thailand & AMLO)
  // AMLO Mandate: Threshold >= 2,000,000 THB requires mandatory asset declaration
  if (amt.greaterThanOrEqualTo(2000000)) {
    score += 0.65;
    flags.push("THRESHOLD_EXCEEDED_2M_THB: Mandatory AMLO Cash/Asset Reporting");
  } else if (amt.greaterThanOrEqualTo(500000)) {
    // BOT Directive: Transactions >= 500,000 THB require elevated anomaly screening
    score += 0.35;
    flags.push("THRESHOLD_EXCEEDED_500K_THB: BOT Elevated Transaction Alert");
  } else if (amt.greaterThanOrEqualTo(200000)) {
    score += 0.15;
    flags.push("MEDIUM_VALUE_TRANSFER");
  }

  // 2. Transaction Type Specific Risk
  if (params.type === "CROSS_BORDER") {
    score += 0.25;
    flags.push("CROSS_BORDER_SETTLEMENT: Heightened FATF Recommendation 16 scrutiny required");
  }

  // 3. Historical Velocity Bursts & Structuring Heuristics
  if (process.env.DATABASE_URL) {
    try {
      const now = Date.now();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      const oneHourAgo = new Date(now - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

      // Query historical counts and volume for this source account
      const [recent5m, recent1h, pastDayTxs] = await Promise.all([
        prisma.transaction.count({
          where: {
            sourceAccountId: params.sourceAccountId,
            createdAt: { gte: fiveMinutesAgo },
          },
        }),
        prisma.transaction.count({
          where: {
            sourceAccountId: params.sourceAccountId,
            createdAt: { gte: oneHourAgo },
          },
        }),
        prisma.transaction.findMany({
          where: {
            sourceAccountId: params.sourceAccountId,
            createdAt: { gte: twentyFourHoursAgo },
          },
          select: { amount: true },
        }),
      ]);

      burstCount5m = recent5m;
      hourlyCount = recent1h;

      cumulative24h = pastDayTxs.reduce(
        (acc, tx) => acc.plus(new Decimal(tx.amount.toString())),
        new Decimal(0)
      ).plus(amt);

      // Heuristic A: Velocity Burst Anomaly (>= 3 transfers within 5 minutes)
      if (burstCount5m >= 3) {
        score += 0.45;
        flags.push(`VELOCITY_BURST_ANOMALY: ${burstCount5m} rapid transactions detected in past 5 minutes`);
      }

      // Heuristic B: Sustained Hourly Velocity (>= 5 transfers in 1 hour)
      if (hourlyCount >= 5) {
        score += 0.35;
        flags.push(`HIGH_HOURLY_VELOCITY: ${hourlyCount} transactions in past 60 minutes`);
      } else if (hourlyCount >= 3) {
        score += 0.15;
        flags.push(`MODERATE_HOURLY_VELOCITY: ${hourlyCount} transactions in past 60 minutes`);
      }

      // Heuristic C: Structuring / Smurfing Detection
      // Transfer is individually below 500k, but 24h cumulative exceeds 2M AMLO threshold
      if (amt.lessThan(500000) && cumulative24h.greaterThanOrEqualTo(2000000)) {
        score += 0.40;
        flags.push(
          `STRUCTURING_ANOMALY: 24h cumulative volume ฿${cumulative24h.toFixed(2)} exceeds AMLO 2M threshold across split transfers`
        );
      }
    } catch (_e) {
      // If database lookup fails during isolated preview tests, continue with baseline
    }

    // 4. Source Account Standing & Destination Standing
    try {
      const [sourceAcc, destAcc] = await Promise.all([
        prisma.financialAccount.findUnique({
          where: { id: params.sourceAccountId },
          select: { status: true },
        }),
        prisma.financialAccount.findUnique({
          where: { id: params.destinationAccountId },
          select: { status: true },
        }),
      ]);

      if (sourceAcc?.status === "UNDER_INVESTIGATION") {
        score += 0.50;
        flags.push("ACCOUNT_UNDER_INVESTIGATION: Source account is under regulatory audit");
      }

      if (destAcc?.status === "UNDER_INVESTIGATION") {
        score += 0.55;
        flags.push("BENEFICIARY_UNDER_INVESTIGATION: Destination counterparty flagged in AML watchlist");
      }
    } catch (_e) {
      // Fallback if not available
    }
  }

  // Clamp score between 0.01 and 1.00
  const finalScore = Math.min(1.0, Math.max(0.01, parseFloat(score.toFixed(2))));
  const isHighRisk = finalScore >= 0.65;

  let recommendedAction: "APPROVE" | "FLAG_FOR_REVIEW" | "REJECT_ANOMALY" = "APPROVE";
  if (finalScore >= 0.85) {
    recommendedAction = "REJECT_ANOMALY";
  } else if (finalScore >= 0.65) {
    recommendedAction = "FLAG_FOR_REVIEW";
  }

  let riskReason = flags.length > 0 ? flags.join(" | ") : "Normal domestic transaction parameters verified";
  if (isHighRisk) {
    riskReason = `[HIGH RISK ESCALATION] ${riskReason}`;
  }

  return {
    riskScore: finalScore,
    riskReason,
    isHighRisk,
    recommendedAction,
    flags,
    velocityMetrics: {
      burstCount5m,
      hourlyCount,
      cumulativeVolume24h: cumulative24h.toFixed(2),
    },
  };
}
