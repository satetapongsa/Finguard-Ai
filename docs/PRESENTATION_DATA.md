# FinGuard AI — Presentation Data Package (Official Challenge Facts)

> **Core Value Statement:**  
> **“AI does the analysis. Humans control the decision. Every action is traceable.”**

---

## 1. Executive Summary & Problem Space
- **Industry Sector:** Banking, Financial Services, and Insurance (BFSI).
- **Target Persona:** Bank Chief Compliance Officer (CCO), Head of Regulatory Affairs, Internal Audit.
- **The Core Problem:**  
  Commercial banks in Thailand face frequent, high-stakes regulatory circulars from the Bank of Thailand (BOT). Reading 40+ page documents, manually comparing clauses against older frameworks, and searching across hundreds of internal bank policies takes weeks of manual legal review, resulting in compliance delays and statutory penalties.
- **The Solution:**  
  FinGuard AI is an **Autonomous Regulatory Intelligence & Policy Mapping Agent** that continuously ingests official announcements, calculates temporal clause diffs, semantically retrieves impacted bank policies, and presents a grounded compliance gap matrix requiring authorized Human Compliance Officer approval before dispatching remediation tasks.

---

## 2. Multi-Agent System Architecture
| Agent | Responsibility | Core Technology |
| :--- | :--- | :--- |
| **Watcher Agent** | Autonomous discovery of new regulatory circulars. | Node.js Fetch, SSRF allowlist, AbortController, Vercel Cron. |
| **Ingestion Agent** | PDF parsing, UTF-8 Thai text normalization, SHA-256 fingerprinting. | `bot-parser`, Crypto, Prisma ORM, Neon PostgreSQL. |
| **Diff Agent** | Deterministic clause delta classification (`ADD`, `MODIFY`, `DELETE`, `UNCHANGED`). | `clause-matcher`, Temporal Data Model, ChangeType Enums. |
| **Gap Analysis Agent** | Semantic policy retrieval and grounded evidence reasoning. | `grounded-reasoning`, pgvector, NoneEmbedding fallback. |
| **Dispatcher Agent** | Human-in-the-Loop approval gating and ticket emission. | RBAC Engine, `ticket-builder`, Idempotency Controller. |

---

## 3. Measurable Prototype & Benchmark Metrics
*(Evaluated via automated benchmark test suite `npm run test:benchmark`)*

- **Clause Diff Classification Accuracy:** **100%** (5/5 changes classified accurately on test set).
- **Grounded Gap Mapping Accuracy:** **100%** (4/4 conflicts detected with risk floors intact).
- **Evidence Triad Traceability:** **100%** (Bidirectional citation of external BOT clause and internal bank policy).
- **Prompt Injection Resistance:** **100%** (Adversarial system override embedded in policy text rejected).
- **Remediation Dispatch Idempotency:** **100%** (Zero duplicate tickets on retry).
- **Diff Analysis Latency:** **< 1 ms** per 5-clause circular comparison.
- **Grounded Reasoning Latency:** **< 1 ms** per clause-policy evaluation.

---

## 4. Security & Governance Invariants
1. **Zero-Hallucination Evidence Triad:** Every gap finding must cite the enacted regulatory clause and the internal bank policy. Insufficient evidence defaults safely to `INSUFFICIENT_EVIDENCE` with a `LOW` risk floor.
2. **Mandatory Human-in-the-Loop Gating:** Workflow halts unconditionally at `WAITING_FOR_HUMAN`. The system is cryptographically blocked from issuing remediation tickets without an authorized Compliance Officer's digital approval.
3. **Server-Side RBAC:** `COMPLIANCE_OFFICER` has review/approval rights. `AUDITOR` has strictly read-only access.
4. **SSRF Guard:** External fetch allowlist restricted strictly to official BOT domains (`bot.or.th`).
5. **Tamper-Evident SHA-256 Audit Trail:** Every event is appended to an unbroken cryptographic blockchain.

---

## 5. Technology Stack
- **Framework:** Next.js 15 (App Router, Server Actions)
- **Language:** TypeScript Strict Mode
- **Database:** Neon Serverless PostgreSQL with pgvector
- **ORM:** Prisma v6
- **Auth:** NextAuth.js v5 (JWT Session + Role Invariants)
- **AI Engine:** Grounded Deterministic Engine + DeepSeek / OpenAI API compatibility
