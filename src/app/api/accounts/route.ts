import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
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

    return NextResponse.json({
      success: true,
      data: accounts.map((acc) => ({
        ...acc,
        balance: acc.balance.toString(),
      })),
    });
  } catch (error) {
    console.warn("Database offline, serving demo financial accounts fallback:", error);
    return NextResponse.json({
      success: true,
      data: [
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
      ],
    });
  }
}
