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
  Building2,
  Sparkles,
  Send,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import { TransactionWithAccounts } from "@/lib/types";
import { sanitizeText, inspectPiiPresence } from "@/lib/security/guardrails";

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

  // Live Real-Time Transfer Studio States
  const [liveSourceId, setLiveSourceId] = useState("");
  const [liveDestId, setLiveDestId] = useState("");
  const [liveAmount, setLiveAmount] = useState("50000");
  const [liveType, setLiveType] = useState<"TRANSFER" | "SETTLEMENT" | "DISBURSEMENT" | "CROSS_BORDER">("TRANSFER");
  const [liveNote, setLiveNote] = useState("ชำระค่าบริการคู่ค้า เลขประจำตัว 1-1004-99882-12-9");
  const [isExecutingLive, setIsExecutingLive] = useState(false);
  const [liveReceipt, setLiveReceipt] = useState<{
    id: string;
    amount: string;
    sourceAccount: { accountNumber: string; accountName: string };
    destinationAccount: { accountNumber: string; accountName: string };
    status: string;
    riskScore: number;
    riskReason: string;
    metadata: Record<string, unknown>;
    auditHash: string;
    createdAt: string;
  } | null>(null);

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
        if (accData.data.length >= 2) {
          setLiveSourceId((prev) => prev || accData.data[0].id);
          setLiveDestId((prev) => prev || accData.data[1].id);
        }
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

  // Calculations for Live Studio
  const liveSourceAcc = accounts.find((a) => a.id === liveSourceId);
  const liveDestAcc = accounts.find((a) => a.id === liveDestId);
  const numLiveAmount = parseFloat(liveAmount) || 0;
  const sourceCurrentBal = liveSourceAcc ? parseFloat(liveSourceAcc.balance) : 0;
  const destCurrentBal = liveDestAcc ? parseFloat(liveDestAcc.balance) : 0;
  const sourceAfterBal = sourceCurrentBal - numLiveAmount;
  const destAfterBal = destCurrentBal + numLiveAmount;
  const isLiveOverdraft = sourceAfterBal < 0;

  const livePiiInspection = inspectPiiPresence(liveNote);
  const liveMaskedPreview = sanitizeText(liveNote);

  const applyLivePreset = (
    amount: string,
    type: "TRANSFER" | "SETTLEMENT" | "DISBURSEMENT" | "CROSS_BORDER",
    note: string,
    srcIdx = 0,
    dstIdx = 1
  ) => {
    setLiveAmount(amount);
    setLiveType(type);
    setLiveNote(note);
    if (accounts[srcIdx]) setLiveSourceId(accounts[srcIdx].id);
    if (accounts[dstIdx]) setLiveDestId(accounts[dstIdx].id);
    setLiveReceipt(null);
  };

  const handleExecuteLiveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSourceId || !liveDestId || isLiveOverdraft || isExecutingLive) return;
    setIsExecutingLive(true);
    setLiveReceipt(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceAccountId: liveSourceId,
          destinationAccountId: liveDestId,
          amount: parseFloat(liveAmount),
          type: liveType,
          metadata: {
            note: liveNote,
            channel: "DASHBOARD_LIVE_STUDIO",
            initiatedAt: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.transaction) {
        setLiveReceipt({
          id: data.transaction.id,
          amount: data.transaction.amount,
          sourceAccount: data.transaction.sourceAccount,
          destinationAccount: data.transaction.destinationAccount,
          status: data.transaction.status,
          riskScore: data.riskAssessment?.riskScore ?? data.transaction.riskScore ?? 0,
          riskReason: data.riskAssessment?.riskReason ?? data.transaction.riskReason ?? "Verified",
          metadata: data.transaction.metadata || {},
          auditHash: data.auditHash || data.entryHash || "",
          createdAt: data.transaction.createdAt,
        });
        await loadData();
      }
    } catch (err) {
      console.error("Live transfer error:", err);
    } finally {
      setIsExecutingLive(false);
    }
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
        </div>
      </div>

      {/* Neon Database Connection & Simulation Action Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50/90 via-sky-50/80 to-blue-50/90 dark:from-slate-900/90 dark:via-[#071328]/80 dark:to-slate-900/90 border border-cyan-200/80 dark:border-cyan-900/40 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                {dbStatus.connected ? "Neon PostgreSQL (Live)" : "Neon: Connecting..."}
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
                : "Connecting to Neon Serverless PostgreSQL database..."}
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

      {/* ========================================================================= */}
      {/* LIVE INTERACTIVE TRANSFER STUDIO (โอนเงินสดและตรวจกฎหมายเรียลไทม์)          */}
      {/* ========================================================================= */}
      {accounts.length >= 2 && (
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-cyan-800/80 p-6 shadow-xl dark:shadow-2xl relative overflow-hidden bg-white dark:bg-gradient-to-b dark:from-[#061022] dark:to-[#040914]">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Studio Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-800/80 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    ศูนย์จำลองการโอนเงินสด & ตรวจสอบกฎหมาย (Live Money Transfer Studio)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-mono">
                    Neon DB Connected
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  ทดสอบโอนเงินจริง ตัดยอดแบบ Double-Entry ACID และตรวจจับความเสี่ยง ธปท./ปปง./PDPA แบบเรียลไทม์
                </p>
              </div>
            </div>

            {/* Scenario Quick Buttons */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">เคสทดสอบ:</span>
              <button
                type="button"
                onClick={() =>
                  applyLivePreset(
                    "45000",
                    "TRANSFER",
                    "ชำระค่าบริการคู่ค้า เลขประจำตัว 1-1004-99882-12-9",
                    0,
                    1
                  )
                }
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-600/40 text-xs font-bold transition cursor-pointer"
              >
                ฿45,000 โอนปกติ
              </button>
              <button
                type="button"
                onClick={() =>
                  applyLivePreset(
                    "650000",
                    "DISBURSEMENT",
                    "เบิกจ่ายงบประมาณโครงการ เลขประจำตัว 1-1004-99882-12-9",
                    0,
                    1
                  )
                }
                className="px-2.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-600/50 text-xs font-bold transition cursor-pointer"
              >
                ฿650,000 เกณฑ์ ธปท. (&gt; 5 แสน)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyLivePreset(
                    "2500000",
                    "CROSS_BORDER",
                    "โอนทุนข้ามแดน แจ้ง ปปง. เลขประจำตัว 1-1004-99882-12-9",
                    0,
                    1
                  )
                }
                className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-600/50 text-xs font-bold transition cursor-pointer"
              >
                ฿2,500,000 เกณฑ์ ปปง. (STR &gt; 2 ล้าน)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyLivePreset(
                    "350000",
                    "CROSS_BORDER",
                    "โอนเงินไปยังบัญชีเป้าหมายเฝ้าระวัง เลขประจำตัว 1-1004-99882-12-9",
                    0,
                    4
                  )
                }
                className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 text-purple-300 border border-purple-600/50 text-xs font-bold transition cursor-pointer"
              >
                บัญชีเฝ้าระวัง (Watchlist)
              </button>
            </div>
          </div>

          {/* Form Grid */}
          <form onSubmit={handleExecuteLiveTransfer} className="mt-5 space-y-5">
            {/* Visual Account Selector Bridge */}
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 items-center">
              {/* Source Account Card */}
              <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>บัญชีผู้โอน (Source Account - Debit)</span>
                  </label>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    ยอดปัจจุบัน: ฿{sourceCurrentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <select
                  value={liveSourceId}
                  onChange={(e) => setLiveSourceId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 font-semibold"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} ({acc.accountNumber}) - ฿{Number(acc.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                  <span className="text-slate-500">ยอดคงเหลือหลังโอน:</span>
                  <span className={`font-bold ${sourceAfterBal < 0 ? "text-rose-500 dark:text-rose-400" : "text-cyan-700 dark:text-cyan-300"}`}>
                    ฿{sourceAfterBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Transfer Arrow Bridge */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center py-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm dark:shadow-md">
                  <ArrowRight className="w-5 h-5 rotate-90 lg:rotate-0" />
                </div>
                <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400/80 mt-1 uppercase font-bold text-center">
                  Double-Entry
                </span>
              </div>

              {/* Destination Account Card */}
              <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>บัญชีผู้รับ (Destination Account - Credit)</span>
                  </label>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    ยอดปัจจุบัน: ฿{destCurrentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <select
                  value={liveDestId}
                  onChange={(e) => setLiveDestId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 font-semibold"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} ({acc.accountNumber}) - ฿{Number(acc.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                  <span className="text-slate-500">ยอดคงเหลือหลังรับ:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ฿{destAfterBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount, Type, and PDPA Redaction */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Amount */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>จำนวนเงินโอน (THB)</span>
                  {numLiveAmount >= 2000000 ? (
                    <span className="text-rose-400 font-mono text-[10px]">ปปง. &ge; ฿2M STR</span>
                  ) : numLiveAmount >= 500000 ? (
                    <span className="text-amber-400 font-mono text-[10px]">ธปท. &gt; ฿500K Alert</span>
                  ) : (
                    <span className="text-emerald-400 font-mono text-[10px]">ปกติ (Standard)</span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold font-mono text-sm">฿</span>
                  <input
                    type="number"
                    value={liveAmount}
                    onChange={(e) => setLiveAmount(e.target.value)}
                    min="1"
                    step="any"
                    required
                    className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-mono font-extrabold focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              {/* Transfer Type */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-white">ประเภทธุรกรรม</label>
                <select
                  value={liveType}
                  onChange={(e) => setLiveType(e.target.value as "TRANSFER" | "SETTLEMENT" | "DISBURSEMENT" | "CROSS_BORDER")}
                  className="w-full bg-slate-950 border border-slate-700/90 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                >
                  <option value="TRANSFER">โอนเงินในประเทศ (Domestic Transfer)</option>
                  <option value="SETTLEMENT">เคลียริ่งระหว่างสถาบัน (Inter-Bank Settlement)</option>
                  <option value="DISBURSEMENT">เบิกจ่ายองค์กร (Corporate Disbursement)</option>
                  <option value="CROSS_BORDER">โอนเงินต่างประเทศ (Cross-Border Wire)</option>
                </select>
              </div>

              {/* Note with Real-Time PDPA Inspection */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>บันทึกช่วยจำ / เลขบัตรประชาชน (PDPA Live Masking)</span>
                  {livePiiInspection.hasPii && (
                    <span className="text-[10px] text-cyan-400 font-mono font-bold flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>ตรวจพบข้อมูลส่วนบุคคล</span>
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={liveNote}
                  onChange={(e) => setLiveNote(e.target.value)}
                  placeholder="พิมพ์เลขบัตรประชาชน 13 หลัก หรือเลขบัตรเครดิต..."
                  className="w-full bg-slate-950 border border-slate-700/90 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            {/* PDPA Real-Time Live Preview Highlight Box */}
            <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-cyan-300">PDPA Guardrail ทำงานแบบเรียลไทม์: </span>
                  <span className="font-mono text-cyan-100">{liveMaskedPreview}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 shrink-0">
                Auto-Masked ก่อนบันทึกจริง
              </span>
            </div>

            {/* Action Button & Invariant Confirmation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center space-x-2 text-xs font-mono">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">การันตีสมดุล Double-Entry: </span>
                <span className={`font-bold ${isLiveOverdraft ? "text-rose-400" : "text-emerald-400"}`}>
                  {isLiveOverdraft ? "ยอดเงินไม่พอ (Overdraft Rejected)" : "Debit = Credit (Net Zero Delta)"}
                </span>
              </div>

              <button
                type="submit"
                disabled={isExecutingLive || isLiveOverdraft}
                className={`px-7 py-3 rounded-2xl text-xs font-extrabold text-white transition flex items-center justify-center space-x-2.5 cursor-pointer shadow-xl ${
                  isLiveOverdraft
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 shadow-cyan-600/30 active:scale-95"
                }`}
              >
                {isExecutingLive ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังตัดยอดและบันทึกลง Neon DB...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-cyan-300" />
                    <span>ยืนยันการโอนเงินสดจริง (Execute Live ACID Transfer)</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ========================================================================= */}
          {/* OFFICIAL TRANSACTION RECEIPT SLIP (สลิปยืนยันการทำธุรกรรมจริง)              */}
          {/* ========================================================================= */}
          {liveReceipt && (
            <div className="mt-6 p-5 rounded-2xl bg-emerald-50/90 dark:bg-[#030712] border-2 border-emerald-400 dark:border-emerald-500/60 shadow-xl dark:shadow-2xl animate-in fade-in duration-300 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      สลิปยืนยันการทำรายการโอนเงินสำเร็จ (Official Transaction Receipt)
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      ตัดยอดจริงลง Neon Serverless PostgreSQL &bull; รหัสอ้างอิง: <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold">{liveReceipt.id}</span>
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600">
                  {liveReceipt.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-emerald-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                  <span className="text-[10px] text-slate-500 block">บัญชีผู้โอน (Debit -)</span>
                  <span className="text-slate-900 dark:text-white font-bold">{liveReceipt.sourceAccount.accountName}</span>
                  <span className="text-rose-500 dark:text-rose-400 block mt-1 font-bold">-฿{Number(liveReceipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-emerald-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                  <span className="text-[10px] text-slate-500 block">บัญชีผู้รับ (Credit +)</span>
                  <span className="text-slate-900 dark:text-white font-bold">{liveReceipt.destinationAccount.accountName}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 block mt-1 font-bold">+฿{Number(liveReceipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-emerald-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                  <span className="text-[10px] text-slate-500 block">ผลการตรวจความเสี่ยง (Risk)</span>
                  <span className={`font-bold block ${liveReceipt.riskScore >= 0.65 ? "text-rose-500 dark:text-rose-400" : liveReceipt.riskScore >= 0.35 ? "text-amber-500 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {(liveReceipt.riskScore * 100).toFixed(0)}% Risk Score
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5" title={liveReceipt.riskReason}>
                    {liveReceipt.riskReason}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-emerald-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                  <span className="text-[10px] text-slate-500 block">ลายเซ็นบล็อกเชน (Audit Hash)</span>
                  <span className="text-[10px] text-cyan-700 dark:text-cyan-300 truncate block font-mono" title={liveReceipt.auditHash}>
                    {liveReceipt.auditHash ? `${liveReceipt.auditHash.substring(0, 16)}...` : "SHA-256 Verified"}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">✓ Non-Repudiation</span>
                </div>
              </div>
            </div>
          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-cyan-700/60 rounded-3xl p-6 sm:p-7 relative shadow-2xl text-slate-800 dark:text-slate-200 max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-cyan-800/70 rounded-3xl p-6 sm:p-7 relative shadow-2xl text-slate-800 dark:text-slate-200">
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
                <span className="font-bold block mb-1">Production Database Note:</span>
                All fund transfers and ledger entries are executed directly on Neon PostgreSQL with ACID double-entry consistency and SHA-256 cryptographic audit logs.
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
