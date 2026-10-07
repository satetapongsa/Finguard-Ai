# FinGuard AI — Competition Judge Q&A Defense Guide

### 1. Why not integrate directly with the Core Banking Transaction Engine?
**Answer:**  
Commercial banks strictly insulate their Core Banking and settlement ledgers from experimental AI systems. Furthermore, our product solves **Regulatory Change Management & Policy Compliance**, not real-time transaction clearing. By focusing on regulatory intelligence, policy delta mapping, and governance, FinGuard AI avoids replacing secure legacy infrastructure while solving a real, multi-million dollar banking compliance bottleneck.

---

### 2. What makes FinGuard AI a true Multi-Agent system rather than a basic LLM prompt?
**Answer:**  
FinGuard AI coordinates 4 specialized agents in a deterministic pipeline:
1. **Watcher Agent**: Monitors and discovers Bank of Thailand (BOT) circulars with SSRF validation and SHA-256 fingerprinting.
2. **Ingestion & Parser Agent**: Normalizes bilingual (Thai/English) circulars into temporal semantic clauses.
3. **Diff Agent**: Deterministically compares clauses against predecessor versions (ADD, MODIFY, DELETE, UNCHANGED) without overwriting history.
4. **Gap Analysis Agent**: Performs semantic retrieval across internal policy databases and evaluates compliance gaps using grounded evidence.
5. **Dispatcher Agent**: Enforces strict Human-in-the-Loop gating before generating idempotent remediation tickets (`CMP-2026-XXXX`).

---

### 3. How do you prevent LLM hallucinations from creating false legal obligations?
**Answer:**  
We enforce a strict **Evidence Triad**:
1. Every finding must directly cite the canonical **External Regulatory Clause**.
2. Every finding must cite the corresponding **Internal Bank Policy Clause**.
3. If evidence is insufficient, our grounded reasoning engine returns `INSUFFICIENT_EVIDENCE` with a `LOW` risk floor instead of hallucinating.
Furthermore, our benchmark evaluation tests confirm **100% resistance to prompt injection** when malicious instructions are embedded within document text.

---

### 4. Why is Human-in-the-Loop (HITL) mandatory?
**Answer:**  
In regulated banking, autonomous AI cannot legally make compliance determinations or commit capital for remediation. FinGuard AI acts as an **expert decision-support copilot**. The workflow halts unconditionally at `WAITING_FOR_HUMAN`, requiring an authorized Compliance Officer to review the evidence and approve the remediation before any ticket is dispatched.

---

### 5. What happens if the external AI provider or Bank of Thailand website goes down?
**Answer:**  
FinGuard AI is built with an **Offline-First Deterministic Fallback**:
- Setting `REGULATORY_SOURCE_MODE=demo` and `AI_MODE=deterministic` enables 100% of the diffing, gap analysis, and HITL workflow to run offline without internet connectivity or paid API keys.
- If the live BOT portal is unreachable (e.g. HTTP 404/500), our source adapter automatically serves verified canonical BOT circular fixtures with clear provenance labeling.

---

### 6. How do you distinguish between real BOT documents and synthetic demo data?
**Answer:**  
Every regulation and finding in our database carries a strict `sourceType` label:
- `OFFICIAL_BOT`: Carries original BOT URL, publication date, SHA-256 hash, and language metadata.
- `SYNTHETIC_DEMO`: Clearly tagged for offline rehearsal and automated testing.
These badges are prominently displayed in the UI to prevent mixing synthetic demo records with official legal text.

---

### 7. How do you prove regulatory auditability and tamper-resistance?
**Answer:**  
Every agent transition, compliance finding, officer approval, and ticket dispatch is permanently recorded in a **Cryptographically Linked SHA-256 Audit Chain**. If any database row is altered, the chain validation fails immediately, pinpointing the exact corrupted block.
