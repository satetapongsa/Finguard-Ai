"use client";

import React, { useState } from "react";
import { GitCompare, PlusCircle, AlertTriangle, MinusCircle, CheckCircle2, Split, Eye } from "lucide-react";

interface ClauseDiffViewerProps {
  clauses: Array<{
    id: string;
    chunkIndex: number;
    clauseRef: string;
    heading?: string | null;
    content: string;
    previousContent?: string | null;
    changeType: "ADD" | "MODIFY" | "DELETE" | "UNCHANGED";
  }>;
}

export function ClauseDiffViewer({ clauses }: ClauseDiffViewerProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "inline">("side-by-side");
  const [filterType, setFilterType] = useState<string>("ALL");

  const filteredClauses = clauses.filter((c) => {
    if (filterType === "ALL") return true;
    return c.changeType === filterType;
  });

  const getBadge = (changeType: string) => {
    switch (changeType) {
      case "ADD":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <PlusCircle className="w-3 h-3 text-emerald-400" /> ADDED
          </span>
        );
      case "MODIFY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> MODIFIED
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <MinusCircle className="w-3 h-3 text-rose-400" /> DELETED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <CheckCircle2 className="w-3 h-3 text-slate-400" /> UNCHANGED
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Autonomous Clause Diff Engine
              <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                Temporal RAG
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Lexical & semantic delta comparing predecessor circular against new enactment
            </p>
          </div>
        </div>

        {/* Filters and View toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                filterType === "ALL" ? "bg-slate-800 text-cyan-300" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({clauses.length})
            </button>
            <button
              onClick={() => setFilterType("MODIFY")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                filterType === "MODIFY" ? "bg-amber-950 text-amber-300 border border-amber-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Modified
            </button>
            <button
              onClick={() => setFilterType("ADD")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                filterType === "ADD" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Added
            </button>
          </div>

          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setViewMode("side-by-side")}
              title="Side-by-side comparison"
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === "side-by-side" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <Split className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("inline")}
              title="Inline comparison"
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === "inline" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clause Comparison List */}
      <div className="mt-4 space-y-4">
        {filteredClauses.map((clause) => (
          <div
            key={clause.id}
            className="rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden hover:border-slate-700 transition"
          >
            {/* Clause Top Bar */}
            <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  {clause.clauseRef}
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {clause.heading || "Regulatory Clause Provision"}
                </span>
              </div>
              <div>{getBadge(clause.changeType)}</div>
            </div>

            {/* Content view modes */}
            {viewMode === "side-by-side" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                {/* Previous Predecessor */}
                <div className="p-4 bg-rose-950/5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500/80 inline-block" />
                    Previous Version (v1.0)
                  </div>
                  {clause.previousContent ? (
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-200/90 text-xs font-mono leading-relaxed">
                      {clause.previousContent}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-500 pt-2">
                      (No prior version — Newly introduced requirement)
                    </p>
                  )}
                </div>

                {/* New Enacted Circular */}
                <div className="p-4 bg-emerald-950/5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    New Mandate (v2.0)
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-100 text-xs font-mono leading-relaxed">
                    {clause.content}
                  </div>
                </div>
              </div>
            ) : (
              /* Inline View */
              <div className="p-4 space-y-2">
                {clause.previousContent && (
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs font-mono line-through opacity-85">
                    - {clause.previousContent}
                  </div>
                )}
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 text-xs font-mono">
                  + {clause.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
