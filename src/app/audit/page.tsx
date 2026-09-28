"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Hash,
  Database,
  FileCode,
  Link as LinkIcon,
  ShieldAlert,
} from "lucide-react";
import { AuditLogItem, AuditChainVerificationResult } from "@/lib/types";

export default function AuditExplorerPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<AuditChainVerificationResult | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [inspectedLog, setInspectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === "ALL"
          ? "/api/audit?limit=50&verify=true"
          : `/api/audit?limit=50&status=${statusFilter}&verify=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        if (data.verification) {
          setVerificationResult(data.verification);
        }
      }
    } catch (err) {
      console.error("Could not fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyChain = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/audit/verify");
      const data = await res.json();
      if (data.success && data.report) {
        setVerificationResult(data.report);
      }
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.actionType.toLowerCase().includes(term) ||
      log.targetResource.toLowerCase().includes(term) ||
      log.payloadHash.toLowerCase().includes(term) ||
      (log.entryHash && log.entryHash.toLowerCase().includes(term)) ||
      (log.actor?.name && log.actor.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-7 pb-10" suppressHydrationWarning>
      {/* Page Title & Integrity Assurance Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Cryptographic Immutable Audit Explorer
            </h1>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-700/60 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Blockchain-Linked SHA-256</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
            Tamper-evident, write-only compliance ledger with deterministic SHA-256 linked-list derivation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={verifyChain}
            disabled={verifying}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition cursor-pointer"
          >
            <ShieldCheck className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} />
            <span>{verifying ? "Verifying Chain..." : "Verify Cryptographic Chain"}</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-bold border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-600 dark:text-cyan-400" : ""}`} />
            <span>Sync Audit Log</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Chain Integrity Status Alert */}
      {verificationResult && (
        <div
          className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
            verificationResult.isValid
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-900 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                verificationResult.isValid ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-400"
              }`}
            >
              {verificationResult.isValid ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center space-x-2">
                <span>{verificationResult.isValid ? "Chain Integrity Intact (100% Unbroken)" : "Chain Tampering Detected!"}</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  {verificationResult.totalBlocks} Blocks Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Every audit block&apos;s SHA-256 hash successfully satisfies parent continuity and content non-repudiation.
              </p>
            </div>
          </div>

          <div className="font-mono text-[10px] space-y-0.5 text-slate-600 dark:text-slate-400">
            <div>
              Genesis Hash:{" "}
              <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{verificationResult.genesisHash.slice(0, 16)}...</span>
            </div>
            <div>
              Latest Link:{" "}
              <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{verificationResult.latestHash.slice(0, 16)}...</span>
            </div>
          </div>
        </div>
      )}

      {/* Audit Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Total Recorded Events</span>
            <Database className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          {loading ? (
            <div className="h-9 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-3" />
          ) : (
            <p className="text-3xl font-mono font-extrabold text-slate-900 dark:text-white mt-3">{logs.length}</p>
          )}
          <span className="text-xs text-slate-600 dark:text-slate-400 mt-1 block">Append-only sequential event records</span>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Blockchain Links Verified</span>
            <LinkIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          {loading ? (
            <div className="h-9 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-3" />
          ) : (
            <p className="text-3xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-3">
              {logs.filter((l) => l.isIntegrityVerified).length}
            </p>
          )}
          <span className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-1 block">SHA-256 Parent Chaining Verified</span>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Alert & Blocked Interceptions</span>
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          {loading ? (
            <div className="h-9 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-3" />
          ) : (
            <p className="text-3xl font-mono font-extrabold text-rose-600 dark:text-rose-400 mt-3">
              {logs.filter((l) => l.status === "ALERT" || l.status === "BLOCKED").length}
            </p>
          )}
          <span className="text-xs text-rose-600 dark:text-rose-400/80 mt-1 block">Compliance interventions recorded</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/90 overflow-hidden shadow-xl dark:shadow-2xl">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Immutable Event Journal</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium border border-slate-300 dark:border-slate-700/60">
              {filteredLogs.length} entries
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action, hash, actor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-52 sm:w-64 transition"
              />
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {["ALL", "SUCCESS", "ALERT", "BLOCKED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-bold cursor-pointer ${
                    statusFilter === st
                      ? "bg-white text-cyan-800 border border-cyan-300 shadow-sm dark:bg-gradient-to-r dark:from-cyan-900 dark:to-slate-800 dark:text-cyan-300 dark:border-cyan-500/40"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400 font-bold">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor / Principal</th>
                <th className="px-5 py-3.5">Action Type</th>
                <th className="px-5 py-3.5">Target Resource</th>
                <th className="px-5 py-3.5">Linked Entry Hash (SHA-256)</th>
                <th className="px-5 py-3.5 text-center">Audit Status</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-7 w-14 bg-slate-200 dark:bg-slate-800 rounded-xl ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500 font-medium">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const displayHash = log.entryHash || log.payloadHash;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition duration-150">
                      {/* Timestamp */}
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {new Date(log.createdAt).toLocaleString([], {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      {/* Actor */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {log.actor?.name || "System Autonomous Agent"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {log.actor?.email || "internal://engine.finguard"}
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-[10px] px-2.5 py-1 rounded-md font-bold bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-cyan-800 dark:text-cyan-300">
                          {log.actionType}
                        </span>
                      </td>

                      {/* Target Resource */}
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{log.targetResource}</span>
                        {log.resourceId && (
                          <span className="text-[10px] block text-slate-500">
                            #{log.resourceId.slice(0, 8)}
                          </span>
                        )}
                      </td>

                      {/* Cryptographic Entry Hash */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] text-cyan-800 dark:text-cyan-300 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                            {displayHash ? `${displayHash.slice(0, 10)}...${displayHash.slice(-8)}` : "N/A"}
                          </span>
                          <button
                            onClick={() => copyHash(displayHash)}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                            title="Copy Full SHA-256 Hash"
                          >
                            {copiedHash === displayHash ? (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/60"
                              : log.status === "ALERT"
                              ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60"
                              : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/60"
                          }`}
                        >
                          {log.status === "SUCCESS" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          <span>{log.status}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setInspectedLog(log)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none"
                        >
                          <FileCode className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl glass-panel bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-7 relative text-slate-800 dark:text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/60 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Audit Entry Inspection: #{inspectedLog.id}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tamper-evident blockchain-linked payload record</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-transparent"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Linked Chain Hashes */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 uppercase tracking-wider text-[9px] block">Previous Block Hash (Parent Link):</span>
                  <span className="text-cyan-700 dark:text-cyan-400 break-all">{inspectedLog.previousHash || "0".repeat(64) + " (Genesis)"}</span>
                </div>
                <div className="pt-1 border-t border-slate-200 dark:border-slate-900">
                  <span className="text-slate-500 uppercase tracking-wider text-[9px] block">Payload SHA-256 Hash:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 break-all">{inspectedLog.payloadHash}</span>
                </div>
                {inspectedLog.entryHash && (
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-900">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px] block">Current Block Entry Hash:</span>
                    <span className="text-indigo-700 dark:text-indigo-400 break-all">{inspectedLog.entryHash}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Resource & Principal Metadata:
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-slate-800 dark:text-slate-300">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Action Type</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{inspectedLog.actionType}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Target Resource</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{inspectedLog.targetResource}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Sanitized Event Payload:
                </span>
                <pre className="mt-1.5 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-cyan-800 dark:text-cyan-300 max-h-48 overflow-y-auto">
                  {JSON.stringify(inspectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
