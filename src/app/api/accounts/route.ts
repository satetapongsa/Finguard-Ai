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
