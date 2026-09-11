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
    console.warn("Database offline, serving standard compliance policies fallback:", error);
    return NextResponse.json({
      success: true,
      count: 5,
      data: [
        {
          id: "pol-1",
          code: "BOT-NO-12/2566",
          title: "Bank of Thailand Directives on Real-Time Electronic Fund Transfers",
          category: "AML",
          rawContent:
            "All commercial banks and licensed payment service providers must execute real-time transaction monitoring. Any single transaction exceeding 500,000 THB or cumulative transfers exceeding 2,000,000 THB within 24 hours must be checked against dynamic risk profiles. Mandatory reporting applies to velocity anomalies.",
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "pol-2",
          code: "AMLO-SEC-2024-01",
          title: "AMLO Requirements for Politically Exposed Persons & High-Risk Cross-Border Channels",
          category: "AML",
          rawContent:
            "Pursuant to the Anti-Money Laundering Act B.E. 2542 (and amendments), transactions involving entities domiciled in non-cooperative jurisdictions or designated watchlist entities require enhanced customer due diligence (EDD). Immediate temporary holds must be applied upon risk score threshold > 0.70.",
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "pol-3",
          code: "PDPA-SEC-2562",
          title: "Financial Sector Personal Data Protection Act Compliance Standard",
          category: "PDPA",
          rawContent:
            "No unencrypted or unmasked Personally Identifiable Information (PII) — specifically 13-digit Thai National IDs, credit card PAN numbers, or domestic telephone numbers — shall be transmitted into cloud-based LLM inference prompts or immutable public logs. Redaction must occur client-side or at security gateway ingress.",
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "pol-4",
          code: "BOT-FRAUD-2567",
          title: "National Cyber Fraud Prevention & Suspicious Mule Account Measures",
          category: "FRAUD",
          rawContent:
            "Financial institutions are mandated to suspend mobile banking or electronic fund settlement immediately upon detection of rapid successive transfers (burst velocity: 3+ transfers in under 60 minutes) to unverified destination accounts.",
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }
}
