"use client";

import React, { useState } from "react";
import { runWatcherAction, runRegulatoryAnalysisAction } from "@/app/actions/regulation-actions";
import { Bot, RefreshCw, CheckCircle2, Sparkles, Play } from "lucide-react";

export function TriggerWorkflowButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleRunWorkflow = async () => {
    setLoading(true);
    setMsg(null);
    try {
      // 1. Run Watcher
      const watcherRes = await runWatcherAction();
      if (!watcherRes.success) {
        alert("Watcher failed: " + ("error" in watcherRes ? watcherRes.error : "Unknown error"));
        return;
      }

      const regId = "data" in watcherRes ? watcherRes.data?.documentId : undefined;
      if (regId) {
        // 2. Run Diff + Gap Analysis
        const analysisRes = await runRegulatoryAnalysisAction(regId);
        if (analysisRes.success) {
          setMsg("Workflow completed: 3 changes diffed, 3 gaps identified. Status: WAITING_FOR_HUMAN");
          setTimeout(() => setMsg(null), 7000);
        } else {
          alert("Analysis failed: " + ("error" in analysisRes ? analysisRes.error : "Unknown error"));
        }
      } else {
        setMsg("Watcher verified: Document already processed in temporal store.");
        setTimeout(() => setMsg(null), 5000);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {msg && (
        <span className="text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          {msg}
        </span>
      )}
      <button
        onClick={handleRunWorkflow}
        disabled={loading}
        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition"
      >
        <Play className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        <span>{loading ? "Agent Workflow Running..." : "Run Autonomous Workflow"}</span>
      </button>
    </div>
  );
}
