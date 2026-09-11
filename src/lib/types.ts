import { z } from "zod";

// =========================================================
// ZOD VALIDATION SCHEMAS
// =========================================================

export const CreateTransactionSchema = z.object({
  sourceAccountId: z.string().min(1, "Source account ID is required"),
  destinationAccountId: z.string().min(1, "Destination account ID is required"),
  amount: z
    .number()
    .positive("Transaction amount must be strictly positive")
    .max(100_000_000, "Single transaction cannot exceed 100,000,000 THB"),
  currency: z.string().default("THB"),
  type: z
    .enum(["TRANSFER", "SETTLEMENT", "DISBURSEMENT", "CROSS_BORDER"])
    .default("TRANSFER"),
  metadata: z
    .record(z.string(), z.unknown())
    .optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

export const ComplianceAnalyzeSchema = z.object({
  query: z.string().min(3, "Query must be at least 3 characters long"),
  transactionId: z.string().optional(),
  category: z.string().optional(),
  contextData: z.record(z.string(), z.unknown()).optional(),
});

export type ComplianceAnalyzeInput = z.infer<typeof ComplianceAnalyzeSchema>;

export const AuditQuerySchema = z.object({
  actionType: z.string().optional(),
  status: z.enum(["SUCCESS", "BLOCKED", "ALERT"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type AuditQueryInput = z.infer<typeof AuditQuerySchema>;

// =========================================================
// DOMAIN TYPES (BFSI & RISK)
// =========================================================

export type TransactionStatusType = "PENDING" | "APPROVED" | "FLAGGED" | "REJECTED";
export type AccountStatusType = "ACTIVE" | "FROZEN" | "UNDER_INVESTIGATION" | "CLOSED";
export type RoleType = "ADMIN" | "COMPLIANCE_OFFICER" | "AUDITOR";

export interface RiskEvaluationResult {
  riskScore: number; // 0.0 to 1.0
  riskReason: string;
  isHighRisk: boolean;
  flags: string[];
}

export interface TransactionWithAccounts {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  currency: string;
  type: string;
  status: TransactionStatusType;
  riskScore: number;
  riskReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  sourceAccount: {
    accountNumber: string;
    accountName: string;
  };
  destinationAccount: {
    accountNumber: string;
    accountName: string;
  };
}

export interface CompliancePolicyItem {
  id: string;
  code: string;
  title: string;
  category: string;
  rawContent: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string | null;
  actionType: string;
  targetResource: string;
  resourceId: string | null;
  payloadHash: string;
  ipAddress: string | null;
  status: "SUCCESS" | "BLOCKED" | "ALERT";
  details: Record<string, unknown> | null;
  createdAt: string;
  actor?: {
    name: string | null;
    email: string;
    role: RoleType;
  } | null;
}
