# FinGuard AI — Presentation Architecture Diagram

```
                              OFFICIAL SOURCE
                     Bank of Thailand Circular Catalog
                        (FIPCS / Orders & Notices)
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │    Watcher Agent    │
                          │  SSRF Guard / HTTPS │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   Ingestion Agent   │
                          │ PDF / Thai Normalizer│
                          └──────────┬──────────┘
                                     │
                     TEMPORAL REGULATORY DATA MODEL
                     (PostgreSQL + pgvector Extension)
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
          ┌─────────────────────┐         ┌─────────────────────┐
          │     Diff Agent      │         │   Policy Retrieval  │
          │ Clause Delta Match  │         │  pgvector / Hybrid  │
          │(ADD/MOD/DEL/UNCHANG)│         │(P-102, P-205, P-310)│
          └──────────┬──────────┘         └──────────┬──────────┘
                     │                               │
                     └───────────────┬───────────────┘
                                     ▼
                          ┌─────────────────────┐
                          │ Gap Analysis Agent  │
                          │ Grounded Reasoning  │
                          │   Evidence Triad    │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  Human Compliance   │  ◄── STRICT GATE:
                          │    Review Queue     │      WAITING_FOR_HUMAN
                          └──────────┬──────────┘
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
              REMEDIATION ACTION TICKET (CMP-2026-XXXX)
                            │
                            ▼
              CRYPTOGRAPHIC SHA-256 AUDIT LOG CHAIN
```

---

## Subsystem Stack & Boundaries

| Subsystem | Core Technologies | Primary Function |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 15, React 19, Tailwind CSS, Lucide Icons | Responsive Dark BFSI Compliance Dashboard & Evidence Modals. |
| **API & Server Actions** | Next.js Server Actions, NextAuth v5 | Authoritative server-side RBAC and workflow triggering. |
| **Multi-Agent Pipeline** | TypeScript Strict Mode, AbortController, Crypto | Watcher, Ingestion, Diff, Gap Analysis, Dispatcher orchestration. |
| **Database & Vectors** | Neon Serverless PostgreSQL with pgvector, Prisma ORM | Temporal regulation storage, chunking, and similarity ranking. |
| **Security Layer** | SSRF Validator, PDPA PII Masking, SHA-256 Audit Chain | Zero-trust input sanitization and tamper-evident blockchain logging. |
