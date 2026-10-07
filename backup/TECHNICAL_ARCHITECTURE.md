# FinGuard AI — Technical Architecture Specification

**Autonomous Regulatory Intelligence & Policy Mapping Agent**  
*Enterprise Architecture Blueprint & Security Specifications*

---

## 1. Multi-Agent Pipeline Architecture

FinGuard AI implements a specialized, decoupled **5-Agent Pipeline** where each agent possesses a single bounded responsibility, deterministic validation gates, and complete observability.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       OFFICIAL REGULATORY INGESTION                         │
│                     (Bank of Thailand Circular Portal)                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. WATCHER AGENT                                                            │
│ • Scheduled hourly cron (/api/watcher/cron) with bearer token security      │
│ • SSRF-Guarded HTTP Client (RFC 1918 private IP & non-HTTPS blocking)       │
│ • HTML Circular Table Scraper & SHA-256 Content Fingerprinting              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. INGESTION AGENT                                                          │
│ • Bilingual Thai/English Text Normalizer (Unicode zero-width sanitizer)     │
│ • Temporal Chunking Engine: Extracts numbered clauses (e.g., Clause 1.1)    │
│ • Supersession Linking: Marks v1.0 as REVOKED and v2.0 as ACTIVE            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. DIFF AGENT                                                               │
│ • In-Memory Fast Token Comparison Algorithm (Latency: 1 ms)                 │
│ • Mathematical Classification: ADD, MODIFY, DELETE, UNCHANGED               │
│ • Change Magnitude & Impact Scoring                                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. GAP ANALYSIS AGENT                                                       │
│ • Vector Retrieval: Cosine similarity via Neon pgvector (1536 dim)          │
│ • Grounded Reasoning Engine: Anchored by REGULATORY_GAP_PROMPT_V1           │
│ • Evidence Triad: (1) BOT Clause + (2) Internal Policy + (3) Audit Proof    │
│ • Output Status: WAITING_FOR_HUMAN (OPEN)                                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ [SOVEREIGN HUMAN-IN-THE-LOOP APPROVAL GATE]                                 │
│ • Strict Server-Side RBAC: COMPLIANCE_OFFICER or ADMIN only                 │
│ • Audit Log Hash Generated: Action GAP_APPROVED                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. DISPATCHER AGENT                                                         │
│ • Gate Enforcement: Rejects dispatch if status !== "APPROVED"               │
│ • Idempotent Ticket Generator (CMP-2026-XXXX) for Jira/ServiceNow           │
│ • Audit Log Hash Generated: Action GAP_DISPATCHED                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Temporal Regulatory Data Model

FinGuard AI models regulatory evolution as a **temporal directed acyclic graph (DAG)** rather than static document stores.

### Database Schema Highlights (`prisma/schema.prisma`):

```prisma
model Regulation {
  id             String           @id @default(cuid())
  regulationCode String           // e.g., "BOT-COMP-001"
  version        String           // e.g., "1.0", "2.0"
  title          String
  sourceType     RegulationSource @default(BOT_OFFICIAL)
  status         RegulationStatus @default(ACTIVE) // ACTIVE, REVOKED, SUPERSEDED
  effectiveFrom  DateTime
  effectiveTo    DateTime?
  
  supersedesId   String?
  supersedes     Regulation?      @relation("RegulationSupersession", fields: [supersedesId], references: [id])
  supersededBy   Regulation[]     @relation("RegulationSupersession")
  
  chunks         RegulationChunk[]
  gaps           ComplianceGap[]
}

model RegulationChunk {
  id              String      @id @default(cuid())
  regulationId    String
  chunkIndex      Int
  clauseRef       String      // e.g., "Clause 1.1"
  heading         String?
  content         String      @db.Text
  previousContent String?    @db.Text
  changeType      ChangeType  @default(UNCHANGED) // ADD, MODIFY, DELETE, UNCHANGED
  embedding       Unsupported("vector(1536)")?

  regulation      Regulation  @relation(fields: [regulationId], references: [id], onDelete: Cascade)
}

model ComplianceGap {
  id                 String     @id @default(cuid())
  regulationId       String
  regulationChunkId  String?
  internalPolicyId   String
  riskLevel          RiskLevel  // CRITICAL, HIGH, MEDIUM, LOW
  confidence         Float      // 0.0 to 1.0
  reasoning          String?    @db.Text
  promptVersion      String?    // e.g., "REGULATORY_GAP_PROMPT_V1"
  evidenceRegulation String?    @db.Text
  evidencePolicy     String?    @db.Text
  status             GapStatus  @default(OPEN) // OPEN, REVIEWED, APPROVED, DISMISSED
  reviewedBy         String?
  approvedAt         DateTime?
}
```

---

## 3. Grounded AI Reasoning & Evidence Triad

To eliminate large language model hallucinations in high-stakes banking compliance, FinGuard AI mandates the **Evidence Triad Contract**:

1. **Circular Grounding (`evidenceRegulation`)**: Direct, unmodified substring extracted from the official Bank of Thailand circular chunk.
2. **Policy Grounding (`evidencePolicy`)**: Direct excerpt from the target bank internal policy (e.g., `P-102`, `P-205`, `P-310`).
3. **Structured Reasoning (`reasoning`)**: Step-by-step risk deduction generated by prompt version `REGULATORY_GAP_PROMPT_V1`.

If either context is absent or contradictory, the agent is strictly instructed to return `INSUFFICIENT_EVIDENCE` and set risk level to `LOW` pending human clarification.

---

## 4. Cryptographic Audit Chain

All compliance actions are secured with a tamper-evident blockchain-style hash chain:

```text
Block N-1: [ Hash: 7a8f... | Action: GAP_APPROVED | Timestamp: 13:10:00 ]
     │
     └── SHA-256(Block N-1 Hash + Block N Data + Salt)
               │
               ▼
Block N:   [ Hash: d4e1... | Action: GAP_DISPATCHED | Timestamp: 13:10:05 ]
```

- Any post-hoc database record manipulation breaks the hash chain.
- `/api/audit/verify` verifies the chain on demand with millisecond verification times.

---

## 5. Security & SSRF Protection

- **SSRF Guard**: `src/lib/security/ssrf-guard.ts` intercepts all outgoing requests from the Ingestion Agent. URLs targeting localhost (`127.0.0.1`), link-local metadata services (`169.254.169.254`), or private internal subnets are immediately blocked with HTTP 403.
- **Server-Side RBAC**: Actions verify user role tokens in session headers before executing mutations. `AUDITOR` accounts have strictly read-only access and are rejected at the server action layer.
- **Data Privacy (PDPA)**: All ingested text passes through a regex PII masking filter that obfuscates Thai National ID numbers (13 digits), payment card numbers (16 digits), phone numbers, and email addresses.
