import { TicketPriority } from "@prisma/client";

export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${year}-${rand}`;
}

export function buildTicketPayload(gap: {
  id: string;
  gapTitle: string;
  finding: string;
  actionItem: string;
  riskLevel: string;
  internalPolicy: {
    id: string;
    policyCode: string;
    title: string;
    ownerDepartment: string;
  };
}) {
  const priority: TicketPriority =
    gap.riskLevel === "CRITICAL"
      ? "URGENT"
      : gap.riskLevel === "HIGH"
      ? "HIGH"
      : gap.riskLevel === "MEDIUM"
      ? "MEDIUM"
      : "LOW";

  const daysUntilDue = gap.riskLevel === "CRITICAL" ? 7 : gap.riskLevel === "HIGH" ? 14 : 30;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysUntilDue);

  return {
    targetDepartment: gap.internalPolicy.ownerDepartment,
    title: `[Remediation Required] ${gap.internalPolicy.policyCode}: ${gap.gapTitle}`,
    actionItems: `1. Policy Finding: ${gap.finding}\n2. Required Remediation: ${gap.actionItem}\n3. Target Policy: ${gap.internalPolicy.title} (${gap.internalPolicy.policyCode})\n4. SLA Due Date: ${dueDate.toISOString().split("T")[0]}`,
    priority,
    assignedTo: `${gap.internalPolicy.ownerDepartment.toLowerCase().replace(/[^a-z0-9]/g, ".")}@finguard.bank`,
    dueDate,
  };
}
