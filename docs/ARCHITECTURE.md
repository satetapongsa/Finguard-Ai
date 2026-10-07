# FinGuard AI — Enterprise Architecture & Agentic Workflow

```
                        OFFICIAL REGULATORY SOURCE
                         (Bank of Thailand FIPCS)
                                    │
                                    ▼
                         ┌────────────────────┐
                         │   Watcher Agent    │  ◄── SSRF Guard & Rate Limiter
                         └─────────┬──────────┘
                                   │
                                   ▼
                         ┌────────────────────┐
                         │  Ingestion Agent   │  ◄── SHA-256 Fingerprinting
                         └─────────┬──────────┘
                                   │
                                   ▼
                       DOCUMENT & CLAUSE CHUNKING
                     (Bilingual Thai & English Parser)
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       ┌────────────────────────┐    ┌────────────────────────┐
       │   Versioning & Diff    │    │    Policy Retrieval    │
       │         Agent          │    │   (Semantic pgvector)  │
       └────────────┬───────────┘    └────────────┬───────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                     ┌───────────────────────────┐
                     │ Grounded Gap Analysis     │
                     │          Agent            │
                     └─────────────┬─────────────┘
                                   │
                          EVIDENCE TRIAD MATRIX
                      (Risk Floor & Anti-Hallucination)
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │   Human Compliance Review │  ◄── Status: WAITING_FOR_HUMAN
                     └─────────────┬─────────────┘
                                   │
                           Approved by Officer?
                            /             \
                         YES               NO
                          │                 │
                          ▼                 ▼
                ┌──────────────────┐    STOP / ARCHIVE
                │ Dispatcher Agent │
                └─────────┬────────┘
                          │
                          ▼
             REMEDIATION TICKET (CMP-2026-XXXX)
                          │
                          ▼
             CRYPTOGRAPHIC AUDIT CHAIN (SHA-256)
```

---

## Agent Responsibilities & Technology Matrix

| Agent Name | Primary Responsibility | Key Libraries & Technologies |
| :--- | :--- | :--- |
| **Watcher Agent** | Autonomous discovery of new regulatory circulars. | Node.js Fetch, `ssrf-guard`, AbortController, Vercel Cron. |
| **Ingestion Agent** | PDF parsing, UTF-8 Thai text normalization, SHA-256 hashing. | `bot-parser`, Crypto, Prisma ORM, Neon PostgreSQL. |
| **Diff Agent** | Deterministic clause delta comparison against historical circulars. | `clause-matcher`, Temporal Data Model, ChangeType Enums. |
| **Gap Analysis Agent** | Semantic policy retrieval and grounded evidence reasoning. | `grounded-reasoning`, pgvector / NoneEmbedding fallback. |
| **Dispatcher Agent** | Human-in-the-Loop approval gating and ticket emission. | RBAC Engine, `ticket-builder`, Idempotency Controller. |
