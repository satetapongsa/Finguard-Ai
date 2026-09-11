"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  Scale,
  Search,
  RefreshCw,
  ArrowUpRight,
  ExternalLink,
  PlusCircle,
  FileCheck2,
  Lock,
  Zap,
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-7 pb-10">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Autonomous Compliance Command Center
            </h1>
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Real-Time Engine</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium max-w-2xl">
            Double-entry ACID settlement with real-time heuristic AMLO & Bank of Thailand risk scoring.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Sync Ledger</span>
          </button>
          <button
            onClick={() => setQuickTransferOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Volume Processed
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 group-hover:scale-110 transition duration-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              ฿{stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center text-xs font-semibold text-emerald-400 space-x-1.5">
              <ArrowUpRight className="w-4 h-4" />
              <span>{stats.transactionCount} settled transactions</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Verified Ledger Balance
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 group-hover:scale-110 transition duration-200">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              ฿{stats.verifiedLedgerBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center text-xs font-semibold text-cyan-400 space-x-1.5">
              <FileCheck2 className="w-4 h-4" />
              <span>Double-Entry Invariant Verified</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              High-Risk AML Flags
            </span>
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-400 group-hover:scale-110 transition duration-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400 tracking-tight">
              {stats.highRiskFlags}
            </div>
            <div className="mt-2 flex items-center text-xs font-semibold text-rose-400 space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Requires Copilot Interrogation</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Regulatory Directives
            </span>
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-400 group-hover:scale-110 transition duration-200">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-300 tracking-tight">
              {stats.activeComplianceAlerts}
            </div>
            <div className="mt-2 flex items-center text-xs font-semibold text-purple-400 space-x-1.5">
              <span>BOT &bull; AMLO &bull; PDPA &bull; FATF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table Section */}
      <div className="glass-panel rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <h2 className="font-extrabold text-base text-white tracking-tight">
              Real-Time Transaction Ledger
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-medium border border-slate-700/60">
              {filteredTransactions.length} records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search account, name, or ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-52 sm:w-64 transition"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              {(["ALL", "APPROVED", "FLAGGED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-bold cursor-pointer ${
                    statusFilter === filter
                      ? "bg-gradient-to-r from-cyan-900 to-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm"
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
            <thead className="bg-slate-950/60 border-b border-slate-800/80 uppercase tracking-wider text-[11px] text-slate-400 font-bold">
              <tr>
                <th className="px-5 py-3.5">Reference / Time</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Source (Debit)</th>
                <th className="px-5 py-3.5">Destination (Credit)</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Risk Index</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-500 font-medium">
                    No transactions matching current filters.
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
                      className="hover:bg-slate-800/30 transition duration-150 group"
                    >
                      {/* ID / Time */}
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-slate-200 text-xs tracking-tight">
                          #{tx.id.slice(0, 8)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {new Date(tx.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider bg-slate-900 border border-slate-700/80 text-cyan-300">
                          {tx.type}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-900 to-slate-800 border border-cyan-800/40 flex items-center justify-center font-bold text-[10px] text-cyan-300">
                            {getInitials(tx.sourceAccount.accountName)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">
                              {tx.sourceAccount.accountName}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {tx.sourceAccount.accountNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-900 to-slate-800 border border-blue-800/40 flex items-center justify-center font-bold text-[10px] text-blue-300">
                            {getInitials(tx.destinationAccount.accountName)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">
                              {tx.destinationAccount.accountName}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {tx.destinationAccount.accountNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 text-right font-mono font-extrabold text-sm text-white">
                        ฿{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                            tx.status === "APPROVED"
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"
                              : tx.status === "FLAGGED"
                              ? "bg-rose-950/80 text-rose-300 border border-rose-700/60 animate-pulse"
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
                      <td className="px-5 py-4 text-center">
                        <span
                          title={tx.riskReason ?? "Standard low risk parameters"}
                          className={`inline-block px-3 py-1 rounded-full font-mono text-xs font-bold tracking-tight ${
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
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleInspectInCopilot(tx)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/40 text-slate-300 text-xs font-bold transition duration-200 cursor-pointer border border-slate-700"
                        >
                          <span>Copilot</span>
                          <ExternalLink className="w-3.5 h-3.5" />
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
