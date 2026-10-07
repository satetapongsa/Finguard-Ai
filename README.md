# FinGuard AI — Autonomous Regulatory Intelligence & Policy Mapping Agent

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-Serverless%20Postgres%20with%20pgvector-00E599?style=flat&logo=postgresql)](https://neon.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Competition-Demo--Ready-emerald.svg)]()
[![License](https://img.shields.io/badge/License-MIT-gray.svg)](https://opensource.org/licenses/MIT)

> **“AI does the analysis. Humans control the decision. Every action is traceable.”**

FinGuard AI is an **Autonomous Regulatory Intelligence & Policy Mapping Agent** engineered for the Banking, Financial Services, and Insurance (BFSI) sector. It automates the manual, labor-intensive burden of reading new regulatory announcements (e.g. from the Bank of Thailand / ธปท.), comparing them with predecessor circulars, and mapping requirements to internal bank policies using a grounded multi-agent workflow with mandatory Human-in-the-Loop governance.

---

## 1. Product Workflow

```text
OFFICIAL REGULATORY SOURCE (Bank of Thailand FIPCS)
        ↓
WATCHER AGENT (Safe Polling + SSRF Guard + SHA-256 Fingerprint)
        ↓
INGESTION AGENT (Bilingual Thai/English Parser + Temporal Model)
        ↓
VERSIONING & DIFF AGENT (ADD, MODIFY, DELETE, UNCHANGED)
        ↓
POLICY RETRIEVAL (Semantic pgvector + Lexical Filtering)
        ↓
GROUNDED GAP ANALYSIS AGENT (Evidence Triad + Anti-Hallucination)
        ↓
HUMAN-IN-THE-LOOP REVIEW (Strict WAITING_FOR_HUMAN State)
        ↓
COMPLIANCE OFFICER APPROVAL
        ↓
DISPATCHER AGENT (Idempotent Remediation Ticket CMP-2026-XXXX)
        ↓
CRYPTOGRAPHIC AUDIT CHAIN (SHA-256 Tamper-Evident Trail)
```

---

## 2. Core Capabilities

1. **Official Bank of Thailand (BOT) Source Adapter:**
   - Safe server-side polling targeting official BOT supervision circulars.
   - Strict SSRF protection allowlisting official BOT domains (`bot.or.th`).
   - UTF-8 Thai text normalization and clause regex matching (`ข้อ 1`, `ข้อ 1.1`, `(1)`, `(ก)`).
   - Provenance tracking distinguishing `OFFICIAL_BOT` vs `SYNTHETIC_DEMO`.

2. **Grounded AI Reasoning & Anti-Hallucination Guardrails:**
   - Evaluates compliance impact strictly against supplied evidence (**Evidence Triad**).
   - Returns `INSUFFICIENT_EVIDENCE` instead of hallucinating when context is incomplete.
   - Resists adversarial prompt injection embedded inside regulatory or policy text (100% verified).

3. **Deterministic Human-in-the-Loop (HITL) Governance:**
   - Autonomous agents strictly halt at `WAITING_FOR_HUMAN`.
   - Never auto-approves or auto-dispatches remediation tickets.
   - Enforces server-side RBAC: `COMPLIANCE_OFFICER` authorizes actions, `AUDITOR` is strictly read-only.

4. **Cryptographic Traceability & Audit Trail:**
   - Every agent state transition, finding, approval, and ticket dispatch is sealed in an unbroken SHA-256 blockchain.
   - Database mutations are detectable immediately via built-in chain validation.

---

## 3. Quick Start & Competition Demo

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- PostgreSQL database (Neon Serverless PostgreSQL recommended)

### Setup Instructions
```bash
# 1. Clone repository
git clone https://github.com/satetapongsa/Finguard-Ai.git
cd Finguard-Ai

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 4. Generate Prisma Client & Push Schema
npx prisma db push

# 5. Seed pristine competition demo state
npm run demo:reset

# 6. Start development server
npm run dev
```

Visit `http://localhost:3000` and log in with:
- **Compliance Officer:** `officer@finguard.bank` / `Officer@FinGuard2026!`
- **Auditor (Read-Only):** `auditor@finguard.bank` / `Auditor@FinGuard2026!`
- **System Admin:** `admin@finguard.bank` / `Admin@FinGuard2026!`

---

## 4. Key Documentation & Runbooks

- [3-Minute Competition Demo Script](docs/COMPETITION_DEMO.md)
- [Competition Judge Q&A Defense Guide](docs/JUDGE_QA.md)
- [Benchmark & Evaluation Report](docs/BENCHMARK.md)
- [Enterprise Architecture Diagram](docs/ARCHITECTURE.md)
- [Security Architecture & Threat Model](docs/SECURITY.md)

---

## 5. Automated Benchmark & Verification Results

```bash
npm test
```

| Benchmark Category | Accuracy / Compliance | Latency |
| :--- | :---: | :---: |
| **Clause Diff Classification (ADD/MODIFY/DELETE/UNCHANGED)** | **100%** | < 1 ms |
| **Grounded Gap Mapping & Risk Floor Calibration** | **100%** | < 1 ms |
| **Evidence Triad Traceability** | **100%** | — |
| **Adversarial Prompt Injection Resistance** | **100%** | — |
| **Dispatch Format & Idempotency** | **100%** | — |
| **Production Build (`next build`)** | **PASSED** | — |
| **Strict TypeScript (`tsc --noEmit`)** | **PASSED (0 Errors)** | — |
| **ESLint (`next lint`)** | **PASSED (0 Errors)** | — |

---

## 6. Operational Modes

| Mode | `REGULATORY_SOURCE_MODE` | `AI_MODE` | `EMBEDDING_MODE` | Description |
| :--- | :---: | :---: | :---: | :--- |
| **Competition Offline** | `demo` | `deterministic` | `none` | **100% offline.** Zero external keys or live network dependencies needed. |
| **Live BOT Production** | `bot` | `live` | `live` | Real BOT portal polling, OpenAI/DeepSeek LLM, pgvector semantic retrieval. |
| **Hybrid Testing** | `demo` | `live` | `live` | Synthetic regulatory fixtures with live LLM reasoning. |

---

## 7. License & Compliance Notice

This system is developed as an Autonomous Compliance Intelligence Agent for enterprise banking decision support. All AI outputs serve as expert decision-support recommendations subject to authorized human compliance review.
