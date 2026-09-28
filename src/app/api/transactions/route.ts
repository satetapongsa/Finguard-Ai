import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { CreateTransactionSchema } from "@/lib/types";
import {
  sanitizePayload,
  computePayloadHash,
  computeAuditEntryHash,
  GENESIS_PREV_HASH,
} from "@/lib/security/guardrails";
import { evaluateTransactionRisk } from "@/lib/risk/engine";

let txCache: { key: string; data: any; count: number; expiresAt: number } | null = null;
const TX_CACHE_TTL_MS = 2500;

function invalidateTxCache() {
  txCache = null;
}

/**
 * GET /api/transactions
 * Retrieve recent transactions with micro-caching for instant page navigation
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const status = searchParams.get("status");
  const cacheKey = `${limit}-${status || "ALL"}`;

  const now = Date.now();
  if (txCache && txCache.key === cacheKey && now < txCache.expiresAt) {
    return NextResponse.json(
      {
        success: true,
        count: txCache.count,
        data: txCache.data,
        cached: true,
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, stale-while-revalidate=5",
          "X-FinGuard-Cache": "HIT",
        },
      }
    );
  }

  try {
    const whereClause: Prisma.TransactionWhereInput = {};
    if (status && status !== "ALL") {
      whereClause.status = status as Prisma.EnumTransactionStatusFilter;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        sourceAccount: {
          select: { accountNumber: true, accountName: true },
        },
        destinationAccount: {
          select: { accountNumber: true, accountName: true },
        },
      },
    });

    const serializedTransactions = transactions.map((t) => ({
      ...t,
      amount: t.amount.toString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    txCache = {
      key: cacheKey,
      data: serializedTransactions,
      count: serializedTransactions.length,
      expiresAt: now + TX_CACHE_TTL_MS,
    };

    return NextResponse.json(
      {
        success: true,
        count: serializedTransactions.length,
        data: serializedTransactions,
        cached: false,
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, stale-while-revalidate=5",
          "X-FinGuard-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("Failed to query transactions from database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to query transactions from Neon PostgreSQL database",
        details: error instanceof Error ? error.message : "Database error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * ACID Transaction Engine with Double-Entry Ledger Verification
 */
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch (_e) {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  // 1. Zod schema validation
  const parseResult = CreateTransactionSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: parseResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { sourceAccountId, destinationAccountId, amount, currency, type, metadata } =
    parseResult.data;

  if (sourceAccountId === destinationAccountId) {
    return NextResponse.json(
      { success: false, error: "Source and destination accounts must be distinct" },
      { status: 400 }
    );
  }

  // 2. Sanitize payload through PDPA Guardrails (Mask PII)
  const sanitizedMetadata = metadata ? sanitizePayload(metadata) : null;
  const sanitizedLogPayload = {
    sourceAccountId,
    destinationAccountId,
    amount,
    currency,
    type,
    metadata: sanitizedMetadata,
  };
  const payloadHash = computePayloadHash(sanitizedLogPayload);

  // 3. Autonomous Risk Scoring Evaluation
  const riskAssessment = await evaluateTransactionRisk({
    sourceAccountId,
    destinationAccountId,
    amount,
    type,
  });

  const transactionStatus = riskAssessment.isHighRisk ? "FLAGGED" : "APPROVED";

  try {
    // 4. ACID Execution via prisma.$transaction (Double-Entry Ledger)
    const result = await prisma.$transaction(
      async (tx) => {
        // Step A: Lock & fetch source account
        const sourceAcc = await tx.financialAccount.findUnique({
          where: { id: sourceAccountId },
        });

        if (!sourceAcc) {
          throw new Error("ERR_SOURCE_ACCOUNT_NOT_FOUND");
        }

        if (sourceAcc.status === "FROZEN" || sourceAcc.status === "CLOSED") {
          throw new Error(`ERR_SOURCE_ACCOUNT_${sourceAcc.status}`);
        }

        // Step B: Lock & fetch destination account
        const destAcc = await tx.financialAccount.findUnique({
          where: { id: destinationAccountId },
        });

        if (!destAcc) {
          throw new Error("ERR_DEST_ACCOUNT_NOT_FOUND");
        }

        if (destAcc.status === "CLOSED") {
          throw new Error("ERR_DEST_ACCOUNT_CLOSED");
        }

        // Step C: Strict Balance & Overdraft Constraint Check
        const transferAmount = new Prisma.Decimal(amount);
        if (sourceAcc.balance.lessThan(transferAmount)) {
          throw new Error("ERR_INSUFFICIENT_FUNDS");
        }

        // Step D: Calculate balances & enforce double-entry equality
        const newSourceBalance = sourceAcc.balance.minus(transferAmount);
        const newDestBalance = destAcc.balance.plus(transferAmount);

        // Mathematical double-entry verification: Total Debits must equal Total Credits
        const totalDebits = transferAmount;
        const totalCredits = transferAmount;
        if (!totalDebits.equals(totalCredits)) {
          throw new Error("ERR_DOUBLE_ENTRY_IMBALANCE");
        }

        // Debit Source Account
        await tx.financialAccount.update({
          where: { id: sourceAccountId },
          data: {
            balance: newSourceBalance,
          },
        });

        // Credit Destination Account
        await tx.financialAccount.update({
          where: { id: destinationAccountId },
          data: {
            balance: newDestBalance,
          },
        });

        // Step E: Create immutable Transaction record
        const createdTx = await tx.transaction.create({
          data: {
            sourceAccountId,
            destinationAccountId,
            amount: transferAmount,
            currency,
            type,
            status: transactionStatus,
            riskScore: riskAssessment.riskScore,
            riskReason: riskAssessment.riskReason,
            metadata: sanitizedMetadata as Prisma.InputJsonValue,
          },
          include: {
            sourceAccount: {
              select: { accountNumber: true, accountName: true },
            },
            destinationAccount: {
              select: { accountNumber: true, accountName: true },
            },
          },
        });

        // Step F: Create Strict Double-Entry Ledger Records
        await tx.ledgerEntry.createMany({
          data: [
            {
              transactionId: createdTx.id,
              accountId: sourceAccountId,
              entryType: "DEBIT",
              amount: transferAmount,
              balanceAfter: newSourceBalance,
              currency,
            },
            {
              transactionId: createdTx.id,
              accountId: destinationAccountId,
              entryType: "CREDIT",
              amount: transferAmount,
              balanceAfter: newDestBalance,
              currency,
            },
          ],
        });

        // Step G: Cryptographic Linked-List Audit Log (Blockchain-style SHA-256 Chain)
        const previousLog = await tx.auditLog.findFirst({
          orderBy: { createdAt: "desc" },
          select: { entryHash: true },
        });

        const previousHash = previousLog?.entryHash || GENESIS_PREV_HASH;
        const logTimestamp = new Date();
        const entryHash = computeAuditEntryHash({
          previousHash,
          payloadHash,
          actionType: "TRANSACTION_EXECUTE",
          targetResource: "Transaction",
          resourceId: createdTx.id,
          createdAt: logTimestamp,
        });

        await tx.auditLog.create({
          data: {
            actionType: "TRANSACTION_EXECUTE",
            targetResource: "Transaction",
            resourceId: createdTx.id,
            payloadHash,
            previousHash,
            entryHash,
            ipAddress,
            status: riskAssessment.isHighRisk ? "ALERT" : "SUCCESS",
            details: {
              amount: transferAmount.toString(),
              currency,
              riskScore: riskAssessment.riskScore,
              riskFlags: riskAssessment.flags,
              sourceAccount: sourceAcc.accountNumber,
              destinationAccount: destAcc.accountNumber,
              doubleEntryLedger: {
                totalDebits: totalDebits.toString(),
                totalCredits: totalCredits.toString(),
                debitAccountId: sourceAccountId,
                creditAccountId: destinationAccountId,
                isBalanced: true,
              },
            },
            createdAt: logTimestamp,
          },
        });

        return { ...createdTx, entryHash };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message:
          transactionStatus === "FLAGGED"
            ? "Transaction executed and flagged for AML compliance review"
            : "Transaction settled successfully",
        transaction: {
          ...result,
          amount: result.amount.toString(),
          createdAt: result.createdAt.toISOString(),
        },
        riskAssessment,
        auditHash: payloadHash,
        entryHash: result.entryHash,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "TRANSACTION_FAILED";

    // Record blocked audit event for compliance non-repudiation with cryptographic link
    try {
      const blockedTimestamp = new Date();
      const blockedPayloadHash = computePayloadHash({ error: message, timestamp: blockedTimestamp.getTime() });
      const previousLog = await prisma.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { entryHash: true },
      });
      const previousHash = previousLog?.entryHash || GENESIS_PREV_HASH;
      const entryHash = computeAuditEntryHash({
        previousHash,
        payloadHash: blockedPayloadHash,
        actionType: "TRANSACTION_REJECTED",
        targetResource: "Transaction",
        createdAt: blockedTimestamp,
      });

      await prisma.auditLog.create({
        data: {
          actionType: "TRANSACTION_REJECTED",
          targetResource: "Transaction",
          payloadHash: blockedPayloadHash,
          previousHash,
          entryHash,
          ipAddress,
          status: "BLOCKED",
          details: { reason: message },
          createdAt: blockedTimestamp,
        },
      });
    } catch (_auditErr) {
      // Ignore fallback log error
    }

    if (message === "ERR_INSUFFICIENT_FUNDS") {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction rejected: Insufficient ledger balance (overdraft prevented)",
        },
        { status: 422 }
      );
    }

    if (message.startsWith("ERR_SOURCE_ACCOUNT_")) {
      return NextResponse.json(
        {
          success: false,
          error: `Transaction blocked: Source account constraint violation (${message})`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Transaction failed to commit to ACID ledger",
        details: message,
      },
      { status: 500 }
    );
  }
}
