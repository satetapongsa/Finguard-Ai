import { ChangeType } from "@prisma/client";

export interface RegulationChange {
  clauseRef: string;
  chunkIndex?: number;
  changeType: ChangeType;
  oldContent?: string | null;
  newContent?: string | null;
  explanation: string;
  chunkId?: string;
}

export interface RegulationDiffResult {
  previousRegulationId?: string | null;
  currentRegulationId: string;
  previousVersion?: string | null;
  currentVersion: string;
  regulationCode: string;
  summary: {
    added: number;
    modified: number;
    deleted: number;
    unchanged: number;
    total: number;
  };
  changes: RegulationChange[];
}
