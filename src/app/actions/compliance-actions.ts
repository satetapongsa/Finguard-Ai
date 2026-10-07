"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { analyzeComplianceGaps } from "@/lib/agents/gap-analysis/gap-analysis-agent";
import { getAuthenticatedActor, authorizeRole } from "@/lib/security/rbac";

/**
 * Server Action: Get All Compliance Gaps with filters
 * Roles: ADMIN, COMPLIANCE_OFFICER, AUDITOR
 */
export async function getComplianceGapsAction(filter?: {
  regulationId?: string;
  internalPolicyId?: string;
  riskLevel?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status?: "OPEN" | "REVIEWED" | "APPROVED" | "DISMISSED";
}) {
  try {
    const where: any = {};
    if (filter?.regulationId) where.regulationId = filter.regulationId;
    if (filter?.internalPolicyId) where.internalPolicyId = filter.internalPolicyId;
    if (filter?.riskLevel) where.riskLevel = filter.riskLevel;
    if (filter?.status) where.status = filter.status;

    const gaps = await prisma.complianceGap.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        regulation: true,
        regulationChunk: true,
        internalPolicy: true,
        tickets: true,
      },
    });

    return { success: true, data: gaps };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch compliance gaps" };
  }
}

/**
 * Server Action: Run Gap Analysis Agent on a Regulation
 * Roles: ADMIN, COMPLIANCE_OFFICER
 */
export async function runGapAnalysisAction(regulationId: string) {
  const actor = await getAuthenticatedActor();
  const authCheck = authorizeRole(actor, ["ADMIN", "COMPLIANCE_OFFICER"]);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const result = await analyzeComplianceGaps(regulationId, actor?.id);
  revalidatePath("/dashboard/gap-analysis");
  return result;
}

/**
 * Server Action: Get Details for a single Compliance Gap
 */
export async function getGapDetailsAction(gapId: string) {
  try {
    const gap = await prisma.complianceGap.findUnique({
      where: { id: gapId },
      include: {
        regulation: true,
        regulationChunk: true,
        internalPolicy: true,
        tickets: true,
      },
    });

    if (!gap) {
      return { success: false, error: `Compliance gap with id ${gapId} not found` };
    }

    return { success: true, data: gap };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch gap details" };
  }
}
