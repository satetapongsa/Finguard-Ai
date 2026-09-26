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
  console.log("🔒 Starting FinGuard AI Database Seeding...");

  // 1. Clean existing records
  await prisma.auditLog.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.financialAccount.deleteMany();
  await prisma.compliancePolicy.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleared existing database tables.");

  // 2. Seed Users with Roles
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
      name: "Waraporn Kiatkun (Senior AML Officer)",
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

  // 3. Seed Financial Accounts (Double-Entry Balance Verification)
  const treasuryAccount = await prisma.financialAccount.create({
    data: {
      accountNumber: "THB-100-888999",
      accountName: "Bangkok Central Liquidity Treasury",
      balance: new Prisma.Decimal(85000000.0),
      currency: "THB",
      status: "ACTIVE",
    },
  });

  const settlementAccount = await prisma.financialAccount.create({
    data: {
      accountNumber: "THB-200-444555",
      accountName: "APAC Regional FX Settlement Hub",
      balance: new Prisma.Decimal(38500000.0),
      currency: "THB",
      status: "ACTIVE",
    },
  });

  const corporateAccount = await prisma.financialAccount.create({
    data: {
      accountNumber: "THB-300-111222",
      accountName: "Siam Logistics & Export Corp.",
      balance: new Prisma.Decimal(4200000.0),
      currency: "THB",
      status: "ACTIVE",
    },
  });

  const retailEscrow = await prisma.financialAccount.create({
    data: {
      accountNumber: "THB-400-333777",
      accountName: "Consumer Digital Escrow Pool",
      balance: new Prisma.Decimal(1250000.0),
      currency: "THB",
      status: "ACTIVE",
    },
  });

  const flaggedAccount = await prisma.financialAccount.create({
    data: {
      accountNumber: "THB-999-000111",
      accountName: "Offshore Apex Trading Ltd (Flagged)",
      balance: new Prisma.Decimal(450000.0),
      currency: "THB",
      status: "UNDER_INVESTIGATION",
    },
  });

  console.log("🏦 Seeded 5 BFSI Financial Accounts with live balances.");

  // 4. Seed Regulatory Compliance Policies (BOT, AMLO, PDPA, FATF)
  const policies = [
    {
      code: "BOT-NO-12/2566",
      title: "Bank of Thailand Directives on Real-Time Electronic Fund Transfers",
      category: "AML",
      rawContent:
        "All commercial banks and licensed payment service providers must execute real-time transaction monitoring. Any single transaction exceeding 500,000 THB or cumulative transfers exceeding 2,000,000 THB within 24 hours must be checked against dynamic risk profiles. Mandatory reporting applies to velocity anomalies.",
    },
    {
      code: "AMLO-SEC-2024-01",
      title: "AMLO Requirements for Politically Exposed Persons & High-Risk Cross-Border Channels",
      category: "AML",
      rawContent:
        "Pursuant to the Anti-Money Laundering Act B.E. 2542 (and amendments), transactions involving entities domiciled in non-cooperative jurisdictions or designated watchlist entities require enhanced customer due diligence (EDD). Immediate temporary holds must be applied upon risk score threshold > 0.70.",
    },
    {
      code: "PDPA-SEC-2562",
      title: "Financial Sector Personal Data Protection Act Compliance Standard",
      category: "PDPA",
      rawContent:
        "No unencrypted or unmasked Personally Identifiable Information (PII) — specifically 13-digit Thai National IDs, credit card PAN numbers, or domestic telephone numbers — shall be transmitted into cloud-based LLM inference prompts or immutable public logs. Redaction must occur client-side or at security gateway ingress.",
    },
    {
      code: "BOT-FRAUD-2567",
      title: "National Cyber Fraud Prevention & Suspicious Mule Account Measures",
      category: "FRAUD",
      rawContent:
        "Financial institutions are mandated to suspend mobile banking or electronic fund settlement immediately upon detection of rapid successive transfers (burst velocity: 3+ transfers in under 60 minutes) to unverified destination accounts.",
    },
    {
      code: "FATF-R16-WIRE",
      title: "Financial Action Task Force Recommendation 16 (Wire Transfer Rule)",
      category: "CROSS_BORDER",
      rawContent:
        "Cross-border wire transfers must include complete originator information and beneficiary information. Intermediary institutions must verify that accompanying payer and payee details are intact before final book settlement.",
    },
  ];

  for (const pol of policies) {
    await prisma.compliancePolicy.create({
      data: pol,
    });
  }

  console.log(`📜 Seeded ${policies.length} Regulatory Compliance Policies.`);

  // 5. Seed Historical Transactions with Varied Risk Profiles
  const sampleTransactions = [
    {
      sourceAccountId: treasuryAccount.id,
      destinationAccountId: settlementAccount.id,
      amount: new Prisma.Decimal(5000000.0),
      currency: "THB",
      type: "SETTLEMENT" as const,
      status: "APPROVED" as const,
      riskScore: 0.12,
      riskReason: "Standard inter-bank treasury liquidity replenishment",
      metadata: {
        channel: "SWIFT_ISO20022",
        purpose: "LIQUIDITY_SETTLEMENT",
        senderTaxId: "0107536000102",
      },
      createdAt: new Date(Date.now() - 4 * 3600 * 1000),
    },
    {
      sourceAccountId: corporateAccount.id,
      destinationAccountId: retailEscrow.id,
      amount: new Prisma.Decimal(850000.0),
      currency: "THB",
      type: "DISBURSEMENT" as const,
      status: "FLAGGED" as const,
      riskScore: 0.72,
      riskReason:
        "[HIGH RISK ESCALATION] THRESHOLD_EXCEEDED_500K_THB: Elevated Transaction Alert | High single-day corporate disbursement",
      metadata: {
        recipientIdMasked: "1-XXXX-XXXXX-XX-8",
        channel: "BAHTNET",
        note: "Emergency contractor milestone payout",
      },
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
    {
      sourceAccountId: corporateAccount.id,
      destinationAccountId: flaggedAccount.id,
      amount: new Prisma.Decimal(2450000.0),
      currency: "THB",
      type: "CROSS_BORDER" as const,
      status: "FLAGGED" as const,
      riskScore: 0.88,
      riskReason:
        "[HIGH RISK ESCALATION] THRESHOLD_EXCEEDED_2M_THB: Mandatory AMLO Cash/Asset Reporting | CROSS_BORDER_SETTLEMENT | ACCOUNT_UNDER_INVESTIGATION",
      metadata: {
        originCountry: "TH",
        destinationJurisdiction: "KY",
        swiftCode: "APEXTRKYXXX",
      },
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      sourceAccountId: retailEscrow.id,
      destinationAccountId: corporateAccount.id,
      amount: new Prisma.Decimal(35000.0),
      currency: "THB",
      type: "TRANSFER" as const,
      status: "APPROVED" as const,
      riskScore: 0.04,
      riskReason: "Standard domestic retail merchant clearance",
      metadata: {
        referenceNumber: "TXN-2026-0911-098",
        settlementEngine: "PROMPTPAY_BATCH",
      },
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  ];

  let previousChainHash = "0".repeat(64);

  for (const txn of sampleTransactions) {
    const createdTx = await prisma.transaction.create({
      data: txn,
    });

    // Seed Balanced Double-Entry Ledger Entries
    await prisma.ledgerEntry.createMany({
      data: [
        {
          transactionId: createdTx.id,
          accountId: createdTx.sourceAccountId,
          entryType: "DEBIT",
          amount: createdTx.amount,
          balanceAfter: new Prisma.Decimal(1000000),
          currency: createdTx.currency,
          createdAt: createdTx.createdAt,
        },
        {
          transactionId: createdTx.id,
          accountId: createdTx.destinationAccountId,
          entryType: "CREDIT",
          amount: createdTx.amount,
          balanceAfter: new Prisma.Decimal(2000000),
          currency: createdTx.currency,
          createdAt: createdTx.createdAt,
        },
      ],
    });

    const payloadHash = computeHash({
      txId: createdTx.id,
      amount: createdTx.amount.toString(),
      status: createdTx.status,
      timestamp: createdTx.createdAt,
    });

    const timeStr = createdTx.createdAt.toISOString();
    const entryHash = crypto
      .createHash("sha256")
      .update(`${previousChainHash}:${payloadHash}:TRANSACTION_EXECUTE:Transaction:${createdTx.id}:${timeStr}`)
      .digest("hex");

    await prisma.auditLog.create({
      data: {
        actorId: officer.id,
        actionType: "TRANSACTION_EXECUTE",
        targetResource: "Transaction",
        resourceId: createdTx.id,
        payloadHash,
        previousHash: previousChainHash,
        entryHash,
        ipAddress: "192.168.1.104",
        status: txn.status === "FLAGGED" ? "ALERT" : "SUCCESS",
        details: {
          riskScore: txn.riskScore,
          riskReason: txn.riskReason,
          amount: txn.amount.toString(),
          doubleEntry: {
            isBalanced: true,
            amount: txn.amount.toString(),
          },
        },
        createdAt: createdTx.createdAt,
      },
    });

    previousChainHash = entryHash;
  }

  console.log(`💳 Seeded ${sampleTransactions.length} Initial Transactions with Audit Logs.`);
  console.log("✅ FinGuard AI Database Seeding Completed Successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
