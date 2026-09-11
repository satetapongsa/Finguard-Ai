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

## 🏛️ System Architecture

```
                                  [ CLIENT LAYER ]
               Next.js 15+ App Router • Tailwind CSS • Lucide • Zustand
                                          │
                                          ▼
                             [ ZERO-TRUST EDGE & RBAC ]
                 NextAuth v5 (JWT) • Ingress Filtering • Role Guards
                                          │
                                          ▼
                            [ PDPA & PII MASKING SHIELD ]
              Deterministic Regex: Thai National ID • Credit Cards • Phones
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
         [ ACID LEDGER ENGINE ]                    [ REGULATORY RAG COPILOT ]
      Double-Entry Balance Checks                 pgvector Policy Retrieval (<=>)
   Prisma Serializable $transaction               Vercel AI SDK Streaming Engine
                    │                                           │
                    └─────────────────────┬─────────────────────┘
                                          ▼
                         [ IMMUTABLE AUDIT STORE (SHA-256) ]
               Non-Repudiation Checksums • Write-Only Sequential Log
```

---

## ⚡ Core Highlights

1. **ACID Double-Entry Ledger Engine**
   - Atomic debit/credit settlement via `prisma.$transaction` using `SERIALIZABLE` isolation.
   - Mathematical overdraft prevention, race condition mitigation, and balance consistency.

2. **PDPA & PII Sanitization Middleware**
   - Automatically redacts sensitive financial identifiers (Thai 13-digit National IDs, 16-digit card PANs, and phone numbers) prior to logging or LLM consumption.

3. **Autonomous Risk & Anomaly Scorer**
   - Sub-second heuristic scoring enforcing Bank of Thailand rules (฿500K THB threshold) and AMLO rules (฿2M THB mandatory reporting, cross-border checks, burst velocity detection).

4. **Vector-Augmented Regulatory RAG (pgvector)**
   - High-dimension policy retrieval against regulatory frameworks (BOT circulars, AMLO directives, FATF Recommendation 16).
   - Real-time token streaming with precise legal citations (`[BOT-NO-12/2566]`, `[AMLO-SEC-2024-01]`).

5. **Cryptographic Tamper-Evident Audit Explorer**
   - Append-only write store calculating deterministic SHA-256 hashes of all payloads for non-repudiation and external regulatory inspection.

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/<your-username>/finguard-ai.git
cd finguard-ai
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your keys:

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

# Push schema to PostgreSQL with pgvector (when database is connected)
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
│   │   ├── globals.css        # BFSI dark theme, glassmorphism & risk styling
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
All demo credentials and test records use non-production, synthetic datasets. Never commit live banking credentials or active private API keys to version control.
