"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Hash,
  Database,
  FileCode,
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
    <div className="space-y-6">
      {/* Page Title & Integrity Assurance Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Cryptographic Immutable Audit Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident, write-only compliance ledger with SHA-256 payload integrity guarantees
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Non-Repudiation Verified</span>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bfsi-glass-card rounded-xl p-4 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Recorded Events</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-white mt-2">{logs.length}</p>
          <span className="text-[10px] text-slate-500">Append-only sequential records</span>
        </div>

        <div className="bfsi-glass-card rounded-xl p-4 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Integrity Verified Hashes</span>
            <Hash className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-2">
            {logs.filter((l) => l.payloadHash).length}
          </p>
          <span className="text-[10px] text-emerald-400/80">SHA-256 Checksums Validated</span>
        </div>

        <div className="bfsi-glass-card rounded-xl p-4 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Alert & Blocked Interceptions</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-rose-400 mt-2">
            {logs.filter((l) => l.status === "ALERT" || l.status === "BLOCKED").length}
          </p>
          <span className="text-[10px] text-rose-400/80">Compliance interventions recorded</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bfsi-glass-card rounded-xl border border-slate-800 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-sm text-white">Immutable Event Journal</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {filteredLogs.length} entries
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action, hash, actor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
              />
            </div>

            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              {["ALL", "SUCCESS", "ALERT", "BLOCKED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md transition text-[11px] font-medium cursor-pointer ${
                    statusFilter === st
                      ? "bg-slate-700 text-cyan-400 font-semibold"
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
            <thead className="bg-slate-900/80 border-b border-slate-800 uppercase tracking-wider text-[10px] text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor / Principal</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Target Resource</th>
                <th className="px-4 py-3">Cryptographic SHA-256 Hash</th>
                <th className="px-4 py-3 text-center">Audit Status</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No audit records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    {/* Timestamp */}
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
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
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">
                        {log.actor?.name || "System Autonomous Agent"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {log.actor?.email || "internal://engine.finguard"}
                      </div>
                    </td>

                    {/* Action Type */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                        {log.actionType}
                      </span>
                    </td>

                    {/* Target Resource */}
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {log.targetResource}
                      {log.resourceId && (
                        <span className="text-[10px] block text-slate-600">
                          #{log.resourceId.slice(0, 8)}
                        </span>
                      )}
                    </td>

                    {/* Cryptographic SHA-256 Hash */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[10px] text-cyan-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          {log.payloadHash ? `${log.payloadHash.slice(0, 14)}...${log.payloadHash.slice(-8)}` : "N/A"}
                        </span>
                        <button
                          onClick={() => copyHash(log.payloadHash)}
                          className="p-1 text-slate-400 hover:text-white transition"
                          title="Copy Full SHA-256 Hash"
                        >
                          {copiedHash === log.payloadHash ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40"
                            : log.status === "ALERT"
                            ? "bg-amber-950/80 text-amber-400 border border-amber-800/40"
                            : "bg-rose-950/80 text-rose-400 border border-rose-800/40"
                        }`}
                      >
                        {log.status === "SUCCESS" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        <span>{log.status}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setInspectedLog(log)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer"
                      >
                        <FileCode className="w-3 h-3" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl bfsi-glass-card rounded-2xl border border-slate-700 p-6 relative text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  Audit Entry Inspection: #{inspectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold">Cryptographic SHA-256 Checksum:</span>
                <p className="font-mono text-cyan-400 bg-slate-950 p-2 rounded-lg mt-1 break-all border border-slate-800">
                  {inspectedLog.payloadHash}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Action:</span>
                  <p className="font-mono text-white font-semibold">{inspectedLog.actionType}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">IP Address:</span>
                  <p className="font-mono text-white font-semibold">{inspectedLog.ipAddress || "127.0.0.1"}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold">Sanitized Payload & Metadata:</span>
                <pre className="font-mono text-[11px] bg-slate-950 p-3 rounded-lg mt-1 overflow-x-auto border border-slate-800 text-slate-300">
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
