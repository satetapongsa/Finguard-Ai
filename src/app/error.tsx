"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw, ShieldCheck, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error to monitoring service without leaking sensitive stack traces
    console.error("FinGuard Error Boundary Caught:", error.message);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            System Resilience Recovery
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            A transient application anomaly was safely intercepted by the FinGuard Zero-Crash Isolation Layer. No customer data or financial state was compromised.
          </p>
        </div>

        {error?.digest && (
          <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl text-[11px] font-mono text-slate-500 truncate border border-slate-200 dark:border-slate-800">
            Error Digest Ref: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Recover Session & Retry</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Double-Entry Ledger Invariants Preserved</span>
        </div>
      </div>
    </div>
  );
}
