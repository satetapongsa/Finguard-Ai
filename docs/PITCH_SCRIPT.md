# FinGuard AI — Competition Stage Pitch Script (90-Second & 3-Minute Editions)

> **Core Value Punchline:**  
> **“AI does the analysis. Humans control the decision. Every action is traceable.”**

---

## 1. 3-Minute Full Competition Pitch (Standard Track)

### [0:00 – 0:15] Slide 1: Title & Hook
- **Spoken:**  
  *"Good morning, judges. We are FinGuard AI: an Autonomous Regulatory Intelligence and Policy Mapping Agent engineered for commercial banking. Our mission is to transform complex regulatory changes into actionable, traceable compliance work."*
- **Transition:** *"To see why this is urgent, consider the burden on a commercial bank today."*

---

### [0:15 – 0:35] Slide 2 & 3: The Problem & Strategic Pivot
- **Spoken:**  
  *"Whenever the Bank of Thailand publishes a new circular, compliance teams spend weeks manually reading 40-page PDFs, comparing clause numbers against older frameworks, and searching across hundreds of internal bank policies.  
  Early on, we realized we don't need to replace Core Banking or touch transaction ledgers. The true bottleneck is the regulatory change workflow surrounding the bank. By solving regulatory change management, we eliminate audit lag without risking core banking stability."*
- **Transition:** *"This is why we built FinGuard AI."*

---

### [0:35 – 0:55] Slide 4 & 5: Multi-Agent Architecture (Why Agentic?)
- **Spoken:**  
  *"FinGuard AI is not a generic chatbot or basic RAG tool. It is a multi-agent state machine.  
  Our Watcher Agent securely discovers official circulars. Our Diff Agent classifies clause-level additions and amendments. Our Gap Analysis Agent semantically matches requirements against internal bank policies. And our Dispatcher Agent halts at a mandatory human governance checkpoint before triggering remediation."*
- **Transition:** *"Let's look at a concrete example."*

---

### [0:55 – 1:35] Slide 6 & 7: Real Scenario & The Evidence Triad
- **Spoken:**  
  *"When Bank of Thailand circular **BOT-COMP-001** updated to version 2.0, FinGuard AI instantly detected that **Clause 1.1 doubles mandatory transaction record retention from 12 to 24 months**.  
  The system mapped this change to Internal Policy **P-102 (Compliance Operations)**, identifying a high-risk statutory gap with 96% confidence.  
  Notice our **Evidence Triad**: we display the verbatim regulation, the verbatim internal policy, and the grounded AI reasoning side-by-side. If context is missing, our engine outputs 'Insufficient Evidence' instead of guessing."*
- **Transition:** *"Who decides the final compliance action? The human compliance officer."*

---

### [1:35 – 2:05] Slide 8 & 9: Human-in-the-Loop Governance & Security
- **Spoken:**  
  *"In banking, autonomous AI cannot legally make compliance determinations. FinGuard AI enforces strict governance: the system stops at `WAITING_FOR_HUMAN`.  
  With one click, an authorized Compliance Officer reviews the evidence, edits the action plan, and approves the finding.  
  The Dispatcher Agent issues remediation ticket `CMP-2026-3229` with a 14-day SLA. Everything is sealed into an immutable SHA-256 cryptographic audit chain."*
- **Transition:** *"How do we know this works reliably?"*

---

### [2:05 – 2:35] Slide 10 & 11: Production Stack & Controlled Benchmark
- **Spoken:**  
  *"Built on Next.js 15, Neon PostgreSQL with pgvector, and Prisma ORM, FinGuard AI supports both live LLM reasoning and an offline-first deterministic mode.  
  On our automated evaluation benchmarks, FinGuard AI achieved **100% accuracy in clause diffing and gap mapping**, 100% evidence citation compliance, and zero duplicate tickets across repeated retries."*
- **Transition:** *"Our vision for enterprise scaling..."*

---

### [2:35 – 3:00] Slide 12: Business Impact & Closing
- **Spoken:**  
  *"Our roadmap expands from Bank of Thailand circulars to SEC, AMLO, and enterprise GRC platforms like ServiceNow and Jira.  
  FinGuard AI bridges the gap between regulatory change and bank policy:  
  **AI does the analysis. Humans control the decision. Every action is traceable.**  
  Thank you."*

---

## 2. 90-Second Lightning Pitch (Judge Speed Round)

### [0:00 – 0:15] The Problem
> *"Distinguished judges, commercial banks receive hundreds of regulatory circulars annually. Compliance officers spend weeks reading 40-page legal PDFs and manually searching internal policies to determine what needs to change."*

### [0:15 – 0:35] The Product & Multi-Agent Engine
> *"**FinGuard AI** is the Autonomous Regulatory Intelligence & Policy Mapping Agent for BFSI.  
> It doesn't just summarize text. It runs a 4-agent pipeline: watching official Bank of Thailand circulars, computing clause diffs, semantically retrieving internal bank policies, and presenting a grounded compliance gap matrix."*

### [0:35 – 0:55] Real Scenario & Evidence Triad
> *"When circular **BOT-COMP-001 v2.0** doubled record retention from 12 to 24 months, FinGuard AI instantly flagged that bank policy **P-102** only requires 12 months.  
> Our **Evidence Triad** provides verbatim proof from both documents with zero hallucination.  
> And crucially: **FinGuard AI never auto-approves.** It halts at `WAITING_FOR_HUMAN`."*

### [0:55 – 1:15] Human Governance & Action
> *"The Compliance Officer reviews the evidence and authorizes the finding. The Dispatcher Agent issues remediation ticket `CMP-2026-XXXX` with an SLA due date and records the action in an unbroken SHA-256 cryptographic audit chain."*

### [1:15 – 1:30] Closing Punchline
> *"On our controlled evaluation benchmark, FinGuard AI achieved **100% accuracy in diffing and gap mapping** with zero duplicate dispatches.  
> **AI does the analysis. Humans control the decision. Every action is traceable.**  
> Thank you."*
