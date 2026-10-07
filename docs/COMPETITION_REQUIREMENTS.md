# FinGuard AI — Competition Requirements & Rubric Alignment

> **Target Competition:** Digital Innovation Challenge 2026 — BFSI & FinTech Innovation Track  
> **Target Persona:** Bank Innovation Judges, C-Level Compliance/Risk Executives, Enterprise Architects  
> **Core Theme:** Agentic AI, Autonomous Workflows, Regulatory Technology (RegTech), Trust & Governance

---

## 1. Challenge Overview & Problem Context
In commercial banking, financial institutions operate under stringent supervision from regulatory bodies such as the **Bank of Thailand (BOT / ธปท.)** and **AMLO (ปปง.)**. Whenever new regulatory circulars or amendments are published:
- Compliance and Legal teams manually download and parse extensive PDF circulars (often 40+ pages in Thai and English).
- Legal analysts manually compare clauses against predecessor regulations to identify altered mandates.
- Compliance officers manually cross-reference hundreds of internal bank policies across operations, AML, IT security, and data governance.
- Remediation tasks are created manually in fragmented ticketing systems, causing audit delays, tracking failures, and regulatory non-compliance penalties.

**FinGuard AI was engineered specifically to solve this end-to-end regulatory change management lifecycle through a multi-agent autonomous pipeline governed by strict Human-in-the-Loop approval.**

---

## 2. Official Judging Rubric Alignment Matrix

| Judging Dimension | Weight (Est.) | Competition Requirement | FinGuard AI Implementation & Evidence | Verified Source |
| :--- | :---: | :--- | :--- | :--- |
| **1. Innovation & Agentic AI Depth** | 25% | Demonstrates true agentic orchestration beyond simple LLM text generation or basic RAG. | 4-agent autonomous pipeline: Watcher $\rightarrow$ Ingestion $\rightarrow$ Diff $\rightarrow$ Gap Analysis $\rightarrow$ Dispatcher. Performs multi-step autonomous actions with state machines. | `src/lib/agents/` |
| **2. Technical Feasibility & Architecture** | 20% | Production-grade software architecture, low latency, robust data modeling, and deployable code. | Next.js 15 App Router, TypeScript Strict Mode, Neon Serverless PostgreSQL with pgvector, Prisma ORM, production build verified. | `next build`, `package.json` |
| **3. Safety, Security & Governance** | 20% | Enterprise-grade governance, anti-hallucination guardrails, RBAC, tamper-evident auditability. | **Evidence Triad** (mandatory citation of external regulation + internal policy), `WAITING_FOR_HUMAN` gate, SSRF allowlist (`bot.or.th`), SHA-256 cryptographic audit chain. | `src/lib/security/`, `docs/SECURITY.md` |
| **4. Business Impact & Practicality** | 20% | Direct relevance to real banking operational bottlenecks without impractical Core Banking disruption. | Solves regulatory change management for BFSI. Refined from coaching to avoid high-risk core banking tampering while accelerating compliance review. | `docs/BENCHMARK.md`, `docs/PRESENTATION_DATA.md` |
| **5. Live Presentation & Demo Execution** | 15% | Clear value proposition, seamless live demo, defensible claims, and robust failsafe contingency. | 3-minute & 90-second stage scripts, 3-second pristine database reset (`npm run demo:reset`), offline-first deterministic fallback. | `docs/COMPETITION_DEMO.md`, `docs/DEMO_FAILSAFE.md` |

---

## 3. Scope & Boundary Invariants
The competition scope strictly defines what FinGuard AI **IS** and what it **IS NOT**:

### What FinGuard AI IS:
- ✅ **Autonomous Regulatory Intelligence & Policy Mapping Agent**
- ✅ **Bilingual Clause Parser & Temporal Diff Engine** (Bank of Thailand circulars)
- ✅ **Semantic Internal Bank Policy Retriever** (pgvector + structured filtering)
- ✅ **Grounded Gap Analysis & Decision-Support Copilot**
- ✅ **Human-in-the-Loop Governance Gatekeeper**
- ✅ **Tamper-Evident Cryptographic Audit Chain**

### What FinGuard AI IS NOT:
- ❌ NOT a Core Banking Transaction Replacement
- ❌ NOT an Automated Real-Time Transaction Blocker
- ❌ NOT a Fraud / Mule Account Detection Tool
- ❌ NOT an Unchecked Autonomous Legal Decision Maker

---

## 4. Verification & Audit Statement
- All benchmark metrics cited in the pitch deck (`100% diff classification`, `100% gap mapping`, `100% evidence triad`, `100% prompt injection resistance`, `0 duplicate dispatches`) are directly derived from executable test suites (`tests/evaluation/benchmark.test.ts`).
- No claims of universal production accuracy or unverified financial returns are made.
