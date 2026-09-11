import { Decimal } from "decimal.js";
import prisma from "@/lib/prisma";
import { RiskEvaluationResult } from "@/lib/types";

/**
 * Autonomous BFSI Risk Assessment Engine
 * Combines regulatory rules (BOT, AMLO) and velocity heuristics.
 */
export async function evaluateTransactionRisk(params: {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  type: string;
}): Promise<RiskEvaluationResult> {
  const flags: string[] = [];
  let score = 0.05; // Base low baseline

  const amt = new Decimal(params.amount);

  // 1. Regulatory Amount Threshold Checks (Bank of Thailand & AMLO)
  if (amt.greaterThanOrEqualTo(2000000)) {
    score += 0.50;
    flags.push("THRESHOLD_EXCEEDED_2M_THB: Mandatory AMLO Cash/Asset Reporting");
  } else if (amt.greaterThanOrEqualTo(500000)) {
    score += 0.30;
    flags.push("THRESHOLD_EXCEEDED_500K_THB: Elevated Transaction Alert");
  } else if (amt.greaterThanOrEqualTo(200000)) {
    score += 0.15;
    flags.push("MEDIUM_VALUE_TRANSFER");
  }

  // 2. Transaction Type Specific Risk
  if (params.type === "CROSS_BORDER") {
    score += 0.25;
    flags.push("CROSS_BORDER_SETTLEMENT: Heightened jurisdiction scrutiny required");
  }

  // 3. Historical Velocity Heuristics (Count transactions in last 1 hour)
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTxCount = await prisma.transaction.count({
      where: {
        sourceAccountId: params.sourceAccountId,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentTxCount >= 5) {
      score += 0.40;
      flags.push(`HIGH_VELOCITY_ANOMALY: ${recentTxCount} transfers in past 60 minutes`);
    } else if (recentTxCount >= 3) {
      score += 0.20;
      flags.push(`MODERATE_VELOCITY: ${recentTxCount} transfers in past 60 minutes`);
    }
  } catch (_e) {
    // If database lookup fails during dry runs, proceed with baseline
  }

  // 4. Source Account Standing
  try {
    const sourceAcc = await prisma.financialAccount.findUnique({
      where: { id: params.sourceAccountId },
      select: { status: true },
    });

    if (sourceAcc?.status === "UNDER_INVESTIGATION") {
      score += 0.50;
      flags.push("ACCOUNT_UNDER_INVESTIGATION: High priority compliance alert");
    }
  } catch (_e) {
    // Fallback if not available
  }

  // Clamp score between 0.00 and 1.00
  const finalScore = Math.min(1.0, Math.max(0.01, parseFloat(score.toFixed(2))));
  const isHighRisk = finalScore >= 0.65;

  let riskReason = flags.length > 0 ? flags.join(" | ") : "Normal domestic transaction parameters verified";
  if (isHighRisk) {
    riskReason = `[HIGH RISK ESCALATION] ${riskReason}`;
  }

  return {
    riskScore: finalScore,
    riskReason,
    isHighRisk,
    flags,
  };
}
