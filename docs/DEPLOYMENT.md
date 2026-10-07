# FinGuard AI — Deployment Specification & Status

## 1. System Metadata & Release Lock

| Field | Value |
| :--- | :--- |
| **System Name** | **FinGuard AI** — Autonomous Regulatory Intelligence & Policy Mapping Agent |
| **Release Version** | `v1.0.1-competition` |
| **Git Commit Reference** | `b2280b3` (Post-Phase 7 verified tag lock) |
| **Repository** | `https://github.com/satetapongsa/Finguard-Ai.git` |
| **Primary Branch** | `main` |
| **Release Date** | October 2026 |
| **Track / Event** | Digital Innovation Challenge 2026 — BFSI Track |

---

## 2. Infrastructure Architecture

| Layer | Provider / Architecture | SLA / Tier |
| :--- | :--- | :--- |
| **Frontend & API Edge** | **Vercel** (Next.js 15 App Router Edge/Node Runtime) | Serverless, Global Anycast CDN, Automated TLS |
| **Database Cluster** | **Neon Serverless PostgreSQL** (`ap-southeast-1` AWS Singapore) | Auto-scaling vCPU, PgBouncer Connection Pooler |
| **Vector Engine** | PostgreSQL `pgvector` Extension (1536 dimensions) | Native HNSW / IVFFlat Indexing |
| **AI Reasoning** | Vercel AI SDK + Google Gemini 1.5 Pro / Deterministic Fallback Engine | Multi-model provider adapter with automatic fallback |
| **Automated Scheduler** | Vercel Cron (`/api/watcher/cron`) | Scheduled hourly regulatory scans |

---

## 3. Deployment Endpoints

| Resource | URL / Route | Access Policy |
| :--- | :--- | :--- |
| **Production Application** | `https://finguard-ai.vercel.app` (or verified localhost preview) | Public HTTPS (RBAC enforced internally) |
| **Health Check API** | `https://finguard-ai.vercel.app/api/health` | Public GET (returns JSON subsystem status) |
| **Regulatory Cron Job** | `https://finguard-ai.vercel.app/api/watcher/cron` | Bearer Token protected (`Authorization: Bearer <CRON_SECRET>`) |
| **NextAuth Endpoint** | `https://finguard-ai.vercel.app/api/auth/[...nextauth]` | Standard session exchange |

---

## 4. Subsystem Health Check Contract (`/api/health`)

The health endpoint provides real-time status of all critical dependencies. An optional AI provider degradation gracefully downgrades the system without breaking core navigation or human-in-the-loop workflows.

```json
{
  "status": "HEALTHY",
  "uptimeSeconds": 1215.96,
  "timestamp": "2026-10-07T06:10:50.051Z",
  "totalLatencyMs": 194,
  "checks": {
    "database": {
      "status": "HEALTHY",
      "latencyMs": 194
    },
    "aiReasoning": {
      "status": "HEALTHY",
      "details": {
        "provider": "deterministic",
        "model": "deterministic-rule-engine-v1",
        "mode": "deterministic"
      }
    },
    "vectorEmbeddings": {
      "status": "HEALTHY",
      "details": {
        "provider": "none",
        "dimension": 1536,
        "mode": "none"
      }
    },
    "regulatorySource": {
      "status": "HEALTHY",
      "details": {
        "mode": "demo",
        "botEndpoint": "https://www.bot.or.th"
      }
    }
  }
}
```

### Status Thresholds:
- **`HEALTHY`**: Database connection query (`SELECT 1`) succeeds, active reasoning engine ready.
- **`DEGRADED`**: External AI API key missing in live mode; deterministic fallback active.
- **`UNAVAILABLE`**: Database unreachable (HTTP 503 returned).

---

## 5. Security & Safety Checklist

- [x] **Zero Hardcoded Secrets**: Scanned source code, YAML configs, and tests.
- [x] **Production Reset Guard**: `prisma/seed.ts` aborts execution if `NODE_ENV === "production"` unless `ALLOW_DEMO_RESET=true` is explicitly provided.
- [x] **SSRF Protection**: `src/lib/security/ssrf-guard.ts` blocks all loopback, local subnet (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`), and non-HTTPS protocols.
- [x] **Server-Side RBAC**: Actions verify session and user role (`ADMIN`, `COMPLIANCE_OFFICER`, `AUDITOR`) before executing mutations.
- [x] **Cryptographic Audit Log**: Every remediation approval and ticket dispatch is signed with a SHA-256 hash linked to previous block hashes.
