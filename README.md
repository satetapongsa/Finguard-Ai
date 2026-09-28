# FinGuard AI - Autonomous Financial Compliance and Transaction Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-Serverless%20Postgres-00E599?style=flat&logo=postgresql)](https://neon.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/Version-1.2.0-cyan.svg)](https://github.com/satetapongsa/finguard-ai)
[![License](https://img.shields.io/badge/License-MIT-gray.svg)](https://opensource.org/licenses/MIT)

FinGuard AI is an enterprise financial compliance and transaction intelligence platform engineered for the Banking, Financial Services, and Insurance (BFSI) sector. The system provides real-time transaction monitoring, double-entry ACID ledger consistency, automated regulatory compliance checks, Personal Data Protection Act (PDPA) data masking, end-to-end cryptographic hash validation, and tamper-evident SHA-256 audit trails.

---

## Release Version & Engineering Log (Version 1.2.0)

### Version Overview
- **Current Version:** `v1.2.0` (Production-Ready Architecture)
- **Primary Focus:** High-concurrency database engine optimization, interactive multi-page navigation routing, central transaction processing overlays, end-to-end cryptographic hash mismatch detection, and DeepSeek AI backend integration.

### Summary of Recent Architectural Enhancements
1. **High-Performance Database Engine & Query Optimization:**
   - Transformed multi-query dashboard aggregation routes into single-pass Raw SQL (`$queryRaw`) executions, bypassing multi-roundtrip network latencies on Neon Serverless PostgreSQL.
   - Configured PgBouncer connection pooling (`pgbouncer=true&connect_timeout=10&pool_timeout=10`) and decoupled non-critical database health probes into non-blocking background threads.
   - Introduced microsecond in-memory caching with explicit cache-busting query parameter support (`?_t=timestamp`).

2. **Global Sync & Cache Purge Engine:**
   - Implemented a unified `triggerFullSyncAndRefresh` workflow across all core modules (Dashboard, Teller Desk, Ledger Reconciliation, and Audit Explorer).
   - Mounted a central translucent processing overlay (`TransactionProcessingOverlay`) that provides visual loading state indicators while purging stale Zustand state and pulling fresh database records.

3. **End-to-End Cryptographic Tamper & Mismatch Detection:**
   - Implemented 256-bit cryptographic dispatch hash checking between sender and receiver nodes (`sourceCryptHash` vs `destinationCryptHash`).
   - Mismatched or tampered transactions trigger immediate visual highlight alerts (red indicator), force a 100% risk rating quarantine, and lock account balance mutation before entering the ledger.

4. **Dedicated Enterprise Page Modularization:**
   - Separated operational workflows into distinct pages to maintain visual clarity and speed: Frontline Teller Desk (`/teller`), Daily Operations & Ledger Reconciliation (`/reconciliation`), Audit Explorer (`/audit`), and FinGuard AI Copilot (`/compliance`).
   - Configured instant navigation switching without page reload blocking, hydrated by post-navigation background fetching.

5. **DeepSeek AI Integration Readiness:**
   - Integrated DeepSeek AI engine support (`deepseek-chat` and `deepseek-reasoner`) within the FinGuard AI Copilot module (`/compliance`), equipped with dynamic API key injection and model fallback handlers.

---

## Business Objective and Application Purpose

### Why FinGuard AI Was Built
Financial institutions operating under modern regulatory regimes face significant friction reconciling transaction speed with compliance rigor. FinGuard AI was developed to solve three core structural challenges:

1. **Instant Compliance Invariant Enforcement:** Automate statutory rules (Bank of Thailand high-value transfer thresholds, AMLO suspicious transaction reporting, FATF Travel Rule) at the exact moment of transaction dispatch, avoiding post-facto audit fines.
2. **Double-Entry Ledger & Cryptographic Integrity:** Guarantee that ledger debits and credits maintain mathematical symmetry (ACID compliant) while sealing every entry with SHA-256 hash chains to make financial records non-repudiable.
3. **Privacy Compliance by Design (PDPA):** Automatically mask customer Personally Identifiable Information (PII) at the edge before data persistence or LLM inference, ensuring compliance with Thai PDPA B.E. 2562.

---

## Current System State (Maturity Matrix)

| Module / System Layer | Maturity Level | Status & Capability |
| :--- | :--- | :--- |
| **ACID Double-Entry Engine** | Production-Ready | Handles parallel debit/credit settlements with strict overdraft prevention. |
| **Database Persistence (Neon PostgreSQL)** | Production-Ready | Optimized raw SQL aggregations, PgBouncer pooler, and schema migrations. |
| **PDPA Data Protection Guardrail** | Production-Ready | Edge masking for Citizen IDs, PAN card numbers, phone numbers, and emails. |
| **Cryptographic Audit Explorer** | Production-Ready | SHA-256 linked-list derivation with built-in chain validation (`GET /api/audit/verify`). |
| **Frontline Teller Desk** | Production-Ready | Quick test account generation, counter transfers, and printable customer slips. |
| **FinGuard AI Copilot** | Integration-Ready | UI RAG inspector connected to DeepSeek AI backend API key handler. |

---

## Executive Summary of Supported Regulations

The platform addresses regulatory compliance, fraud mitigation, and auditability requirements mandated by:
- **Bank of Thailand (BOT) Directives:** Electronic Fund Transfer Notification (BOT-NO-12/2566)
- **Anti-Money Laundering Office (AMLO):** Suspicious Transaction Reporting (AMLO-SEC-2024-01)
- **Personal Data Protection Act (PDPA):** Sensitive Data Redaction (PDPA B.E. 2562)
- **Financial Action Task Force (FATF):** Wire Transfer Travel Rule (Recommendation 16)

---

## Architecture and Data Flow

FinGuard AI is built on a multi-tier micro-architectural foundation:

```mermaid
flowchart TB
    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef edge fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef security fill:#450a0a,stroke:#f43f5e,stroke-width:2px,color:#f8fafc;
    classDef core fill:#0c2d48,stroke:#0ea5e9,stroke-width:2px,color:#f8fafc;
    classDef ai fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef data fill:#1e1e24,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef audit fill:#3b0764,stroke:#c084fc,stroke-width:2px,color:#f8fafc;

    subgraph L1 ["1. Client and Presentation Tier (Next.js 15 App Router / React 19)"]
        UI_DASH["Executive Ledger Dashboard\n(Real-time Balances & Transaction Stream)"]:::client
        UI_COPILOT["FinGuard AI Copilot Interface\n(Regulatory RAG & DeepSeek Engine)"]:::client
        UI_AUDIT["Cryptographic Audit Explorer\n(SHA-256 Chain Verification)"]:::client
        STATE_STORE["State Management\n(Zustand + Micro-Cache Engine)"]:::client
    end

    subgraph L2 ["2. Security Perimeter and Edge Gateway"]
        EDGE_ROUTER["Next.js Edge Middleware\n(Security Headers & Route Protection)"]:::edge
        AUTH_RBAC["Role-Based Access Control (RBAC)\n(Admin / Compliance Officer / Auditor)"]:::edge
        PDPA_SHIELD["PDPA Data Redaction Interceptor\n(Regex Masking: Citizen ID, PAN, Phone, Email)"]:::security
    end

    subgraph L3 ["3. Domain and Execution Engines"]
        API_GW["REST API and Server Actions Handlers"]:::core
        
        subgraph ENGINES ["Core Domain Processing"]
            TX_ENGINE["ACID Double-Entry Ledger Engine\n(Debit / Credit Symmetry & Overdraft Guard)"]:::core
            RISK_ENGINE["Autonomous Risk Engine\n(Velocity Bursts & AMLO/BOT Thresholds)"]:::core
            AUDIT_ENGINE["Cryptographic Audit Derivation Engine\n(SHA-256 Linked-List Non-Repudiation)"]:::core
        end
    end

    subgraph L4 ["4. Persistence and Cloud Infrastructure"]
        DB_NEON[("Neon Serverless PostgreSQL\n(PgBouncer Connection Pooling + Direct Endpoint)")]:::data
        AUDIT_CHAIN[("Append-Only Cryptographic Audit Log\n(SHA-256 Previous Hash Linking)")]:::audit
        VEC_STORE[("Regulatory Directives Vector Store\n(pgvector Cosine Distance & HNSW Index)")]:::ai
    end

    UI_DASH -->|HTTPS / REST| EDGE_ROUTER
    UI_COPILOT -->|Streaming SSE / REST| EDGE_ROUTER
    UI_AUDIT -->|HTTPS / JSON| EDGE_ROUTER
    STATE_STORE -.->|Session State| EDGE_ROUTER

    EDGE_ROUTER --> AUTH_RBAC
    AUTH_RBAC --> PDPA_SHIELD
    PDPA_SHIELD --> API_GW

    API_GW --> TX_ENGINE
    TX_ENGINE --> RISK_ENGINE
    RISK_ENGINE --> TX_ENGINE
    TX_ENGINE --> AUDIT_ENGINE

    TX_ENGINE -->|Serializable Transaction Commit| DB_NEON
    AUDIT_ENGINE -->|Linked-List Hash Block| AUDIT_CHAIN
    API_GW -->|Vector Policy Similarity Search| VEC_STORE
```

---

## Core Technical Features

### 1. ACID Double-Entry Ledger
- Strict transactional debit and credit symmetry for all financial transactions.
- Prevention of race conditions and mathematical overdrafts using database transactions.
- Zero-drift balance tracking across multiple accounts.

### 2. High-Performance Neon Serverless PostgreSQL Integration
- Single-pass Raw SQL aggregations (`$queryRaw`) eliminating multi-roundtrip latencies.
- Dual-connection configuration:
  - `DATABASE_URL`: Utilizes Neon PgBouncer connection pooler for serverless scalability.
  - `DIRECT_URL`: Dedicated direct endpoint for schema migrations.

### 3. Real-Time PDPA and PII Guardrail
- Intercepts and masks sensitive personal identifiers before persistence or transmission:
  - Thai National Citizen ID: `1-XXXX-XXXXX-XX-9`
  - Payment Card Numbers (16-digit PAN): `****-****-****-1234`
  - Thai Mobile Phone Numbers: `081-XXX-5678`
  - Email Addresses: `c****************r@finguard.bank`

### 4. Autonomous Risk Engine & End-to-End Cryptographic Validation
- 256-bit hash validation comparing dispatch node hash against receiver node hash.
- Automated Bank of Thailand (500,000 THB) and AMLO (2,000,000 THB) suspicious transaction evaluation.

### 5. Cryptographic Linked-List Audit Chain
- Write-once, read-only audit log modeled after blockchain hash chains.
- Deterministic SHA-256 block digest computation:
  `entryHash = SHA256(previousHash + payloadHash + actionType + targetResource + resourceId + timestamp)`

---

## Installation and Setup

### Prerequisites
- Node.js 18.18 or higher (Node.js 20+ recommended)
- PostgreSQL database (Neon Serverless PostgreSQL recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/satetapongsa/finguard-ai.git
cd finguard-ai
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```env
# Database: Neon Serverless PostgreSQL (Optimized connection pool)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-XYZ-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connect_timeout=10&pool_timeout=10"
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-XYZ.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="finguard_super_secret_jwt_key_compliance_2026_min_32_chars!"

# DeepSeek AI Engine Integration
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-chat"

# Security & Compliance Flags
ENABLE_PII_AUTO_MASKING="true"
AUDIT_INTEGRITY_SALT="finguard-ledger-salt-compliance-2026"
```

### 3. Initialize Database Schema and Demo Data
```bash
npm run db:setup
```

### 4. Start Development Server
```bash
npm run dev -p 3003
```

---

## Quality Assurance & Verification

Run strict TypeScript verification:
```bash
npx tsc --noEmit
```

Run test suite:
```bash
npx tsx tests/guardrails.test.ts
```

---

## Future Engineering Roadmap (Next Steps)

1. **Production DeepSeek RAG Embeddings Scaling:**
   - Migrate in-memory policy embeddings to full `pgvector` HNSW indexes for sub-10ms vector similarity lookups on Thailand regulatory legal codes.
2. **Automated STR Export (XML/JSON):**
   - Implement direct export generation for AMLO Suspicious Transaction Reports complying with regulatory submission formats.
3. **Multi-Region Ledger Replication:**
   - Configure multi-region read replicas for cross-border banking operations across ASEAN hubs.
4. **WebSocket Real-Time Feed:**
   - Upgrade HTTP polling feed to WebSockets/Server-Sent Events for zero-latency live transaction streaming across officer dashboards.

---

## License

This project is licensed under the MIT License.

