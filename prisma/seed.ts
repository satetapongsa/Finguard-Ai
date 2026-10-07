import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function computeHash(data: unknown): string {
  return crypto
    .createHash("sha256")
    .update(`seed-salt:${JSON.stringify(data)}`)
    .digest("hex");
}

async function main() {
  console.log("========================================");
  console.log("FinGuard AI Demo Seed — Phase 1");
  console.log("========================================");

  // 1. Clean existing records safely
  await prisma.dispatchTicket.deleteMany();
  await prisma.complianceGap.deleteMany();
  await prisma.regulationChunk.deleteMany();
  await prisma.internalPolicy.deleteMany();
  await prisma.regulation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.financialAccount.deleteMany();
  await prisma.compliancePolicy.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleared existing database tables.");

  // 2. Seed Users with Roles (Preserving IAM)
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash("Admin@FinGuard2026!", salt);
  const officerHash = await bcrypt.hash("Officer@FinGuard2026!", salt);
  const auditorHash = await bcrypt.hash("Auditor@FinGuard2026!", salt);

  const admin = await prisma.user.create({
    data: {
      name: "Supachai Thanasuk (CISO)",
      email: "admin@finguard.bank",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const officer = await prisma.user.create({
    data: {
      name: "Waraporn Kiatkun (Senior Compliance Officer)",
      email: "officer@finguard.bank",
      passwordHash: officerHash,
      role: "COMPLIANCE_OFFICER",
    },
  });

  const auditor = await prisma.user.create({
    data: {
      name: "Chaiyut Petchprasert (External Auditor)",
      email: "auditor@finguard.bank",
      passwordHash: auditorHash,
      role: "AUDITOR",
    },
  });

  console.log(`👤 Seeded 3 RBAC Users: Admin, Officer (${officer.id}), Auditor.`);

  // 3. Seed Regulations (Synthetic BOT Family: v1.0 and v2.0)
  // 3.1 v1.0 (Status = REVOKED, Superseded by v2.0)
  const v1 = await prisma.regulation.create({
    data: {
      regulationCode: "BOT-COMP-001",
      title: "Directives on Financial Institution Transaction Record Retention and Compliance Review",
      version: "1.0",
      issuer: "Bank of Thailand",
      sourceUrl: "https://www.bot.or.th/announcements/BOT-COMP-001-v1.pdf",
      publishedAt: new Date("2024-06-15T00:00:00Z"),
      effectiveFrom: new Date("2024-07-01T00:00:00Z"),
      effectiveTo: new Date("2026-07-31T23:59:59Z"),
      status: "REVOKED",
    },
  });

  // 3.2 v2.0 (Status = ACTIVE, Supersedes v1.0)
  const v2 = await prisma.regulation.create({
    data: {
      regulationCode: "BOT-COMP-001",
      title: "Updated Directives on Extended Transaction Retention, Suspicious Escalation SLAs, and Regulatory Incident Reporting",
      version: "2.0",
      issuer: "Bank of Thailand",
      sourceUrl: "https://www.bot.or.th/announcements/BOT-COMP-001-v2.pdf",
      publishedAt: new Date("2026-07-15T00:00:00Z"),
      effectiveFrom: new Date("2026-08-01T00:00:00Z"),
      effectiveTo: null,
      status: "ACTIVE",
      supersedesId: v1.id,
    },
  });

  // 4. Seed Regulation Chunks
  // 4.1 v1.0 Chunks (4 chunks)
  const v1Chunks = [
    {
      regulationId: v1.id,
      chunkIndex: 0,
      clauseRef: "Clause 1.1",
      heading: "Transaction Monitoring Record Retention Period",
      content: "Financial institutions must maintain transaction monitoring records for at least 12 months.",
      changeType: "UNCHANGED" as const,
    },
    {
      regulationId: v1.id,
      chunkIndex: 1,
      clauseRef: "Clause 1.2",
      heading: "Threshold-Based Transaction Review",
      content: "Compliance teams must review transactions exceeding the institution's defined risk threshold.",
      changeType: "UNCHANGED" as const,
    },
    {
      regulationId: v1.id,
      chunkIndex: 2,
      clauseRef: "Clause 1.3",
      heading: "Suspicious Transaction Escalation Procedure",
      content: "Suspicious transactions must be escalated to the designated compliance function.",
      changeType: "UNCHANGED" as const,
    },
    {
      regulationId: v1.id,
      chunkIndex: 3,
      clauseRef: "Clause 1.4",
      heading: "Compliance Review Audit Trail Retention",
      content: "Compliance review records must be retained for audit purposes.",
      changeType: "UNCHANGED" as const,
    },
  ];

  for (const chunk of v1Chunks) {
    await prisma.regulationChunk.create({ data: chunk });
  }

  // 4.2 v2.0 Chunks (5 chunks) with temporal diff markers
  const v2Chunks = [
    {
      regulationId: v2.id,
      chunkIndex: 0,
      clauseRef: "Clause 1.1",
      heading: "Extended Record Retention Requirement (24 Months)",
      content: "Financial institutions must maintain transaction monitoring records for at least 24 months.",
      previousContent: "Financial institutions must maintain transaction monitoring records for at least 12 months.",
      changeType: "MODIFY" as const,
    },
    {
      regulationId: v2.id,
      chunkIndex: 1,
      clauseRef: "Clause 1.2",
      heading: "Threshold-Based Transaction Review",
      content: "Compliance teams must review transactions exceeding the institution's defined risk threshold.",
      previousContent: "Compliance teams must review transactions exceeding the institution's defined risk threshold.",
      changeType: "UNCHANGED" as const,
    },
    {
      regulationId: v2.id,
      chunkIndex: 2,
      clauseRef: "Clause 1.3",
      heading: "24-Hour Strict Escalation SLA for Suspicious Transfers",
      content: "Suspicious transactions must be escalated to the designated compliance function within 24 hours.",
      previousContent: "Suspicious transactions must be escalated to the designated compliance function.",
      changeType: "MODIFY" as const,
    },
    {
      regulationId: v2.id,
      chunkIndex: 3,
      clauseRef: "Clause 1.4",
      heading: "Compliance Review Audit Trail Retention",
      content: "Compliance review records must be retained for audit purposes.",
      previousContent: "Compliance review records must be retained for audit purposes.",
      changeType: "UNCHANGED" as const,
    },
    {
      regulationId: v2.id,
      chunkIndex: 4,
      clauseRef: "Clause 1.5",
      heading: "Mandatory 30-Day Regulatory Incident Reporting Window",
      content: "Institutions must submit a regulatory incident report within 30 days after confirmation of a qualifying compliance event.",
      previousContent: null,
      changeType: "ADD" as const,
    },
  ];

  const createdV2Chunks: Record<string, any> = {};
  for (const chunk of v2Chunks) {
    const c = await prisma.regulationChunk.create({ data: chunk });
    createdV2Chunks[chunk.clauseRef] = c;
  }

  // 5. Seed Synthetic Internal Policies (P-102, P-205, P-310)
  const p102 = await prisma.internalPolicy.create({
    data: {
      policyCode: "P-102",
      title: "Regulatory Record Retention Policy",
      description: "Standards and storage quotas for customer transaction records and ledger archives.",
      version: "1.2",
      status: "ACTIVE",
      ownerDepartment: "Compliance Operations",
      content: "The bank must retain transaction monitoring records for at least 12 months.",
      effectiveFrom: new Date("2024-01-01T00:00:00Z"),
    },
  });

  const p205 = await prisma.internalPolicy.create({
    data: {
      policyCode: "P-205",
      title: "Suspicious Transaction Escalation Policy",
      description: "Escalation procedures, internal routing, and queue management for flagged transactions.",
      version: "2.0",
      status: "ACTIVE",
      ownerDepartment: "AML & Compliance",
      content: "Suspicious transactions must be escalated to the Compliance Operations team for manual review.",
      effectiveFrom: new Date("2024-03-15T00:00:00Z"),
    },
  });

  const p310 = await prisma.internalPolicy.create({
    data: {
      policyCode: "P-310",
      title: "Regulatory Incident Reporting Policy",
      description: "Governance, escalation channels, and committee notifications for compliance breaches.",
      version: "1.0",
      status: "ACTIVE",
      ownerDepartment: "Regulatory Affairs",
      content: "Confirmed compliance incidents must be reviewed and reported according to the bank's internal escalation procedure.",
      effectiveFrom: new Date("2024-05-01T00:00:00Z"),
    },
  });

  // 6. Seed Compliance Gaps (Phase 1 Baseline Mappings)
  await prisma.complianceGap.create({
    data: {
      regulationId: v2.id,
      regulationChunkId: createdV2Chunks["Clause 1.1"].id,
      internalPolicyId: p102.id,
      gapTitle: "Transaction Record Retention Mismatch (12 vs 24 Months)",
      finding: "BOT v2.0 Clause 1.1 mandates record retention of at least 24 months, whereas Internal Policy P-102 only specifies 12 months retention.",
      actionItem: "Update P-102 Section 4: Extend mandatory storage retention duration from 12 months to 24 months.",
      riskLevel: "HIGH",
      status: "OPEN",
      confidence: 0.96,
      reasoning: "The newly enacted circular doubles the mandatory transaction data retention duration. Non-compliance exposes the bank to regulatory sanctions under Section 11 of the Banking Act.",
    },
  });

  await prisma.complianceGap.create({
    data: {
      regulationId: v2.id,
      regulationChunkId: createdV2Chunks["Clause 1.3"].id,
      internalPolicyId: p205.id,
      gapTitle: "Missing Mandatory 24-Hour Escalation SLA for Suspicious Activities",
      finding: "BOT v2.0 Clause 1.3 requires escalation within 24 hours. Current Internal Policy P-205 provides open-ended escalation guidance without an explicit 24-hour turnaround time.",
      actionItem: "Amend P-205 Section 2: Incorporate strict 24-hour escalation SLA and automated alerts for compliance queue managers.",
      riskLevel: "HIGH",
      status: "OPEN",
      confidence: 0.92,
      reasoning: "BOT circular Clause 1.3 imposes a strict 24-hour SLA. Existing policy lacks defined timeframes.",
    },
  });

  await prisma.complianceGap.create({
    data: {
      regulationId: v2.id,
      regulationChunkId: createdV2Chunks["Clause 1.5"].id,
      internalPolicyId: p310.id,
      gapTitle: "Unspecified 30-Day Regulatory Incident Reporting Window",
      finding: "New BOT requirement (Clause 1.5) mandates incident reporting within 30 days after qualifying event confirmation. P-310 relies solely on internal escalation workflows with no external statutory reporting deadline.",
      actionItem: "Add Section 5 to P-310: Formalize external 30-day reporting protocol to the Bank of Thailand Supervision Department.",
      riskLevel: "HIGH",
      status: "OPEN",
      confidence: 0.95,
      reasoning: "New requirement introduced in v2.0 without predecessor counterpart. P-310 has no clause governing external BOT notification schedules.",
    },
  });

  console.log("========================================");
  console.log("FinGuard AI Demo Seed");
  console.log("========================================");
  console.log("");
  console.log("Regulations:");
  console.log("✓ BOT-COMP-001 v1.0 (REVOKED)");
  console.log("✓ BOT-COMP-001 v2.0 (ACTIVE)");
  console.log("");
  console.log("Chunks:");
  console.log("✓ v1.0 = 4");
  console.log("✓ v2.0 = 5");
  console.log(`✓ Total Chunks = ${v1Chunks.length + v2Chunks.length}`);
  console.log("");
  console.log("Internal Policies:");
  console.log("✓ P-102 (Compliance Operations)");
  console.log("✓ P-205 (AML & Compliance)");
  console.log("✓ P-310 (Regulatory Affairs)");
  console.log("");
  console.log("Compliance Gaps:");
  console.log("✓ Clause 1.1 ↔ P-102 (HIGH RISK, Confidence 96%)");
  console.log("✓ Clause 1.3 ↔ P-205 (HIGH RISK, Confidence 92%)");
  console.log("✓ Clause 1.5 ↔ P-310 (HIGH RISK, Confidence 95%)");
  console.log("");
  console.log("Database seed completed successfully.");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
