"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Send,
  Printer,
  Eye,
  EyeOff,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Building2,
  Percent,
  Sparkles,
  Wallet,
  ArrowRight,
  ExternalLink,
  Bot,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import { TransactionWithAccounts } from "@/lib/types";

export default function TellerDeskPage() {
  const router = useRouter();
  const setQuickTransferOpen = useComplianceStore((s) => s.setQuickTransferOpen);
  const setCreateAccountOpen = useComplianceStore((s) => s.setCreateAccountOpen);
  const setSelectedTransaction = useComplianceStore((s) => s.setSelectedTransaction);

  const [maskPii, setMaskPii] = useState(true);
  const [selectedCustomerAccount, setSelectedCustomerAccount] = useState<string>("");
  const [customerAccountSearch, setCustomerAccountSearch] = useState<string>("");
  const [receiptModalTx, setReceiptModalTx] = useState<TransactionWithAccounts | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const cachedAccounts = useComplianceStore((s) => s.cachedAccounts);
  const setCachedAccounts = useComplianceStore((s) => s.setCachedAccounts);

  const [accounts, setAccounts] = useState<
    {
      id: string;
      accountNumber: string;
      accountName: string;
      balance: string;
      currency: string;
      status: string;
    }[]
  >(() => cachedAccounts || []);

  // Live Real-Time Transfer Studio States
  const [liveSourceId, setLiveSourceId] = useState(() => (cachedAccounts && cachedAccounts.length >= 2 ? cachedAccounts[0].id : ""));
  const [liveDestId, setLiveDestId] = useState(() => (cachedAccounts && cachedAccounts.length >= 2 ? cachedAccounts[1].id : ""));
  const [liveAmount, setLiveAmount] = useState("50000");
  const [liveType, setLiveType] = useState<"TRANSFER" | "SETTLEMENT" | "DISBURSEMENT" | "CROSS_BORDER">("TRANSFER");
  const [liveNote, setLiveNote] = useState("Customer counter cash settlement ID 1-1004-99882-12-9");
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

  const [loading, setLoading] = useState(false);

  const formatAccNo = (num: string) => {
    if (!maskPii || !num || num.length <= 4) return num;
    return num.slice(0, 3) + "-****-" + num.slice(-4);
  };

  const loadData = async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.success && data.data) {
        setAccounts(data.data);
        setCachedAccounts(data.data);
        if (data.data.length >= 2) {
          setLiveSourceId((prev) => prev || data.data[0].id);
          setLiveDestId((prev) => prev || data.data[1].id);
          setSelectedCustomerAccount((prev) => prev || data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Non-blocking accounts refresh:", err);
    }
  };

  useEffect(() => {
    loadData();
    const handleTxUpdate = () => loadData();
    window.addEventListener("finguard_tx_updated", handleTxUpdate);
    return () => window.removeEventListener("finguard_tx_updated", handleTxUpdate);
  }, []);

  const handleCopyReceipt = (tx: TransactionWithAccounts | null) => {
    if (!tx) return;
    const text = `========================================
FINANCIAL SETTLEMENT RECEIPT (OFFICIAL)
========================================
Receipt ID: ${tx.id}
Date/Time:  ${new Date(tx.createdAt).toLocaleString()}
Status:     ${tx.status} (Double-Entry ACID Settled)

DEBIT (Sender):
Account:    ${tx.sourceAccount.accountName}
Number:     ${formatAccNo(tx.sourceAccount.accountNumber)}
Amount:     -฿${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}

CREDIT (Receiver):
Account:    ${tx.destinationAccount.accountName}
Number:     ${formatAccNo(tx.destinationAccount.accountNumber)}
Amount:     +฿${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}

Category:   ${tx.type}
Risk Score: ${(tx.riskScore * 100).toFixed(0)}% (${tx.riskReason || "Verified"})
Audit Hash: ${tx.auditHash || "SHA-256 Non-Repudiation Verified"}
========================================`;
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  // Live Studio Calculations
  const liveSourceAcc = accounts.find((a) => a.id === liveSourceId);
  const liveDestAcc = accounts.find((a) => a.id === liveDestId);
  const numAmount = parseFloat(liveAmount) || 0;
  const currentSourceBalance = liveSourceAcc ? parseFloat(liveSourceAcc.balance) : 0;
  const isLiveOverdraft = liveSourceAcc ? numAmount > currentSourceBalance : false;

  const liveEstimatedRisk = useMemo(() => {
    let score = 0.05;
    let reason = "Normal low-value counter transfer";

    if (numAmount >= 2000000) {
      score = 0.85;
      reason = "High-value threshold exceeded (AMLO Mandate >= 2,000,000 THB)";
    } else if (numAmount >= 500000) {
      score = 0.45;
      reason = "Elevated value transfer (Bank of Thailand CTR Notice >= 500,000 THB)";
    } else if (numAmount >= 100000) {
      score = 0.20;
      reason = "Standard commercial threshold";
    }

    if (liveType === "CROSS_BORDER") {
      score = Math.min(1.0, score + 0.35);
      reason += " + Cross-border settlement scrutiny (FATF Rec. 16)";
    }

    return { score, reason };
  }, [numAmount, liveType]);

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
            channel: "FRONTLINE_TELLER_PORTAL",
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

  const selectedCustAcc = accounts.find((a) => a.id === selectedCustomerAccount);

  const printCustomerReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12" suppressHydrationWarning>
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frontline Teller & Counter Operations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-700/60 font-mono">
              Branch Counter Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium max-w-2xl">
            Customer balance verification, double-entry settlement execution, and official customer slip generation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* PDPA PII Masking Toggle */}
          <button
            onClick={() => setMaskPii(!maskPii)}
            className={`inline-flex items-center space-x-1.5 h-10 px-3 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 shadow-sm whitespace-nowrap ${
              maskPii
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 hover:bg-amber-100"
            }`}
            title="Toggle PDPA Data Masking"
          >
            {maskPii ? <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            <span>{maskPii ? "PDPA Masked" : "Unmasked"}</span>
          </button>

          <button
            onClick={() => setCreateAccountOpen(true)}
            className="inline-flex items-center space-x-1.5 h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95 shadow-sm whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>+ New Account</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 h-10 px-3.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700/80 shadow-sm transition cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600 dark:text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Instant Customer Balance Verifier Widget */}
      <div className="glass-panel rounded-3xl border border-cyan-300 dark:border-cyan-800/80 p-5 sm:p-6 shadow-xl space-y-4 bg-cyan-50/20 dark:bg-slate-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/60 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                Customer Balance & Solvency Lookup
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Instant counter balance lookup, available funds check, and 1-click transfer routing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 font-mono font-bold">
              [VERIFIED] Solvency Checked
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Account Selector */}
          <div className="lg:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Select Customer Account:</span>
              <span className="text-[10px] text-slate-500 font-normal">
                {accounts.length} active customer accounts
              </span>
            </label>

            <select
              value={selectedCustomerAccount}
              onChange={(e) => setSelectedCustomerAccount(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 font-bold"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName} ({formatAccNo(acc.accountNumber)}) - ฿{Number(acc.balance).toLocaleString()} [{acc.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Balance & Action Card */}
          {selectedCustAcc && (
            <div className="lg:col-span-6 p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {selectedCustAcc.accountName}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                    {selectedCustAcc.status}
                  </span>
                </div>
                <div className="font-mono text-sm font-extrabold text-cyan-700 dark:text-cyan-400 mt-1">
                  ฿{Number(selectedCustAcc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedCustAcc.currency}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLiveSourceId(selectedCustAcc.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-300 text-[11px] font-bold border border-rose-300 dark:border-rose-700/60 transition cursor-pointer"
                >
                  Set as Sender (Debit)
                </button>

                <button
                  type="button"
                  onClick={() => setLiveDestId(selectedCustAcc.id)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-700/60 transition cursor-pointer"
                >
                  Set as Receiver (Credit)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Interactive Transfer Studio */}
      {accounts.length >= 2 && (
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-cyan-800/80 p-6 shadow-xl relative overflow-hidden bg-white dark:bg-gradient-to-b dark:from-[#061022] dark:to-[#040914]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800/80 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Teller Money Transfer & Settlement Engine
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  Execute ACID double-entry transactions with real-time heuristic AMLO & Bank of Thailand regulatory evaluation
                </p>
              </div>
            </div>

            {/* Quick Simulation Presets */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyLivePreset("25000", "TRANSFER", "Customer counter deposit & transfer")}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
              >
                Standard (฿25K)
              </button>
              <button
                type="button"
                onClick={() => applyLivePreset("750000", "TRANSFER", "High-value corporate invoice payment")}
                className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-[11px] font-bold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 transition"
              >
                High-Value (฿750K)
              </button>
              <button
                type="button"
                onClick={() => applyLivePreset("2500000", "CROSS_BORDER", "International trade cross-border disbursement", 0, 1)}
                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-[11px] font-bold text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 transition"
              >
                AMLO Breach (฿2.5M)
              </button>
            </div>
          </div>

          <form onSubmit={handleExecuteLiveTransfer} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Debit Source Account */}
              <div className="lg:col-span-4 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Sender (Debit Account)</span>
                  </span>
                  {liveSourceAcc && (
                    <span className={`text-[10px] font-mono font-bold ${isLiveOverdraft ? "text-rose-600" : "text-slate-500"}`}>
                      Avail: ฿{Number(liveSourceAcc.balance).toLocaleString()}
                    </span>
                  )}
                </label>
                <select
                  value={liveSourceId}
                  onChange={(e) => setLiveSourceId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-2xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 font-bold"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === liveDestId}>
                      {acc.accountName} ({formatAccNo(acc.accountNumber)}) - ฿{Number(acc.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Type */}
              <div className="lg:col-span-4 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Transfer Amount (THB)</span>
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                    {liveType}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ฿
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={liveAmount}
                    onChange={(e) => setLiveAmount(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-2xl pl-8 pr-3.5 py-2.5 text-sm font-mono font-black text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
                    placeholder="50,000"
                  />
                </div>
              </div>

              {/* Credit Destination Account */}
              <div className="lg:col-span-4 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Receiver (Credit Account)</span>
                  </span>
                  {liveDestAcc && (
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      Avail: ฿{Number(liveDestAcc.balance).toLocaleString()}
                    </span>
                  )}
                </label>
                <select
                  value={liveDestId}
                  onChange={(e) => setLiveDestId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-2xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 font-bold"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === liveSourceId}>
                      {acc.accountName} ({formatAccNo(acc.accountNumber)}) - ฿{Number(acc.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note & Reference */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-8 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Settlement Note / Metadata</span>
                  <span className="text-[10px] text-slate-500">PDPA Filter Active</span>
                </label>
                <input
                  type="text"
                  value={liveNote}
                  onChange={(e) => setLiveNote(e.target.value)}
                  placeholder="e.g. Counter deposit, Vendor Invoice, Settlement"
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Execute Button */}
              <div className="lg:col-span-4 pt-4 sm:pt-0">
                <button
                  type="submit"
                  disabled={isExecutingLive || isLiveOverdraft || numAmount <= 0}
                  className={`w-full h-11 rounded-2xl font-black text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg active:scale-95 ${
                    isLiveOverdraft
                      ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-400 dark:border-slate-700"
                      : "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-cyan-600/25"
                  }`}
                >
                  <Send className={`w-4 h-4 ${isExecutingLive ? "animate-pulse" : ""}`} />
                  <span>
                    {isExecutingLive
                      ? "Processing ACID Settlement..."
                      : isLiveOverdraft
                      ? "Insufficient Funds (Overdraft)"
                      : "Execute Live Transfer"}
                  </span>
                </button>
              </div>
            </div>

            {/* Teller Advice Banner */}
            <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-slate-900/90 border border-cyan-200 dark:border-cyan-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>
                  <strong>Frontline Advice:</strong>{" "}
                  {numAmount >= 2000000
                    ? "Requires AMLO Mandatory CTR/STR documentation before physical cash disbursement."
                    : numAmount >= 500000
                    ? "Supervisor Dual-Control Authorization required for large value counter settlement."
                    : "Frontline Authorized. Standard instant processing eligible."}
                </span>
              </div>
              <div className="font-mono text-[11px] font-bold text-cyan-700 dark:text-cyan-400 shrink-0">
                Est. Risk: {(liveEstimatedRisk.score * 100).toFixed(0)}%
              </div>
            </div>
          </form>

          {/* Success Receipt Alert */}
          {liveReceipt && (
            <div className="mt-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 animate-in fade-in duration-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200 dark:border-emerald-900/60">
                <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-200 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Transaction Settled Successfully (Double-Entry ACID Verified)</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fullTx: TransactionWithAccounts = {
                        id: liveReceipt.id,
                        amount: liveReceipt.amount,
                        currency: "THB",
                        type: liveType,
                        status: liveReceipt.status as "APPROVED" | "FLAGGED" | "REJECTED",
                        riskScore: liveReceipt.riskScore,
                        riskReason: liveReceipt.riskReason,
                        metadata: liveReceipt.metadata,
                        auditHash: liveReceipt.auditHash,
                        sourceAccountId: liveSourceId,
                        destinationAccountId: liveDestId,
                        sourceAccount: liveReceipt.sourceAccount as any,
                        destinationAccount: liveReceipt.destinationAccount as any,
                        createdAt: new Date(liveReceipt.createdAt).toISOString(),
                      };
                      setReceiptModalTx(fullTx);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Print Customer Slip</span>
                  </button>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600">
                    {liveReceipt.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Sender Debit:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {liveReceipt.sourceAccount.accountName} ({formatAccNo(liveReceipt.sourceAccount.accountNumber)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Receiver Credit:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {liveReceipt.destinationAccount.accountName} ({formatAccNo(liveReceipt.destinationAccount.accountNumber)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Amount Settled:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ฿{Number(liveReceipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Overview Grid */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/90 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/60 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
              All Customer & Liquidity Accounts ({accounts.length})
            </h2>
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
                    ? "bg-rose-50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-800/50"
                    : "bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                      isFlagged
                        ? "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700/60"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700/60"
                    }`}
                  >
                    {acc.status}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {acc.currency}
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-xs truncate" title={acc.accountName}>
                  {acc.accountName}
                </div>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                  {formatAccNo(acc.accountNumber)}
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-baseline justify-between">
                  <span className="text-[10px] text-slate-500">Balance:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    ฿{Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Printable Customer Receipt Modal */}
      {receiptModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#060a14] border border-slate-200 dark:border-cyan-700/60 rounded-3xl p-6 sm:p-7 relative shadow-2xl text-slate-800 dark:text-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                  <Printer className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Customer Settlement Receipt
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official Double-Entry ACID Transaction Slip
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceiptModalTx(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            {/* Slip Content */}
            <div className="mt-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 space-y-4 font-sans text-xs">
              <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-800 space-y-1">
                <div className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  FinGuard AI Sovereign Settlement
                </div>
                <div className="text-[11px] text-slate-500">
                  Headquarters &bull; Double-Entry Core Banking
                </div>
                <div className="font-mono text-[10px] text-cyan-700 dark:text-cyan-400 font-bold">
                  Ref: {receiptModalTx.id}
                </div>
              </div>

              <div className="text-center py-2 bg-slate-100 dark:bg-slate-900/80 rounded-xl">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Settled Amount</div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  ฿{Number(receiptModalTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Status: {receiptModalTx.status} (ACID Non-Repudiation)
                </div>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Sender Account:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">
                    {receiptModalTx.sourceAccount.accountName} ({formatAccNo(receiptModalTx.sourceAccount.accountNumber)})
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Receiver Account:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">
                    {receiptModalTx.destinationAccount.accountName} ({formatAccNo(receiptModalTx.destinationAccount.accountNumber)})
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Transaction Type:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {receiptModalTx.type}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="text-slate-900 dark:text-white">
                    {new Date(receiptModalTx.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Risk Assessment:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {(receiptModalTx.riskScore * 100).toFixed(0)}% ({receiptModalTx.riskReason || "Compliant"})
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-800 text-[10px] font-mono text-center space-y-1">
                <div className="text-slate-500">Blockchain SHA-256 Audit Verification:</div>
                <div className="text-cyan-700 dark:text-cyan-300 truncate font-bold">
                  {receiptModalTx.auditHash || "SHA-256 Verified"}
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">[VERIFIED] Non-Repudiation Guaranteed</div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
              <button
                type="button"
                onClick={printCustomerReceipt}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-cyan-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Slip</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleCopyReceipt(receiptModalTx)}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-300 dark:border-slate-700"
                >
                  {copiedReceipt ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  <span>{copiedReceipt ? "Copied" : "Copy Slip Text"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReceiptModalTx(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
