# FinGuard AI — Autonomous Financial Compliance & Transaction Intelligence Agent

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4.1-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=flat&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-Streaming-000000?style=flat&logo=vercel)](https://sdk.vercel.ai/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Zero--Any-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**FinGuard AI** is a production-ready Autonomous Financial Compliance and Transaction Intelligence Agent platform engineered for the **Banking, Financial Services, and Insurance (BFSI)** sector. It enforces strict double-entry ACID ledger consistency, real-time PDPA/PII data protection, heuristic and LLM anomaly scoring, and regulatory RAG interrogation adhering to **Bank of Thailand (BOT)** and **Anti-Money Laundering Office (AMLO)** directives.

---

## 🏛️ System Architecture & Data Flow

Below is the complete end-to-end system architecture visualized natively in Mermaid:

```mermaid
flowchart TB
    %% =========================================================================
    %% STYLING DEFINITIONS
    %% =========================================================================
    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef edge fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef security fill:#450a0a,stroke:#f43f5e,stroke-width:2px,color:#f8fafc;
    classDef core fill:#0c2d48,stroke:#0ea5e9,stroke-width:2px,color:#f8fafc;
    classDef ai fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef data fill:#1e1e24,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef audit fill:#3b0764,stroke:#c084fc,stroke-width:2px,color:#f8fafc;

    %% =========================================================================
    %% LAYER 1: CLIENT & PRESENTATION LAYER
    %% =========================================================================
    subgraph L1 ["1. Client & Presentation Layer (Next.js 15+ / React 19)"]
        UI_DASH["Executive Ledger Dashboard\n(Real-time KPIs & Risk Stream)"]:::client
        UI_COPILOT["Compliance Copilot UI\n(Split-screen Inspector & Chat)"]:::client
        UI_AUDIT["Immutable Audit Explorer\n(Cryptographic Hash Verifier)"]:::client
        STATE_STORE["Client State Engine\n(Zustand + NextAuth v5 JWT)"]:::client
    end

    %% =========================================================================
    %% LAYER 2: EDGE GATEWAY & SECURITY PERIMETER
    %% =========================================================================
    subgraph L2 ["2. Edge Gateway & Security Perimeter (Zero-Trust Ingress)"]
        EDGE_ROUTER["Edge Reverse Proxy / WAF\n(DDoS Shield & TLS 1.3 Termination)"]:::edge
        AUTH_RBAC["Identity & RBAC Middleware\n(Admin / Compliance Officer / Auditor)"]:::edge
        PDPA_SHIELD["PDPA & PII Sanitization Engine\n(Regex Masking: Thai ID, PAN, Mobile, Email)"]:::security
    end

    %% =========================================================================
    %% LAYER 3: CORE APPLICATION & AGENTIC ORCHESTRATION LAYER
    %% =========================================================================
    subgraph L3 ["3. Core Application & Agentic Orchestration Layer (Node.js Runtime)"]
        API_GW["REST & SSE Event Handlers\n(Next.js App Router API Handlers)"]:::core
        AGENT_ORCH["Agentic Workflow Orchestrator\n(Vercel AI SDK / Tool Calling Coordinator)"]:::core
        
        subgraph ENGINES ["Specialized Domain Engines"]
            TX_ENGINE["ACID Transaction Engine\n(Double-Entry Ledger & Balance Guard)"]:::core
            RISK_ENGINE["Autonomous Risk Engine\n(Velocity Profiler & Threshold Heuristics)"]:::core
            COMPLIANCE_ENGINE["Policy Verification Engine\n(Regulatory Directive Parser)"]:::core
        end
    end

    %% =========================================================================
    %% LAYER 4: AI INFERENCE & KNOWLEDGE RETRIEVAL (RAG) LAYER
    %% =========================================================================
    subgraph L4 ["4. AI Inference & Knowledge Retrieval (RAG) Layer"]
        VEC_STORE["PostgreSQL Vector Store\n(pgvector: Cosine Distance & HNSW Index)"]:::ai
        INGEST_PIPE["Regulatory Ingestion Pipeline\n(PDF/Circular Parser & Chunking)"]:::ai
        LLM_GW["LLM Inference Gateway\n(Streaming Adapters: Gemini 1.5/2.5 & Claude)"]:::ai
        GUARD_LLM["Model Alignment Guardrail\n(Prompt Injection & Jailbreak Defense)"]:::security
    end

    %% =========================================================================
    %% LAYER 5: DATA PERSISTENCE & IMMUTABLE AUDIT LAYER
    %% =========================================================================
    subgraph L5 ["5. Data Persistence & Immutable Audit Layer (PostgreSQL & Object Store)"]
        DB_LEDGER[("Primary Transaction Ledger\nPostgreSQL: Serializable Isolation")]:::data
        AUDIT_STORE[("Immutable Write-Only Audit Log\nSHA-256 Checksums & Event Ledger")]:::audit
        DOC_STORE[("Encrypted Policy Object Store\nS3-Compatible / SSE-KMS Encrypted")]:::data
    end

    %% =========================================================================
    %% INTER-LAYER COMMUNICATIONS & PROTOCOLS
    %% =========================================================================
    UI_DASH -->|HTTPS / WSS| EDGE_ROUTER
    UI_COPILOT -->|Server-Sent Events / Stream| EDGE_ROUTER
    UI_AUDIT -->|HTTPS / JSON| EDGE_ROUTER
    STATE_STORE -.->|Bearer JWT Token| EDGE_ROUTER

    EDGE_ROUTER -->|TLS Terminated Ingress| AUTH_RBAC
    AUTH_RBAC -->|Validated Claims & Role| PDPA_SHIELD
    PDPA_SHIELD -->|Sanitized Payload & Masked PII| API_GW

    API_GW -->|Execute Transfer| TX_ENGINE
    API_GW -->|Analyze Inquiry| AGENT_ORCH

    TX_ENGINE -->|Pre-execution Velocity & Amount Check| RISK_ENGINE
    RISK_ENGINE -->|Risk Score > 0.65 Escalation| AGENT_ORCH

    AGENT_ORCH -->|Policy Keyword & Vector Query| VEC_STORE
    AGENT_ORCH -->|Sanitized Prompt + Retrieved Policies| GUARD_LLM
    GUARD_LLM -->|Streamed Prompt| LLM_GW
    LLM_GW -->|Token Stream with Citations| API_GW

    INGEST_PIPE -->|Chunked Embeddings 1536d| VEC_STORE
    INGEST_PIPE -->|Raw Document Archive| DOC_STORE

    TX_ENGINE -->|prisma.$transaction: Debit & Credit| DB_LEDGER
    TX_ENGINE -->|Compute SHA-256 Hash of Sanitized Payload| AUDIT_STORE
    AGENT_ORCH -->|Log AI Audit Event & Citation Hashes| AUDIT_STORE
    API_GW -->|Query Tamper-Evident Records| AUDIT_STORE
```

---

## ⚡ Core Technical Pillars

1. **ACID Double-Entry Ledger Engine**
   - Atomic debit/credit settlement via `prisma.$transaction` using `SERIALIZABLE` isolation.
   - Mathematical overdraft prevention, race condition elimination, and ledger balance consistency.

2. **PDPA & PII Sanitization Guardrail Middleware**
   - Automatically masks sensitive personal identifiers (13-digit Thai National IDs, 16-digit payment card PANs, phone numbers, and emails) prior to logging or LLM consumption.

3. **Autonomous Risk & Anomaly Scoring Engine**
   - Real-time heuristic scoring checking Bank of Thailand rules (฿500,000 THB threshold) and AMLO directives (฿2,000,000 THB mandatory reporting, cross-border checks, burst velocity detection).

4. **Vector-Augmented Regulatory RAG (`pgvector`)**
   - High-dimension policy retrieval against regulatory frameworks (BOT circulars, AMLO directives, FATF Recommendation 16).
   - Real-time token streaming with precise legal citations (`[BOT-NO-12/2566]`, `[AMLO-SEC-2024-01]`).

5. **Cryptographic Tamper-Evident Audit Explorer**
   - Append-only write store calculating deterministic SHA-256 hashes of all sanitized payloads for non-repudiation and external regulatory examination.

---

## 🔄 Execution Data Flows

### Scenario 1: Financial Document Ingestion & Compliance Interrogation
```
[User Query / Document] ──► [Edge RBAC] ──► [PDPA Sanitizer] ──► [pgvector Policy RAG]
                                                                          │
                                                                          ▼
[Immutable Audit Store] ◄── [Audit SHA-256] ◄── [Token Stream] ◄── [AI Copilot Model]
```

### Scenario 2: High-Volume Transaction Anomaly Verification
```
[Transfer Request] ──► [PDPA Masking] ──► [Risk Scorer]
                                               │
                                 ┌─────────────┴─────────────┐
                                 ▼                           ▼
                        [Low Risk (<0.65)]          [High Risk (>=0.65)]
                                 │                           │
                                 │                  [Autonomous AI Alert]
                                 └─────────────┬─────────────┘
                                               ▼
                                 [prisma.$transaction]
                                 - Debit Source Balance
                                 - Credit Destination Balance
                                               │
                                 ┌─────────────┴─────────────┐
                                 ▼                           ▼
                     [Primary Transaction DB]   [SHA-256 Immutable Audit Log]
```

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/satetapongsa/finguard-ai.git
cd finguard-ai
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finguard_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-super-secret-jwt-key-min-32-chars"
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
```

### 3. Initialize Database & Seed Demo Data

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to PostgreSQL with pgvector
npx prisma db push

# Seed mock accounts, policies, and transactions
npm run prisma:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001`) in your browser.

---

## 🧪 Testing & Verification

Run the security and PDPA guardrail test suite:
```bash
npx tsx tests/guardrails.test.ts
```

Run strict TypeScript compiler type check:
```bash
npx tsc --noEmit
```

Build for production:
```bash
npm run build
```

---

## 📁 Repository Structure

```
finguard-ai/
├── prisma/
│   ├── schema.prisma          # PostgreSQL + pgvector schema & RBAC
│   └── seed.ts                # Seeder for accounts, policies & ledger
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── accounts/      # Financial accounts query API
│   │   │   ├── audit/         # Immutable audit log query API
│   │   │   ├── compliance/    # RAG policy retrieval & streaming AI
│   │   │   ├── policies/      # Regulatory policy list API
│   │   │   ├── stats/         # Executive dashboard KPI aggregator
│   │   │   └── transactions/  # ACID double-entry transfer engine
│   │   ├── audit/             # Immutable Audit Explorer UI
│   │   ├── compliance/        # AI Compliance Copilot split-screen
│   │   ├── dashboard/         # Executive KPI Dashboard & Ledger Table
│   │   ├── globals.css        # BFSI dark theme, glassmorphism & fonts
│   │   └── layout.tsx         # Root layout with navigation & modal
│   ├── components/
│   │   ├── Navigation.tsx     # Top header with engine status indicators
│   │   └── QuickTransferModal.tsx # Live ACID transfer & PII masking preview
│   ├── lib/
│   │   ├── auth.ts            # NextAuth v5 configuration with RBAC
│   │   ├── prisma.ts          # Singleton PrismaClient instance
│   │   ├── risk/engine.ts     # Autonomous velocity & threshold risk engine
│   │   ├── security/guardrails.ts # PII masking (Thai ID, Cards) & SHA-256
│   │   └── types.ts           # Strict Zod schemas & TypeScript types
│   └── store/
│       └── compliance-store.ts # Zustand client state management
├── tests/
│   └── guardrails.test.ts     # Security & PDPA guardrail unit test suite
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## 📄 Regulatory Compliance Scope

- **Bank of Thailand (BOT)**: High-Value Electronic Fund Transfers Directive (BOT-NO-12/2566).
- **Anti-Money Laundering Office (AMLO)**: Suspicious Transaction Report (STR) & Watchlist Screening (AMLO-SEC-2024-01).
- **Personal Data Protection Act (PDPA B.E. 2562)**: Financial Sector Sensitive Data Redaction Guidelines.
- **Financial Action Task Force (FATF)**: Recommendation 16 (Wire Transfer Travel Rule).

---

## 🛡️ Security & Privacy Notice
All demo credentials and test records use synthetic datasets. Never commit live banking credentials or active private API keys to version control.
