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
  Server,
  Database,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Bot,
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

  const [accounts, setAccounts] = useState<
    {
      id: string;
      accountNumber: string;
      accountName: string;
      balance: string;
      currency: string;
      status: string;
    }[]
  >([]);
  const [inspectedTx, setInspectedTx] = useState<TransactionWithAccounts | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

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
  const [showNeonModal, setShowNeonModal] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider: string;
    isNeon?: boolean;
    latencyMs?: number;
    message?: string;
  }>({
    connected: false,
    provider: "Checking Database...",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, txRes, dbRes, accRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/transactions?limit=50"),
        fetch("/api/database/status"),
        fetch("/api/accounts"),
      ]);

      const statsData = await statsRes.json();
      const txData = await txRes.json();
      const dbData = await dbRes.json();
      const accData = await accRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
      if (txData.success) {
        setTransactions(txData.data);
      }
      if (accData.success) {
        setAccounts(accData.data);
      }
      if (dbData.success) {
        setDbStatus({
          connected: dbData.connected,
          provider: dbData.provider,
          isNeon: dbData.provider?.includes("Neon"),
          latencyMs: dbData.latencyMs,
          message: dbData.message,
        });
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for live transaction commits from QuickTransferModal
    const handleTxUpdate = () => loadData();
    window.addEventListener("finguard_tx_updated", handleTxUpdate);
    return () => window.removeEventListener("finguard_tx_updated", handleTxUpdate);
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

  const copyNeonTemplate = () => {
    const text = `DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-PROJECT-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-PROJECT.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"`;
    navigator.clipboard.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
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
            <span>Simulate Transfer</span>
          </button>
        </div>
      </div>

      {/* Neon Database Connection & Simulation Action Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#071328]/80 to-slate-900/90 border border-cyan-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md ${
              dbStatus.connected
                ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-400"
                : "bg-amber-950/60 border-amber-700/60 text-amber-400"
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-white">Database:</span>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                  dbStatus.connected
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                    : "bg-amber-950 text-amber-300 border border-amber-800/60"
                }`}
              >
                {dbStatus.connected ? "Neon PostgreSQL (Live)" : "Neon: Simulator Engine Active"}
              </span>
              {dbStatus.latencyMs && (
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  {dbStatus.latencyMs}ms
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {dbStatus.connected
                ? "Active double-entry persistence on Neon serverless PostgreSQL with pgvector."
                : "Interactive double-entry ACID simulator active. Connect Neon URL in .env to persist."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNeonModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-800/40 transition cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>Neon Setup Guide</span>
          </button>
          <button
            onClick={() => setQuickTransferOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-white text-xs font-bold border border-cyan-500/50 transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Launch Simulation</span>
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

      {/* BFSI Liquidity & Settlement Accounts Overview */}
      {accounts.length > 0 && (
        <div className="glass-panel rounded-3xl border border-slate-800/90 p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-white tracking-tight">
                  BFSI Treasury & Settlement Accounts Liquidity
                </h2>
                <p className="text-[11px] text-slate-400">
                  Real-time Double-Entry Ledger account standings & solvency status
                </p>
              </div>
            </div>
            <button
              onClick={() => setQuickTransferOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold border border-cyan-500/30 transition cursor-pointer self-start sm:self-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Simulate Transfer Between Accounts</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {accounts.map((acc) => {
              const isFlagged = acc.status !== "ACTIVE";
              return (
                <div
                  key={acc.id}
                  className={`p-3.5 rounded-2xl border transition duration-200 ${
                    isFlagged
                      ? "bg-rose-950/20 border-rose-800/50 hover:border-rose-600/80"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-cyan-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        isFlagged
                          ? "bg-rose-950 text-rose-300 border border-rose-700/60"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                      }`}
                    >
                      {acc.status}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {acc.currency}
                    </span>
                  </div>
                  <div className="font-bold text-white text-xs truncate" title={acc.accountName}>
                    {acc.accountName}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                    {acc.accountNumber}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                    <span className="text-[10px] text-slate-500">Balance:</span>
                    <span className="font-mono font-bold text-white text-xs">
                      ฿{Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                placeholder="Search account, amount, txn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-52 sm:w-64 transition"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              {["ALL", "APPROVED", "FLAGGED", "REJECTED"].map((st) => (
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

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800/80 uppercase tracking-wider text-[11px] text-slate-400 font-bold">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Source (Debit)</th>
                <th className="px-5 py-3.5">Destination (Credit)</th>
                <th className="px-5 py-3.5">Amount (THB)</th>
                <th className="px-5 py-3.5">Risk Score</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500 font-medium">
                    No transactions found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setInspectedTx(tx)}
                    className="hover:bg-slate-800/40 transition duration-150 group cursor-pointer"
                  >
                    {/* Timestamp */}
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      {new Date(tx.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                      <span className="block text-[10px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Source Account */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-xs">
                        {tx.sourceAccount.accountName}
                      </div>
                      <div className="font-mono text-[11px] text-cyan-400">
                        {tx.sourceAccount.accountNumber}
                      </div>
                    </td>

                    {/* Destination Account */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-xs">
                        {tx.destinationAccount.accountName}
                      </div>
                      <div className="font-mono text-[11px] text-blue-400">
                        {tx.destinationAccount.accountNumber}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 font-mono font-bold text-white text-sm">
                      ฿{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span className="text-[10px] font-sans font-normal text-slate-400 ml-1.5 px-1.5 py-0.5 rounded bg-slate-800">
                        {tx.type}
                      </span>
                    </td>

                    {/* Risk Score */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-14 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              tx.riskScore >= 0.65
                                ? "bg-rose-500"
                                : tx.riskScore >= 0.35
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, tx.riskScore * 100))}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono font-bold text-xs ${
                            tx.riskScore >= 0.65
                              ? "text-rose-400"
                              : tx.riskScore >= 0.35
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {(tx.riskScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          tx.status === "APPROVED"
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"
                            : tx.status === "FLAGGED"
                            ? "bg-amber-950/80 text-amber-300 border border-amber-700/60"
                            : "bg-rose-950/80 text-rose-300 border border-rose-700/60"
                        }`}
                      >
                        <span>{tx.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectInCopilot(tx);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-950/80 hover:text-cyan-300 text-slate-300 text-xs font-semibold border border-slate-700/80 hover:border-cyan-600/60 transition cursor-pointer"
                        title="Inspect transaction against BOT & AMLO regulations in Copilot"
                      >
                        <span>Inspect in Copilot</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Inspection Modal */}
      {inspectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#080d1a] border border-cyan-700/60 rounded-3xl p-6 sm:p-7 relative shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-white text-base">Transaction Ledger Record</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inspectedTx.status === "APPROVED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                          : inspectedTx.status === "FLAGGED"
                          ? "bg-amber-950 text-amber-300 border border-amber-700/60"
                          : "bg-rose-950 text-rose-300 border border-rose-700/60"
                      }`}
                    >
                      {inspectedTx.status}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-400 mt-0.5">
                    {inspectedTx.id} &bull; {new Date(inspectedTx.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedTx(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Double-Entry Ledger Movement */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                    <Scale className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Double-Entry Settlement Breakdown</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                    Balanced (Net Zero Delta)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Debit Account */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/40">
                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                      Debit Account (Source)
                    </div>
                    <div className="font-bold text-white text-xs mt-1">
                      {inspectedTx.sourceAccount.accountName}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {inspectedTx.sourceAccount.accountNumber}
                    </div>
                    <div className="mt-2 font-mono font-bold text-rose-300 text-xs">
                      -฿{Number(inspectedTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Credit Account */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/40">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Credit Account (Destination)
                    </div>
                    <div className="font-bold text-white text-xs mt-1">
                      {inspectedTx.destinationAccount.accountName}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {inspectedTx.destinationAccount.accountNumber}
                    </div>
                    <div className="mt-2 font-mono font-bold text-emerald-300 text-xs">
                      +฿{Number(inspectedTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Engine Assessment */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Autonomous Risk Evaluation</span>
                  </span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      inspectedTx.riskScore >= 0.65
                        ? "text-rose-400"
                        : inspectedTx.riskScore >= 0.35
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    Risk Score: {(inspectedTx.riskScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed border border-slate-800">
                  {inspectedTx.riskReason || "Parameters compliant with standard thresholds."}
                </div>
              </div>

              {/* PDPA Intercepted Metadata */}
              {inspectedTx.metadata && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PDPA / PII Intercepted Metadata</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                      PII Masked
                    </span>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 text-cyan-200 font-mono text-[11px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(inspectedTx.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => {
                    const tx = inspectedTx;
                    setInspectedTx(null);
                    handleInspectInCopilot(tx);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-cyan-600/20"
                >
                  <Bot className="w-4 h-4" />
                  <span>Analyze in Compliance AI Copilot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setInspectedTx(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer text-center"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Neon PostgreSQL Setup Guide Modal */}
      {showNeonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#080d1a] border border-cyan-800/70 rounded-3xl p-6 sm:p-7 relative shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Connect to Neon Serverless PostgreSQL</h3>
                  <p className="text-xs text-slate-400">Persistent ACID double-entry ledger & pgvector directives</p>
                </div>
              </div>
              <button
                onClick={() => setShowNeonModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-300 flex items-center justify-between">
                  <span>Step 1: Paste Neon URL into your .env file</span>
                  <button
                    onClick={copyNeonTemplate}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[11px] font-bold border border-cyan-700/60 transition cursor-pointer"
                  >
                    {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEnv ? "Copied" : "Copy Template"}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-200 overflow-x-auto">
{`# In your .env file:
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-XYZ-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-XYZ.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"`}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="font-bold text-white">Step 2: Push Schema & Seed Initial BFSI Accounts</div>
                <p className="text-slate-400 text-[11px]">
                  Run this single command in terminal to create all tables (pgvector, ACID ledger, audit trail) and seed initial accounts:
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-400">
                  npm run db:setup
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-[11px] text-cyan-300">
                <span className="font-bold block mb-1">💡 Real-Time Simulator Note:</span>
                While awaiting your Neon URL, the in-memory double-entry simulator is 100% active. You can execute transfers, test AML thresholds, and verify cryptographic hashes right now.
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowNeonModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Got It, Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X(props: { className?: string }) {
  return (
    <svg className={props.className || "w-5 h-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
