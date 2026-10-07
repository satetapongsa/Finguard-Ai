# FinGuard AI — Demo Execution Modes & Switching Guide

FinGuard AI is engineered with a **triple-redundant execution architecture** to ensure zero-risk presentation under any stage condition, network failure, or external API outage.

---

## 1. Operating Modes Overview

```text
               ┌────────────────────────────────────────────────────────┐
               │              FinGuard AI Runtime Control               │
               └───────────────────────────┬────────────────────────────┘
                                           │
         ┌─────────────────────────────────┼────────────────────────────────┐
         ▼                                 ▼                                ▼
   [Mode A: LIVE]                  [Mode B: HYBRID]                 [Mode C: OFFLINE]
   • Official BOT Portal           • Cached Verified BOT Circular    • Deterministic Synthetic Fixture
   • Live Gemini 1.5 Pro           • Deterministic AI Fallback       • Local Rule Engine (0ms Latency)
   • Live pgvector Embeddings      • Zero External API Risk          • 100% Guaranteed Pitch Replay
```

---

## 2. Mode Specifications

### Mode A — LIVE (Production / Full Integration)
- **Use Case:** High-bandwidth showcase, judge deep-dive on live external data ingestion.
- **Regulatory Source:** Real-time scrape from `https://www.bot.or.th` regulatory announcements portal via SSRF-guarded HTTP client.
- **AI Reasoning:** Live call to Gemini 1.5 Pro via Vercel AI SDK with prompt version `REGULATORY_GAP_PROMPT_V1`.
- **Vector Search:** Live embeddings generated via Google `text-embedding-004` (1536 dim) with cosine similarity in Neon pgvector.
- **Latency:** 1.5s – 3.5s per workflow cycle.
- **Requirements:** Stable Internet connection, valid `AI_API_KEY`.

### Mode B — HYBRID (Recommended Stage Default)
- **Use Case:** Stage pitch under unknown venue Wi-Fi conditions.
- **Regulatory Source:** Stored official BOT circular (`BOT-COMP-001 v2.0`) in Neon database.
- **AI Reasoning:** Deterministic grounded reasoning engine matching exact regulatory clauses.
- **Vector Search:** Clause reference mapping with fallback to exact token overlap.
- **Latency:** < 150 ms response time.
- **Requirements:** Neon database connection (or local PostgreSQL).

### Mode C — OFFLINE (Air-Gapped Failsafe)
- **Use Case:** Total venue Wi-Fi collapse, airplane presentation, or local laptop rehearsal.
- **Regulatory Source:** Pre-seeded local SQLite/Neon snapshot with BOT-COMP-001 v1.0 and v2.0.
- **AI Reasoning:** Fully local deterministic rule engine.
- **Vector Search:** Indexed memory store.
- **Latency:** < 10 ms (instantaneous).
- **Requirements:** Node.js runtime only.

---

## 3. How to Switch Modes

Switching modes takes **less than 10 seconds** and requires only setting environment flags in `.env` (or Vercel dashboard).

### Switching to Mode A (LIVE)
```bash
# In .env:
REGULATORY_SOURCE_MODE=bot
AI_MODE=live
AI_PROVIDER=google
AI_API_KEY=your_actual_gemini_api_key_here
EMBEDDING_MODE=live
EMBEDDING_API_KEY=your_actual_gemini_api_key_here
```

### Switching to Mode B (HYBRID - Recommended)
```bash
# In .env:
REGULATORY_SOURCE_MODE=demo
AI_MODE=deterministic
EMBEDDING_MODE=none
```

### Switching to Mode C (OFFLINE)
```bash
# In .env:
REGULATORY_SOURCE_MODE=demo
AI_MODE=deterministic
EMBEDDING_MODE=none
# Run local offline build:
npm run build
npm start
```

---

## 4. Emergency Decision Tree

If an anomaly occurs during presentation rehearsal or stage setup, follow this decision tree immediately:

```text
Problem: External BOT Portal is slow or down (> 5s)?
  ↳ ACTION: Keep REGULATORY_SOURCE_MODE=demo. Presenter continues seamlessly with BOT-COMP-001 v2.0 cached circular.

Problem: AI API Rate Limit / Quota Exceeded?
  ↳ ACTION: Health endpoint transitions to DEGRADED. System automatically invokes deterministic rule engine without throwing errors.

Problem: Venue Wi-Fi disconnected?
  ↳ ACTION: Switch presenter browser to http://localhost:3000 running local production build.

Problem: Accidental human error in database state during rehearsal?
  ↳ ACTION: Run "npm run demo:reset" (completes in 5 seconds). Restores exactly 3 OPEN gaps, 0 approved, 0 tickets.
```
