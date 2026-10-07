# FinGuard AI — Competition Pitch Deck

**Digital Innovation Challenge 2026 — BFSI Track**  
*Autonomous Regulatory Intelligence & Policy Mapping Agent*

---

## Slide 1: Title & Hook

### FinGuard AI
**Autonomous Regulatory Intelligence & Policy Mapping Agent for BFSI**

- **Subtitle:** Transforming 3-Week Manual Compliance Cycles into a 5-Minute Traceable Workflow.
- **Presenter:** FinGuard AI Engineering Team
- **Core Mantra:** *“AI does the analysis. Humans control the decision. Every action is traceable.”*
- **Visuals:** High-contrast dark navy branding, glowing multi-agent flow diagram, official BOT source badge.

---

## Slide 2: The BFSI Compliance Nightmare

### The Problem: When Regulations Change, Commercial Banks Freeze

- **The Reality:** The Bank of Thailand (BOT) issues 50+ page regulatory circulars without machine-readable diffs.
- **Manual Burden:** Compliance officers spend **80 to 120 hours** manually comparing circulars line-by-line with internal bank policies.
- **High Stakes:** A single missed clause can trigger up to **5,000,000 THB** in regulatory penalties and systemic operational vulnerability.
- **Key Pain Point:** *“Spreadsheets and disconnected emails cannot handle modern regulatory velocity.”*

---

## Slide 3: The Solution — FinGuard AI

### Autonomous Regulatory Intelligence

```text
Regulatory Change → Detect → Diff → Policy Impact → Grounded Analysis → Human Approval → Action → Audit
```

- **Speed:** From 2–3 weeks of manual reading to **< 5 minutes**.
- **Accuracy:** Granular, clause-level comparison instead of fuzzy document summaries.
- **Enterprise Safety:** Fully isolated multi-agent execution with zero ungrounded hallucinations.

---

## Slide 4: Multi-Agent Architecture

### Five Specialized Agents with Bounded Autonomy

1. **Watcher Agent**: Scans official BOT announcements portal hourly with SSRF protection.
2. **Ingestion Agent**: Normalizes bilingual Thai/English circulars and extracts temporal clause chunks.
3. **Diff Agent**: Computes in-memory clause changes in 1 millisecond.
4. **Gap Analysis Agent**: Maps regulatory mandates to internal bank policies with Evidence Triad grounding.
5. **Dispatcher Agent**: Dispatches approved remediation tasks to internal engineering/ticketing queues.

---

## Slide 5: The Core Innovation — Temporal Graph & Clause Diff

### Moving Beyond Generic Document Summaries

- **Temporal Supersession:** Versioned regulatory nodes (`BOT-COMP-001 v1.0` [REVOKED] → `v2.0` [ACTIVE]).
- **Mathematical Diff Breakdown:**
  - **1 ADD**: Clause 1.5 (Mandatory biometric step-up authentication)
  - **2 MODIFY**: Clause 1.1 (Incident reporting SLA reduced from 24h to 2h) & Clause 1.3 (Suspicious transaction reporting threshold)
  - **2 UNCHANGED**: Clause 1.2 & Clause 1.4
- **Benefit:** Compliance officers see *exact delta clauses*, not 50 pages of unchanged legal text.

---

## Slide 6: Grounded AI Reasoning & Evidence Triad

### Eliminating Hallucinations in High-Stakes Compliance

The Gap Analysis Agent enforces the **Evidence Triad** before any risk claim is generated:

| Triad Element | Concrete Evidence in Scenario |
| :--- | :--- |
| **1. BOT Circular Citation** | *Clause 1.1: "Financial institutions must notify BOT within 2 hours of Sev-1 incidents."* |
| **2. Internal Policy Excerpt** | *Policy P-102 (Compliance Ops): "Current escalation window is 24 hours."* |
| **3. Grounded Deduction** | *Prompt version `REGULATORY_GAP_PROMPT_V1` deduces a 22-hour non-compliance gap.* |

- **Confidence:** 96% | **Risk Floor:** HIGH
- **Safety Fallback:** Returns `INSUFFICIENT_EVIDENCE` if context is incomplete.

---

## Slide 7: Sovereign Human-in-the-Loop & Audit Chain

### AI Recommends. Humans Decide. Cryptography Proves.

- **Human Approval Gate:**
  - Status is locked in `WAITING_FOR_HUMAN (OPEN)`.
  - Dispatcher Agent **strictly refuses** to emit tickets without explicit Compliance Officer sign-off.
- **Cryptographic Audit Log:**
  - Every action (`GAP_APPROVED`, `GAP_DISPATCHED`) is hashed with SHA-256 and chained to previous blocks.
  - Zero-knowledge verifiable audit trail for internal compliance and regulatory inspectors.

---

## Slide 8: Empirical Benchmark & Evaluation

### 100% Verified Accuracy in Controlled Evaluation

| Benchmark Category | Target | Verified Score |
| :--- | :---: | :---: |
| **Clause Diff Classification** | ≥ 95% | **100.0%** (5/5 clauses) |
| **Grounded Policy Gap Mapping** | ≥ 90% | **100.0%** (4/4 mapped) |
| **Evidence Triad Traceability** | 100% | **100.0%** (zero hallucinated citations) |
| **Prompt Injection Defense** | 100% | **100.0%** (adversarial overrides rejected) |
| **Dispatch Idempotency** | 100% | **100.0%** (zero duplicate tickets) |
| **Diff Agent Latency** | < 100 ms | **1 ms** |

---

## Slide 9: Market Opportunity & Business Model

### Commercialization in Thai BFSI & Beyond

- **Target Market:** 17 Commercial Banks, 12 Foreign Bank Branches, and 30+ Non-Bank Financial Institutions licensed by the Bank of Thailand.
- **Business Model:** Enterprise B2B SaaS / On-Premise VPC Deployment.
  - Annual compliance license tier based on monitored regulatory sources and policy inventory size.
  - Value-add integration modules for Jira, ServiceNow, and SAP GRC.
- **Cost Justification:** Saves **~1,200 hours** of senior legal/compliance consulting per institution annually.

---

## Slide 10: Vision & Roadmap

### The Future of Autonomous Regulatory Intelligence

- **Today (v1.0-competition):** Bank of Thailand circulars, temporal diffing, HITL approval, cryptographic audit chain.
- **Q1 2027:** Expand to Securities and Exchange Commission (SEC) Thailand and AMLO.
- **Q2 2027:** Automated policy drafting assistant with direct Word/Confluence redline export.
- **Q3 2027:** Cross-jurisdictional compliance mapping across ASEAN regulatory bodies (MAS Singapore, BNM Malaysia).

---

> **Final Message:** *“AI does the analysis. Humans control the decision. Every action is traceable.”*
