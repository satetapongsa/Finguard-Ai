# FinGuard AI — Master Pitch Deck Specification (12 Core Slides)

> **Design System Palette:**  
> Primary Background: `#0f172a` (Dark Slate / Navy) | Accent: `#0ea5e9` (Cyan / Sky) | Secondary Accent: `#10b981` (Emerald) | Risk Accent: `#f43f5e` (Rose / Amber) | Text: `#ffffff` & `#94a3b8`

---

## Slide 1: Title & Opening Hook
- **Slide Number:** 1
- **Title:** FinGuard AI
- **Subtitle:** Autonomous Regulatory Intelligence & Policy Mapping Agent
- **Objective:** Establish the identity, category, and core value proposition in under 10 seconds.
- **Main Message:** *Turn regulatory change into actionable compliance.*
- **Visual Layout:**
  - Dark enterprise navy background with subtle glowing cyan grid.
  - Centered bold title `FinGuard AI`.
  - Simple 3-step high-level arrow visual: `Regulatory Change` $\rightarrow$ `AI Analysis` $\rightarrow$ `Traceable Action`.
  - Badges: `BFSI RegTech Innovation` | `Bank of Thailand Framework`.
- **Data & Metrics:** Nil (Brand & positioning focus).
- **Time Allocation:** 10 Seconds (3-min pitch) / 15 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"Good morning, judges. We are FinGuard AI: an Autonomous Regulatory Intelligence and Policy Mapping Agent built for the banking sector. Our mission is simple: to transform complex regulatory changes into traceable, actionable compliance workflows."*
- **Transition:** *"To understand why this is urgent, let's look at what happens inside a commercial bank today."*
- **Source Verification:** `README.md`, `docs/PRESENTATION_DATA.md`.

---

## Slide 2: The Problem Space
- **Slide Number:** 2
- **Title:** Regulation Changes. Internal Policy Doesn't Automatically Keep Up.
- **Objective:** Clearly articulate the operational pain and regulatory risk of manual compliance workflows.
- **Main Message:** Manual regulatory tracking across hundreds of internal policies is slow, fragmented, and exposes banks to severe compliance penalties.
- **Visual Layout:**
  - Left column: The Fragile Manual Chain (Download PDF $\rightarrow$ Read 40+ Pages $\rightarrow$ Compare Versions $\rightarrow$ Search Policy DB $\rightarrow$ Email Teams $\rightarrow$ Manual Tickets).
  - Right column: Key Friction Points highlighted with warning accents:
    - ⏱️ **Weeks of Latency** per new circular.
    - 🧩 **Fragmented Governance** between legal, operations, and IT.
    - ⚠️ **Audit Exposure** and statutory fines under Banking Act Section 11.
- **Data & Metrics:** Qualitative operational friction (No invented market statistics).
- **Time Allocation:** 20 Seconds (3-min pitch) / 30 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"Every time the Bank of Thailand releases a new circular, compliance teams face a manual marathon: downloading 40-page PDFs, manually comparing clause numbers, and scouring hundreds of internal policies. This manual lag leaves institutions vulnerable to non-compliance penalties."*
- **Transition:** *"When we first analyzed this problem, we made a crucial architectural discovery."*
- **Source Verification:** `docs/COMPETITION_REQUIREMENTS.md`.

---

## Slide 3: The Insight & Strategic Pivot
- **Slide Number:** 3
- **Title:** We Don't Need to Replace Core Banking.
- **Objective:** Justify why refining scope away from Core Banking replacement into Regulatory Intelligence creates maximum enterprise value and feasibility.
- **Main Message:** The greatest value is not inside the transactional engine, but in the regulatory governance workflow surrounding it.
- **Visual Layout:**
  - Left Panel (De-emphasized with strikethrough border):  
    *Legacy Pivot Scope:* `Core Banking Replacement` | `Transaction Blocking` | `Mule Detection`. (Label: *High-risk, intrusive, rejected by enterprise banks*).
  - Right Panel (Highlighted with Cyan Glow):  
    *FinGuard AI Scope:* `Regulatory Change Management` $\rightarrow$ `Policy Impact Mapping` $\rightarrow$ `Human-Governed Action`. (Label: *Non-intrusive, zero core banking friction, rapid adoption*).
- **Data & Metrics:** Scope refinement rationale.
- **Time Allocation:** 15 Seconds (3-min pitch) / 25 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"Earlier in development, we realized commercial banks will never allow experimental AI to tamper directly with core banking transaction ledgers. The real bottleneck is the regulatory change workflow surrounding the bank. By focusing strictly on compliance intelligence and policy impact, we solve a multi-million dollar problem without touching core infrastructure."*
- **Transition:** *"This insight led to the creation of FinGuard AI."*
- **Source Verification:** `docs/JUDGE_OBJECTIONS.md` (Q2).

---

## Slide 4: The Solution
- **Slide Number:** 4
- **Title:** Meet FinGuard AI
- **Objective:** Introduce the 4-agent autonomous pipeline and its end-to-end workflow.
- **Main Message:** A governed multi-agent architecture that automates detection, diffing, policy mapping, and remediation.
- **Visual Layout:**
  - Horizontal 4-Stage Agent Node Pipeline:
    1. 📡 **Watcher & Ingestion Agent:** Monitors BOT portal with SSRF validation and SHA-256 fingerprinting.
    2. 🔍 **Versioning & Diff Agent:** Calculates clause-level deltas against historical regulations.
    3. 🧠 **Gap Analysis Agent:** Semantically retrieves internal policies and reasons on compliance gaps.
    4. 🎫 **Dispatcher Agent:** Enforces Human-in-the-Loop gating before emitting remediation tickets.
- **Data & Metrics:** 4 Specialized Agents, 1 Governed Pipeline.
- **Time Allocation:** 20 Seconds (3-min pitch) / 30 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"FinGuard AI coordinates four specialized agents: a Watcher that ingests official BOT circulars, a Diff Agent that classifies clause changes, a Gap Analysis Agent that maps impacts to internal policies, and a Dispatcher that issues remediation tickets only after human authorization."*
- **Transition:** *"Now, judges often ask: 'Why is this Agentic AI rather than just another ChatGPT prompt?'"*
- **Source Verification:** `src/lib/agents/`, `docs/ARCHITECTURE.md`.

---

## Slide 5: Why This Is Agentic AI
- **Slide Number:** 5
- **Title:** Not Just RAG. A Multi-Step Compliance Workflow.
- **Objective:** Clearly differentiate multi-agent state machines from basic conversational RAG.
- **Main Message:** FinGuard AI executes stateful actions across a compliance lifecycle, not just text summarization.
- **Visual Layout:**
  - Two-Column Comparison Table:
    - **Typical RAG:** Query $\rightarrow$ Retrieve $\rightarrow$ Summarize Text (Stateless, no governance, prone to hallucinations).
    - **FinGuard Agentic Workflow:** Ingest $\rightarrow$ Version Diff $\rightarrow$ Policy Retrieval $\rightarrow$ Grounded Impact $\rightarrow$ **WAIT FOR HUMAN** $\rightarrow$ Dispatch Ticket $\rightarrow$ Immutable Audit Chain.
  - Callout Banner: *"The difference is not retrieval. The difference is stateful action under human governance."*
- **Data & Metrics:** 7-step stateful pipeline.
- **Time Allocation:** 20 Seconds (3-min pitch) / 30 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"Basic RAG simply retrieves and summarizes text. FinGuard AI is an agentic workflow: it maintains temporal version state, matches clause hierarchies, halts at mandatory human checkpoints, and generates idempotent remediation tasks with cryptographic auditability."*
- **Transition:** *"Let's see this in action with a real Bank of Thailand regulatory change."*
- **Source Verification:** `docs/JUDGE_OBJECTIONS.md` (Q1), `tests/evaluation/benchmark.test.ts`.

---

## Slide 6: The Real Banking Scenario
- **Slide Number:** 6
- **Title:** One Regulatory Change. Three Compliance Impacts.
- **Objective:** Walk through the concrete verified example matching the live application.
- **Main Message:** FinGuard AI pinpointed 3 high-risk gaps when Bank of Thailand circular BOT-COMP-001 updated from v1.0 to v2.0.
- **Visual Layout:**
  - Center Visual: Circular delta mapped to bank policies:
    - **Clause 1.1 [MODIFY]:** Retention doubled (*12m $\rightarrow$ 24m*) $\longrightarrow$ Impacts **P-102 (Compliance Operations)** [HIGH RISK, 96% Conf]
    - **Clause 1.3 [MODIFY]:** 24-Hour Escalation SLA enacted $\longrightarrow$ Impacts **P-205 (AML & Compliance)** [HIGH RISK, 92% Conf]
    - **Clause 1.5 [ADD]:** New 30-Day BOT Reporting window $\longrightarrow$ Impacts **P-310 (Regulatory Affairs)** [HIGH RISK, 95% Conf]
    - **Clause 1.2 [UNCHANGED]:** Governance committee text preserved $\longrightarrow$ Compliant.
- **Data & Metrics:** 1 ADD, 2 MODIFY, 2 UNCHANGED, 3 High-Risk Gaps identified.
- **Time Allocation:** 30 Seconds (3-min pitch) / 45 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"Here is our benchmark circular: BOT-COMP-001 v2.0. Clause 1.1 doubles record retention from 12 to 24 months. FinGuard AI instantly flagged that Internal Policy P-102 only requires 12 months—exposing the bank to statutory sanctions. Clauses 1.3 and 1.5 were similarly mapped to AML and Regulatory Affairs policies with zero manual cross-referencing."*
- **Transition:** *"How can compliance officers trust the AI's reasoning? Through the Evidence Triad."*
- **Source Verification:** Database Seed (`prisma/seed.ts`), `tests/agents.test.ts`.

---

## Slide 7: Grounded AI & Trust
- **Slide Number:** 7
- **Title:** Every AI Finding Is Evidence-Linked.
- **Objective:** Showcase the Evidence Triad as the core anti-hallucination defense.
- **Main Message:** Reasoning is strictly constrained to supplied regulatory and internal evidence; unsupported claims default safely to INSUFFICIENT_EVIDENCE.
- **Visual Layout:**
  - Three Interlocking Cards (The Evidence Triad):
    1. 🏛️ **External Regulatory Evidence:** Verbatim excerpt from BOT circular (*"retain records for at least 24 months"*).
    2. 🏢 **Internal Bank Policy Evidence:** Verbatim excerpt from Policy P-102 (*"retained for 12 months"*).
    3. ⚖️ **Grounded Impact Analysis:** Reasoning explains exact discrepancy with 96% evidence-backed confidence and recommended action.
  - Sub-banner: `Zero Unsupported Claims` | `Explicit INSUFFICIENT_EVIDENCE Fallback` | `Strict Prompt Injection Resistance`.
- **Data & Metrics:** 100% Evidence Triad compliance on evaluation benchmarks.
- **Time Allocation:** 20 Seconds (3-min pitch) / 30 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"We eliminate hallucinations with the Evidence Triad: every finding must present verbatim evidence from both the regulatory circular and the internal bank policy. If evidence is lacking, our reasoning engine explicitly returns 'Insufficient Evidence' rather than fabricating a legal obligation."*
- **Transition:** *"Even with high confidence, who has the final say? The human officer."*
- **Source Verification:** `src/lib/agents/gap-analysis/grounded-reasoning.ts`, `docs/BENCHMARK.md`.

---

## Slide 8: Human-in-the-Loop Governance
- **Slide Number:** 8
- **Title:** AI Does the Analysis. Humans Control the Decision.
- **Objective:** Position Human-in-the-Loop not as a limitation, but as an essential enterprise risk control.
- **Main Message:** The workflow halts unconditionally at WAITING_FOR_HUMAN; no remediation ticket is ever issued without digital compliance authorization.
- **Visual Layout:**
  - Large Visual Gate: `AI Analysis Complete` $\rightarrow$ 🛑 **`WAITING_FOR_HUMAN`** $\rightarrow$ `Officer Approval` $\rightarrow$ `Ticket Issued`.
  - Officer Review Card: Shows editable remediation notes, role-based authorization check (`COMPLIANCE_OFFICER` required, `AUDITOR` read-only), and one-click authorization.
- **Data & Metrics:** 0 Unauthorized Dispatches, 0 Dispatches while status is OPEN.
- **Time Allocation:** 20 Seconds (3-min pitch) / 30 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"In regulated banking, autonomous AI cannot legally make compliance determinations. FinGuard AI enforces strict governance: the system stops at 'Waiting for Human'. Only an authorized Compliance Officer can review the evidence, adjust remediation actions, and approve the dispatch."*
- **Transition:** *"Once approved, how is the operational action executed and secured?"*
- **Source Verification:** `src/components/GapMatrixTable.tsx`, `src/lib/security/rbac.ts`.

---

## Slide 9: Security, RBAC & Audit Trail
- **Slide Number:** 9
- **Title:** Built for Regulated Banking Environments
- **Objective:** Reassure risk and security judges regarding data protection, SSRF protection, and auditability.
- **Main Message:** Multi-layered defense incorporating server-side RBAC, SSRF domain allowlisting, and cryptographic SHA-256 blockchain logging.
- **Visual Layout:**
  - 4 Enterprise Pillars:
    - 🛡️ **Server-Side RBAC:** Enforces strict role boundaries (`COMPLIANCE_OFFICER` vs `AUDITOR` read-only).
    - 🌐 **SSRF Guard:** Strict allowlist restricts document ingestion to official BOT hostnames (`bot.or.th`).
    - 🏷️ **Source Provenance:** Clear distinction between `OFFICIAL_BOT` and `SYNTHETIC_DEMO`.
    - ⛓️ **Cryptographic Audit Chain:** Tamper-evident SHA-256 block chain (`GENESIS` $\rightarrow$ `DIFF` $\rightarrow$ `GAP` $\rightarrow$ `APPROVAL` $\rightarrow$ `DISPATCH`).
- **Data & Metrics:** 100% Tamper Detection Accuracy, 0 Client-Side Secrets.
- **Time Allocation:** 15 Seconds (3-min pitch) / 25 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"Our architecture is built for zero-trust banking: Server-side RBAC blocks unauthorized actions, SSRF guards prevent external data leakage, and every single event is sealed in an unbroken SHA-256 cryptographic audit trail."*
- **Transition:** *"Let's review the technical engine powering FinGuard AI."*
- **Source Verification:** `docs/SECURITY.md`, `src/lib/security/`.

---

## Slide 10: Technical Architecture & Stack
- **Slide Number:** 10
- **Title:** Production-Grade Technical Foundation
- **Objective:** Prove engineering rigor, modern full-stack implementation, and cloud deployment readiness.
- **Main Message:** Built with Next.js 15, Prisma v6, Neon PostgreSQL with pgvector, and multi-mode AI providers.
- **Visual Layout:**
  - Clean Layered Stack Diagram:
    - **Presentation:** Next.js 15 App Router, React 19, Tailwind CSS.
    - **Orchestration & Security:** Server Actions, NextAuth v5, SSRF Guard, Audit Logger.
    - **Intelligence Layer:** Grounded Deterministic Engine + DeepSeek / OpenAI LLM abstraction, Vector(1536) embedding guard.
    - **Data Layer:** Neon Serverless PostgreSQL with `pgvector` indexing.
- **Data & Metrics:** Production build verified (`Compiled in 5.7s`, 17/17 routes static/dynamic).
- **Time Allocation:** 15 Seconds (3-min pitch) / 25 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"FinGuard AI is built on Next.js 15, Neon Serverless PostgreSQL with pgvector, and Prisma ORM. It supports both live LLM reasoning via DeepSeek/OpenAI and a 100% offline deterministic fallback, guaranteeing zero points of failure during operations."*
- **Transition:** *"All of these capabilities have been rigorously tested on our benchmark evaluation suite."*
- **Source Verification:** `package.json`, `next.config.ts`, `docs/ARCHITECTURE.md`.

---

## Slide 11: Controlled Benchmark & Engineering Proof
- **Slide Number:** 11
- **Title:** Controlled Evaluation Benchmark
- **Objective:** Present empirical evidence of accuracy, safety, and performance.
- **Main Message:** 100% accuracy on controlled evaluation datasets across diffing, gap mapping, evidence citation, and prompt injection defense.
- **Visual Layout:**
  - 4 Prominent Stat Badges (with explicit *Controlled Evaluation Benchmark* sub-label):
    - **100%** — Clause Diff Classification Accuracy (5/5 changes classified).
    - **100%** — Grounded Gap Mapping & Risk Floor Calibration (4/4 test cases).
    - **100%** — Evidence Triad Citation Compliance.
    - **100% PASS** — Adversarial Prompt Injection Defense.
    - **0 Duplicates** — Dispatch Idempotency across repeated retry tests.
    - **< 1 ms** — Processing latency per clause comparison.
- **Data & Metrics:** Measured results from `tests/evaluation/benchmark.test.ts`.
- **Time Allocation:** 15 Seconds (3-min pitch) / 25 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"On our automated evaluation benchmarks, FinGuard AI achieved 100% accuracy in clause diffing and policy mapping, 100% compliance in evidence citation, zero duplicate tickets across repeated dispatches, and successfully resisted adversarial prompt injections embedded in policy text."*
- **Transition:** *"Where does FinGuard AI go from here?"*
- **Source Verification:** `docs/BENCHMARK.md`, `tests/evaluation/benchmark.test.ts`.

---

## Slide 12: Business Impact & Strategic Roadmap
- **Slide Number:** 12
- **Title:** From Regulatory Change to Actionable Compliance.
- **Objective:** Present the enterprise commercialization hypothesis and future integration roadmap.
- **Main Message:** Scaling from Bank of Thailand circulars to a multi-regulator enterprise compliance hub.
- **Visual Layout:**
  - 3-Phase Horizon Roadmap:
    - **Phase 1 (Current / Prototype):** Bank of Thailand FIPCS Circulars + Temporal Clause Diff + pgvector Policy Mapping.
    - **Phase 2 (Next Horizon):** Multi-Regulator Ingestion (SEC, AMLO, PDPA) + Enterprise GRC Connectors (Jira, ServiceNow).
    - **Phase 3 (Enterprise Scale):** Real-time automated policy drafting assistance & cross-border regulatory harmonization.
  - Final Value Banner:  
    **“AI does the analysis. Humans control the decision. Every action is traceable.”**
- **Data & Metrics:** B2B Enterprise SaaS hypothesis (Per institution / volume of regulatory streams).
- **Time Allocation:** 25 Seconds (3-min pitch) / 40 Seconds (5-min pitch).
- **Speaker Notes:**  
  *"Our roadmap expands from Bank of Thailand circulars to SEC, AMLO, and international regulators, integrating seamlessly with enterprise GRC tools like ServiceNow and Jira. FinGuard AI turns regulatory change into actionable compliance: AI does the analysis, humans control the decision, and every action is traceable. Thank you."*
- **Transition:** *End of presentation $\rightarrow$ Ready for Judge Q&A.*
- **Source Verification:** `docs/PRESENTATION_DATA.md`, `README.md`.
