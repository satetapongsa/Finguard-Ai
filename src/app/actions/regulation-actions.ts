"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { runWatcher, getDemoRegulatorySource } from "@/lib/agents/ingestion/watcher-agent";
import { ingestRegulatoryDocument } from "@/lib/agents/ingestion/ingestion-agent";
import { compareRegulationVersions } from "@/lib/agents/diff/diff-agent";
import { executeRegulatoryAnalysisWorkflow } from "@/lib/agents/orchestration/regulatory-workflow";
import { RegulatoryDocumentInput } from "@/lib/agents/ingestion/types";
import { getAuthenticatedActor, authorizeRole } from "@/lib/security/rbac";

/**
 * Server Action: Run Autonomous Watcher Agent
 * Roles: ADMIN, COMPLIANCE_OFFICER
 */
export async function runWatcherAction(
  customSource?: RegulatoryDocumentInput,
  options?: { dryRun?: boolean; forceBotSource?: boolean }
) {
  const actor = await getAuthenticatedActor();
  const authCheck = authorizeRole(actor, ["ADMIN", "COMPLIANCE_OFFICER"]);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const result = await runWatcher(customSource, actor?.id, options);
  revalidatePath("/dashboard/regulations");
  revalidatePath("/dashboard/gap-analysis");
  return result;
}

/**
 * Server Action: Ingest Regulatory Document Directly
 * Roles: ADMIN, COMPLIANCE_OFFICER
 */
export async function ingestRegulationAction(input: RegulatoryDocumentInput) {
  const actor = await getAuthenticatedActor();
  const authCheck = authorizeRole(actor, ["ADMIN", "COMPLIANCE_OFFICER"]);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const result = await ingestRegulatoryDocument(input, actor?.id);
  revalidatePath("/dashboard/regulations");
  return result;
}

/**
 * Server Action: Run Full Regulatory Analysis Workflow
 * Executes Diff Agent -> Gap Analysis Agent -> Stops for Human Review
 * Roles: ADMIN, COMPLIANCE_OFFICER
 */
export async function runRegulatoryAnalysisAction(regulationId: string) {
  const actor = await getAuthenticatedActor();
  const authCheck = authorizeRole(actor, ["ADMIN", "COMPLIANCE_OFFICER"]);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const result = await executeRegulatoryAnalysisWorkflow(regulationId, actor?.id);
  revalidatePath("/dashboard/regulations");
  revalidatePath("/dashboard/gap-analysis");
  return result;
}

/**
 * Server Action: Get Regulation by ID with chunks and gaps
 * Roles: All authenticated (ADMIN, COMPLIANCE_OFFICER, AUDITOR)
 */
export async function getRegulationByIdAction(id: string) {
  try {
    const reg = await prisma.regulation.findUnique({
      where: { id },
      include: {
        chunks: { orderBy: { chunkIndex: "asc" } },
        gaps: { include: { internalPolicy: true } },
        supersedes: true,
        supersededBy: true,
      },
    });
    return { success: true, data: reg };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch regulation" };
  }
}

/**
 * Server Action: Get All Regulation Versions for a given regulation code
 */
export async function getRegulationVersionsAction(regulationCode: string) {
  try {
    const versions = await prisma.regulation.findMany({
      where: { regulationCode },
      orderBy: { publishedAt: "desc" },
      include: {
        chunks: { orderBy: { chunkIndex: "asc" } },
      },
    });
    return { success: true, data: versions };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch versions" };
  }
}

/**
 * Server Action: Get Regulation Diff comparing current vs predecessor
 */
export async function getRegulationDiffAction(currentRegulationId: string) {
  const actor = await getAuthenticatedActor();
  return await compareRegulationVersions(currentRegulationId, actor?.id);
}
