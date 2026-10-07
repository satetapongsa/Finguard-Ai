# FinGuard AI — Master Presentation Architecture & Navigation Guide

This document defines the complete operational layout for the live competition pitch, linking the **12-Slide Deck**, the **Live Dashboard Demo**, the **Evaluation Benchmark Data**, and the **Disaster Recovery Failsafe Tree**.

---

## 1. Master Pitch Architecture Map

```
┌────────────────────────────────────────────────────────────────────────┐
│                        12-SLIDE COMPETITION DECK                       │
│                        (docs/SLIDE_DECK_SPEC.md)                       │
├────────────────────────────────┬───────────────────────────────────────┤
│ [Slide 1-3] Problem & Context  │ [Slide 4-6] Solution & Real Scenario  │
│  - Problem: Manual 40p PDF lag │  - 4-Agent Orchestration Engine       │
│  - Insight: Non-intrusive Reg  │  - BOT-COMP-001 v2.0 (1.1, 1.3, 1.5)  │
├────────────────────────────────┼───────────────────────────────────────┤
│ [Slide 7-9] Trust & Governance │ [Slide 10-12] Tech, Proof & Roadmap   │
│  - Evidence Triad (Verbatim)   │  - Stack: Next.js 15, pgvector, Neon  │
│  - WAITING_FOR_HUMAN Gate      │  - Benchmark: 100% on Controlled Set  │
│  - SHA-256 Audit Blockchain    │  - Value: Actionable Compliance       │
└────────────────────────────────┴───────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          LIVE DASHBOARD DEMO                           │
│                      (docs/COMPETITION_DEMO.md)                        │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. Regulatory Watch Feed       │ 2. Compliance Gap Matrix              │
│    `/dashboard/regulations`    │    `/dashboard/gap-analysis`          │
│    - Shows BOT v1.0 vs v2.0    │    - 3 High-Risk Gaps (P-102, P-205)  │
│    - Clause 1.1: 12m -> 24m    │    - Evidence Triad Modal             │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. Human Approval Gate         │ 4. Cryptographic Audit Chain          │
│    - Status: WAITING_FOR_HUMAN │    `/audit`                           │
│    - Officer confirms & notes  │    - Block chain: GENESIS -> DISPATCH │
│    - Ticket CMP-2026-XXXX      │    - Validation status: CHAIN_VALID   │
└────────────────────────────────┴───────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    DISASTER RECOVERY & FAILSAFE TREE                   │
│                        (docs/DEMO_FAILSAFE.md)                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Mode A: Competition Offline    │ Instant Database Reset (< 3 sec):     │
│   `REGULATORY_SOURCE_MODE=demo`│   `npm run demo:reset`                │
│   `AI_MODE=deterministic`      │   - Restores 3 clean OPEN gaps        │
│   - 100% offline self-contained│   - Wipes duplicate tickets           │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. Fast Navigation Index for Presenters

### Scenario 1: Standard 3-Minute Presentation
1. **Slides 1–5 (0:00–1:00):** Problem, Insight, Solution, Agentic Workflow.
2. **Switch to Live Browser (1:00–2:30):**
   - Show `/dashboard` (Executive "Why This Matters" card).
   - Click `/dashboard/gap-analysis` $\rightarrow$ Open Clause 1.1 $\leftrightarrow$ P-102 Evidence Triad.
   - Click **"Confirm & Authorize Dispatch"** $\rightarrow$ Ticket `CMP-2026-XXXX` created.
   - Click `/audit` $\rightarrow$ Show SHA-256 block chain.
3. **Switch to Slides 11–12 (2:30–3:00):** Benchmark metrics & Closing Statement.

### Scenario 2: 90-Second Speed Round (Slides Only + Quick Demo Moment)
1. **Slide 1–2 (0:00–0:20):** Hook & Banking Problem.
2. **Slide 4 & 6 (0:20–0:50):** 4 Agents & BOT-COMP-001 (12m $\rightarrow$ 24m on P-102).
3. **Slide 7–8 (0:50–1:15):** Evidence Triad & `WAITING_FOR_HUMAN` Governance Gate.
4. **Slide 11–12 (1:15–1:30):** Benchmark proof & Closing punchline.

---

## 3. Data & Entity Consistency Reference
All presentation artifacts are mathematically synchronized with the application seed:
- **Circular Code:** `BOT-COMP-001 v2.0` (Active) superseding `v1.0` (Revoked).
- **Clause Diffs:** `1 ADD` (Clause 1.5), `2 MODIFY` (Clause 1.1 & 1.3), `2 UNCHANGED` (Clause 1.2 & 1.4).
- **Internal Policies:**
  - `P-102` (Compliance Operations) $\leftrightarrow$ Clause 1.1 (Retention 12m vs 24m) — **HIGH Risk, 96% Confidence**.
  - `P-205` (AML & Compliance) $\leftrightarrow$ Clause 1.3 (24-Hour SLA) — **HIGH Risk, 92% Confidence**.
  - `P-310` (Regulatory Affairs) $\leftrightarrow$ Clause 1.5 (30-Day Reporting) — **HIGH Risk, 95% Confidence**.
- **Benchmark Evaluation Result:** **100%** on controlled test suite, 0 duplicate dispatches, 0 prompt injection breaches.
