import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

let accountsCache: { data: any; expiresAt: number } | null = null;
const ACCOUNTS_CACHE_TTL_MS = 2500;

function invalidateAccountsCache() {
  accountsCache = null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bypassCache = searchParams.has("_t");

  const now = Date.now();
  if (!bypassCache && accountsCache && now < accountsCache.expiresAt) {
    return NextResponse.json(
      { success: true, data: accountsCache.data, cached: true },
      {
        headers: {
          "Cache-Control": "private, no-cache, stale-while-revalidate=5",
          "X-FinGuard-Cache": "HIT",
        },
      }
    );
  }

  try {
    const accounts = await prisma.financialAccount.findMany({
      orderBy: { accountNumber: "asc" },
      select: {
        id: true,
        accountNumber: true,
        accountName: true,
        balance: true,
        currency: true,
        status: true,
      },
    });

    const data = accounts.map((acc) => ({
      ...acc,
      balance: acc.balance.toString(),
    }));

    accountsCache = { data, expiresAt: now + ACCOUNTS_CACHE_TTL_MS };

    return NextResponse.json(
      { success: true, data, cached: false },
      {
        headers: {
          "Cache-Control": "private, no-cache, stale-while-revalidate=5",
          "X-FinGuard-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch accounts from database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch accounts from Neon PostgreSQL database",
        details: error instanceof Error ? error.message : "Database error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id: customId,
      accountName,
      accountNumber: customAccountNumber,
      balance = 100000,
      currency = "THB",
      status = "ACTIVE",
    } = body;

    if (!accountName || typeof accountName !== "string" || accountName.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Account name is required",
        },
        { status: 400 }
      );
    }

    // Generate unique randomized Account ID for strict system transaction inspection
    const generateRandomAuditId = () => {
      const entropy = Math.random().toString(36).substring(2, 7).toUpperCase();
      const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
      return `FA-${timestamp}-${entropy}`;
    };

    let accountId =
      customId && typeof customId === "string" && customId.trim().length > 0
        ? customId.trim()
        : generateRandomAuditId();

    // Verify ID uniqueness in database
    for (let i = 0; i < 5; i++) {
      const existingId = await prisma.financialAccount.findUnique({
        where: { id: accountId },
      });
      if (!existingId) break;
      accountId = generateRandomAuditId();
    }

    // Generate Thai Banking Standard 10-digit Account Number (XXX-X-XXXXX-X)
    const generateRandomAccountNumber = () => {
      const branch = String(Math.floor(100 + Math.random() * 900)); // 3 digits (e.g. 082, 102, 591)
      const type = String(Math.floor(1 + Math.random() * 9)); // 1 digit (e.g. 1=savings, 2=current)
      const serial = String(Math.floor(10000 + Math.random() * 90000)); // 5 digits
      const checkDigit = String(Math.floor(1 + Math.random() * 9)); // 1 digit
      return `${branch}-${type}-${serial}-${checkDigit}`;
    };

    let accountNumber =
      customAccountNumber && customAccountNumber.trim().length > 0
        ? customAccountNumber.trim()
        : generateRandomAccountNumber();

    // Ensure unique account number
    for (let i = 0; i < 5; i++) {
      const existing = await prisma.financialAccount.findUnique({
        where: { accountNumber },
      });
      if (!existing) break;
      accountNumber = generateRandomAccountNumber();
    }

    const initialBalance = new Prisma.Decimal(Math.max(0, parseFloat(balance.toString()) || 0));

    const newAccount = await prisma.financialAccount.create({
      data: {
        id: accountId,
        accountNumber,
        accountName: accountName.trim(),
        balance: initialBalance,
        currency,
        status: status as "ACTIVE" | "FROZEN" | "UNDER_INVESTIGATION" | "CLOSED",
      },
    });

    invalidateAccountsCache();

    return NextResponse.json(
      {
        success: true,
        message: "Financial account provisioned successfully with unique audit ID and randomized account number",
        account: {
          ...newAccount,
          balance: newAccount.balance.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create account in database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create financial account",
        details: error instanceof Error ? error.message : "Database error",
      },
      { status: 500 }
    );
  }
}
