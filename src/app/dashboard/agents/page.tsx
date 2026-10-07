import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  ShieldAlert,
  Bot,
  CheckCircle2,
  Clock,
  ArrowRight,
  GitCompare,
  Layers,
  Send,
  Zap,
  Play,
  FileCheck,
} from "lucide-react";
import { TriggerWorkflowButton } from "@/components/TriggerWorkflowButton";

export const dynamic = "force-dynamic";

export default async function AgentActivityControlCenterPage() {
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      actionType: {
        in: [
          "REGULATION_INGESTED",
          "DIFF_ANALYSIS_COMPLETED",
          "GAP_IDENTIFIED",
          "GAP_APPROVED",
          "GAP_REJECTED",
          "DISPATCH_CREATED",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const latestGap = await prisma.complianceGap.findFirst({
    where: { status: "OPEN" },
  });

  const isWaitingForHuman = Boolean(latestGap);

  const tickets = await prisma.dispatchTicket.findMany({
    include: { internalPolicy: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" /> Agentic AI Orchestration & Observability
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Agent Control Center & Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time status, execution trace, and governance oversight for the 4-Agent regulatory intelligence pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/audit"
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold transition flex items-center gap-2"
          >
            <span>Immutable Audit Trail</span>
            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <TriggerWorkflowButton />
        </div>
      </div>

      {/* Prominent WAITING_FOR_HUMAN State Banner */}
      <div
        className={`p-6 rounded-2xl border transition shadow-2xl ${
          isWaitingForHuman
            ? "bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/20 border-amber-500/50"
            : "bg-slate-900/90 border-slate-800"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  PIPELINE STATE
                </span>
                <span className="text-sm font-black text-amber-400 tracking-wide flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
                  WAITING_FOR_HUMAN
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                Human-in-the-Loop Governance Gate Active
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Autonomous agents have successfully discovered, diffed, and mapped regulatory changes.
                Downstream operational dispatch is <strong>strictly blocked</strong> until an authorized Compliance Officer reviews the evidence and authorizes remediation.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/gap-analysis"
            className="px-5 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Review & Authorize</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4-Agent Architecture Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agent 1: Watcher & Ingestion */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              AGENT 1
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              COMPLETED
            </span>
          </div>
          <div className="font-bold text-white text-base">Ingestion & Watcher</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Monitors BOT regulatory circulars, extracts clauses into normalized chunks, and computes SHA-256 content hashes.
          </p>
          <div className="text-[11px] text-cyan-300 pt-2 border-t border-slate-800/80 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>BOT-COMP-001 v2.0 Ingested</span>
          </div>
        </div>

        {/* Agent 2: Versioning & Diff */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              AGENT 2
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              COMPLETED
            </span>
          </div>
          <div className="font-bold text-white text-base">Versioning & Diff</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Performs deterministic lexical comparison against predecessor v1.0 and classifies changes into ADD / MODIFY / UNCHANGED.
          </p>
          <div className="text-[11px] text-amber-300 pt-2 border-t border-slate-800/80 flex items-center gap-1">
            <GitCompare className="w-3.5 h-3.5 text-amber-400" />
            <span>1 ADD • 2 MODIFY Identified</span>
          </div>
        </div>

        {/* Agent 3: Gap Analysis */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              AGENT 3
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              COMPLETED
            </span>
          </div>
          <div className="font-bold text-white text-base">Gap Analysis Agent</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evaluates clause deltas against bank internal policies (P-102, P-205, P-310) and calculates risk exposure.
          </p>
          <div className="text-[11px] text-rose-300 pt-2 border-t border-slate-800/80 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>3 HIGH-Risk Gaps Mapped</span>
          </div>
        </div>

        {/* Agent 4: Dispatcher Agent */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              AGENT 4
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              GATED BY HUMAN
            </span>
          </div>
          <div className="font-bold text-white text-base">Dispatcher Agent</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generates operational tickets (CMP-YYYY-XXXX) for business units ONLY after human compliance officer approval.
          </p>
          <div className="text-[11px] text-indigo-300 pt-2 border-t border-slate-800/80 flex items-center gap-1">
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span>{tickets.length} Remediation Tickets Created</span>
          </div>
        </div>
      </div>

      {/* Real Execution Audit Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Autonomous Agent Execution Timeline
            </h2>
            <p className="text-xs text-slate-400">
              Live cryptographic event ledger recorded across all agent workflow actions
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 text-[11px]">
                      {log.actionType}
                    </span>
                    <span className="text-slate-300 font-semibold">{log.targetResource}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString()} • {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-1.5 font-mono truncate">
                  Hash: {log.entryHash.slice(0, 32)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
