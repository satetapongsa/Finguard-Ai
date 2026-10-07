import { TicketPriority, TicketStatus } from "@prisma/client";

export interface DispatchTicketResult {
  id: string;
  ticketNumber: string;
  gapId: string;
  internalPolicyId: string;
  targetDepartment: string;
  title: string;
  actionItems: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string | null;
  dispatchedAt: Date;
  dueDate: Date | null;
  isExisting: boolean;
}
