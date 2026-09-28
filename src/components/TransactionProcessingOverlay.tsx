"use client";

import { useComplianceStore } from "@/store/compliance-store";
import { Loader2, ShieldCheck, Database, Lock } from "lucide-react";

export default function TransactionProcessingOverlay() {
  const isProcessing = useComplianceStore((s) => s.isProcessingTransaction);
  const message = useComplianceStore((s) => s.processingMessage);

  if (!isProcessing) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-[3px] transition-all duration-300 animate-in fade-in"
    >
      <div className="relative mx-4 flex flex-col items-center rounded-3xl border border-white/20 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 max-w-sm w-full text-center">
        {/* Ambient radial glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-24 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 blur-2xl pointer-events-none" />

        {/* Central Spinning Ring Indicator */}
        <div className="relative mb-4 flex items-center justify-center">
          {/* Subtle outer pulsing ring */}
          <div className="absolute w-16 h-16 rounded-full border-2 border-cyan-500/20 animate-ping" />
          {/* Rotating gradient ring */}
          <div className="w-14 h-14 rounded-full border-3 border-transparent border-t-cyan-500 border-r-blue-500 animate-spin" />
          {/* Central Security Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
          </div>
        </div>

        {/* Status text */}
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
          Processing Transaction
        </h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
          {message || "Recording transaction and securing audit trail..."}
        </p>

        {/* Micro badge row */}
        <div className="mt-4 flex items-center justify-center gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1">
            <Database className="w-3 h-3 text-cyan-500" />
            <span>ACID Ledger</span>
          </div>
          <span>&bull;</span>
          <div className="flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>SHA-256 Hash</span>
          </div>
        </div>
      </div>
    </div>
  );
}
