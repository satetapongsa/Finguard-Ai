import { SourceType, DocumentLanguage } from "@prisma/client";

export interface BotAnnouncementMetadata {
  sourceDocumentId: string;
  announcementNumber: string;
  title: string;
  publishedAt: Date;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  issuer: string;
  sourceUrl: string;
  documentUrl: string;
  documentType: "CIRCULAR" | "NOTIFICATION" | "GUIDELINE";
  language: DocumentLanguage;
  targetInstitutionType?: string;
}

export interface FetchedBotDocument {
  metadata: BotAnnouncementMetadata;
  documentBuffer?: Buffer;
  documentHash: string; // SHA-256
  rawText: string;
  clauses: Array<{
    clauseRef: string;
    heading?: string;
    content: string;
  }>;
}

export interface BotWatcherOptions {
  limit?: number;
  dryRun?: boolean;
  sinceDate?: Date;
  mockFixtureMode?: boolean; // For offline deterministic tests
}
