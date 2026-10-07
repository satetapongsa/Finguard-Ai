# FinGuard AI — Final Environment Matrix

This document provides the definitive configuration matrix across all operating modes for **FinGuard AI** (Autonomous Regulatory Intelligence & Policy Mapping Agent for BFSI).

---

## 1. Operating Modes Summary

FinGuard AI supports three formal operational profiles designed for zero-failure competition presentation, secure enterprise deployment, and deterministic offline evaluation.

| Setting / Variable | Local Demo (Mode C) | Live Competition (Mode A) | Production Deployment |
| :--- | :--- | :--- | :--- |
| **`REGULATORY_SOURCE_MODE`** | `demo` | `bot` | `bot` (with fallback) |
| **`AI_MODE`** | `deterministic` | `live` | `live` (with fallback) |
| **`EMBEDDING_MODE`** | `none` | `live` | `live` |
| **Network Dependency** | Zero (fully offline) | BOT portal + AI API | High availability |
| **Latency SLA** | < 10 ms | 1,200 – 3,500 ms | < 2,500 ms |
| **Deterministic Replay** | 100% Guaranteed | Subject to live model | Guardrail bounded |

---

## 2. Comprehensive Environment Variable Specification

Every configuration key used by FinGuard AI is classified below by scope, sensitivity, and required fallback behavior.

> **CRITICAL SECURITY RULE:** Real credentials must NEVER be checked into Git. Use `.env.example` as a template and provide real values only via secure environment managers (e.g., Vercel Project Settings, AWS Secrets Manager).

### Database Configuration

| Name | Required? | Server-Only? | Secret? | Purpose | Example Placeholder |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | Yes | **Yes** | Connection string for Neon Serverless PostgreSQL with pooling (`pgbouncer=true`) and SSL | `postgresql://user:pass@ep-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | No | Yes | **Yes** | Direct connection string for Prisma migrations bypassing PgBouncer | `postgresql://user:pass@ep-direct.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |

### Authentication & IAM Configuration

| Name | Required? | Server-Only? | Secret? | Purpose | Example Placeholder |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `AUTH_SECRET` | **Yes** | Yes | **Yes** | NextAuth.js v5 cryptographic session signing and JWT encryption key (min 32 bytes) | `finguard_auth_secret_32_bytes_random_hex` |
| `NEXTAUTH_SECRET` | No | Yes | **Yes** | Legacy NextAuth v4 compatibility key | `finguard_auth_secret_32_bytes_random_hex` |
| `NEXTAUTH_URL` | **Yes** | Yes | No | Canonical origin URL for authentication callbacks | `https://finguard-ai.vercel.app` or `http://localhost:3000` |

### Regulatory Source Configuration

| Name | Required? | Server-Only? | Secret? | Purpose | Example Placeholder |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `REGULATORY_SOURCE_MODE` | No | Yes | No | Ingestion source mode: `demo` (local fixtures) or `bot` (official BOT announcements) | `demo` (default) or `bot` |
| `BOT_SOURCE_URL` | No | Yes | No | Official Bank of Thailand regulatory announcements base URL | `https://www.bot.or.th` |
| `CRON_SECRET` | No | Yes | **Yes** | Bearer token authenticating Vercel Cron invocations to `/api/watcher/cron` | `sec_cron_token_random_hash_2026` |

### AI Reasoning Engine Configuration

| Name | Required? | Server-Only? | Secret? | Purpose | Example Placeholder |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `AI_MODE` | No | Yes | No | AI Reasoning mode: `deterministic` (rule-based fallback) or `live` (Vercel AI SDK) | `deterministic` (default) or `live` |
| `AI_PROVIDER` | No | Yes | No | AI model vendor when `AI_MODE=live` (`google` or `openai`) | `google` |
| `AI_API_KEY` | Optional | Yes | **Yes** | API key for Gemini 1.5 Pro / GPT-4o grounded gap reasoning | `AIzaSy_demo_placeholder_key_not_real` |

### Vector Embeddings & Semantic Search

| Name | Required? | Server-Only? | Secret? | Purpose | Example Placeholder |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `EMBEDDING_MODE` | No | Yes | No | Embedding mode: `none` (clause reference matching) or `live` (pgvector cosine similarity) | `none` (default) or `live` |
| `EMBEDDING_API_KEY` | Optional | Yes | **Yes** | API key for `text-embedding-004` (1536 dim) | `placeholder_embedding_key_not_real` |

### Safety & Operational Guards

| Name | Required? | Server-Only? | Secret? | Purpose | Example Placeholder |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | Yes | No | Execution environment (`development`, `production`, `test`) | `production` |
| `ALLOW_DEMO_RESET` | No | Yes | No | Safety override allowing `prisma/seed.ts` to execute in production | `false` (default) |
| `LOG_LEVEL` | No | Yes | No | Application logging verbosity (`error`, `warn`, `info`, `debug`) | `info` |

---

## 3. Environment Profile Templates

### A. Local Demo Profile (`.env.local`)
```env
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=demo_local_secret_key_32_characters_minimum_length
DATABASE_URL=postgresql://user:pass@ep-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
REGULATORY_SOURCE_MODE=demo
AI_MODE=deterministic
EMBEDDING_MODE=none
ALLOW_DEMO_RESET=true
```

### B. Live Competition Profile (`.env.competition`)
```env
NODE_ENV=production
NEXTAUTH_URL=https://finguard-ai.vercel.app
AUTH_SECRET=prod_competition_secure_random_token_32_bytes
DATABASE_URL=postgresql://user:pass@ep-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
REGULATORY_SOURCE_MODE=bot
AI_MODE=live
AI_PROVIDER=google
AI_API_KEY=<SECURE_KEY_FROM_SECRET_MANAGER>
EMBEDDING_MODE=live
EMBEDDING_API_KEY=<SECURE_KEY_FROM_SECRET_MANAGER>
ALLOW_DEMO_RESET=false
```

### C. Enterprise Production Profile (`.env.production`)
```env
NODE_ENV=production
NEXTAUTH_URL=https://compliance.finguard.bank
AUTH_SECRET=<KMS_MANAGED_SECRET>
DATABASE_URL=postgresql://finguard_app:pass@neon-cluster.internal:5432/finguard_prod?sslmode=verify-full
REGULATORY_SOURCE_MODE=bot
BOT_SOURCE_URL=https://www.bot.or.th
CRON_SECRET=<SECURE_CRON_BEARER_TOKEN>
AI_MODE=live
AI_PROVIDER=google
AI_API_KEY=<VAULT_MANAGED_KEY>
EMBEDDING_MODE=live
EMBEDDING_API_KEY=<VAULT_MANAGED_KEY>
ALLOW_DEMO_RESET=false
LOG_LEVEL=info
```
