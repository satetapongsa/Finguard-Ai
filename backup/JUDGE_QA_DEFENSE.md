# FinGuard AI — Emergency Backup: Judge Q&A & Objection Handling

## 1. Top Judge Objections & Battle-Tested Answers

### Objection 1: "Why don't you let AI automatically update the bank's internal policy?"
**Answer Sequence:**
1. *Business Problem:* Regulatory interpretation in banking carries statutory liability and severe operational consequences.
2. *Design Choice:* We deliberately bounded autonomy to discovery, clause comparison, and risk mapping.
3. *Technical Mechanism:* The Dispatcher Agent strictly validates `status === "APPROVED"` at the database layer before creating tickets.
4. *Governance:* The Compliance Officer retains sovereign decision authority; the audit trail records their digital signature.

---

### Objection 2: "How do you guarantee the LLM isn't hallucinating compliance gaps?"
**Answer Sequence:**
1. *Business Problem:* Hallucinations in compliance can cause false positives (wasted engineering hours) or fatal false negatives (fines).
2. *Design Choice:* We enforce the Evidence Triad Contract.
3. *Technical Mechanism:* Grounded prompt `REGULATORY_GAP_PROMPT_V1` requires verbatim circular chunks and policy text. If context is missing, the system outputs `INSUFFICIENT_EVIDENCE`.
4. *Governance:* In our automated benchmark of adversarial injections, this grounded architecture achieved 100% defense.

---

### Objection 3: "What if the Bank of Thailand website changes its layout or blocks your scraper?"
**Answer Sequence:**
1. *Business Problem:* Commercial banking software cannot fail due to external web layout changes.
2. *Design Choice:* Triple-redundant architecture (Live BOT Adapter, Hybrid cached store, and Offline deterministic engine).
3. *Technical Mechanism:* If the live crawler encounters a 403 or non-standard HTML, the system logs a degraded warning and seamlessly serves verified cached circulars with SHA-256 fingerprint validation.
4. *Governance:* No broken UI states; zero presenter panic.

---

### Objection 4: "How do you make money with this?"
**Answer Sequence:**
1. *Business Problem:* Banks currently pay millions of THB annually to Big-4 compliance consultants for manual regulatory mapping.
2. *Design Choice:* B2B Enterprise SaaS / VPC deployment for financial institutions.
3. *Technical Mechanism:* Tiered annual subscription based on monitored regulatory feeds (BOT, SEC, AMLO) and internal policy document volume.
4. *Governance:* Clear ROI: cuts 80–120 hours of manual review down to 5 minutes per circular.
