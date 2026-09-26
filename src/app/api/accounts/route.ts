import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { simLedgerStore } from "@/lib/ledger/simulation-store";

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
  } catch (_error) {
    // Return live in-memory accounts state (reflects simulation transfers)
    return NextResponse.json({
      success: true,
      data: simLedgerStore.getAccounts(),
    });
  }
}
