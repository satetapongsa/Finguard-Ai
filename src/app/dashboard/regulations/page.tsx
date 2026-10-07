import prisma from "@/lib/prisma";
import Link from "next/link";
import { ClauseDiffViewer } from "@/components/ClauseDiffViewer";
import { TriggerWorkflowButton } from "@/components/TriggerWorkflowButton";
import {
  FileCheck2,
  AlertTriangle,
  History,
  Building,
  Calendar,
  ExternalLink,
  Bot,
  Zap,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RegulatoryWatchPage() {
  const regulations = await prisma.regulation.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      chunks: {
        orderBy: { chunkIndex: "asc" },
      },
      gaps: {
        include: { internalPolicy: true },
      },
      supersedes: true,
      supersededBy: true,
    },
  });

  const activeReg = regulations.find((r) => r.status === "ACTIVE" && r.chunks.length > 0) || regulations[0];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" /> Autonomous Ingestion & Diff Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Regulatory Watcher Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Continuously monitors regulatory announcements from the Bank of Thailand (BOT),
            extracts clauses into normalized temporal chunks, and computes clause-level diffs against predecessor circulars.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/gap-analysis"
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold transition flex items-center gap-2"
          >
            <span>Compliance Gaps</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <TriggerWorkflowButton />
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>TRACKED CIRCULARS</span>
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{regulations.length}</div>
          <div className="text-[11px] text-cyan-400 mt-1">Bank of Thailand Frameworks</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>SEMANTIC CLAUSES</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {regulations.reduce((acc, r) => acc + r.chunks.length, 0)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Normalized Regulatory Chunks</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>IDENTIFIED GAPS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {regulations.reduce((acc, r) => acc + r.gaps.length, 0)}
          </div>
          <div className="text-[11px] text-amber-400 mt-1">Policy Conflicts Discovered</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>WATCHER ENGINE</span>
            <History className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">ACTIVE</div>
          <div className="text-[11px] text-slate-400 mt-1">Autonomous Poll Engine 24/7</div>
        </div>
      </div>

      {/* Regulation Circulars Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Official Circular Announcements</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {regulations.length} total
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regulations.map((reg) => (
            <div
              key={reg.id}
              className={`p-5 rounded-2xl border transition ${
                reg.status === "ACTIVE"
                  ? "bg-slate-900/90 border-cyan-500/30 shadow-xl shadow-cyan-950/20"
                  : "bg-slate-950/60 border-slate-800/80 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {reg.regulationCode} v{reg.version}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-500" /> {reg.issuer}
                  </span>
                </div>
                <div>
                  {reg.status === "ACTIVE" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      ACTIVE (Enacted)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      REVOKED / SUPERSEDED
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-sm sm:text-base text-white mb-2 leading-snug">
                {reg.title}
              </h3>

              {/* Source Provenance & Trust Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {reg.sourceType === "OFFICIAL_BOT" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                    OFFICIAL BOT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    SYNTHETIC DEMO
                  </span>
                )}
                {reg.language && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                    LANG: {reg.language}
                  </span>
                )}
                {reg.documentHash && (
                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]" title={`SHA-256: ${reg.documentHash}`}>
                    SHA: {reg.documentHash.substring(0, 8)}...
                  </span>
                )}
                {reg.documentUrl && (
                  <a
                    href={reg.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    <span>View Official Source</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Effective: {new Date(reg.effectiveFrom).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-semibold font-mono">
                    {reg.chunks.length} Chunks
                  </span>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold font-mono">
                    {reg.gaps.length} Gaps
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Clause Diff Viewer Section */}
      {activeReg && activeReg.chunks.length > 0 && (
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Side-by-Side Clause Diff Viewer</span>
              <span className="text-xs font-mono text-cyan-400">
                [{activeReg.regulationCode} v{activeReg.version} vs Predecessor v1.0]
              </span>
            </h2>
          </div>

          {/* Diff Summary Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block uppercase font-bold text-[10px]">Total Clauses Analyzed</span>
              <span className="text-xl font-black text-white">{activeReg.chunks.length} Clauses</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                1 Added (Clause 1.5)
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                2 Modified (Clauses 1.1, 1.3)
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                2 Unchanged (Clauses 1.2, 1.4)
              </span>
            </div>
          </div>

          {/* Render Diff Viewer */}
          <ClauseDiffViewer clauses={activeReg.chunks as any} />
        </div>
      )}
    </div>
  );
}
