import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

let accountsCache: { data: any; expiresAt: number } | null = null;
const ACCOUNTS_CACHE_TTL_MS = 2500;

function invalidateAccountsCache() {
  accountsCache = null;
}

export async function GET() {
  const now = Date.now();
  if (accountsCache && now < accountsCache.expiresAt) {
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

    // Generate clean account number if not provided
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const accountNumber =
      customAccountNumber && customAccountNumber.trim().length > 0
        ? customAccountNumber.trim()
        : `ACC-${new Date().getFullYear()}-${randomSuffix}`;

    // Check duplicate
    const existing = await prisma.financialAccount.findUnique({
      where: { accountNumber },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Account number ${accountNumber} already exists in database`,
        },
        { status: 409 }
      );
    }

    const initialBalance = new Prisma.Decimal(Math.max(0, parseFloat(balance.toString()) || 0));

    const newAccount = await prisma.financialAccount.create({
      data: {
        accountNumber,
        accountName: accountName.trim(),
        balance: initialBalance,
        currency,
        status: status as "ACTIVE" | "FROZEN" | "UNDER_INVESTIGATION" | "CLOSED",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Financial account created successfully in Neon database",
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
