import { RegulationStatus, ChangeType, SourceType, DocumentLanguage } from "@prisma/client";

export interface RegulatoryDocumentInput {
  regulationCode: string;
  title: string;
  version: string;
  issuer?: string;
  sourceType?: SourceType;
  sourceDocumentId?: string;
  sourceUrl?: string;
  documentUrl?: string;
  documentHash?: string;
  language?: DocumentLanguage;
  publishedAt?: Date | string;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  status?: RegulationStatus;
  supersedesRegulationCode?: string;
  supersedesVersion?: string;
  clauses: Array<{
    clauseRef: string;
    heading?: string;
    content: string;
  }>;
}

export interface WatcherResult {
  detected: boolean;
  documentId?: string;
  regulationCode?: string;
  version?: string;
  status: "NEW" | "ALREADY_PROCESSED" | "FAILED";
  message?: string;
}

export interface IngestionResult {
  regulationId: string;
  regulationCode: string;
  version: string;
  isNew: boolean;
  chunksCount: number;
  supersededRegulationId?: string | null;
}
