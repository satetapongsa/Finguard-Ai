# FinGuard AI — Pitch & Scoring Rubric Mapping Matrix

This document establishes the direct cross-reference between competition judging dimensions, slide numbers in `docs/SLIDE_DECK_SPEC.md`, live dashboard demo actions, and underlying source evidence.

---

## 1. Judging Rubric Alignment Matrix

| Judging Dimension | Target Score Focus | Slide Ref | Live Demo Moment | Source Code & Evidence |
| :--- | :--- | :---: | :--- | :--- |
| **1. Innovation & Agentic AI Depth** | Multi-agent orchestration, state machines, and temporal RAG beyond basic text chat. | **Slide 4 & 5** | Navigate to `/dashboard/agents` $\rightarrow$ Show 4 active agent pipelines & status badges. | `src/lib/agents/`, `src/lib/agents/orchestration/regulatory-workflow.ts` |
| **2. Technical Feasibility & Architecture** | Deployable stack, production build, low-latency execution, pgvector similarity search. | **Slide 10** | Show production build status, sub-millisecond benchmark results, and system health `/api/health`. | `package.json`, `tests/evaluation/benchmark.test.ts`, `/api/health` |
| **3. Safety, Security & Governance** | Anti-hallucination Evidence Triad, mandatory Human-in-the-Loop gating, RBAC, auditability. | **Slide 7, 8 & 9** | Open Evidence Triad modal on Clause 1.1 $\rightarrow$ Show `WAITING_FOR_HUMAN` gate $\rightarrow$ Approve $\rightarrow$ Show `/audit` block chain. | `src/lib/agents/gap-analysis/grounded-reasoning.ts`, `src/lib/security/` |
| **4. Problem Relevance & Business Impact** | Solving regulatory lag in commercial banking without risky Core Banking interference. | **Slide 2, 3 & 6** | Show `Why This Matters` executive summary card on `/dashboard` $\rightarrow$ Show 12m to 24m policy gap on P-102. | `src/app/dashboard/page.tsx`, `docs/PRESENTATION_DATA.md` |
| **5. Live Execution & Presentation Quality** | Seamless demo flow, defensible empirical numbers, zero crashes, robust disaster recovery. | **Slide 1, 11 & 12** | Complete 3-minute uninterrupted flow $\rightarrow$ Execute 3-second database reset (`npm run demo:reset`). | `docs/COMPETITION_DEMO.md`, `docs/DEMO_FAILSAFE.md` |

---

## 2. Judge Question to Slide Cross-Reference

| Common Judge Question | Recommended Slide | Key Visual / Proof Point | Spoken Response Time |
| :--- | :---: | :--- | :---: |
| **"Why is this Agentic AI rather than just RAG?"** | **Slide 5** | 7-step stateful action pipeline vs 3-step stateless RAG comparison table. | < 30s |
| **"Why not connect directly to Core Banking?"** | **Slide 3** | Scope refinement diagram: Regulatory governance surrounding the ledger. | < 25s |
| **"How do you prevent hallucinations?"** | **Slide 7** | Evidence Triad card (verbatim regulation + verbatim internal policy citation). | < 25s |
| **"What if the AI makes an illegal decision?"** | **Slide 8** | `WAITING_FOR_HUMAN` visual gate: AI proposes, human compliance officer authorizes. | < 20s |
| **"What happens if the internet / BOT site fails?"** | **Slide 10** | Offline deterministic fallback mode (`REGULATORY_SOURCE_MODE=demo`). | < 20s |
| **"How do you prove records haven't been tampered with?"** | **Slide 9** | Cryptographic SHA-256 blockchain audit trail with instant mismatch detection. | < 25s |
| **"Where is the empirical proof that this works?"** | **Slide 11** | Controlled Evaluation Benchmark stats (100% diff, 100% gap mapping, 0 duplicates). | < 20s |
| **"What is your commercialization roadmap?"** | **Slide 12** | 3-phase expansion horizon from BOT to SEC/AMLO and enterprise GRC tools. | < 30s |
