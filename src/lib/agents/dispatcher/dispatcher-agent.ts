import prisma from "@/lib/prisma";
import { DispatchTicketResult } from "./types";
import { generateTicketNumber, buildTicketPayload } from "./ticket-builder";
import { AgentResult, createAgentSuccessResult, createAgentFailureResult } from "../common/types";
import { recordAuditEntry } from "@/lib/security/audit-logger";

/**
 * Agent 4: Dispatcher Agent
 * Triggers ONLY after Human-in-the-Loop compliance officer approval.
 * Strictly verifies status === "APPROVED".
 * Strictly idempotent: will not create duplicate tickets on retries.
 */
export async function dispatchComplianceRemediation(
  gapId: string,
  actorId?: string | null
): Promise<AgentResult<DispatchTicketResult>> {
  const startTime = Date.now();

  try {
    const gap = await prisma.complianceGap.findUnique({
      where: { id: gapId },
      include: {
        internalPolicy: true,
        tickets: true,
      },
    });

    if (!gap) {
      return createAgentFailureResult(
        "GAP_NOT_FOUND",
        `ComplianceGap with id ${gapId} not found.`,
        startTime
      );
    }

    // 1. Human-in-the-Loop Gate: Must be APPROVED
    if (gap.status !== "APPROVED") {
      return createAgentFailureResult(
        "APPROVAL_REQUIRED",
        `Cannot dispatch unapproved compliance gap. Current status is ${gap.status}. Human approval is strictly required.`,
        startTime
      );
    }

    // 2. Dispatch Idempotency: Return existing ticket if already dispatched
    const existingTicket = gap.tickets[0];
    if (existingTicket) {
      return createAgentSuccessResult<DispatchTicketResult>(
        {
          id: existingTicket.id,
          ticketNumber: existingTicket.ticketNumber,
          gapId: existingTicket.gapId,
          internalPolicyId: existingTicket.internalPolicyId,
          targetDepartment: existingTicket.targetDepartment,
          title: existingTicket.title,
          actionItems: existingTicket.actionItems,
          priority: existingTicket.priority,
          status: existingTicket.status,
          assignedTo: existingTicket.assignedTo,
          dispatchedAt: existingTicket.dispatchedAt,
          dueDate: existingTicket.dueDate,
          isExisting: true,
        },
        "COMPLETED",
        startTime
      );
    }

    // 3. Build Ticket Payload
    const payload = buildTicketPayload(gap);
    const ticketNumber = generateTicketNumber();

    const ticket = await prisma.dispatchTicket.create({
      data: {
        ticketNumber,
        gapId: gap.id,
        internalPolicyId: gap.internalPolicyId,
        targetDepartment: payload.targetDepartment,
        title: payload.title,
        actionItems: payload.actionItems,
        priority: payload.priority,
        status: "OPEN",
        assignedTo: payload.assignedTo,
        dueDate: payload.dueDate,
      },
    });

    // 4. Record Cryptographic Audit Log
    await recordAuditEntry({
      actorId: actorId || null,
      actionType: "DISPATCH_CREATED",
      targetResource: "DispatchTicket",
      resourceId: ticket.id,
      details: {
        ticketNumber: ticket.ticketNumber,
        gapId: gap.id,
        policyCode: gap.internalPolicy.policyCode,
        targetDepartment: ticket.targetDepartment,
        priority: ticket.priority,
      },
    });

    return createAgentSuccessResult<DispatchTicketResult>(
      {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        gapId: ticket.gapId,
        internalPolicyId: ticket.internalPolicyId,
        targetDepartment: ticket.targetDepartment,
        title: ticket.title,
        actionItems: ticket.actionItems,
        priority: ticket.priority,
        status: ticket.status,
        assignedTo: ticket.assignedTo,
        dispatchedAt: ticket.dispatchedAt,
        dueDate: ticket.dueDate,
        isExisting: false,
      },
      "COMPLETED",
      startTime
    );
  } catch (error: any) {
    console.error("[DispatcherAgent] Error dispatching remediation:", error);
    return createAgentFailureResult(
      "DISPATCH_ERROR",
      error?.message || "Failed to dispatch compliance ticket",
      startTime
    );
  }
}
