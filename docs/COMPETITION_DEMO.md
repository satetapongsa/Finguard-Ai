# FinGuard AI — Competition Demo Runbook (3-Minute Script)

> **Core Value Proposition:**  
> **“AI does the analysis. Humans control the decision. Every action is traceable.”**

---

## Pre-Demo Checklist (30 Seconds Before Demo)
1. Run `npm run demo:reset` to restore the clean judge state:
   - 3 OPEN High-Risk compliance gaps
   - 0 duplicate or pre-approved tickets
   - Clear pristine audit trail
2. Open Browser at: `http://localhost:3000/dashboard`
3. Log in as **Senior Compliance Officer**:
   - Email: `officer@finguard.bank`
   - Password: `Officer@FinGuard2026!`

---

## 3-Minute Presentation Walkthrough

### [0:00 – 0:30] The Banking Problem & Executive Context
- **Speaker:**  
  *"In commercial banking, every time the Bank of Thailand issues a new circular, compliance teams spend weeks manually reading PDFs, comparing clauses against predecessor rules, and hunting down affected internal policies."*
- **Action:**  
  Point to the **FinGuard AI** dashboard showing tracked circulars and active multi-agent pipeline.
- **Narrative:**  
  *"FinGuard AI automates this burden with an Autonomous Regulatory Intelligence Agent workflow — transforming regulatory change into explainable, reviewable, and actionable compliance tasks."*

---

### [0:30 – 1:00] Regulatory Watch & Clause Diff Engine
- **Action:**  
  Click **"Regulatory Watch"** (`/dashboard/regulations`).
- **Showcase:**  
  - **BOT-COMP-001 v2.0** vs **v1.0**
  - **Source Provenance Badge:** Point out the `OFFICIAL BOT` / `SYNTHETIC DEMO` badge and SHA-256 fingerprint.
  - **Side-by-Side Clause Diff Viewer:**
    - `Clause 1.1` [MODIFY]: Record retention requirement doubled.
    - `Clause 1.2` [UNCHANGED]: Governance committee unchanged.
    - `Clause 1.3` [MODIFY]: 24-hour escalation SLA introduced.
    - `Clause 1.5` [ADD]: Brand-new 30-day reporting window.

---

### [1:00 – 1:45] Grounded AI Reasoning & Evidence Triad
- **Action:**  
  Navigate to **"Compliance Gaps"** (`/dashboard/gap-analysis`).
- **Showcase:**  
  Click on the top row: **Clause 1.1 ↔ P-102 (Transaction Record Retention Mismatch)**.
- **Explain the Traceable Evidence Triad Modal:**
  1. **External Regulatory Evidence (BOT):** Highlights enacted requirement (*"retain records for at least 24 months"*).
  2. **Internal Bank Policy Evidence:** Shows current internal standard (*P-102: "retain for at least 12 months"*).
  3. **Grounded AI Reasoning:** Model explains exact discrepancy with 96% calibrated confidence and Zero-Hallucination guarantee (`REGULATORY_GAP_PROMPT_V1`).

---

### [1:45 – 2:15] Human-in-the-Loop Governance & Approval Gate
- **Core Governance Rule:**  
  *"Notice that FinGuard AI NEVER auto-approves or auto-dispatches remediation tickets. The system strictly halts at `WAITING_FOR_HUMAN`."*
- **Action:**  
  1. Add Compliance Officer Note: *"Approved. Expedited update required for Q3 audit."*
  2. Click **"Confirm & Authorize Dispatch"**.
- **Result:**  
  Status transitions instantly from `OPEN` $\rightarrow$ `APPROVED`.

---

### [2:15 – 2:45] Dispatcher Agent & Remediation Ticket Dispatch
- **Showcase:**  
  - System generates operational ticket: `CMP-2026-XXXX`.
  - Target Department: **Compliance Operations**.
  - Priority: **HIGH** (14-day SLA due date).
  - Demonstrates **Idempotent Dispatch**: Re-dispatching the same gap safely returns the existing ticket without creating duplicates.

---

### [2:45 – 3:00] Immutable Cryptographic Audit Chain & Conclusion
- **Action:**  
  Click **"Cryptographic Audit Trail"** (`/audit`).
- **Showcase:**  
  - Live tamper-evident SHA-256 block chain (`GENESIS` $\rightarrow$ `REGULATION_DIFF` $\rightarrow$ `GAP_ANALYSIS` $\rightarrow$ `HUMAN_APPROVAL` $\rightarrow$ `TICKET_DISPATCHED`).
  - Point to unbroken hash integrity indicator (`CHAIN_VALID`).
- **Closing Punchline:**  
  *"FinGuard AI delivers autonomous intelligence without uncontrolled risk: **AI does the analysis. Humans control the decision. Every action is traceable.** Thank you."*
