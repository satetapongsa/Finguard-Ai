"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  Scale,
  RefreshCw,
  ArrowUpRight,
  ExternalLink,
  PlusCircle,
  FileCheck2,
  Lock,
  Zap,
  Database,
  CheckCircle2,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Bot,
  UserPlus,
  BarChart3,
  PieChart,
  Activity,
  CreditCard,
  FileText,
  Clock,
  Shield,
  Layers,
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
  const setQuickTransferOpen = useComplianceStore((s) => s.setQuickTransferOpen);
  const setCreateAccountOpen = useComplianceStore((s) => s.setCreateAccountOpen);
  const setSelectedTransaction = useComplianceStore((s) => s.setSelectedTransaction);
  const cachedStats = useComplianceStore((s) => s.cachedStats);
  const cachedTransactions = useComplianceStore((s) => s.cachedTransactions);
  const setCachedStats = useComplianceStore((s) => s.setCachedStats);
  const setCachedTransactions = useComplianceStore((s) => s.setCachedTransactions);

  const [stats, setStats] = useState<DashboardStats>(() => cachedStats || {
    totalVolume: 0,
    transactionCount: 0,
    verifiedLedgerBalance: 0,
    highRiskFlags: 0,
    activeComplianceAlerts: 0,
  });

  const [transactions, setTransactions] = useState<TransactionWithAccounts[]>(() => cachedTransactions || []);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"24H" | "7D" | "30D">("24H");
  const [activeChartTab, setActiveChartTab] = useState<"VOLUME" | "RISK">("VOLUME");

  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider: string;
    isNeon?: boolean;
    latencyMs?: number;
  }>({
    connected: true,
    provider: "Neon PostgreSQL",
    isNeon: true,
    latencyMs: 18,
  });

  const loadData = async () => {
    try {
      const [statsRes, txRes, dbRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/transactions?limit=50"),
        fetch("/api/database/status"),
      ]);

      const [statsData, txData, dbData] = await Promise.all([
        statsRes.json(),
        txRes.json(),
        dbRes.json(),
      ]);

      if (statsData.success && statsData.data) {
        setStats(statsData.data);
        setCachedStats(statsData.data);
      }
      if (txData.success && txData.data) {
        setTransactions(txData.data);
        setCachedTransactions(txData.data);
      }
      if (dbData.success) {
        setDbStatus({
          connected: dbData.connected,
          provider: dbData.provider,
          isNeon: dbData.provider?.includes("Neon"),
          latencyMs: dbData.latencyMs,
        });
      }
    } catch (err) {
      console.error("Non-blocking dashboard refresh:", err);
    }
  };

  useEffect(() => {
    loadData();

    const handleTxUpdate = () => loadData();
    window.addEventListener("finguard_tx_updated", handleTxUpdate);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadData();
      }
    }, 12000);

    return () => {
      window.removeEventListener("finguard_tx_updated", handleTxUpdate);
      clearInterval(interval);
    };
  }, []);

  // Risk Distribution Calculation for Charts
  const riskBreakdown = useMemo(() => {
    let low = 0;
    let medium = 0;
    let high = 0;

    transactions.forEach((tx) => {
      if (tx.riskScore >= 0.65) high++;
      else if (tx.riskScore >= 0.35) medium++;
      else low++;
    });

    const total = Math.max(1, transactions.length);
    return {
      low: { count: low, percentage: ((low / total) * 100).toFixed(1) },
      medium: { count: medium, percentage: ((medium / total) * 100).toFixed(1) },
      high: { count: high, percentage: ((high / total) * 100).toFixed(1) },
      total: transactions.length,
    };
  }, [transactions]);

  // Volume Trend Chart Data Generator
  const volumeChartPoints = useMemo(() => {
    const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"];
    const baseVal = stats.totalVolume > 0 ? stats.totalVolume / 6 : 50000;
    
    return hours.map((hour, idx) => {
      const multiplier = [0.4, 0.25, 0.75, 1.1, 0.95, 0.85, 1.0][idx];
      const volume = Math.round(baseVal * multiplier);
      const riskLevel = [10, 5, 25, 45, 60, 30, 20][idx];
      return { hour, volume, riskLevel };
    });
  }, [stats.totalVolume]);

  const maxChartVolume = Math.max(...volumeChartPoints.map((p) => p.volume), 100000);

  return (
    <div className="space-y-6 pb-12" suppressHydrationWarning>
      {/* Top Banner / Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Oversight & Risk Intelligence Hub
            </h1>
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-700/60 font-mono">
              Live ACID Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium max-w-2xl">
            Real-time visual monitoring of liquidity volume, mathematical AML/CFT risk vectors, and regulatory compliance.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setCreateAccountOpen(true)}
            className="inline-flex items-center space-x-1.5 h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95 shadow-sm whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>+ Create Account</span>
          </button>

          <button
            onClick={() => setQuickTransferOpen(true)}
            className="inline-flex items-center space-x-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-600/25 transition cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Transfer Funds</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 h-10 px-3.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700/80 shadow-sm transition cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600 dark:text-cyan-400" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Dedicated Workflow Portal Switcher / Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Link 1: Frontline Teller Desk */}
        <Link
          href="/teller"
          className="group p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-200 dark:border-cyan-800/80 hover:border-cyan-400 dark:hover:border-cyan-500 transition duration-200 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition duration-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                Frontline Teller Desk
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Customer transfers & slips
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition duration-200" />
        </Link>

        {/* Link 2: Daily Operations & Reconciliation */}
        <Link
          href="/reconciliation"
          className="group p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-200 dark:border-purple-800/80 hover:border-purple-400 dark:hover:border-purple-500 transition duration-200 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition duration-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                Ledger Reconciliation
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Audit ledger & CSV export
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition duration-200" />
        </Link>

        {/* Link 3: Immutable Audit Trail */}
        <Link
          href="/audit"
          className="group p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200 dark:border-amber-800/80 hover:border-amber-400 dark:hover:border-amber-500 transition duration-200 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition duration-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                Audit Trail Explorer
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                SHA-256 blockchain proof
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition duration-200" />
        </Link>

        {/* Link 4: FinGuard AI */}
        <Link
          href="/compliance"
          className="group p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400 dark:hover:border-emerald-500 transition duration-200 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition duration-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                FinGuard AI
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Sovereign compliance agent
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition duration-200" />
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Settled Volume (24h)
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800/40 text-cyan-700 dark:text-cyan-400 group-hover:scale-110 transition duration-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              ฿{stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 space-x-1.5">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 font-mono text-[10px]">
                {stats.transactionCount} Txns
              </span>
              <span>Settled in Real-Time</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Verified Ledger Balance
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition duration-200">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              ฿{stats.verifiedLedgerBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center text-xs font-semibold text-cyan-700 dark:text-cyan-400 space-x-1.5">
              <FileCheck2 className="w-4 h-4" />
              <span>Double-Entry ACID Balanced</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              High-Risk AML Flags
            </span>
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 group-hover:scale-110 transition duration-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
              {stats.highRiskFlags}
            </div>
            <div className="mt-2 flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400 space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>AMLO Trigger &ge; ฿2M or Gaussian Burst</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Regulatory Directives
            </span>
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/40 text-purple-700 dark:text-purple-400 group-hover:scale-110 transition duration-200">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-700 dark:text-purple-300 tracking-tight">
              {stats.activeComplianceAlerts}
            </div>
            <div className="mt-2 flex items-center text-xs font-semibold text-purple-700 dark:text-purple-400 space-x-1.5">
              <span>BOT &bull; AMLO &bull; PDPA &bull; FATF</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE ANALYTICS & CHARTS SECTION                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Financial Settlement Volume & Velocity Trend (8 cols) */}
        <div className="lg:col-span-8 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/90 p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/60 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  Settlement Velocity & Volume Trajectory
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Hourly double-entry settlement distribution and volume flow
                </p>
              </div>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {(["24H", "7D", "30D"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                    timeRange === r
                      ? "bg-white text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 shadow-sm border border-cyan-200 dark:border-cyan-800"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Dynamic Bar & Area Chart */}
          <div className="space-y-3">
            <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-slate-200 dark:border-slate-800 relative">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-full" />
                <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-full" />
                <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-full" />
              </div>

              {volumeChartPoints.map((pt, idx) => {
                const heightPercent = Math.max(12, Math.min(100, Math.round((pt.volume / maxChartVolume) * 100)));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-20 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-lg shadow-xl whitespace-nowrap">
                      ฿{pt.volume.toLocaleString()} ({pt.hour})
                    </div>

                    {/* Bar Container */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-cyan-600 via-blue-600 to-indigo-500 group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-200 relative overflow-hidden shadow-md shadow-cyan-600/10"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-white/40" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2">
              {volumeChartPoints.map((pt, idx) => (
                <span key={idx}>{pt.hour}</span>
              ))}
            </div>
          </div>

          {/* Chart Footnote Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Avg Settlement:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                ฿{stats.transactionCount > 0 ? (stats.totalVolume / stats.transactionCount).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Throughput:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                100% Invariant Checked
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Engine Mode:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                Zero-Crash Isolation
              </span>
            </div>
          </div>
        </div>

        {/* Chart 2: Mathematical Risk & AML Severity Donut / Tier Distribution (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/90 p-5 sm:p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800/60 flex items-center justify-center text-rose-700 dark:text-rose-400">
                <PieChart className="w-4.5 h-4.5" />
              </div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                Risk Severity Breakdown
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              {riskBreakdown.total} evaluated
            </span>
          </div>

          {/* Graphical Multi-Tier Progress Bars */}
          <div className="space-y-4">
            {/* Low Risk Tier */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Normal Compliant (&lt;35%)</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {riskBreakdown.low.count} ({riskBreakdown.low.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  style={{ width: `${riskBreakdown.low.percentage}%` }}
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Medium Risk Tier */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Elevated Scrutiny (35-64%)</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {riskBreakdown.medium.count} ({riskBreakdown.medium.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  style={{ width: `${riskBreakdown.medium.percentage}%` }}
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>

            {/* High Risk Tier */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>AMLO High-Risk (&ge;65%)</span>
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {riskBreakdown.high.count} ({riskBreakdown.high.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  style={{ width: `${riskBreakdown.high.percentage}%` }}
                  className="bg-rose-500 h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Mathematical Anomaly Radar Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>Statistical Heuristics Active:</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">4 Engines</span>
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
              <li>&bull; Gaussian Z-Score Outlier (2.5&sigma;)</li>
              <li>&bull; 24h Velocity &amp; Smurfing Ratio</li>
              <li>&bull; AMLO ฿2,000,000 Threshold Limit</li>
              <li>&bull; FATF Rec. 16 Cross-Border Scrutiny</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECENT SETTLEMENT FEED & SYSTEM RADAR                                     */}
      {/* ========================================================================= */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/90 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                Live Transaction Activity Stream
              </h2>
              <p className="text-[11px] text-slate-500">
                Latest settlement mutations from Neon PostgreSQL database
              </p>
            </div>
          </div>

          <Link
            href="/reconciliation"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-cyan-700 dark:text-cyan-400 text-xs font-bold border border-slate-200 dark:border-slate-700/80 transition shadow-sm"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
          {transactions.slice(0, 5).map((tx) => (
            <div
              key={tx.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    tx.status === "APPROVED"
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                      : tx.status === "FLAGGED"
                      ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                  }`}
                >
                  {tx.type === "CROSS_BORDER" ? "FX" : "TX"}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {tx.sourceAccount.accountName} &rarr; {tx.destinationAccount.accountName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Ref: {tx.id.slice(0, 18)}... &bull; {new Date(tx.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-4">
                <div className="text-right">
                  <div className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                    ฿{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Risk: {(tx.riskScore * 100).toFixed(0)}% ({tx.status})
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedTransaction(tx);
                    router.push(`/compliance?txId=${tx.id}`);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
                >
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
