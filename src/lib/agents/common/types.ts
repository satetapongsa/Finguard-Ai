export type AgentExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "WAITING_FOR_HUMAN";

export interface AgentResult<T> {
  success: boolean;
  status: AgentExecutionStatus;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
  };
}

export function createAgentSuccessResult<T>(
  data: T,
  status: AgentExecutionStatus = "COMPLETED",
  startTime?: number
): AgentResult<T> {
  const now = Date.now();
  const start = startTime || now;
  return {
    success: true,
    status,
    data,
    metadata: {
      startedAt: new Date(start).toISOString(),
      completedAt: new Date(now).toISOString(),
      durationMs: Math.max(0, now - start),
    },
  };
}

export function createAgentFailureResult<T>(
  code: string,
  message: string,
  startTime?: number
): AgentResult<T> {
  const now = Date.now();
  const start = startTime || now;
  return {
    success: false,
    status: "FAILED",
    error: { code, message },
    metadata: {
      startedAt: new Date(start).toISOString(),
      completedAt: new Date(now).toISOString(),
      durationMs: Math.max(0, now - start),
    },
  };
}
