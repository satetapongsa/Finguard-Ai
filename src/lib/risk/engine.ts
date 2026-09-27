import { Decimal } from "decimal.js";
import prisma from "@/lib/prisma";
import { RiskEvaluationResult, MathAnomalyMetrics } from "@/lib/types";

export interface EnhancedRiskEvaluationResult extends RiskEvaluationResult {
  recommendedAction: "APPROVE" | "FLAG_FOR_REVIEW" | "REJECT_ANOMALY";
  velocityMetrics: {
    burstCount5m: number;
    hourlyCount: number;
    cumulativeVolume24h: string;
  };
}

/**
 * Autonomous BFSI Risk Assessment & Mathematical Anomaly Interception Engine
 * Combines regulatory rules (Bank of Thailand & AMLO), Gaussian Z-Score statistics,
 * burst velocity, and structuring/smurfing heuristics.
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
  let historicalMean = 150000;
  let historicalStdDev = 120000;
  let zScore = 0;
  let isGaussianOutlier = false;
  let velocityScore = 0;
  let smurfingRatio = 0;

  // 1. Regulatory Amount Threshold Checks (Bank of Thailand & AMLO)
  // AMLO Mandate: Threshold >= 2,000,000 THB requires mandatory asset declaration
  if (amt.greaterThanOrEqualTo(2000000)) {
    score += 0.65;
    flags.push("THRESHOLD_EXCEEDED_2M_THB: เงื่อนไข ปปง. &ge; ฿2,000,000 (Mandatory AMLO STR Filing)");
  } else if (amt.greaterThanOrEqualTo(500000)) {
    // BOT Directive: Transactions >= 500,000 THB require elevated anomaly screening
    score += 0.35;
    flags.push("THRESHOLD_EXCEEDED_500K_THB: เงื่อนไข ธปท. &ge; ฿500,000 (BOT Elevated Transaction Alert)");
  } else if (amt.greaterThanOrEqualTo(200000)) {
    score += 0.15;
    flags.push("MEDIUM_VALUE_TRANSFER: รายการโอนขนาดกลาง &ge; ฿200,000 (Enhanced Monitoring)");
  }

  // 2. Transaction Type Specific Risk
  if (params.type === "CROSS_BORDER") {
    score += 0.25;
    flags.push("CROSS_BORDER_SETTLEMENT: ธุรกรรมข้ามแดนตามเกณฑ์ FATF Recommendation 16");
  }

  // 3. Historical Velocity Bursts, Gaussian Statistics & Structuring Heuristics
  if (process.env.DATABASE_URL) {
    try {
      const now = Date.now();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      const oneHourAgo = new Date(now - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

      // Query historical counts and volume for this source account
      const [recent5m, recent1h, pastDayTxs, allSourceTxs] = await Promise.all([
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
        prisma.transaction.findMany({
          where: {
            sourceAccountId: params.sourceAccountId,
          },
          select: { amount: true },
          take: 50,
        }),
      ]);

      burstCount5m = recent5m;
      hourlyCount = recent1h;

      cumulative24h = pastDayTxs.reduce(
        (acc, tx) => acc.plus(new Decimal(tx.amount.toString())),
        new Decimal(0)
      ).plus(amt);

      // Mathematical Z-Score Calculation (Gaussian Distribution Anomaly: Z = (x - μ) / σ)
      if (allSourceTxs.length >= 3) {
        const amounts = allSourceTxs.map((t) => parseFloat(t.amount.toString()));
        const sum = amounts.reduce((a, b) => a + b, 0);
        historicalMean = sum / amounts.length;
        const variance =
          amounts.reduce((acc, val) => acc + Math.pow(val - historicalMean, 2), 0) /
          amounts.length;
        historicalStdDev = Math.max(1000, Math.sqrt(variance));
      }

      zScore = parseFloat(((params.amount - historicalMean) / historicalStdDev).toFixed(2));
      if (zScore >= 2.5) {
        isGaussianOutlier = true;
        score += 0.25;
        flags.push(
          `MATHEMATICAL_GAUSSIAN_OUTLIER: Z-score = ${zScore} (&ge; 2.5σ ค่าเบี่ยงเบนทางคณิตศาสตร์จากพฤติกรรมเฉลี่ย ฿${historicalMean.toLocaleString(undefined, { maximumFractionDigits: 0 })})`
        );
      }

      // Mathematical Velocity Burst Anomaly (>= 3 transfers within 5 minutes)
      if (burstCount5m >= 3) {
        velocityScore = 0.45;
        score += velocityScore;
        flags.push(`VELOCITY_BURST_ANOMALY: ตรวจพบการโอนเงินถี่ผิดปกติ ${burstCount5m} ครั้งในรอบ 5 นาที`);
      } else if (hourlyCount >= 5) {
        velocityScore = 0.35;
        score += velocityScore;
        flags.push(`HIGH_HOURLY_VELOCITY: ความถี่การโอนต่อชั่วโมงสูง ${hourlyCount} ครั้งในรอบ 60 นาที`);
      } else if (hourlyCount >= 3) {
        velocityScore = 0.15;
        score += velocityScore;
        flags.push(`MODERATE_HOURLY_VELOCITY: ความถี่การโอนปานกลาง ${hourlyCount} ครั้งในรอบ 60 นาที`);
      }

      // Mathematical Structuring / Smurfing Anomaly Ratio: (Cumulative 24h / 2,000,000 AMLO Threshold)
      smurfingRatio = parseFloat(cumulative24h.dividedBy(2000000).toFixed(2));
      if (amt.lessThan(500000) && cumulative24h.greaterThanOrEqualTo(2000000)) {
        score += 0.40;
        flags.push(
          `STRUCTURING_SMURFING_ANOMALY: ซอยยอดย่อยสะสม 24 ชม. รวม ฿${cumulative24h.toFixed(2)} เกินเกณฑ์ ปปง. ฿2M (Smurfing Index = ${smurfingRatio})`
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
        flags.push("ACCOUNT_UNDER_INVESTIGATION: บัญชีต้นทางอยู่ในรายชื่อเฝ้าระวังทางกฎหมาย (Watchlist)");
      }

      if (destAcc?.status === "UNDER_INVESTIGATION") {
        score += 0.55;
        flags.push("BENEFICIARY_UNDER_INVESTIGATION: บัญชีปลายทางต้องสงสัยอยู่ในรายชื่อ AML Watchlist");
      }
    } catch (_e) {
      // Fallback if not available
    }
  }

  // Clamp score between 0.01 and 1.00
  const finalScore = Math.min(1.0, Math.max(0.01, parseFloat(score.toFixed(2))));
  const isHighRisk = finalScore >= 0.65;

  let recommendedAction: "APPROVE" | "FLAG_FOR_REVIEW" | "REJECT_ANOMALY" = "APPROVE";
  let classification:
    | "NORMAL_TRANSACTION"
    | "ELEVATED_SCRUTINY"
    | "ANOMALY_HIGH_RISK"
    | "CRITICAL_REGULATORY_BREACH" = "NORMAL_TRANSACTION";

  if (finalScore >= 0.85) {
    recommendedAction = "REJECT_ANOMALY";
    classification = "CRITICAL_REGULATORY_BREACH";
  } else if (finalScore >= 0.65) {
    recommendedAction = "FLAG_FOR_REVIEW";
    classification = "ANOMALY_HIGH_RISK";
  } else if (finalScore >= 0.35) {
    classification = "ELEVATED_SCRUTINY";
  } else {
    classification = "NORMAL_TRANSACTION";
  }

  let riskReason =
    flags.length > 0
      ? flags.join(" | ")
      : "การโอนเงินเป็นไปตามเกณฑ์ปกติ ไม่พบความผิดปกติทางคณิตศาสตร์และกฎระเบียบ";
  if (isHighRisk) {
    riskReason = `[ความเสี่ยงสูง/ผิดปกติ] ${riskReason}`;
  }

  const thresholdRatio = parseFloat(amt.dividedBy(2000000).toFixed(2));
  const formulaEquation = `R = min(1.0, 0.05(Base) + ${(finalScore - 0.05).toFixed(2)}(Risk Factors)) = ${(finalScore * 100).toFixed(0)}%`;

  const mathBreakdown: MathAnomalyMetrics = {
    zScore,
    mean: parseFloat(historicalMean.toFixed(2)),
    stdDev: parseFloat(historicalStdDev.toFixed(2)),
    thresholdRatio,
    velocityScore,
    smurfingRatio,
    formulaEquation,
    isGaussianOutlier,
    classification,
  };

  return {
    riskScore: finalScore,
    riskReason,
    isHighRisk,
    recommendedAction,
    flags,
    mathBreakdown,
    velocityMetrics: {
      burstCount5m,
      hourlyCount,
      cumulativeVolume24h: cumulative24h.toFixed(2),
    },
  };
}
