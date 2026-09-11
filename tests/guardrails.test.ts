import {
  maskThaiNationalId,
  maskCreditCard,
  maskPhoneNumber,
  maskEmail,
  sanitizeText,
  sanitizePayload,
  computePayloadHash,
  inspectPiiPresence,
} from "../src/lib/security/guardrails";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

console.log("🔒 Running FinGuard AI Security & PDPA Guardrail Tests...\n");

// Test 1: Thai National ID Masking
const sampleThaiId = "Citizen ID is 1-1004-99882-12-9 in record";
const maskedId = maskThaiNationalId(sampleThaiId);
assert(
  maskedId === "Citizen ID is 1-XXXX-XXXXX-XX-9 in record",
  `Thai National ID masked correctly: ${maskedId}`
);

// Test 2: Credit Card Masking
const sampleCc = "Charged card 4111 2222 3333 4444 on gateway";
const maskedCc = maskCreditCard(sampleCc);
assert(
  maskedCc === "Charged card ****-****-****-4444 on gateway",
  `Credit Card masked to last 4 digits: ${maskedCc}`
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

// Test 7: PII Inspection Detection
const detection = inspectPiiPresence("Check ID 1-1004-99882-12-9 and card 4111 2222 3333 4444");
assert(detection.hasPii === true, "PII presence correctly identified");
assert(
  detection.detectedTypes.includes("THAI_ID") && detection.detectedTypes.includes("CREDIT_CARD"),
  "Specific PII types identified"
);

console.log("\n🎉 All FinGuard AI Guardrail & Security Tests Passed Successfully!");
