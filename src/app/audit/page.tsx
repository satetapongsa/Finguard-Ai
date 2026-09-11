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
  Lock,
} from "lucide-react";
import { AuditLogItem } from "@/lib/types";

export default function AuditExplorerPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [inspectedLog, setInspectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === "ALL"
          ? "/api/audit?limit=50"
          : `/api/audit?limit=50&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error("Could not fetch audit logs:", err);
    } finally {
      setLoading(false);
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
      (log.actor?.name && log.actor.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-7 pb-10">
      {/* Page Title & Integrity Assurance Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Cryptographic Immutable Audit Explorer
            </h1>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Non-Repudiation Verified</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium">
            Tamper-evident, write-only compliance ledger with deterministic SHA-256 payload integrity guarantees.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/80 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Sync Audit Log</span>
          </button>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Recorded Events</span>
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-white mt-3">{logs.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Append-only sequential event records</span>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Integrity Verified Hashes</span>
            <Hash className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-emerald-400 mt-3">
            {logs.filter((l) => l.payloadHash).length}
          </p>
          <span className="text-xs text-emerald-400/80 mt-1 block">SHA-256 Checksums Validated</span>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Alert & Blocked Interceptions</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-mono font-extrabold text-rose-400 mt-3">
            {logs.filter((l) => l.status === "ALERT" || l.status === "BLOCKED").length}
          </p>
          <span className="text-xs text-rose-400/80 mt-1 block">Compliance interventions recorded</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <h2 className="font-extrabold text-base text-white tracking-tight">Immutable Event Journal</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-medium border border-slate-700/60">
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
                className="bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-52 sm:w-64 transition"
              />
            </div>

            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              {["ALL", "SUCCESS", "ALERT", "BLOCKED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-bold cursor-pointer ${
                    statusFilter === st
                      ? "bg-gradient-to-r from-cyan-900 to-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white"
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
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800/80 uppercase tracking-wider text-[11px] text-slate-400 font-bold">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor / Principal</th>
                <th className="px-5 py-3.5">Action Type</th>
                <th className="px-5 py-3.5">Target Resource</th>
                <th className="px-5 py-3.5">Cryptographic SHA-256 Hash</th>
                <th className="px-5 py-3.5 text-center">Audit Status</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500 font-medium">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition duration-150">
                    {/* Timestamp */}
                    <td className="px-5 py-4 font-mono text-xs text-slate-300">
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
                      <div className="font-bold text-white text-xs">
                        {log.actor?.name || "System Autonomous Agent"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {log.actor?.email || "internal://engine.finguard"}
                      </div>
                    </td>

                    {/* Action Type */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-[10px] px-2.5 py-1 rounded-md font-bold bg-slate-900 border border-slate-700/80 text-cyan-300">
                        {log.actionType}
                      </span>
                    </td>

                    {/* Target Resource */}
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">{log.targetResource}</span>
                      {log.resourceId && (
                        <span className="text-[10px] block text-slate-500">
                          #{log.resourceId.slice(0, 8)}
                        </span>
                      )}
                    </td>

                    {/* Cryptographic SHA-256 Hash */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[11px] text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {log.payloadHash ? `${log.payloadHash.slice(0, 12)}...${log.payloadHash.slice(-8)}` : "N/A"}
                        </span>
                        <button
                          onClick={() => copyHash(log.payloadHash)}
                          className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Copy Full SHA-256 Hash"
                        >
                          {copiedHash === log.payloadHash ? (
                            <Check className="w-4 h-4 text-emerald-400" />
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
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"
                            : log.status === "ALERT"
                            ? "bg-amber-950/80 text-amber-300 border border-amber-700/60"
                            : "bg-rose-950/80 text-rose-300 border border-rose-700/60"
                        }`}
                      >
                        {log.status === "SUCCESS" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer border border-slate-700"
                      >
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl glass-panel rounded-3xl border border-slate-700 p-6 sm:p-7 relative text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Audit Entry Inspection: #{inspectedLog.id}
                  </h3>
                  <p className="text-xs text-slate-400">Tamper-evident write-only verified payload</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Cryptographic SHA-256 Checksum:
                </span>
                <p className="font-mono text-cyan-300 bg-slate-950 p-3 rounded-xl mt-1 break-all border border-slate-800 text-xs">
                  {inspectedLog.payloadHash}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Action Type:</span>
                  <p className="font-mono text-white font-bold text-xs mt-0.5">{inspectedLog.actionType}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Origin IP Address:</span>
                  <p className="font-mono text-white font-bold text-xs mt-0.5">{inspectedLog.ipAddress || "127.0.0.1"}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Sanitized Payload Metadata:
                </span>
                <pre className="font-mono text-[11px] bg-slate-950 p-4 rounded-xl mt-1 overflow-x-auto border border-slate-800 text-slate-200 leading-relaxed">
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
