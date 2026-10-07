import prisma from "@/lib/prisma";
import Link from "next/link";
import { GapMatrixTable } from "@/components/GapMatrixTable";
import { TriggerWorkflowButton } from "@/components/TriggerWorkflowButton";
import { getAuthenticatedActor } from "@/lib/security/rbac";
import {
  ShieldAlert,
  Layers,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GapAnalysisPage() {
  const actor = await getAuthenticatedActor();

  const gaps = await prisma.complianceGap.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      regulation: true,
      regulationChunk: true,
      internalPolicy: true,
      tickets: true,
    },
  });

  const criticalCount = gaps.filter((g) => g.riskLevel === "CRITICAL").length;
  const highCount = gaps.filter((g) => g.riskLevel === "HIGH").length;
  const approvedCount = gaps.filter((g) => g.status === "APPROVED").length;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Multi-Agent Compliance Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Compliance Gap Matrix & Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Autonomous Gap Analysis Agent evaluates delta between new BOT circulars and internal bank policies.
            Includes Human-in-the-Loop review & automated remediation ticket dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/regulations"
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold transition flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Regulatory Watch</span>
          </Link>
          <TriggerWorkflowButton />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>TOTAL GAPS DETECTED</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{gaps.length}</div>
          <div className="text-[11px] text-cyan-400 mt-1">Cross-Policy Inconsistencies</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/50 shadow-lg">
          <div className="flex items-center justify-between text-rose-300 text-xs font-bold mb-1">
            <span>CRITICAL RISKS</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{criticalCount}</div>
          <div className="text-[11px] text-rose-300/80 mt-1">Regulatory Fine Vulnerabilities</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/50 shadow-lg">
          <div className="flex items-center justify-between text-amber-300 text-xs font-bold mb-1">
            <span>HIGH RISKS</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{highCount}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">SLA / Audit Discrepancies</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/50 shadow-lg">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-bold mb-1">
            <span>APPROVED & DISPATCHED</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{approvedCount}</div>
          <div className="text-[11px] text-emerald-300/80 mt-1">Human-in-the-Loop Approved</div>
        </div>
      </div>

      {/* Main Gap Matrix Table & Review Panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Autonomous Gap Mapping Table</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Human-in-the-Loop Ready
            </span>
          </h2>
        </div>
        <GapMatrixTable gaps={gaps as any} userRole={actor?.role} />
      </div>
    </div>
  );
}
