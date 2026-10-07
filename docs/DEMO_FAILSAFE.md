# FinGuard AI — Stage Demo Failsafe & Disaster Recovery Runbook

## Failsafe Decision Tree During Live Judging

```text
               LIVE DEMO STARTED
                       │
       Is External BOT Website Reachable?
              /                 \
            YES                  NO
             │                    │
        Use Live Mode     Adapter automatically falls back
        (Official BOT)    to verified canonical BOT fixtures
             │                    │
             └──────────┬─────────┘
                        │
             Is AI Provider Available?
              /                 \
            YES                  NO
             │                    │
        Live LLM          Deterministic Engine takes over
        Inference         (zero hallucination, identical output)
             │                    │
             └──────────┬─────────┘
                        │
             Is Neon Database Reachable?
              /                 \
            YES                  NO
             │                    │
        Live Neon         Restore demo seed via:
        Connection        `npm run demo:reset`
             │                    │
             └──────────┬─────────┘
                        │
           DEMO PROCEEDS WITH 100% CERTAINTY
```

---

## 3 Operating Modes & How to Switch

### Mode A: Competition Offline (Default & 100% Safe)
- **Environment:**
  ```env
  REGULATORY_SOURCE_MODE="demo"
  AI_MODE="deterministic"
  EMBEDDING_MODE="none"
  ```
- **Behavior:** 100% self-contained. Full synthetic diffing, 3 high-risk gaps, human approval gate, ticket dispatch, and cryptographic audit chain run locally without internet or external API keys.

### Mode B: Hybrid Live AI
- **Environment:**
  ```env
  REGULATORY_SOURCE_MODE="demo"
  AI_MODE="live"
  AI_API_KEY="your-deepseek-or-openai-key"
  ```
- **Behavior:** Uses canonical regulatory fixtures with live LLM reasoning.

### Mode C: Full Production Live
- **Environment:**
  ```env
  REGULATORY_SOURCE_MODE="bot"
  AI_MODE="live"
  EMBEDDING_MODE="live"
  ```
- **Behavior:** Direct HTTPS queries against `bot.or.th` with live pgvector similarity search.

---

## Instant Recovery Checklist (< 10 Seconds)
If the database state is ever corrupted during practice:
```bash
npm run demo:reset
```
This restores all 3 OPEN high-risk gaps, resets tickets, and establishes a pristine audit trail in under 3 seconds.
