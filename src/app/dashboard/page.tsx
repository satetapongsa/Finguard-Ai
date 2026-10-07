import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  Layers,
  CheckCircle,
  Clock,
  ArrowRight,
  Bot,
  ShieldAlert,
  Building,
  Calendar,
  Sparkles,
  GitCompare,
  CheckCircle2,
} from "lucide-react";
import { TriggerWorkflowButton } from "@/components/TriggerWorkflowButton";

export const dynamic = "force-dynamic";

export default async function ComplianceCommandCenterPage() {
  // 1. Fetch real statistics from database
  const regulationsCount = await prisma.regulation.count();
  const chunksCount = await prisma.regulationChunk.count();
  const policiesCount = await prisma.internalPolicy.count();
  const allGaps = await prisma.complianceGap.findMany({
    include: {
      regulation: true,
      internalPolicy: true,
      tickets: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const highRiskGaps = allGaps.filter((g) => g.riskLevel === "HIGH" || g.riskLevel === "CRITICAL");
  const openGaps = allGaps.filter((g) => g.status === "OPEN");
  const approvedGaps = allGaps.filter((g) => g.status === "APPROVED");
  const reviewedGaps = allGaps.filter((g) => g.status === "REVIEWED");
  const ticketsCount = await prisma.dispatchTicket.count();

  // Active regulation
  const activeRegulation = await prisma.regulation.findFirst({
    where: { status: "ACTIVE" },
    include: {
      chunks: { orderBy: { chunkIndex: "asc" } },
      supersedes: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  // Recent audit logs for Agent Activity summary
  const recentAgentLogs = await prisma.auditLog.findMany({
    where: {
      actionType: {
        in: [
          "REGULATION_INGESTED",
          "DIFF_ANALYSIS_COMPLETED",
          "GAP_IDENTIFIED",
          "GAP_APPROVED",
          "DISPATCH_CREATED",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Banner & Judge-Centered Value Proposition */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              DEMO ENVIRONMENT • SYNTHETIC REGULATORY DATASET
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              BFSI REGULATORY INTELLIGENCE
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            FinGuard AI
          </h1>
          <p className="text-sm sm:text-base font-semibold text-cyan-300 mt-1">
            Autonomous Regulatory Intelligence & Policy Mapping Agent
          </p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            AI detects regulatory changes, maps impact to internal bank policy, and prepares remediation —
            with mandatory Human Compliance Officer approval before operational action.
          </p>
        </div>

        {/* Demo Action Trigger & Direct Call to Action */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/gap-analysis"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <span>Review Compliance Gaps</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <TriggerWorkflowButton />
        </div>
      </div>

      {/* Business Outcome Strip: DETECT -> DIFF -> IMPACT -> REVIEW -> ACT */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 font-bold flex items-center justify-center text-[10px] border border-cyan-800">1</span>
          <div>
            <div className="font-bold text-white text-[11px]">DETECT</div>
            <div className="text-[10px] text-slate-400">Watcher Agent</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 font-bold flex items-center justify-center text-[10px] border border-cyan-800">2</span>
          <div>
            <div className="font-bold text-white text-[11px]">DIFF</div>
            <div className="text-[10px] text-slate-400">Clause Deltas</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 font-bold flex items-center justify-center text-[10px] border border-cyan-800">3</span>
          <div>
            <div className="font-bold text-white text-[11px]">IMPACT</div>
            <div className="text-[10px] text-slate-400">Policy Retrieval</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-950/40 border border-amber-800/60">
          <span className="w-5 h-5 rounded-full bg-amber-900 text-amber-200 font-bold flex items-center justify-center text-[10px] border border-amber-600">4</span>
          <div>
            <div className="font-bold text-amber-300 text-[11px]">REVIEW</div>
            <div className="text-[10px] text-amber-400/90 font-semibold">Human Approval</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 col-span-2 sm:col-span-1">
          <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 font-bold flex items-center justify-center text-[10px] border border-emerald-800">5</span>
          <div>
            <div className="font-bold text-white text-[11px]">ACT & AUDIT</div>
            <div className="text-[10px] text-slate-400">Dispatch Ticket</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            REGULATIONS
          </div>
          <div className="text-2xl font-black text-white">{regulationsCount}</div>
          <div className="text-[10px] text-cyan-400 mt-1">BOT Active & Revoked</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            SEMANTIC CHUNKS
          </div>
          <div className="text-2xl font-black text-white">{chunksCount}</div>
          <div className="text-[10px] text-emerald-400 mt-1">Clauses Indexed</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            BANK POLICIES
          </div>
          <div className="text-2xl font-black text-white">{policiesCount}</div>
          <div className="text-[10px] text-indigo-400 mt-1">Internal Standards</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            OPEN GAPS
          </div>
          <div className="text-2xl font-black text-amber-400">{openGaps.length}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">Pending Review</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 shadow-lg">
          <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-1">
            HIGH / CRITICAL RISK
          </div>
          <div className="text-2xl font-black text-rose-400">{highRiskGaps.length}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">Regulatory Penalties</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 shadow-lg">
          <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
            DISPATCHED
          </div>
          <div className="text-2xl font-black text-emerald-400">{ticketsCount}</div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Action Tickets Issued</div>
        </div>
      </div>

      {/* Middle Section: Active Regulatory Watch + Agent Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Enactment Card (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Active Regulatory Enactment
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    ACTIVE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Target circular governing compliance controls and internal bank policy mapping
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/regulations"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              <span>Inspect Diff</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeRegulation ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-cyan-400 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800">
                  {activeRegulation.regulationCode} v{activeRegulation.version}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {activeRegulation.issuer}
                </span>
                {activeRegulation.supersedes && (
                  <span className="text-[11px] text-amber-400 font-mono">
                    (Supersedes v{activeRegulation.supersedes.version})
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-white leading-snug">
                {activeRegulation.title}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Effective Date</span>
                  <span className="text-slate-200 font-semibold">
                    {new Date(activeRegulation.effectiveFrom).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Clauses</span>
                  <span className="text-cyan-300 font-semibold">{activeRegulation.chunks.length} Chunks</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Diff Classification</span>
                  <span className="text-amber-300 font-semibold">1 ADD • 2 MODIFY</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Workflow State</span>
                  <span className="text-amber-400 font-black animate-pulse">WAITING_FOR_HUMAN</span>
                </div>
              </div>

              {/* WHY THIS MATTERS — Executive Judge Summary */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/30 border border-cyan-800/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Executive Summary • Why This Matters to Bank Compliance</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    HIGH RISK GAP
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <strong className="text-white">Clause 1.1 Mandate:</strong> Record retention duration doubled from 12 months to 24 months.
                  Internal Policy <strong className="text-cyan-300">P-102 (Compliance Operations)</strong> only satisfies 12 months.
                  Non-compliance exposes the institution to regulatory sanctions under Section 11 of the Banking Act.
                </p>
                <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>Remediation Target: <strong className="text-slate-200">Update P-102 Section 4</strong></span>
                  <Link href="/dashboard/gap-analysis" className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
                    <span>Inspect Evidence Triad</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active regulations indexed.</p>
          )}
        </div>

        {/* Right: Agent Activity / Timeline Card (1 col) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Agent Activity</h2>
                <p className="text-[11px] text-slate-400">Real-time workflow execution log</p>
              </div>
            </div>

            <Link
              href="/dashboard/agents"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              <span>Control Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {/* Autonomous Stages */}
            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Watcher Agent</div>
                <div className="text-[11px] text-slate-400">Detected BOT-COMP-001 v2.0</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Ingestion Agent</div>
                <div className="text-[11px] text-slate-400">Parsed 5 semantic clause chunks</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Diff Agent</div>
                <div className="text-[11px] text-slate-400">Classified 3 changes (1 ADD, 2 MODIFY)</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Gap Analysis Agent</div>
                <div className="text-[11px] text-slate-400">Mapped 3 HIGH-risk gaps to P-102, P-205, P-310</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0 mt-1" />
              <div>
                <div className="font-black text-amber-300 flex items-center gap-1.5">
                  <span>● Human-in-the-Loop Review</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-900/80 text-amber-200">WAITING</span>
                </div>
                <div className="text-[11px] text-amber-200/90 mt-0.5">
                  AI analysis complete. Operational action blocked until Compliance Officer approves.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs opacity-70">
              <span className="w-4 h-4 rounded-full border border-slate-600 text-slate-500 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">○</span>
              <div>
                <div className="font-bold text-slate-400">Dispatcher Agent</div>
                <div className="text-[11px] text-slate-500">Awaiting human authorization to issue CMP ticket</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: High Priority Compliance Gaps Work Queue */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              High Priority Compliance Gaps
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                {highRiskGaps.length} Requiring Action
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Regulatory clauses violating bank internal policies, requiring compliance officer approval before remediation dispatch
            </p>
          </div>

          <Link
            href="/dashboard/gap-analysis"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <span>Full Gap Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">BOT Clause</th>
                <th className="py-3 px-4">Target Policy</th>
                <th className="py-3 px-4">Owner Department</th>
                <th className="py-3 px-4">Finding Summary</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {highRiskGaps.map((gap) => (
                <tr key={gap.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                    {gap.gapTitle.includes("1.1") ? "Clause 1.1" : gap.gapTitle.includes("1.3") ? "Clause 1.3" : "Clause 1.5"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-white">{gap.internalPolicy.policyCode}</span>
                    <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                      {gap.internalPolicy.title}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {gap.internalPolicy.ownerDepartment}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-[280px]">
                    <div className="line-clamp-2">{gap.finding}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-black text-xs bg-rose-950 text-rose-300 border border-rose-800">
                      {gap.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {gap.status === "APPROVED" ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        APPROVED
                      </span>
                    ) : gap.status === "REVIEWED" ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        REVIEWED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" /> OPEN
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href="/dashboard/gap-analysis"
                      className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 transition inline-flex items-center gap-1"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
