# FinGuard AI — Emergency Backup: Demo Runbook & Failsafe

## 1. Quick Rehearsal Walkthrough

```text
Step 1: Open http://localhost:3000/dashboard
Step 2: Navigate to Regulatory Watch (/dashboard/regulations)
Step 3: Click BOT-COMP-001 v2.0 -> View Clause Diff (1 ADD, 2 MODIFY, 2 UNCHANGED)
Step 4: Navigate to Gap Matrix (/dashboard/gap-analysis) -> Filter Risk: HIGH
Step 5: Click Clause 1.1 ↔ Policy P-102 (Evidence Triad shown, Confidence 96%)
Step 6: Status is WAITING_FOR_HUMAN -> Click "Approve Remediation"
Step 7: Status changes to APPROVED -> Click "Dispatch Remediation"
Step 8: Ticket CMP-2026-3569 generated
Step 9: Navigate to Audit Trail (/audit) -> SHA-256 block hash verified
```

## 2. Emergency Failsafe Decision Tree

| Failure Mode | Immediate Presenter Action |
| :--- | :--- |
| **Wi-Fi drops on stage** | Switch instantly to `http://localhost:3000` (pre-running local dev server). |
| **External AI quota error** | Deterministic rule engine triggers automatically (< 1ms). Say: *"Our dual-engine architecture seamlessly leverages local deterministic rule models when cloud latency spikes."* |
| **Accidental database click** | Run `npm run demo:reset` in 5 seconds to restore 3 open high-risk gaps. |
| **Browser freeze** | Hit `F5` / `Ctrl+R`. Database persists current state seamlessly. |
