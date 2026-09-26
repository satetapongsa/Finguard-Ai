import { Decimal } from "decimal.js";
import {
  computeAuditEntryHash,
  computePayloadHash,
  GENESIS_PREV_HASH,
} from "@/lib/security/guardrails";
import { evaluateTransactionRisk, EnhancedRiskEvaluationResult } from "@/lib/risk/engine";

export interface SimAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  balance: string;
  currency: string;
  status: "ACTIVE" | "FROZEN" | "UNDER_INVESTIGATION" | "CLOSED";
}

export interface SimTransaction {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  currency: string;
  type: string;
  status: "APPROVED" | "FLAGGED" | "REJECTED";
  riskScore: number;
  riskReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  sourceAccount: {
    accountNumber: string;
    accountName: string;
  };
  destinationAccount: {
    accountNumber: string;
    accountName: string;
  };
}

export interface SimAuditLog {
  id: string;
  actorId: string | null;
  actionType: string;
  targetResource: string;
  resourceId: string | null;
  payloadHash: string;
  previousHash: string | null;
  entryHash: string;
  ipAddress: string | null;
  status: "SUCCESS" | "BLOCKED" | "ALERT";
  details: Record<string, unknown> | null;
  createdAt: string;
  isIntegrityVerified: boolean;
  actor: {
    name: string;
    email: string;
    role: "ADMIN" | "COMPLIANCE_OFFICER" | "AUDITOR";
  };
}

// Global In-Memory Singleton Store for Seamless Zero-Breakage Testing
class SimulationLedgerStore {
  private accounts: SimAccount[] = [
    {
      id: "acc-101",
      accountNumber: "THB-100-888999",
      accountName: "Bangkok Central Liquidity Treasury",
      balance: "85000000.00",
      currency: "THB",
      status: "ACTIVE",
    },
    {
      id: "acc-202",
      accountNumber: "THB-200-444555",
      accountName: "APAC Regional FX Settlement Hub",
      balance: "38500000.00",
      currency: "THB",
      status: "ACTIVE",
    },
    {
      id: "acc-303",
      accountNumber: "THB-300-111222",
      accountName: "Siam Logistics & Export Corp.",
      balance: "4200000.00",
      currency: "THB",
      status: "ACTIVE",
    },
    {
      id: "acc-404",
      accountNumber: "THB-400-333777",
      accountName: "Consumer Digital Escrow Pool",
      balance: "1250000.00",
      currency: "THB",
      status: "ACTIVE",
    },
    {
      id: "acc-999",
      accountNumber: "THB-999-000111",
      accountName: "Offshore Apex Trading Ltd (Flagged)",
      balance: "450000.00",
      currency: "THB",
      status: "UNDER_INVESTIGATION",
    },
  ];

  private transactions: SimTransaction[] = [
    {
      id: "tx-init-001",
      sourceAccountId: "acc-101",
      destinationAccountId: "acc-202",
      amount: "5000000.00",
      currency: "THB",
      type: "SETTLEMENT",
      status: "APPROVED",
      riskScore: 0.12,
      riskReason: "Standard inter-bank treasury liquidity replenishment",
      metadata: { channel: "SWIFT_ISO20022" },
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      sourceAccount: {
        accountNumber: "THB-100-888999",
        accountName: "Bangkok Central Liquidity Treasury",
      },
      destinationAccount: {
        accountNumber: "THB-200-444555",
        accountName: "APAC Regional FX Settlement Hub",
      },
    },
    {
      id: "tx-init-002",
      sourceAccountId: "acc-303",
      destinationAccountId: "acc-404",
      amount: "850000.00",
      currency: "THB",
      type: "DISBURSEMENT",
      status: "FLAGGED",
      riskScore: 0.72,
      riskReason:
        "[HIGH RISK ESCALATION] THRESHOLD_EXCEEDED_500K_THB: Elevated Transaction Alert",
      metadata: { recipientIdMasked: "1-XXXX-XXXXX-XX-9" },
      createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1800 * 1000).toISOString(),
      sourceAccount: {
        accountNumber: "THB-300-111222",
        accountName: "Siam Logistics & Export Corp.",
      },
      destinationAccount: {
        accountNumber: "THB-400-333777",
        accountName: "Consumer Digital Escrow Pool",
      },
    },
    {
      id: "tx-init-003",
      sourceAccountId: "acc-303",
      destinationAccountId: "acc-999",
      amount: "2450000.00",
      currency: "THB",
      type: "CROSS_BORDER",
      status: "FLAGGED",
      riskScore: 0.88,
      riskReason:
        "[HIGH RISK ESCALATION] THRESHOLD_EXCEEDED_2M_THB: Mandatory AMLO Reporting | CROSS_BORDER",
      metadata: { swiftCode: "APEXTRKYXXX" },
      createdAt: new Date(Date.now() - 600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 600 * 1000).toISOString(),
      sourceAccount: {
        accountNumber: "THB-300-111222",
        accountName: "Siam Logistics & Export Corp.",
      },
      destinationAccount: {
        accountNumber: "THB-999-000111",
        accountName: "Offshore Apex Trading Ltd (Flagged)",
      },
    },
  ];

  private auditLogs: SimAuditLog[] = [];

  constructor() {
    this.initGenesisAudit();
  }

  private initGenesisAudit() {
    const time1 = new Date(Date.now() - 3600 * 1000);
    const pHash1 = computePayloadHash({ amount: "5000000.00", currency: "THB" });
    const eHash1 = computeAuditEntryHash({
      previousHash: GENESIS_PREV_HASH,
      payloadHash: pHash1,
      actionType: "TRANSACTION_EXECUTE",
      targetResource: "Transaction",
      resourceId: "tx-init-001",
      createdAt: time1,
    });

    const time2 = new Date(Date.now() - 1800 * 1000);
    const pHash2 = computePayloadHash({ amount: "850000.00", currency: "THB" });
    const eHash2 = computeAuditEntryHash({
      previousHash: eHash1,
      payloadHash: pHash2,
      actionType: "TRANSACTION_EXECUTE",
      targetResource: "Transaction",
      resourceId: "tx-init-002",
      createdAt: time2,
    });

    const time3 = new Date(Date.now() - 600 * 1000);
    const pHash3 = computePayloadHash({ policyCode: "BOT-NO-12/2566" });
    const eHash3 = computeAuditEntryHash({
      previousHash: eHash2,
      payloadHash: pHash3,
      actionType: "POLICY_UPDATE",
      targetResource: "CompliancePolicy",
      resourceId: "pol-1",
      createdAt: time3,
    });

    this.auditLogs = [
      {
        id: "audit-gen-3",
        actorId: "usr-admin-001",
        actionType: "POLICY_UPDATE",
        targetResource: "CompliancePolicy",
        resourceId: "pol-1",
        payloadHash: pHash3,
        previousHash: eHash2,
        entryHash: eHash3,
        ipAddress: "10.0.4.12",
        status: "SUCCESS",
        details: { policyCode: "BOT-NO-12/2566", note: "Regulatory parameter sync" },
        createdAt: time3.toISOString(),
        isIntegrityVerified: true,
        actor: {
          name: "Supachai Thanasuk",
          email: "admin@finguard.bank",
          role: "ADMIN",
        },
      },
      {
        id: "audit-gen-2",
        actorId: "usr-officer-101",
        actionType: "TRANSACTION_EXECUTE",
        targetResource: "Transaction",
        resourceId: "tx-init-002",
        payloadHash: pHash2,
        previousHash: eHash1,
        entryHash: eHash2,
        ipAddress: "192.168.1.104",
        status: "ALERT",
        details: { amount: "850000.00", currency: "THB", riskScore: 0.72 },
        createdAt: time2.toISOString(),
        isIntegrityVerified: true,
        actor: {
          name: "Waraporn Kiatkun",
          email: "officer@finguard.bank",
          role: "COMPLIANCE_OFFICER",
        },
      },
      {
        id: "audit-gen-1",
        actorId: "usr-officer-101",
        actionType: "TRANSACTION_EXECUTE",
        targetResource: "Transaction",
        resourceId: "tx-init-001",
        payloadHash: pHash1,
        previousHash: GENESIS_PREV_HASH,
        entryHash: eHash1,
        ipAddress: "192.168.1.104",
        status: "SUCCESS",
        details: { amount: "5000000.00", currency: "THB", riskScore: 0.12 },
        createdAt: time1.toISOString(),
        isIntegrityVerified: true,
        actor: {
          name: "Waraporn Kiatkun",
          email: "officer@finguard.bank",
          role: "COMPLIANCE_OFFICER",
        },
      },
    ];
  }

  public getAccounts(): SimAccount[] {
    return [...this.accounts];
  }

  public getTransactions(limit = 50, status?: string): SimTransaction[] {
    let result = [...this.transactions];
    if (status && status !== "ALL") {
      result = result.filter((t) => t.status === status);
    }
    return result.slice(0, limit);
  }

  public getAuditLogs(limit = 50, status?: string): SimAuditLog[] {
    let result = [...this.auditLogs];
    if (status && status !== "ALL") {
      result = result.filter((l) => l.status === status);
    }
    return result.slice(0, limit);
  }

  public executeSimulatedTransfer(params: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    currency?: string;
    type?: string;
    metadata?: Record<string, unknown> | null;
    ipAddress?: string;
  }): {
    success: boolean;
    transaction: SimTransaction;
    riskAssessment: EnhancedRiskEvaluationResult;
    auditHash: string;
    entryHash: string;
  } {
    const {
      sourceAccountId,
      destinationAccountId,
      amount,
      currency = "THB",
      type = "TRANSFER",
      metadata = null,
      ipAddress = "127.0.0.1",
    } = params;

    const source = this.accounts.find((a) => a.id === sourceAccountId);
    const dest = this.accounts.find((a) => a.id === destinationAccountId);

    if (!source) throw new Error("ERR_SOURCE_ACCOUNT_NOT_FOUND");
    if (!dest) throw new Error("ERR_DEST_ACCOUNT_NOT_FOUND");
    if (source.status !== "ACTIVE") throw new Error(`ERR_SOURCE_ACCOUNT_${source.status}`);
    if (dest.status === "CLOSED") throw new Error("ERR_DEST_ACCOUNT_CLOSED");

    const transferAmt = new Decimal(amount);
    const sourceBal = new Decimal(source.balance);

    // Overdraft balance check
    if (sourceBal.lessThan(transferAmt)) {
      throw new Error("ERR_INSUFFICIENT_FUNDS");
    }

    // Double-entry calculation: Debit source, Credit dest
    const newSourceBal = sourceBal.minus(transferAmt);
    const newDestBal = new Decimal(dest.balance).plus(transferAmt);

    // Update balances atomically
    source.balance = newSourceBal.toFixed(2);
    dest.balance = newDestBal.toFixed(2);

    // Evaluate Risk
    const isHighAmount = transferAmt.greaterThanOrEqualTo(500000);
    const isCriticalAmount = transferAmt.greaterThanOrEqualTo(2000000);
    const isWatchlistDest = dest.status === "UNDER_INVESTIGATION";

    let riskScore = 0.08;
    const flags: string[] = [];

    if (isCriticalAmount) {
      riskScore += 0.65;
      flags.push("THRESHOLD_EXCEEDED_2M_THB: Mandatory AMLO Cash/Asset Reporting");
    } else if (isHighAmount) {
      riskScore += 0.35;
      flags.push("THRESHOLD_EXCEEDED_500K_THB: BOT Elevated Transaction Alert");
    }

    if (type === "CROSS_BORDER") {
      riskScore += 0.25;
      flags.push("CROSS_BORDER_SETTLEMENT: Heightened FATF Recommendation 16 scrutiny");
    }

    if (isWatchlistDest) {
      riskScore += 0.55;
      flags.push("BENEFICIARY_UNDER_INVESTIGATION: Destination counterparty flagged in AML watchlist");
    }

    const finalScore = Math.min(1.0, Math.max(0.01, parseFloat(riskScore.toFixed(2))));
    const isHighRisk = finalScore >= 0.65;

    const riskAssessment: EnhancedRiskEvaluationResult = {
      riskScore: finalScore,
      riskReason: flags.length > 0 ? `[ALERT] ${flags.join(" | ")}` : "Verified parameters",
      isHighRisk,
      recommendedAction: finalScore >= 0.85 ? "REJECT_ANOMALY" : isHighRisk ? "FLAG_FOR_REVIEW" : "APPROVE",
      flags,
      velocityMetrics: {
        burstCount5m: 1,
        hourlyCount: 2,
        cumulativeVolume24h: transferAmt.toFixed(2),
      },
    };

    const txStatus = isHighRisk ? "FLAGGED" : "APPROVED";
    const txId = `tx-live-${Date.now()}`;
    const timestamp = new Date();

    const createdTx: SimTransaction = {
      id: txId,
      sourceAccountId,
      destinationAccountId,
      amount: transferAmt.toFixed(2),
      currency,
      type,
      status: txStatus,
      riskScore: finalScore,
      riskReason: riskAssessment.riskReason,
      metadata,
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
      sourceAccount: {
        accountNumber: source.accountNumber,
        accountName: source.accountName,
      },
      destinationAccount: {
        accountNumber: dest.accountNumber,
        accountName: dest.accountName,
      },
    };

    // Prepend to transaction list
    this.transactions.unshift(createdTx);

    // Cryptographic Linked-List Audit Entry
    const previousEntry = this.auditLogs[0];
    const previousHash = previousEntry?.entryHash || GENESIS_PREV_HASH;
    const payloadHash = computePayloadHash({
      txId,
      sourceAccount: source.accountNumber,
      destinationAccount: dest.accountNumber,
      amount: transferAmt.toFixed(2),
      currency,
      metadata,
    });

    const entryHash = computeAuditEntryHash({
      previousHash,
      payloadHash,
      actionType: "TRANSACTION_EXECUTE",
      targetResource: "Transaction",
      resourceId: txId,
      createdAt: timestamp,
    });

    const newAuditLog: SimAuditLog = {
      id: `audit-live-${Date.now()}`,
      actorId: "usr-officer-101",
      actionType: "TRANSACTION_EXECUTE",
      targetResource: "Transaction",
      resourceId: txId,
      payloadHash,
      previousHash,
      entryHash,
      ipAddress,
      status: isHighRisk ? "ALERT" : "SUCCESS",
      details: {
        amount: transferAmt.toFixed(2),
        currency,
        riskScore: finalScore,
        flags,
        sourceBalanceAfter: newSourceBal.toFixed(2),
        destBalanceAfter: newDestBal.toFixed(2),
        doubleEntryLedger: {
          totalDebits: transferAmt.toFixed(2),
          totalCredits: transferAmt.toFixed(2),
          isBalanced: true,
        },
      },
      createdAt: timestamp.toISOString(),
      isIntegrityVerified: true,
      actor: {
        name: "Waraporn Kiatkun",
        email: "officer@finguard.bank",
        role: "COMPLIANCE_OFFICER",
      },
    };

    this.auditLogs.unshift(newAuditLog);

    return {
      success: true,
      transaction: createdTx,
      riskAssessment,
      auditHash: payloadHash,
      entryHash,
    };
  }
}

// Global instance to retain state across server route calls
const globalForSim = globalThis as unknown as {
  simLedgerStore?: SimulationLedgerStore;
};

export const simLedgerStore = globalForSim.simLedgerStore ?? new SimulationLedgerStore();
if (process.env.NODE_ENV !== "production") {
  globalForSim.simLedgerStore = simLedgerStore;
}
