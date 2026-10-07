# FinGuard AI — Presentation Day Operations Runbook

This runbook defines exact operating procedures for the competition presentation day.

---

## 1. Before Leaving Home Checklist

- [ ] **Laptop Power**: Main presentation laptop charged to 100%. Power adapter packed in bag.
- [ ] **Backup Laptop**: Secondary laptop loaded with local Git clone and pre-seeded database.
- [ ] **Display Adapters**: USB-C to HDMI, USB-C to DisplayPort, and standard HDMI cables packed.
- [ ] **Presentation Remote / Mouse**: Dedicated wireless clicker/mouse with fresh batteries.
- [ ] **Air-Gapped Backup**: USB drive containing:
  - `FinGuard_AI_Pitch_Deck.pdf`
  - `submission/` package
  - `backup/` emergency folder
- [ ] **Personal Hotspot**: Smartphone hotspot configured and verified on presentation laptop.
- [ ] **Local Build Running**: Verify `http://localhost:3000` is active and responding locally without Wi-Fi.

---

## 2. 30 Minutes Before Stage Checklist

1. **Power & Network**:
   - Plug laptop into mains power.
   - Connect to presentation Wi-Fi or enable personal hotspot.
2. **Close Unrelated Applications**:
   - Close Slack, Discord, WhatsApp, Telegram, Outlook, Mail, Teams.
   - Turn on Windows **"Do Not Disturb / Focus Assist"** to block all banner popups.
3. **Run Demo Reset**:
   ```bash
   npm run demo:reset
   ```
   *Verify output: 3 OPEN Gaps, 0 Approved, 0 Tickets.*
4. **Browser Setup**:
   - Open presentation browser (Chrome or Edge) in full-screen window.
   - Tab 1: Slide Deck (Slide 1 ready in full-screen presentation mode).
   - Tab 2: `http://localhost:3000/dashboard` (or live production URL).
   - Tab 3: `http://localhost:3000/dashboard/gap-analysis`.
   - Tab 4: `http://localhost:3000/audit`.
5. **Hide Developer Tools**:
   - Close Developer Console / DevTools (F12).
   - Minimize or hide all terminal windows into the background.

---

## 3. On-Stage Performance Rules

| DO | DO NOT |
| :--- | :--- |
| **Speak to the business problem** first. | Never start by explaining Next.js or Prisma. |
| **Point to the UI** and highlight the visual state. | Never open a terminal window on stage. |
| **Click "Approve" and "Dispatch"** naturally. | Never use Prisma Studio, curl, or SQL on stage. |
| **Emphasize Human-in-the-Loop**. | Never claim AI autonomously modifies production banking policies. |
| **Maintain steady, deliberate pace**. | Never rush or speak over audience comprehension. |

---

## 4. Presentation Emergency Protocol

> **ABSOLUTE EMERGENCY RULE:** If something breaks during the live presentation, **DO NOT ATTEMPT LIVE ENGINEERING REPAIR ON STAGE**. Never open a terminal, debug a stack trace, or run database commands in front of the judges.

If an anomaly occurs:
1. **Network Drops?**
   - Seamlessly click to Tab 2 on `localhost:3000` (pre-running local production server). Continue speaking without mentioning network issues.
2. **Live AI API Times Out?**
   - The deterministic fallback handles it silently (< 1ms). If asked, highlight: *"Our architecture includes deterministic fallback to ensure zero downtime under high regulatory loads."*
3. **Accidental Wrong Click?**
   - Click back to `/dashboard` or `/dashboard/gap-analysis` via the primary navigation sidebar.
4. **Browser Tab Freezes?**
   - Refresh the page (Ctrl + R). The page will re-hydrate from database state in under 500ms.

---

## 5. Judge Q&A Answering Principles

### The 4-Step Response Framework
When asked any technical or architectural question by judges, always answer using this sequence:

```text
1. Business Problem   → What operational risk or banking reality requires this?
2. Design Choice      → Why did we architect it this way instead of a naive approach?
3. Technical Engine   → What specific mechanism enforces this (SSRF, pgvector, prompt version)?
4. Governance         → How does the human retain ultimate control and auditability?
```

### Example Defense 1: "Why not let AI automatically update the bank's internal policy?"
> *"Because in banking, regulatory interpretation carries legal liability and severe operational consequences. We deliberately architected FinGuard AI so that AI handles what it excels at—high-volume clause diffing and grounded risk extraction—while the Senior Compliance Officer retains sovereign decision authority. The system only dispatches remediation tickets after explicit cryptographic sign-off."*

### Example Defense 2: "How do you prevent hallucinations in compliance decisions?"
> *"We enforce the Evidence Triad. The Gap Analysis Agent cannot output an ungrounded risk claim. Every finding must cite the exact clause chunk from the official Bank of Thailand circular, excerpt the bank's internal policy, and attach prompt version `REGULATORY_GAP_PROMPT_V1`. In our automated benchmark of adversarial injections, this grounded architecture maintained a 100% defense score."*

### Example Defense 3: "What is your commercialization strategy?"
> *"FinGuard AI is designed as a B2B enterprise SaaS / on-premise compliance solution for Tier-1 and Tier-2 financial institutions. Future commercial models would combine annual licensing based on regulatory source volume, document throughput, and multi-entity policy mappings. Our competition prototype validates the end-to-end technical feasibility and compliance workflow."*
