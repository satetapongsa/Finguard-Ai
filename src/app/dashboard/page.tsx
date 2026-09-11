"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  Scale,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  PlusCircle,
  FileCheck2,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import { TransactionWithAccounts } from "@/lib/types";

interface DashboardStats {
  totalVolume: number;
  transactionCount: number;
  verifiedLedgerBalance: number;
  highRiskFlags: number;
  activeComplianceAlerts: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const setSelectedTransaction = useComplianceStore((s) => s.setSelectedTransaction);
  const setQuickTransferOpen = useComplianceStore((s) => s.setQuickTransferOpen);

  const [stats, setStats] = useState<DashboardStats>({
    totalVolume: 0,
    transactionCount: 0,
    verifiedLedgerBalance: 0,
    highRiskFlags: 0,
    activeComplianceAlerts: 0,
  });

  const [transactions, setTransactions] = useState<TransactionWithAccounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, txRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/transactions?limit=50"),
      ]);

      const statsData = await statsRes.json();
      const txData = await txRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
      if (txData.success) {
        setTransactions(txData.data);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesFilter =
        statusFilter === "ALL" ? true : tx.status === statusFilter;
      const matchesSearch =
        searchTerm === "" ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.sourceAccount.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.destinationAccount.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.sourceAccount.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.destinationAccount.accountName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [transactions, statusFilter, searchTerm]);

  const handleInspectInCopilot = (tx: TransactionWithAccounts) => {
    setSelectedTransaction(tx);
    router.push("/compliance");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Autonomous Compliance Command Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ACID double-entry settlement engine with autonomous AMLO & Bank of Thailand risk scoring
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </button>
          <button
            onClick={() => setQuickTransferOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bfsi-glass-card rounded-xl p-4 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Volume Processed</span>
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">
              ฿{stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-emerald-400 space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{stats.transactionCount} settled cycles</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bfsi-glass-card rounded-xl p-4 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Verified Ledger Balance</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">
              ฿{stats.verifiedLedgerBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-cyan-400 space-x-1">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Double-Entry Balanced</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bfsi-glass-card rounded-xl p-4 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">High-Risk AML Flags</span>
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-rose-400">
              {stats.highRiskFlags}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-rose-400 space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Requires Copilot Interrogation</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bfsi-glass-card rounded-xl p-4 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Regulatory Directives</span>
            <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-purple-300">
              {stats.activeComplianceAlerts}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-purple-400 space-x-1">
              <span>BOT &bull; AMLO &bull; PDPA &bull; FATF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table Section */}
      <div className="bfsi-glass-card rounded-xl border border-slate-800 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-sm text-white">Real-Time Transaction Ledger</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {filteredTransactions.length} records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search account, name, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              {(["ALL", "APPROVED", "FLAGGED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-md transition text-[11px] font-medium cursor-pointer ${
                    statusFilter === filter
                      ? "bg-slate-700 text-cyan-400 font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 uppercase tracking-wider text-[10px] text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp / Ref</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Source (Debit)</th>
                <th className="px-4 py-3">Destination (Credit)</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Risk Score</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No transactions matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const riskPercent = Math.round(tx.riskScore * 100);
                  const isHigh = tx.riskScore >= 0.65;
                  const isMed = tx.riskScore >= 0.3 && tx.riskScore < 0.65;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* ID / Time */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-200">{tx.id.slice(0, 10)}...</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.type}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {tx.sourceAccount.accountName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {tx.sourceAccount.accountNumber}
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {tx.destinationAccount.accountName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {tx.destinationAccount.accountNumber}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        ฿{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            tx.status === "APPROVED"
                              ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/40"
                              : tx.status === "FLAGGED"
                              ? "bg-rose-950/70 text-rose-400 border border-rose-800/40 animate-pulse"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              tx.status === "APPROVED"
                                ? "bg-emerald-400"
                                : tx.status === "FLAGGED"
                                ? "bg-rose-400"
                                : "bg-slate-400"
                            }`}
                          />
                          <span>{tx.status}</span>
                        </span>
                      </td>

                      {/* Risk Score Pill */}
                      <td className="px-4 py-3 text-center">
                        <span
                          title={tx.riskReason ?? "Standard low risk"}
                          className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                            isHigh
                              ? "risk-pill-high"
                              : isMed
                              ? "risk-pill-medium"
                              : "risk-pill-low"
                          }`}
                        >
                          {riskPercent}%
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleInspectInCopilot(tx)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-900/60 hover:text-cyan-300 text-slate-300 text-[11px] font-medium transition cursor-pointer border border-slate-700"
                        >
                          <span>Copilot</span>
                          <ExternalLink className="w-3 h-3" />
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
    </div>
  );
}
