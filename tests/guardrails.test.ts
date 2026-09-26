import {
  maskThaiNationalId,
  maskCreditCard,
  maskPhoneNumber,
  maskEmail,
  sanitizeText,
  sanitizePayload,
  computePayloadHash,
  computeAuditEntryHash,
  verifyAuditChain,
  inspectPiiPresence,
  GENESIS_PREV_HASH,
} from "../src/lib/security/guardrails";
import { evaluateTransactionRisk } from "../src/lib/risk/engine";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

async function runTests() {
  console.log("🔒 Running FinGuard AI Security, Ledger & Cryptographic Chain Tests...\n");

  // Test 1: Thai National ID Masking (Formatted)
  const sampleThaiId = "Citizen ID is 1-1004-99882-12-9 in record";
  const maskedId = maskThaiNationalId(sampleThaiId);
  assert(
    maskedId === "Citizen ID is 1-XXXX-XXXXX-XX-9 in record",
    `Formatted Thai National ID masked correctly: ${maskedId}`
  );

  // Test 1b: Thai National ID Masking (Continuous 13 Digits)
  const sampleContinuousThaiId = "Citizen raw ID 1100499882129 scanned";
  const maskedContinuousId = maskThaiNationalId(sampleContinuousThaiId);
  assert(
    maskedContinuousId === "Citizen raw ID 1-XXXX-XXXXX-XX-9 scanned",
    `Continuous 13-digit Thai ID masked correctly: ${maskedContinuousId}`
  );

  // Test 2: Credit Card Masking (Formatted)
  const sampleCc = "Charged card 4111 2222 3333 4444 on gateway";
  const maskedCc = maskCreditCard(sampleCc);
  assert(
    maskedCc === "Charged card ****-****-****-4444 on gateway",
    `Credit Card masked to last 4 digits: ${maskedCc}`
  );

  // Test 2b: 16-Digit PAN (Continuous digits)
  const samplePan = "Card PAN 4111222233334444 authorized";
  const maskedPan = maskCreditCard(samplePan);
  assert(
    maskedPan === "Card PAN ****-****-****-4444 authorized",
    `Continuous 16-digit PAN masked to last 4 digits: ${maskedPan}`
  );

  // Test 3: Phone Number Masking
  const samplePhone = "Contact mobile 081-234-5678";
  const maskedPhone = maskPhoneNumber(samplePhone);
  assert(
    maskedPhone.includes("081-XXX-5678"),
    `Thai Phone number masked: ${maskedPhone}`
  );

  // Test 4: Email Masking
  const sampleEmail = "Alert sent to compliance.officer@finguard.bank";
  const maskedEmail = maskEmail(sampleEmail);
  assert(
    maskedEmail.includes("@finguard.bank") && !maskedEmail.includes("compliance.officer@"),
    `Email masked: ${maskedEmail}`
  );

  // Test 5: Full Recursive Payload Sanitization
  const rawPayload = {
    user: "Waraporn",
    thaiId: "1-1004-99882-12-9",
    rawThaiId: "1100499882129",
    card: "4111 2222 3333 4444",
    secretKey: "super-secret-password-123",
    notes: [
      "Beneficiary phone is 089-999-1234",
      { secondaryCard: "5500 1122 3344 9999" },
    ],
  };

  const sanitized = sanitizePayload(rawPayload);
  assert(
    sanitized.thaiId === "1-XXXX-XXXXX-XX-9",
    "Nested Thai ID masked in JSON object"
  );
  assert(
    sanitized.rawThaiId === "1-XXXX-XXXXX-XX-9",
    "Nested continuous Thai ID masked in JSON object"
  );
  assert(
    sanitized.card === "****-****-****-4444",
    "Nested Credit card masked in JSON object"
  );
  assert(
    sanitized.notes[0] === "Beneficiary phone is 089-XXX-1234",
    "Array item phone number masked"
  );

  // Test 6: SHA-256 Cryptographic Hash Generation
  const hash1 = computePayloadHash(sanitized);
  const hash2 = computePayloadHash(sanitized);
  assert(
    hash1.length === 64,
    `Generated SHA-256 hash length is 64 characters (${hash1})`
  );
  assert(hash1 === hash2, "Payload hash is deterministic and idempotent");

  // Test 7: Blockchain-Style Linked List Tamper-Evidence
  const t0 = new Date("2026-09-26T10:00:00.000Z");
  const t1 = new Date("2026-09-26T10:05:00.000Z");
  const t2 = new Date("2026-09-26T10:10:00.000Z");

  const pHash0 = computePayloadHash({ amount: 100000 });
  const entryHash0 = computeAuditEntryHash({
    previousHash: GENESIS_PREV_HASH,
    payloadHash: pHash0,
    actionType: "TRANSACTION_EXECUTE",
    targetResource: "Transaction",
    resourceId: "tx-001",
    createdAt: t0,
  });

  const pHash1 = computePayloadHash({ amount: 600000 });
  const entryHash1 = computeAuditEntryHash({
    previousHash: entryHash0,
    payloadHash: pHash1,
    actionType: "TRANSACTION_EXECUTE",
    targetResource: "Transaction",
    resourceId: "tx-002",
    createdAt: t1,
  });

  const pHash2 = computePayloadHash({ amount: 2500000 });
  const entryHash2 = computeAuditEntryHash({
    previousHash: entryHash1,
    payloadHash: pHash2,
    actionType: "TRANSACTION_EXECUTE",
    targetResource: "Transaction",
    resourceId: "tx-003",
    createdAt: t2,
  });

  const validChain = [
    {
      id: "b-0",
      previousHash: GENESIS_PREV_HASH,
      entryHash: entryHash0,
      payloadHash: pHash0,
      actionType: "TRANSACTION_EXECUTE",
      targetResource: "Transaction",
      resourceId: "tx-001",
      createdAt: t0,
    },
    {
      id: "b-1",
      previousHash: entryHash0,
      entryHash: entryHash1,
      payloadHash: pHash1,
      actionType: "TRANSACTION_EXECUTE",
      targetResource: "Transaction",
      resourceId: "tx-002",
      createdAt: t1,
    },
    {
      id: "b-2",
      previousHash: entryHash1,
      entryHash: entryHash2,
      payloadHash: pHash2,
      actionType: "TRANSACTION_EXECUTE",
      targetResource: "Transaction",
      resourceId: "tx-003",
      createdAt: t2,
    },
  ];

  const verifyResult = verifyAuditChain(validChain);
  assert(verifyResult.isValid === true, "Unbroken cryptographic chain verified successfully");
  assert(verifyResult.totalBlocks === 3, "Total blocks counted correctly");

  // Test 8: Tamper Detection (Modify payload in block 1 without updating hash)
  const tamperedChain = [
    validChain[0],
    {
      ...validChain[1],
      payloadHash: computePayloadHash({ amount: 999999999 }), // Tampered payload
    },
    validChain[2],
  ];

  const tamperedResult = verifyAuditChain(tamperedChain);
  assert(tamperedResult.isValid === false, "Tampered chain correctly flagged as invalid");
  assert(tamperedResult.corruptedBlockId === "b-1", "Corrupted block accurately identified");

  // Test 9: Autonomous Risk Engine Threshold Checks
  // BOT Threshold > 500,000 THB
  const botRisk = await evaluateTransactionRisk({
    sourceAccountId: "acc-test-1",
    destinationAccountId: "acc-test-2",
    amount: 750000,
    type: "TRANSFER",
  });
  assert(
    botRisk.flags.some((f) => f.includes("THRESHOLD_EXCEEDED_500K_THB")),
    "BOT 500,000 THB threshold detected by Risk Engine"
  );

  // AMLO Threshold > 2,000,000 THB
  const amloRisk = await evaluateTransactionRisk({
    sourceAccountId: "acc-test-1",
    destinationAccountId: "acc-test-2",
    amount: 3000000,
    type: "TRANSFER",
  });
  assert(
    amloRisk.isHighRisk === true,
    "AMLO 2,000,000 THB threshold flagged as high risk"
  );
  assert(
    amloRisk.flags.some((f) => f.includes("THRESHOLD_EXCEEDED_2M_THB")),
    "AMLO mandatory reporting flag triggered"
  );

  console.log("\n🎉 All FinGuard AI Enterprise Security & Ledger Tests Passed Successfully!");
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
