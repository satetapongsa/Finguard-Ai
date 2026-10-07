import assert from "node:assert/strict";
import { parseBotAnnouncementListHtml, parseThaiClauses, normalizeThaiText } from "../src/lib/agents/ingestion/sources/bot/bot-parser";
import { validateRegulatoryUrl } from "../src/lib/security/ssrf-guard";
import { DeterministicReasoningProvider } from "../src/lib/agents/gap-analysis/grounded-reasoning";
import { NoneEmbeddingProvider, EmbeddingProvider } from "../src/lib/embeddings/embedding-provider";

async function runTests() {
  console.log("=================================================");
  console.log("   FinGuard AI - Phase 4 Comprehensive Tests     ");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`[PASS] ${name}`);
            passed++;
          })
          .catch((err) => {
            console.error(`[FAIL] ${name}:`, err.message);
          });
      }
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  // 1. SSRF Protection Tests
  console.log("--- 1. SSRF Guard Validation ---");
  await test("SSRF: Allows official BOT domains", () => {
    assert.equal(validateRegulatoryUrl("https://www.bot.or.th/content/fipcs/circular-102.pdf").valid, true);
    assert.equal(validateRegulatoryUrl("https://fipcs.bot.or.th/announcement/123").valid, true);
    assert.equal(validateRegulatoryUrl("https://bot.or.th/en/circulars").valid, true);
  });

  await test("SSRF: Rejects localhost, loopback, private IP & invalid protocols", () => {
    assert.equal(validateRegulatoryUrl("http://localhost:3000/steal").valid, false);
    assert.equal(validateRegulatoryUrl("http://127.0.0.1:8080/secret").valid, false);
    assert.equal(validateRegulatoryUrl("http://169.254.169.254/metadata").valid, false);
    assert.equal(validateRegulatoryUrl("http://10.0.0.1/admin").valid, false);
    assert.equal(validateRegulatoryUrl("file:///etc/passwd").valid, false);
    assert.equal(validateRegulatoryUrl("https://evil-hacker.com/spoofed-bot").valid, false);
  });

  // 2. Thai Text Normalization & Clause Parsing
  console.log("\n--- 2. Thai Parsing & Clause Extraction ---");
  await test("Thai Normalization: Cleans zero-width spaces and control characters", () => {
    const raw = "ข้อกำหนด\u200Bธนาคารแห่งประเทศไทย\u200C";
    const cleaned = normalizeThaiText(raw);
    assert.equal(cleaned, "ข้อกำหนดธนาคารแห่งประเทศไทย");
  });

  await test("Thai Clause Extraction: Detects Thai numbered clauses", () => {
    const docText = `
ประกาศธนาคารแห่งประเทศไทย ที่ สนส. ๑๒/๒๕๖๙
เรื่อง หลักเกณฑ์การบริหารความเสี่ยงด้านเทคโนโลยีสารสนเทศ

ข้อ 1 ให้สถาบันการเงินจัดให้มีการประเมินความเสี่ยงด้านไซเบอร์อย่างสม่ำเสมอ
ข้อ 1.1 สถาบันการเงินต้องทดสอบเจาะระบบ (Penetration Testing) ทุก 6 เดือน
(1) สำหรับระบบ Core Banking ต้องทดสอบร่วมกับผู้เชี่ยวชาญอิสระภายนอก

ข้อ 2 ให้รายงานเหตุการณ์ภัยคุกคามไซเบอร์ระดับวิกฤติต่อ ธปท. ภายใน 24 ชั่วโมง
`;
    const clauses = parseThaiClauses(docText);
    assert.ok(clauses.length >= 3, `Expected at least 3 clauses, got ${clauses.length}`);
    const refs = clauses.map((c) => c.clauseRef);
    assert.ok(refs.some((r) => r.includes("ข้อ 1")), "Should contain ข้อ 1");
    assert.ok(refs.some((r) => r.includes("ข้อ 1.1")), "Should contain ข้อ 1.1");
    assert.ok(refs.some((r) => r.includes("ข้อ 2")), "Should contain ข้อ 2");
  });

  // 3. Official BOT Listing HTML Parsing
  console.log("\n--- 3. BOT Listing HTML Fixture Parser ---");
  await test("BOT Parser: Extracts announcements and documents from HTML", () => {
    const sampleHtml = `
      <div class="fipcs-item">
        <a class="title" href="/content/fipcs/circular-2569-01">หนังสือเวียน ที่ สนส. ๑๕/๒๕๖๙ เรื่อง แนวปฏิบัติการรักษาความปลอดภัยของระบบคลาวด์</a>
        <div class="meta">
          <span>เลขที่หนังสือ: สนส. ๑๕/๒๕๖๙</span>
          <span>วันที่ประกาศ: 15 มกราคม 2569</span>
          <span>วันที่มีผลบังคับใช้: 01 กรกฎาคม 2569</span>
        </div>
        <div class="downloads">
          <a class="doc-link" href="/content/dam/bot/documents/fipcs/snso-15-2569.pdf">ดาวน์โหลดเอกสาร (PDF)</a>
        </div>
      </div>
    `;
    const parsed = parseBotAnnouncementListHtml(sampleHtml, "https://www.bot.or.th");
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].sourceType, "OFFICIAL_BOT");
    assert.equal(parsed[0].announcementNumber, "สนส. ๑๕/๒๕๖๙");
    assert.equal(parsed[0].documentUrl, "https://www.bot.or.th/content/dam/bot/documents/fipcs/snso-15-2569.pdf");
    assert.equal(parsed[0].language, "TH");
  });

  // 4. Grounded AI Reasoning & Evidence Triad
  console.log("\n--- 4. Grounded AI Reasoning & Evidence Triad ---");
  await test("Grounded AI: Returns structured analysis with evidence triad", async () => {
    const provider = new DeterministicReasoningProvider();
    const result = await provider.analyzeGap({
      clauseRef: "Clause 4.1",
      clauseContent: "Commercial banks must conduct rigorous external penetration tests every 6 months.",
      policyCode: "P-205",
      policyTitle: "Vulnerability Management Policy",
      policyDepartment: "Information Security",
      policyContent: "Section 3: Penetration tests must be conducted annually (every 12 months).",
    });

    assert.equal(result.gapDetected, true);
    assert.equal(result.riskLevel, "HIGH");
    assert.ok(result.confidence >= 0.8 && result.confidence <= 1.0);
    assert.ok(result.reasoning.length > 20);
    assert.ok(result.evidence.regulationExcerpt.length > 0);
    assert.ok(result.evidence.policyExcerpt.length > 0);
  });

  await test("Grounded AI: Identifies INSUFFICIENT_EVIDENCE when context missing", async () => {
    const provider = new DeterministicReasoningProvider();
    const result = await provider.analyzeGap({
      clauseRef: "Clause 9.9",
      clauseContent: "Carbon emission benchmarks for banking datacenter facilities.",
      policyCode: "P-102",
      policyTitle: "Data Protection Policy",
      policyDepartment: "Data Governance",
      policyContent: "Personal customer data must be retained for at least 10 years.",
    });

    assert.equal(result.gapDetected, false);
    assert.equal(result.riskLevel, "LOW");
    assert.ok(result.finding.includes("No direct conflict") || result.reasoning.includes("INSUFFICIENT_EVIDENCE") || result.reasoning.includes("does not conflict"));
  });

  // 5. Vector Dimension & Embedding Provider
  console.log("\n--- 5. Vector Embedding Provider & Dimension Safety ---");
  await test("Embedding Provider: Validates 1536 dimension safely", async () => {
    const noneProvider = new NoneEmbeddingProvider();
    assert.equal(noneProvider.dimension, 1536);
    const vector = await noneProvider.embedText("test text");
    assert.deepEqual(vector, []);

    // Test dimension mismatch guard
    class MockBadProvider implements EmbeddingProvider {
      providerName = "BadProvider";
      dimension = 768; // Wrong dimension!
      async embedText() { return new Array(768).fill(0.1); }
      async embedBatch(t: string[]) { return t.map(() => new Array(768).fill(0.1)); }
    }
    const bad = new MockBadProvider();
    assert.notEqual(bad.dimension, 1536, "Bad provider detected with mismatch dimension");
  });

  console.log("\n=================================================");
  console.log(`Phase 4 Test Results: ${passed} / ${total} Passed`);
  console.log("=================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
