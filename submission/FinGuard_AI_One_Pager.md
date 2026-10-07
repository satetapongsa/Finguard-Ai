# FinGuard AI — Project One-Pager

**Autonomous Regulatory Intelligence & Policy Mapping Agent for Banking**  
*Digital Innovation Challenge 2026 — BFSI Track*

---

### WHO
**FinGuard AI** — Built by regulatory intelligence and full-stack AI engineers to modernize compliance operations across the Thai banking and financial services sector (BFSI).

### WHAT
An **Autonomous Multi-Agent Regulatory Intelligence Platform** that ingests Bank of Thailand (BOT) circulars, computes clause-by-clause diffs against prior regulations, maps required changes to internal bank policies, and prepares operational remediation tickets.

### WHY
Regulatory updates are published as complex, 50+ page legal circulars. Compliance officers spend **80–120 hours** manually comparing clauses against internal policies. A single overlooked clause exposes the bank to regulatory penalties up to **5,000,000 THB** and systemic operational vulnerability.

### HOW
A coordinated **5-Agent Workflow**:
1. **Watcher Agent**: Scans official BOT sources hourly via automated cron.
2. **Ingestion Agent**: Normalizes bilingual text and constructs versioned clause chunks.
3. **Diff Agent**: Compares revisions mathematically (1 ADD, 2 MODIFY, 2 UNCHANGED).
4. **Gap Analysis Agent**: Maps impacts to internal policies using grounded Evidence Triads.
5. **Dispatcher Agent**: Dispatches approved remediation tasks to internal tracking systems.

### PROOF
Validated through a rigorous **Automated Evaluation Benchmark**:
- **100%** Clause Diff Classification Accuracy (5/5 clauses)
- **100%** Grounded Policy Mapping Accuracy (4/4 policies)
- **100%** Evidence Triad Verification (zero hallucinations)
- **100%** Adversarial Prompt Injection Defense
- **100%** Dispatch Idempotency (zero duplicate tickets)
- **1 ms** Diff Computation Latency

### GOVERNANCE
**Human-in-the-Loop Sovereign Gate**: The AI agent cannot dispatch remediation tickets or modify production policy autonomously. The Senior Compliance Officer must inspect the Evidence Triad and authorize approval. Every approval and dispatch is permanently recorded in a **SHA-256 cryptographic audit chain**.

---

> **Mantra:** *AI does the analysis. Humans control the decision. Every action is traceable.*
