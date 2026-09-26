# FinGuard AI - Autonomous Financial Compliance and Transaction Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-Serverless%20Postgres-00E599?style=flat&logo=postgresql)](https://neon.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-gray.svg)](https://opensource.org/licenses/MIT)

FinGuard AI is an enterprise financial compliance and transaction intelligence platform engineered for the Banking, Financial Services, and Insurance (BFSI) sector. The system provides real-time transaction monitoring, double-entry ACID ledger consistency, automated regulatory compliance checks, Personal Data Protection Act (PDPA) data masking, and cryptographic tamper-evident audit trails.

---

## Executive Summary

The platform addresses regulatory compliance, fraud mitigation, and auditability requirements mandated by:
- Bank of Thailand (BOT) Electronic Fund Transfer Directives
- Anti-Money Laundering Office (AMLO) Suspicious Transaction Reporting (STR) Standards
- Personal Data Protection Act (PDPA B.E. 2562) Sensitive Data Masking Provisions
- Financial Action Task Force (FATF) Recommendation 16 (Travel Rule)

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
        UI_COPILOT["Compliance Copilot Interface\n(Regulatory RAG & Policy Inspector)"]:::client
        UI_AUDIT["Cryptographic Audit Explorer\n(SHA-256 Chain Verification)"]:::client
        STATE_STORE["State Management\n(Zustand + Optimized Route Prefetching)"]:::client
    end

    subgraph L2 ["2. Security Perimeter and Edge Gateway"]
        EDGE_ROUTER["Next.js Edge Middleware\n(Strict Security Headers & CSP)"]:::edge
        AUTH_RBAC["Role-Based Access Control (RBAC)\n(Admin / Compliance Officer / Auditor)"]:::edge
        PDPA_SHIELD["PDPA Data Redaction Interceptor\n(Regex Masking: Thai Citizen ID, PAN, Mobile, Email)"]:::security
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
- Zero-drift balance tracking across multiple accounts (Central Liquidity Treasury, Regional FX Settlement Hub, Siam Logistics, Escrow Pool, and Flagged Accounts).

### 2. Neon Serverless PostgreSQL Integration
- Dual-connection configuration:
  - `DATABASE_URL`: Utilizes Neon PgBouncer connection pooler for serverless and Edge runtime scalability.
  - `DIRECT_URL`: Dedicated direct endpoint for schema migrations and introspection.
- Automatic fallback to an in-memory simulation ledger if database configuration is absent.

### 3. Real-Time PDPA and PII Guardrail
- Intercepts and masks sensitive personal identifiers before persistence or transmission:
  - Thai National Citizen ID (13 digits formatted and continuous): `1-XXXX-XXXXX-XX-9`
  - Payment Card Primary Account Numbers (16-digit PAN): `****-****-****-1234`
  - Thai Mobile Phone Numbers: `081-XXX-5678`
  - Email Addresses: `c****************r@finguard.bank`

### 4. Autonomous Compliance and Risk Engine
- Continuous transaction evaluation against statutory thresholds:
  - Bank of Thailand Threshold: Transactions exceeding 500,000 THB trigger elevated review.
  - AMLO Mandatory Reporting Threshold: Transactions equal to or exceeding 2,000,000 THB generate mandatory Suspicious Transaction Reports (STR).
  - Velocity Anomaly Detection: Flags burst transfer activity (3 or more transactions within 5 minutes) and 24-hour cumulative structuring volumes.

### 5. Cryptographic Linked-List Audit Chain
- Write-once, read-only audit log modeled after blockchain hash chains.
- Each audit entry computes a deterministic SHA-256 digest:
  `entryHash = SHA256(previousHash + payloadHash + actionType + targetResource + resourceId + timestamp)`
- An integrity verification endpoint (`GET /api/audit/verify`) detects any modification or deletion across historic blocks.

### 6. High-Performance User Experience
- Built-in Next.js route prefetching (`prefetch={true}`) ensures zero-latency page transitions.
- Interactive transaction inspector drawer displaying double-entry balance breakdown, risk score meters, and masked metadata.
- Optimized CSS with hardware-accelerated micro-interactions and smooth mobile navigation dock.

---

## Regulatory Framework Coverage

| Regulatory Authority | Regulation Code | Description | Automated Guardrail |
| :--- | :--- | :--- | :--- |
| Bank of Thailand (BOT) | BOT-NO-12/2566 | High-Value Electronic Fund Transfers | Flag transfers greater than 500,000 THB |
| Anti-Money Laundering Office (AMLO) | AMLO-SEC-2024-01 | Mandatory Suspicious Transaction Reporting | Mandatory STR on transfers 2,000,000 THB or greater |
| AMLO & Law Enforcement | BOT-FRAUD-2567 | Mule Account (Banchee Ma) Containment | Immediate block on transactions involving blacklisted accounts |
| Office of the PDPA Commission | PDPA-SEC-2562 | Sensitive Customer Identifier Redaction | Real-time masking of Citizen IDs, PANs, and contact details |
| Financial Action Task Force (FATF) | FATF-REC-16 | Wire Transfer Cross-Border Travel Rule | Complete originator and beneficiary counterparty verification |

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
# Database: Neon Serverless PostgreSQL
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-XYZ-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-XYZ.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="finguard_super_secret_jwt_key_compliance_2026_min_32_chars!"

# AI Model Inference (Optional)
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Security & Compliance Flags
ENABLE_PII_AUTO_MASKING="true"
AUDIT_INTEGRITY_SALT="finguard-ledger-salt-compliance-2026"
```

### 3. Initialize Database Schema and Demo Data
Execute database push and seeding in one command:
```bash
npm run db:setup
```

This command runs `prisma db push` and executes the seed script to create initial financial accounts, regulatory policies, and initial transaction records.

### 4. Start Development Server
```bash
npm run dev
```

Access the application in your browser at: `http://localhost:3000`

---

## Verification and Quality Assurance

Run the comprehensive unit and integration test suite:
```bash
npx tsx tests/guardrails.test.ts
```

Run strict TypeScript type checks:
```bash
npx tsc --noEmit
```

Run production build validation:
```bash
npm run build
```

---

## API Reference

### Transactions API
- `GET /api/transactions`
  Retrieves settled transaction ledger records with optional query parameters (`limit`, `status`, `sourceAccountId`).
- `POST /api/transactions`
  Executes an ACID double-entry transaction. Automatically runs risk scoring, PDPA redaction, and SHA-256 audit logging.

### Accounts API
- `GET /api/accounts`
  Returns current financial accounts with active balances, status, and currency codes.

### Audit Explorer API
- `GET /api/audit`
  Retrieves immutable audit trail blocks.
- `GET /api/audit/verify`
  Validates cryptographic integrity of the SHA-256 linked-list chain and identifies tampered blocks.

### Database Health API
- `GET /api/database/status`
  Returns real-time connection status, database latency (ms), and connection provider information.

---

## Project Structure

```
finguard-ai/
|-- prisma/
|   |-- schema.prisma             # Database schema with pgvector and double-entry models
|   `-- seed.ts                   # Database seeder for accounts, policies, and ledger
|-- src/
|   |-- app/
|   |   |-- actions/              # Server Actions for transactions and audit verification
|   |   |-- api/                  # Edge and Node.js REST API routes
|   |   |   |-- accounts/         # Financial accounts endpoint
|   |   |   |-- audit/            # Audit query and cryptographic verification endpoints
|   |   |   |-- compliance/       # Regulatory RAG analysis endpoint
|   |   |   |-- database/status/  # Neon database status endpoint
|   |   |   |-- policies/         # Regulatory policy catalog endpoint
|   |   |   |-- stats/            # Dashboard KPI aggregation endpoint
|   |   |   `-- transactions/     # Double-entry transaction settlement endpoint
|   |   |-- audit/                # Immutable Audit Explorer UI
|   |   |-- compliance/           # Compliance Copilot UI
|   |   |-- dashboard/            # Executive Dashboard and Ledger UI
|   |   |-- globals.css           # Global typography and design tokens
|   |   `-- layout.tsx            # Root application layout
|   |-- components/
|   |   |-- Navigation.tsx        # Navigation bar and responsive mobile dock
|   |   `-- QuickTransferModal.tsx# Scenario transfer simulator with double-entry preview
|   |-- lib/
|   |   |-- ledger/               # Simulation store and ledger interfaces
|   |   |-- prisma.ts             # Prisma client singleton
|   |   |-- rag/                  # Regulatory vector retrieval and embeddings
|   |   |-- risk/                 # Velocity, AMLO, and BOT risk engine
|   |   |-- security/             # PDPA masking and SHA-256 cryptographic chain utilities
|   |   `-- types.ts              # Domain interfaces and type definitions
|   |-- middleware.ts             # Edge security headers and RBAC middleware
|   `-- store/                    # Zustand client state stores
|-- tests/
|   `-- guardrails.test.ts        # Comprehensive security, ledger, and hash test suite
|-- .env.example                  # Environment configuration template
|-- package.json
|-- README.md
`-- tsconfig.json
```

---

## Security and Privacy Notice

All demonstration datasets, financial accounts, and counterparty records provided in this repository are synthetic and designed exclusively for testing and compliance demonstration purposes. Live banking credentials, operational secrets, and production keys must never be committed to source control.

---

## License

This project is licensed under the MIT License.
