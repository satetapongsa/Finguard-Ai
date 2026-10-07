"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { dispatchComplianceRemediation } from "@/lib/agents/dispatcher/dispatcher-agent";
import { getAuthenticatedActor, authorizeRole } from "@/lib/security/rbac";
import { recordAuditEntry } from "@/lib/security/audit-logger";

/**
 * Server Action: Human-in-the-Loop Approval Action
 * Authorized: COMPLIANCE_OFFICER, ADMIN (AUDITOR explicitly rejected)
 */
export async function approveComplianceGapAction(params: {
  gapId: string;
  officerNotes?: string;
  customActionItem?: string;
}) {
  const actor = await getAuthenticatedActor();
  const authCheck = authorizeRole(actor, ["COMPLIANCE_OFFICER", "ADMIN"]);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  try {
    const existingGap = await prisma.complianceGap.findUnique({
      where: { id: params.gapId },
      include: { internalPolicy: true },
    });

    if (!existingGap) {
      return { success: false, error: `Compliance gap with id ${params.gapId} not found` };
    }

    const reviewedAt = new Date();

    const updatedGap = await prisma.complianceGap.update({
      where: { id: params.gapId },
      data: {
        status: "APPROVED",
        reviewedBy: actor?.email || "compliance.officer@finguard.bank",
        reviewedAt,
        approvedAt: reviewedAt,
        reasoning: params.officerNotes
          ? `${existingGap.reasoning || ""}\n[Officer Note]: ${params.officerNotes}`.trim()
          : existingGap.reasoning,
        actionItem: params.customActionItem || existingGap.actionItem,
      },
      include: {
        internalPolicy: true,
        regulation: true,
      },
    });

    // Write Cryptographic Audit Log
    await recordAuditEntry({
      actorId: actor?.id || null,
      actionType: "GAP_APPROVED",
      targetResource: "ComplianceGap",
      resourceId: updatedGap.id,
      details: {
        gapId: updatedGap.id,
        policyCode: updatedGap.internalPolicy.policyCode,
        reviewedBy: updatedGap.reviewedBy,
        approvedAt: reviewedAt.toISOString(),
      },
    });

    revalidatePath("/dashboard/gap-analysis");
    return { success: true, data: updatedGap };
  } catch (error: any) {
    console.error("[ApprovalAction] Failed to approve gap:", error);
    return { success: false, error: error?.message || "Failed to approve compliance gap" };
  }
}

/**
 * Server Action: Human-in-the-Loop Reject / Dismiss Action
 * Authorized: COMPLIANCE_OFFICER, ADMIN
 */
export async function rejectComplianceGapAction(params: {
  gapId: string;
  rejectionReason: string;
}) {
  const actor = await getAuthenticatedActor();
  const authCheck = authorizeRole(actor, ["COMPLIANCE_OFFICER", "ADMIN"]);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  try {
    const existingGap = await prisma.complianceGap.findUnique({
      where: { id: params.gapId },
      include: { internalPolicy: true },
    });

    if (!existingGap) {
      return { success: false, error: `Compliance gap with id ${params.gapId} not found` };
    }

    const reviewedAt = new Date();

    const updatedGap = await prisma.complianceGap.update({
      where: { id: params.gapId },
      data: {
        status: "DISMISSED",
        reviewedBy: actor?.email || "compliance.officer@finguard.bank",
        reviewedAt,
        reasoning: `${existingGap.reasoning || ""}\n[Dismissed by Officer]: ${params.rejectionReason}`.trim(),
      },
      include: {
        internalPolicy: true,
        regulation: true,
      },
    });

    // Write Cryptographic Audit Log
    await recordAuditEntry({
      actorId: actor?.id || null,
      actionType: "GAP_REJECTED",
      targetResource: "ComplianceGap",
      resourceId: updatedGap.id,
      details: {
        gapId: updatedGap.id,
        policyCode: updatedGap.internalPolicy.policyCode,
        reviewedBy: updatedGap.reviewedBy,
        rejectionReason: params.rejectionReason,
      },
    });

    revalidatePath("/dashboard/gap-analysis");
    return { success: true, data: updatedGap };
  } catch (error: any) {
    console.error("[ApprovalAction] Failed to reject gap:", error);
    return { success: false, error: error?.message || "Failed to reject compliance gap" };
  }
}

/**
 * Server Action: Request Further Review (status -> REVIEWED)
 * Authorized: COMPLIANCE_OFFICER, ADMIN
 */
export async function requestComplianceReviewAction(params: {
  gapId: string;
  reviewNotes: string;
}) {
  const actor = await getAuthenticatedActor();
  const authCheck = authorizeRole(actor, ["COMPLIANCE_OFFICER", "ADMIN"]);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  try {
    const updatedGap = await prisma.complianceGap.update({
      where: { id: params.gapId },
      data: {
        status: "REVIEWED",
        reviewedBy: actor?.email || "compliance.officer@finguard.bank",
        reviewedAt: new Date(),
        reasoning: `[Review Requested]: ${params.reviewNotes}`,
      },
      include: {
        internalPolicy: true,
        regulation: true,
      },
    });

    revalidatePath("/dashboard/gap-analysis");
    return { success: true, data: updatedGap };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to request review" };
  }
}

/**
 * Server Action: Dispatch Approved Gap (invokes Agent 4: Dispatcher Agent)
 * Strictly verifies gap.status === "APPROVED" before issuing downstream ticket.
 * Roles: COMPLIANCE_OFFICER, ADMIN
 */
export async function dispatchApprovedGapAction(gapId: string) {
  const actor = await getAuthenticatedActor();
  const authCheck = authorizeRole(actor, ["COMPLIANCE_OFFICER", "ADMIN"]);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const result = await dispatchComplianceRemediation(gapId, actor?.id);
  revalidatePath("/dashboard/gap-analysis");
  return result;
}
