import prisma from "@/lib/prisma";
import { RegulatoryDocumentInput, WatcherResult } from "./types";
import { ingestRegulatoryDocument } from "./ingestion-agent";
import { AgentResult, createAgentSuccessResult, createAgentFailureResult } from "../common/types";
import { pollOfficialBotSource } from "./sources/bot/bot-source-adapter";

/**
 * Synthetic / Demo BOT Regulatory Watcher Source
 * Returns the synthetic Bank of Thailand circular: BOT-COMP-001 v2.0
 */
export function getDemoRegulatorySource(): RegulatoryDocumentInput {
  return {
    regulationCode: "BOT-COMP-001",
    title:
      "Updated Directives on Extended Transaction Retention, Suspicious Escalation SLAs, and Regulatory Incident Reporting",
    version: "2.0",
    issuer: "Bank of Thailand",
    sourceType: "SYNTHETIC_DEMO",
    sourceUrl: "https://www.bot.or.th/announcements/BOT-COMP-001-v2.pdf",
    language: "EN",
    documentHash: "b6f483d98a0c2014197e411ef849767ffc0303fe20f26efdcfe83688b50df472",
    publishedAt: new Date("2026-07-15T00:00:00Z"),
    effectiveFrom: new Date("2026-08-01T00:00:00Z"),
    status: "ACTIVE",
    supersedesRegulationCode: "BOT-COMP-001",
    supersedesVersion: "1.0",
    clauses: [
      {
        clauseRef: "Clause 1.1",
        heading: "Extended Record Retention Requirement (24 Months)",
        content:
          "Financial institutions must maintain transaction monitoring records for at least 24 months.",
      },
      {
        clauseRef: "Clause 1.2",
        heading: "Threshold-Based Transaction Review",
        content:
          "Compliance teams must review transactions exceeding the institution's defined risk threshold.",
      },
      {
        clauseRef: "Clause 1.3",
        heading: "24-Hour Strict Escalation SLA for Suspicious Transfers",
        content:
          "Suspicious transactions must be escalated to the designated compliance function within 24 hours.",
      },
      {
        clauseRef: "Clause 1.4",
        heading: "Compliance Review Audit Trail Retention",
        content:
          "Compliance review records must be retained for audit purposes.",
      },
      {
        clauseRef: "Clause 1.5",
        heading: "Mandatory 30-Day Regulatory Incident Reporting Window",
        content:
          "Institutions must submit a regulatory incident report within 30 days after confirmation of a qualifying compliance event.",
      },
    ],
  };
}

/**
 * Agent 1: Watcher Agent (Phase 4 Edition)
 * Autonomous polling process that monitors regulatory announcements.
 * Supports:
 * - DEMO MODE (Synthetic BOT-COMP-001)
 * - OFFICIAL BOT MODE (Live/Cached official Bank of Thailand circulars)
 * - DRY RUN MODE (Discovers without mutating database)
 */
export async function runWatcher(
  customSource?: RegulatoryDocumentInput,
  actorId?: string | null,
  options: { dryRun?: boolean; forceBotSource?: boolean } = {}
): Promise<AgentResult<WatcherResult>> {
  const startTime = Date.now();
  const isBotMode = options.forceBotSource || process.env.REGULATORY_SOURCE_MODE === "bot";

  try {
    let doc: RegulatoryDocumentInput;

    if (customSource) {
      doc = customSource;
    } else if (isBotMode) {
      // Poll official BOT source
      const botFeed = await pollOfficialBotSource({ limit: 1, dryRun: options.dryRun });
      const firstBotDoc = botFeed.documents[0];

      if (!firstBotDoc) {
        return createAgentSuccessResult<WatcherResult>(
          {
            detected: false,
            status: "ALREADY_PROCESSED",
            message: "No new announcements discovered on official Bank of Thailand channel.",
          },
          "COMPLETED",
          startTime
        );
      }

      doc = {
        regulationCode: firstBotDoc.metadata.announcementNumber,
        title: firstBotDoc.metadata.title,
        version: "1.0",
        issuer: firstBotDoc.metadata.issuer,
        sourceType: "OFFICIAL_BOT",
        sourceDocumentId: firstBotDoc.metadata.sourceDocumentId,
        sourceUrl: firstBotDoc.metadata.sourceUrl,
        documentUrl: firstBotDoc.metadata.documentUrl,
        documentHash: firstBotDoc.documentHash,
        language: firstBotDoc.metadata.language,
        publishedAt: firstBotDoc.metadata.publishedAt,
        effectiveFrom: firstBotDoc.metadata.effectiveFrom,
        status: "ACTIVE",
        clauses: firstBotDoc.clauses,
      };
    } else {
      doc = getDemoRegulatorySource();
    }

    // 1. Dry Run Check
    if (options.dryRun) {
      return createAgentSuccessResult<WatcherResult>(
        {
          detected: true,
          regulationCode: doc.regulationCode,
          version: doc.version,
          status: "NEW",
          message: `[DRY-RUN] Discovered ${doc.sourceType || "REGULATION"}: ${doc.regulationCode} v${doc.version} (${doc.clauses.length} clauses). No database changes applied.`,
        },
        "COMPLETED",
        startTime
      );
    }

    // 2. Check if this version already exists
    const existing = await prisma.regulation.findUnique({
      where: {
        regulationCode_version: {
          regulationCode: doc.regulationCode,
          version: doc.version,
        },
      },
    });

    if (existing) {
      return createAgentSuccessResult<WatcherResult>(
        {
          detected: false,
          documentId: existing.id,
          regulationCode: existing.regulationCode,
          version: existing.version,
          status: "ALREADY_PROCESSED",
          message: `Regulation ${doc.regulationCode} v${doc.version} already exists in temporal store.`,
        },
        "COMPLETED",
        startTime
      );
    }

    // 3. New document detected -> Trigger Ingestion Agent
    const ingestionRes = await ingestRegulatoryDocument(doc, actorId);
    if (!ingestionRes.success || !ingestionRes.data) {
      return createAgentFailureResult(
        ingestionRes.error?.code || "INGESTION_FAILED",
        ingestionRes.error?.message || "Watcher failed during document ingestion.",
        startTime
      );
    }

    return createAgentSuccessResult<WatcherResult>(
      {
        detected: true,
        documentId: ingestionRes.data.regulationId,
        regulationCode: ingestionRes.data.regulationCode,
        version: ingestionRes.data.version,
        status: "NEW",
        message: `Newly published regulation ${doc.regulationCode} v${doc.version} detected and ingested (${ingestionRes.data.chunksCount} clauses).`,
      },
      "COMPLETED",
      startTime
    );
  } catch (error: any) {
    console.error("[WatcherAgent] Error during watcher execution:", error);
    return createAgentFailureResult(
      "WATCHER_ERROR",
      error?.message || "Unexpected failure in watcher agent",
      startTime
    );
  }
}
