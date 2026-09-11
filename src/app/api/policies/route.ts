import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const whereClause: { isActive: boolean; category?: string } = {
      isActive: true,
    };
    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    const policies = await prisma.compliancePolicy.findMany({
      where: whereClause,
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        title: true,
        category: true,
        rawContent: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: policies.length,
      data: policies.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to query policies:", error);
    return NextResponse.json(
      { success: false, error: "Policy query failure" },
      { status: 500 }
    );
  }
}
