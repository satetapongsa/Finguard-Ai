# FinGuard AI — Presenter & Judge Demo Guide

This guide details the step-by-step live demonstration for **FinGuard AI** during judging and stage presentation.

---

## 1. Demo Baseline State

Before commencing the demo, ensure the pristine baseline is loaded:
```bash
npm run demo:reset
```
*Expected Clean State:*
- **2 Regulations**: `BOT-COMP-001 v1.0` (REVOKED) & `v2.0` (ACTIVE)
- **3 Internal Policies**: `P-102` (Ops), `P-205` (AML), `P-310` (Regulatory)
- **3 Open High-Risk Compliance Gaps**:
  - Clause 1.1 ↔ P-102 (Confidence: 96%)
  - Clause 1.3 ↔ P-205 (Confidence: 92%)
  - Clause 1.5 ↔ P-310 (Confidence: 95%)
- **0 Approved Gaps**
- **0 Dispatch Tickets**

---

## 2. 90-Second Speed Run (Stage Pitch Flow)

| Time | Screen / Route | Action & Presenter Voiceover |
| :---: | :--- | :--- |
| **00:00 - 00:15** | `/dashboard` | **The Problem:** *"Every month, commercial banks receive massive circulars from the Bank of Thailand. Reading and mapping them takes weeks. Here on our dashboard, FinGuard AI monitors regulatory health in real time."* |
| **00:15 - 00:30** | `/dashboard/regulations` | **Detection & Diff:** *"The Watcher Agent caught BOT-COMP-001 v2.0 superseding v1.0. Our Diff Agent split the circular into clauses, identifying 1 ADD and 2 MODIFIED clauses instantly."* |
| **00:30 - 00:50** | `/dashboard/gap-analysis` | **Grounded Gap Analysis:** *"The Gap Analysis Agent mapped Clause 1.1 to Internal Policy P-102 at 96% confidence. Notice the Evidence Triad: circular text, policy text, and reasoning. Zero hallucination."* |
| **00:50 - 01:10** | `/dashboard/gap-analysis` (Modal) | **Human-in-the-Loop:** *"The AI cannot act alone. As the Senior Compliance Officer, I review the evidence and click **'Approve Remediation'**. The status transitions to APPROVED."* |
| **01:10 - 01:25** | `/dashboard/gap-analysis` | **Automated Dispatch:** *"Now I click **'Dispatch Remediation'**. The Dispatcher Agent creates ticket `CMP-2026-XXXX` for the operations team. Retrying dispatch is 100% idempotent."* |
| **01:25 - 01:30** | `/audit` | **Immutable Audit:** *"Every single approval and dispatch is permanently recorded in our SHA-256 cryptographic audit chain. AI analyzes. Humans control. Every action is traceable."* |

---

## 3. 3-Minute Comprehensive Run (Judge Deep-Dive Flow)

### Act 1: Autonomous Ingestion & Diff (0:00 - 0:45)
1. Start at `/dashboard`. Explain KPI cards (3 Open Gaps, 9 Chunks, 2 Regulations).
2. Navigate to `/dashboard/regulations`.
3. Open the **Clause Diff Viewer** on `BOT-COMP-001 v2.0`.
4. Point out the color badges:
   - **Green Badge**: Clause 1.5 (`ADD` — Mandatory real-time biometric step-up authentication).
   - **Amber Badge**: Clause 1.1 (`MODIFY` — Incident reporting window reduced from 24h to 2h).
   - **Slate Badge**: Clause 1.2 (`UNCHANGED`).
5. Emphasize: *"This in-memory diff runs in 1 millisecond, eliminating hours of manual legal comparison."*

### Act 2: Grounded Reasoning & The Evidence Triad (0:45 - 1:30)
1. Navigate to `/dashboard/gap-analysis`.
2. Filter by `Risk: HIGH`.
3. Click on **Clause 1.1 ↔ P-102 (Compliance Operations)**.
4. Open the **Evidence Triad Panel**:
   - **Evidence 1 (BOT Circular)**: *"Financial institutions shall notify BOT within 2 hours of Sev-1 cyber incident detection."*
   - **Evidence 2 (Bank Policy P-102)**: *"Current SLA states escalation within 24 hours."*
   - **Evidence 3 (Grounded AI Reasoning)**: Versioned prompt `REGULATORY_GAP_PROMPT_V1` calculated a 22-hour non-compliance gap.
5. Emphasize: *"If either the circular or the policy is missing, our engine outputs `INSUFFICIENT_EVIDENCE`. We never guess."*

### Act 3: Sovereign Human Approval & Ticket Dispatch (1:30 - 2:20)
1. Point to status: `WAITING_FOR_HUMAN (OPEN)`.
2. Attempt to explain RBAC: *"Auditors can view; only Compliance Officers can approve."*
3. Click **"Approve Remediation"**. Status changes immediately to `APPROVED`.
4. Click **"Dispatch Remediation"**.
5. Show the generated ticket:
   - System Target: `CORE_BANKING_INCIDENT_SYSTEM`
   - Ticket Reference: `CMP-2026-XXXX`
   - Action Item: *Update Policy P-102 section 4.1 to mandate 2-hour notification SLA.*

### Act 4: Cryptographic Audit Trail & Benchmark Proof (2:20 - 3:00)
1. Navigate to `/audit`.
2. Inspect the latest block:
   - Event: `GAP_APPROVED` & `GAP_DISPATCHED`
   - Actor: `officer@finguard.bank`
   - Hash: Deterministic SHA-256 digest linking back to the genesis block.
3. Conclude with Benchmark slide:
   - 100% diff classification, 100% gap mapping, 100% prompt injection resistance.
4. Final sentence: *"FinGuard AI bridges the gap between regulatory mandates and bank execution safely, securely, and verifiably."*
