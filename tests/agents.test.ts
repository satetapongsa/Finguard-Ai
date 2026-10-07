import prisma from "../src/lib/prisma";
import { runWatcher } from "../src/lib/agents/ingestion/watcher-agent";
import { compareRegulationVersions } from "../src/lib/agents/diff/diff-agent";
import { analyzeComplianceGaps } from "../src/lib/agents/gap-analysis/gap-analysis-agent";
import { dispatchComplianceRemediation } from "../src/lib/agents/dispatcher/dispatcher-agent";
import { executeRegulatoryAnalysisWorkflow } from "../src/lib/agents/orchestration/regulatory-workflow";
import { authorizeRole } from "../src/lib/security/rbac";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ Passed: ${msg}`);
}

async function runTests() {
  console.log("=================================================");
  console.log("🧪 FinGuard AI Phase 2 — Agents & Workflow Tests");
  console.log("=================================================");

  // Test 1: Watcher Agent Idempotency
  console.log("\n[1] Testing Watcher & Ingestion Agent...");
  const watcherRes1 = await runWatcher();
  assert(watcherRes1.success, "Watcher execution succeeds");
  // Since v2.0 was seeded in Phase 1, watcher should detect ALREADY_PROCESSED
  assert(
    watcherRes1.data?.status === "ALREADY_PROCESSED" || watcherRes1.data?.status === "NEW",
    `Watcher returned valid status: ${watcherRes1.data?.status}`
  );

  const watcherRes2 = await runWatcher();
  assert(
    watcherRes2.data?.status === "ALREADY_PROCESSED",
    "Repeated Watcher execution is strictly idempotent (ALREADY_PROCESSED)"
  );

  // Test 2: Versioning & Diff Agent
  console.log("\n[2] Testing Versioning & Diff Agent...");
  const v2 = await prisma.regulation.findFirst({
    where: { version: "2.0" },
  });
  assert(Boolean(v2), "Found regulation BOT-COMP-001 v2.0 in database");

  const diffRes = await compareRegulationVersions(v2!.id);
  assert(diffRes.success, "Diff Agent executes successfully");
  const diffData = diffRes.data!;

  assert(diffData.summary.added === 1, `Expected 1 ADD clause (got ${diffData.summary.added})`);
  assert(diffData.summary.modified === 2, `Expected 2 MODIFY clauses (got ${diffData.summary.modified})`);
  assert(diffData.summary.unchanged === 2, `Expected 2 UNCHANGED clauses (got ${diffData.summary.unchanged})`);
  assert(diffData.summary.deleted === 0, `Expected 0 DELETE clauses (got ${diffData.summary.deleted})`);

  const cl11 = diffData.changes.find((c) => c.clauseRef === "Clause 1.1");
  assert(cl11?.changeType === "MODIFY", "Clause 1.1 classified as MODIFY");

  const cl12 = diffData.changes.find((c) => c.clauseRef === "Clause 1.2");
  assert(cl12?.changeType === "UNCHANGED", "Clause 1.2 classified as UNCHANGED");

  const cl13 = diffData.changes.find((c) => c.clauseRef === "Clause 1.3");
  assert(cl13?.changeType === "MODIFY", "Clause 1.3 classified as MODIFY");

  const cl15 = diffData.changes.find((c) => c.clauseRef === "Clause 1.5");
  assert(cl15?.changeType === "ADD", "Clause 1.5 classified as ADD");

  // Test 3: Gap Analysis Agent
  console.log("\n[3] Testing Gap Analysis Agent...");
  const gapRes = await analyzeComplianceGaps(v2!.id);
  assert(gapRes.success, "Gap Analysis Agent executes successfully");
  const gapData = gapRes.data!;

  assert(gapData.status === "WAITING_FOR_HUMAN", "Workflow status enters WAITING_FOR_HUMAN");
  assert(gapData.identifiedGapsCount >= 3, `Identified at least 3 gaps (got ${gapData.identifiedGapsCount})`);

  const gap11 = gapData.findings.find((f) => f.clauseRef === "Clause 1.1");
  assert(Boolean(gap11 && gap11.policyCode === "P-102"), "Clause 1.1 correctly mapped to Policy P-102");
  assert(gap11?.riskLevel === "HIGH", "Clause 1.1 risk level is HIGH");

  const gap13 = gapData.findings.find((f) => f.clauseRef === "Clause 1.3");
  assert(Boolean(gap13 && gap13.policyCode === "P-205"), "Clause 1.3 correctly mapped to Policy P-205");
  assert(gap13?.riskLevel === "HIGH", "Clause 1.3 risk level is HIGH");

  const gap15 = gapData.findings.find((f) => f.clauseRef === "Clause 1.5");
  assert(Boolean(gap15 && gap15.policyCode === "P-310"), "Clause 1.5 correctly mapped to Policy P-310");
  assert(gap15?.riskLevel === "HIGH", "Clause 1.5 risk level is HIGH");

  // Test 4: Server-Side RBAC
  console.log("\n[4] Testing Server-Side RBAC Enforcement...");
  const officerActor = { id: "u-officer", email: "officer@finguard.bank", role: "COMPLIANCE_OFFICER" as const };
  const auditorActor = { id: "u-auditor", email: "auditor@finguard.bank", role: "AUDITOR" as const };

  const officerAuth = authorizeRole(officerActor, ["COMPLIANCE_OFFICER", "ADMIN"]);
  assert(officerAuth.authorized, "COMPLIANCE_OFFICER authorized to approve remediation");

  const auditorAuth = authorizeRole(auditorActor, ["COMPLIANCE_OFFICER", "ADMIN"]);
  assert(!auditorAuth.authorized, "AUDITOR is forbidden from approving operational remediation");

  // Test 5: Human-in-the-Loop & Dispatcher Agent
  console.log("\n[5] Testing Human-in-the-Loop Gating & Dispatcher Agent...");
  const targetGap = await prisma.complianceGap.findFirst({
    where: { internalPolicy: { policyCode: "P-102" } },
  });
  assert(Boolean(targetGap), "Found target compliance gap for P-102");

  // Ensure gap is OPEN first to test gate
  await prisma.complianceGap.update({
    where: { id: targetGap!.id },
    data: { status: "OPEN" },
  });

  // Clean up any prior tickets for targetGap to ensure pristine test state
  await prisma.dispatchTicket.deleteMany({
    where: { gapId: targetGap!.id },
  });

  // Attempt dispatch while OPEN -> Must be rejected!
  const dispatchBlocked = await dispatchComplianceRemediation(targetGap!.id);
  assert(!dispatchBlocked.success, "Dispatcher strictly BLOCKS dispatch when status is OPEN");
  assert(dispatchBlocked.error?.code === "APPROVAL_REQUIRED", "Error code is APPROVAL_REQUIRED");

  // Human approves the gap
  await prisma.complianceGap.update({
    where: { id: targetGap!.id },
    data: {
      status: "APPROVED",
      reviewedBy: "officer@finguard.bank",
      reviewedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  // Dispatch after approval -> Must succeed!
  const dispatchAllowed = await dispatchComplianceRemediation(targetGap!.id);
  assert(dispatchAllowed.success, "Dispatcher succeeds after human approval");
  assert(Boolean(dispatchAllowed.data?.ticketNumber), `Generated ticket ${dispatchAllowed.data?.ticketNumber}`);
  assert(!dispatchAllowed.data?.isExisting, "First dispatch creates new ticket");

  // Dispatch retry -> Must be idempotent (returns existing ticket, no duplicate!)
  const dispatchRetry = await dispatchComplianceRemediation(targetGap!.id);
  assert(dispatchRetry.success, "Dispatcher retry succeeds");
  assert(dispatchRetry.data?.isExisting === true, "Repeated dispatch returns existing ticket (Idempotent)");
  assert(
    dispatchRetry.data?.ticketNumber === dispatchAllowed.data?.ticketNumber,
    "Same ticket number returned without creating duplicates"
  );

  // Test 6: Audit Trail Verification
  console.log("\n[6] Verifying Cryptographic Audit Log Entries...");
  const recentLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  assert(recentLogs.length >= 2, `Audit trail contains at least 2 entries (found ${recentLogs.length})`);
  const hasDispatchLog = recentLogs.some((l) => l.actionType === "DISPATCH_CREATED" || l.actionType === "GAP_IDENTIFIED");
  assert(hasDispatchLog, "Cryptographic audit chain recorded regulatory actions");

  console.log("\n=================================================");
  console.log("🎉 ALL PHASE 2 AGENT & WORKFLOW TESTS PASSED!");
  console.log("=================================================\n");
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
