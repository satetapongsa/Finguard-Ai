================================================================================
                    FINGUARD AI — COMPETITION SUBMISSION README                 
================================================================================
Event:     Digital Innovation Challenge 2026 — BFSI Track
Project:   FinGuard AI (Autonomous Regulatory Intelligence & Policy Mapping Agent)
Version:   v1.0.1-competition
Date:      October 2026
================================================================================

1. WHAT IS FINGUARD AI?
--------------------------------------------------------------------------------
FinGuard AI is an autonomous, multi-agent regulatory compliance platform built
for the banking and financial services sector (BFSI). It monitors official Bank 
of Thailand (BOT) regulatory circulars, automatically computes temporal clause 
diffs, maps compliance obligations to internal bank policies, provides grounded 
risk assessments with an Evidence Triad, and orchestrates remediation dispatch 
gated by Human-in-the-Loop approval and cryptographic audit trails.

Core Mantra:
"AI does the analysis. Humans control the decision. Every action is traceable."


2. HOW DO I VIEW THE PITCH DECK?
--------------------------------------------------------------------------------
- Slide Deck File:     submission/FinGuard_AI_Pitch_Deck.md
- Specification & Layout: docs/SLIDE_DECK_SPEC.md
- 90s & 3m Scripts:     docs/PITCH_SCRIPT.md
- Presenter Runbook:    docs/PRESENTATION_DAY.md


3. WHAT IS THE DEMO URL?
--------------------------------------------------------------------------------
- Live Demo / Preview:  http://localhost:3000  (or https://finguard-ai.vercel.app)
- Subsystem Health:     http://localhost:3000/api/health


4. HOW DO I RUN THE DEMO LOCALLY?
--------------------------------------------------------------------------------
Step 1: Install dependencies
        $ npm install

Step 2: Initialize pristine demo baseline
        $ npm run demo:reset

Step 3: Launch dev server
        $ npm run dev

Step 4: Open browser at:
        http://localhost:3000/dashboard

Credentials (Role-Based Access Control):
- Compliance Officer: officer@finguard.bank / Officer@FinGuard2026!
- CISO / Admin:       admin@finguard.bank   / Admin@FinGuard2026!
- Internal Auditor:   auditor@finguard.bank / Auditor@FinGuard2026!


5. WHAT IS THE OFFLINE FALLBACK?
--------------------------------------------------------------------------------
FinGuard AI is 100% capable of running air-gapped without an active internet 
connection. In offline mode:
- Regulatory Source uses local SQLite/Neon temporal chunks.
- Grounded Reasoning runs on our deterministic sub-millisecond rule engine.
- Embedding fallback matches structured clause references.
See docs/FINAL_DEMO_MODES.md for full switching instructions.


6. WHERE IS THE ARCHITECTURE SPECIFICATION?
--------------------------------------------------------------------------------
- Technical Architecture: submission/FinGuard_AI_Technical_Architecture.md
- Full Deep Dive:         docs/ARCHITECTURE.md
- Security & SSRF Specs:  docs/SECURITY.md


7. WHERE ARE THE BENCHMARKS & EVALUATION RESULTS?
--------------------------------------------------------------------------------
- Automated Benchmark:   npm run test:benchmark
- Full Test Suite:       npm test
- Benchmark Summary:     docs/BENCHMARK.md
- Release Manifest:      docs/RELEASE_MANIFEST.md

Verified Benchmark Scores:
- Clause Diff Classification Accuracy:  100.0% (5/5 clauses)
- Grounded Gap Mapping Accuracy:        100.0% (4/4 policies)
- Evidence Triad Traceability:          100.0% (4/4 compliant)
- Prompt Injection Resistance:          100.0% (0 vulnerabilities)
- Ticket Dispatch Idempotency:          100.0% (zero duplicates)
================================================================================
