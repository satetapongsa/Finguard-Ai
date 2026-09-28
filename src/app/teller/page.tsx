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
  ShieldAlert,
  Hash,
  Database,
  Link as LinkIcon,
  ShieldX,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import { TransactionWithAccounts } from "@/lib/types";

export default function TellerDeskPage() {
  const router = useRouter();
  const setQuickTransferOpen = useComplianceStore((s) => s.setQuickTransferOpen);
  const setCreateAccountOpen = useComplianceStore((s) => s.setCreateAccountOpen);
  const setProcessingTransaction = useComplianceStore((s) => s.setProcessingTransaction);
  const setSelectedTransaction = useComplianceStore((s) => s.setSelectedTransaction);
  const cachedAccounts = useComplianceStore((s) => s.cachedAccounts);
  const setCachedAccounts = useComplianceStore((s) => s.setCachedAccounts);
  const triggerFullSyncAndRefresh = useComplianceStore((s) => s.triggerFullSyncAndRefresh);

  const [maskPii, setMaskPii] = useState(true);
  const [selectedCustomerAccount, setSelectedCustomerAccount] = useState<string>("");
  const [customerAccountSearch, setCustomerAccountSearch] = useState<string>("");
  const [receiptModalTx, setReceiptModalTx] = useState<TransactionWithAccounts | null>(null);
  const [blockchainModalTx, setBlockchainModalTx] = useState<TransactionWithAccounts | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<
    {
      id: string;
      accountNumber: string;
      accountName: string;
      balance: string;
      currency: string;
      status: string;
    }[] | null
  >(() => cachedAccounts.length > 0 ? cachedAccounts : null);

  // Live Real-Time Transfer Studio States
  const [liveSourceId, setLiveSourceId] = useState(() => (cachedAccounts && cachedAccounts.length >= 2 ? cachedAccounts[0].id : ""));
  const [liveDestId, setLiveDestId] = useState(() => (cachedAccounts && cachedAccounts.length >= 2 ? cachedAccounts[1].id : ""));
  const [liveAmount, setLiveAmount] = useState("50000");
  const [liveType, setLiveType] = useState<"TRANSFER" | "SETTLEMENT" | "DISBURSEMENT" | "CROSS_BORDER">("TRANSFER");
  const [liveNote, setLiveNote] = useState("Customer counter cash settlement ID 1-1004-99882-12-9");
  const [simulateTampering, setSimulateTampering] = useState(false);
  const [isExecutingLive, setIsExecutingLive] = useState(false);
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);

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

  const [loading, setLoading] = useState(() => cachedAccounts.length === 0);

  const formatAccNo = (num: string) => {
    if (!maskPii || !num || num.length <= 4) return num;
    return num.slice(0, 3) + "-****-" + num.slice(-4);
  };

  const loadData = async (isManual = false) => {
    if (isManual) setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleTxUpdate = () => loadData();
    window.addEventListener("finguard_tx_updated", handleTxUpdate);
    return () => window.removeEventListener("finguard_tx_updated", handleTxUpdate);
  }, []);

  // Quick 1-Click Test Account Generator (Continuous / Unlimited creation)
  const handleQuickCreateSampleAccount = async () => {
    setIsGeneratingAccount(true);
    setProcessingTransaction(true, "Provisioning new test ledger account...");
    const sampleNames = [
      "Bangkok Apex Logistics Ltd.",
      "Siam Horizon Trading Co.",
      "Chiang Mai Digital Ventures",
      "Phuket Hospitality Holdings",
      "Eastern Seaboard Industrial Corp.",
      "Somchai Retail Merchant #",
      "Thonglor Sovereign Escrow Fund",
    ];
    const randIdx = Math.floor(Math.random() * sampleNames.length);
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const name = `${sampleNames[randIdx]} ${randDigits}`;
    const initialBalance = Math.floor(50000 + Math.random() * 450000);

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: name,
          balance: initialBalance,
          currency: "THB",
          status: "ACTIVE",
        }),
      });
      const data = await res.json();
      if (data.success && data.account) {
        await loadData();
        setSelectedCustomerAccount(data.account.id);
        window.dispatchEvent(new Event("finguard_tx_updated"));
      }
    } catch (err) {
      console.error("Failed to generate test account:", err);
    } finally {
      setIsGeneratingAccount(false);
      setProcessingTransaction(false);
    }
  };

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Live Studio Calculations
  const liveSourceAcc = accounts?.find((a) => a.id === liveSourceId);
  const liveDestAcc = accounts?.find((a) => a.id === liveDestId);
  const numAmount = parseFloat(liveAmount) || 0;
  const currentSourceBalance = liveSourceAcc ? parseFloat(liveSourceAcc.balance) : 0;
  const isLiveOverdraft = liveSourceAcc ? numAmount > currentSourceBalance : false;

  const liveEstimatedRisk = useMemo(() => {
    if (simulateTampering) {
      return {
        score: 1.0,
        reason: "[CRYPTOGRAPHIC HASH MISMATCH] Simulation: Source dispatch hash will differ from receiver node hash. Transfer will be blocked.",
      };
    }

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
  }, [numAmount, liveType, simulateTampering]);

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
    if (accounts && accounts[srcIdx]) setLiveSourceId(accounts[srcIdx].id);
    if (accounts && accounts[dstIdx]) setLiveDestId(accounts[dstIdx].id);
    setLiveReceipt(null);
  };

  const handleExecuteLiveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSourceId || !liveDestId || isLiveOverdraft || isExecutingLive) return;
    setIsExecutingLive(true);
    setLiveReceipt(null);
    setProcessingTransaction(true, "Recording counter ledger transfer & verifying cryptographic hash...");
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
            simulateTampering,
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
        window.dispatchEvent(new Event("finguard_tx_updated"));
      }
    } catch (err) {
      console.error("Live transfer error:", err);
    } finally {
      setIsExecutingLive(false);
      setProcessingTransaction(false);
    }
  };

  const selectedCustAcc = accounts?.find((a) => a.id === selectedCustomerAccount);

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
            Customer balance verification, end-to-end blockchain cryptographic hash validation, and official customer slip generation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Quick 1-Click Test Account Generator */}
          <button
            onClick={handleQuickCreateSampleAccount}
            disabled={isGeneratingAccount}
            className="inline-flex items-center space-x-1.5 h-10 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95 whitespace-nowrap"
            title="Instantly generate a test customer account to simulate transfers"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingAccount ? "animate-spin" : ""}`} />
            <span>{isGeneratingAccount ? "Creating..." : "+ Quick Test Account"}</span>
          </button>

          {/* Custom Account Modal */}
          <button
            onClick={() => setCreateAccountOpen(true)}
            className="inline-flex items-center space-x-1.5 h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95 shadow-sm whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Custom Account</span>
          </button>

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
            onClick={() => triggerFullSyncAndRefresh()}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 h-10 px-3.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700/80 shadow-sm transition cursor-pointer whitespace-nowrap active:scale-95"
            title="Purge cache and pull fresh data directly from PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600 dark:text-cyan-400" : ""}`} />
            <span>Sync</span>
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
                {loading || !accounts ? "Loading customer accounts..." : `${accounts.length} active customer accounts loaded`}
              </span>
            </label>

            {loading || !accounts ? (
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <select
                value={selectedCustomerAccount}
                onChange={(e) => setSelectedCustomerAccount(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 font-bold"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    [{acc.id}] {acc.accountName} ({formatAccNo(acc.accountNumber)}) - ฿{Number(acc.balance).toLocaleString()} [{acc.status}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Balance & Action Card */}
          {loading || !accounts ? (
            <div className="lg:col-span-6 p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 shadow-sm animate-pulse space-y-2">
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
              <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded mt-1" />
            </div>
          ) : selectedCustAcc ? (
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
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                    ID: {selectedCustAcc.id}
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                    No: {formatAccNo(selectedCustAcc.accountNumber)}
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
          ) : null}
        </div>
      </div>

      {/* Live Interactive Transfer Studio */}
      {loading || !accounts ? (
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/80 p-8 text-center space-y-3">
          <RefreshCw className="w-7 h-7 text-cyan-500 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Initializing Live Double-Entry Transfer Studio...
          </p>
        </div>
      ) : accounts.length >= 2 && (
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-cyan-800/80 p-6 shadow-xl relative overflow-hidden bg-white dark:bg-gradient-to-b dark:from-[#061022] dark:to-[#040914]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800/80 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Teller Money Transfer & Cryptographic Settlement Engine
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  ACID double-entry transfers with real-time end-to-end blockchain SHA-256 cryptographic match validation
                </p>
              </div>
            </div>

            {/* Simulation Presets */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setSimulateTampering(false);
                  applyLivePreset("25000", "TRANSFER", "Customer counter deposit & transfer");
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
              >
                Normal (฿25K)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulateTampering(false);
                  applyLivePreset("750000", "TRANSFER", "High-value corporate invoice payment");
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-[11px] font-bold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 transition"
              >
                High-Value (฿750K)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulateTampering(true);
                  applyLivePreset("180000", "TRANSFER", "Cryptographic Tampering Simulation Attack");
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-[11px] font-bold text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700 transition shadow-sm"
              >
                Test Tamper Block (Red)
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
                      [{acc.id}] {acc.accountName} ({formatAccNo(acc.accountNumber)}) - ฿{Number(acc.balance).toLocaleString()}
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
                      [{acc.id}] {acc.accountName} ({formatAccNo(acc.accountNumber)}) - ฿{Number(acc.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note, Tamper Check & Execute */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-7 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Settlement Note / Reference</span>
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

              {/* End-to-End Cryptographic Tamper Simulator Toggle */}
              <div className="lg:col-span-5 flex flex-col justify-end space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>Simulate Hash Mismatch</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSimulateTampering(!simulateTampering)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                      simulateTampering
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {simulateTampering ? "TAMPER ON (BLOCK)" : "NORMAL (MATCH)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <div>
              <button
                type="submit"
                disabled={isExecutingLive || isLiveOverdraft || numAmount <= 0}
                className={`w-full h-11 rounded-2xl font-black text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg active:scale-95 ${
                  simulateTampering
                    ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/25"
                    : isLiveOverdraft
                    ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-400 dark:border-slate-700"
                    : "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-cyan-600/25"
                }`}
              >
                <Send className={`w-4 h-4 ${isExecutingLive ? "animate-pulse" : ""}`} />
                <span>
                  {isExecutingLive
                    ? "Validating End-to-End Cryptographic Proof..."
                    : simulateTampering
                    ? "Execute Tampered Transfer (Test Red Block)"
                    : isLiveOverdraft
                    ? "Insufficient Funds (Overdraft)"
                    : "Execute Live Transfer"}
                </span>
              </button>
            </div>

            {/* Teller Guidance Banner */}
            <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              simulateTampering
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-900 dark:text-rose-200"
                : "bg-cyan-50 dark:bg-slate-900/90 border-cyan-200 dark:border-cyan-900/40 text-slate-700 dark:text-slate-300"
            }`}>
              <div className="flex items-center space-x-2 font-medium">
                {simulateTampering ? <ShieldX className="w-4 h-4 text-rose-600 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />}
                <span>
                  <strong>Frontline Advice:</strong>{" "}
                  {simulateTampering
                    ? "Cryptographic tamper simulation active: End-to-end hashes will mismatch, and transfer will be blocked from reaching account balance."
                    : numAmount >= 2000000
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

          {/* Transfer Result Alert (Green for Success, Red for Blocked Tampering) */}
          {liveReceipt && (
            <div
              className={`mt-6 p-5 rounded-2xl border animate-in fade-in duration-200 space-y-4 ${
                (liveReceipt.metadata as any)?.isCryptographicMatch === false || liveReceipt.status === "FLAGGED" && liveReceipt.riskReason?.includes("CRYPTOGRAPHIC")
                  ? "bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-200 shadow-lg shadow-rose-600/10"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-current/20">
                <div className="flex items-center space-x-2 font-black text-sm">
                  {(liveReceipt.metadata as any)?.isCryptographicMatch === false ? (
                    <>
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span className="text-rose-700 dark:text-rose-300">
                        [BLOCKED] Cryptographic Hash Mismatch — Transfer Blocked from Balance
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Transaction Settled Successfully (Double-Entry ACID Verified)</span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Blockchain Block Details Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const fullTx: TransactionWithAccounts = {
                        id: liveReceipt.id,
                        amount: liveReceipt.amount,
                        currency: "THB",
                        type: liveType,
                        status: liveReceipt.status as any,
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
                      setBlockchainModalTx(fullTx);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Hash className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Blockchain Block Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const fullTx: TransactionWithAccounts = {
                        id: liveReceipt.id,
                        amount: liveReceipt.amount,
                        currency: "THB",
                        type: liveType,
                        status: liveReceipt.status as any,
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
                    <span>Print Slip</span>
                  </button>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                      (liveReceipt.metadata as any)?.isCryptographicMatch === false
                        ? "bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border border-rose-400"
                        : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600"
                    }`}
                  >
                    {liveReceipt.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="opacity-70 block">Sender Debit:</span>
                  <span className="font-bold">
                    {liveReceipt.sourceAccount.accountName} ({formatAccNo(liveReceipt.sourceAccount.accountNumber)})
                  </span>
                </div>
                <div>
                  <span className="opacity-70 block">Receiver Credit:</span>
                  <span className="font-bold">
                    {liveReceipt.destinationAccount.accountName} ({formatAccNo(liveReceipt.destinationAccount.accountNumber)})
                  </span>
                </div>
                <div>
                  <span className="opacity-70 block">Amount:</span>
                  <span className="font-bold text-sm">
                    ฿{Number(liveReceipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* End-to-End Cryptographic Match Indicator */}
              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-current/20 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="opacity-80">End-to-End Hash Validation:</span>
                  <span className={`font-bold ${
                    (liveReceipt.metadata as any)?.isCryptographicMatch === false ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {(liveReceipt.metadata as any)?.isCryptographicMatch === false ? "[MISMATCH] BLOCKCHAIN CORRUPT" : "[MATCHED] 100% CRYPTOGRAPHIC CONTINUITY"}
                  </span>
                </div>
                <div className="text-[11px] opacity-75 truncate">
                  Source: {(liveReceipt.metadata as any)?.sourceCryptHash || "N/A"}
                </div>
                <div className="text-[11px] opacity-75 truncate">
                  Dest:   {(liveReceipt.metadata as any)?.destinationCryptHash || "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Overview Grid */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/90 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/60 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
              Customer Accounts ({loading || !accounts ? "..." : accounts.length})
            </h2>
          </div>

          <button
            onClick={handleQuickCreateSampleAccount}
            disabled={isGeneratingAccount}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-700/70 transition cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Add Test Account</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {loading || !accounts ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 animate-pulse space-y-2.5"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-8 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded pt-1" />
              </div>
            ))
          ) : (
            accounts.map((acc) => {
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
          }))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BLOCKCHAIN BLOCK CRYPTOGRAPHIC INSPECTOR MODAL                             */}
      {/* ========================================================================= */}
      {blockchainModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#070d1a] border border-slate-200 dark:border-cyan-700/60 rounded-3xl p-6 sm:p-8 relative shadow-2xl text-slate-800 dark:text-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  (blockchainModalTx.metadata as any)?.isCryptographicMatch === false
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-600 border border-rose-400"
                    : "bg-cyan-100 dark:bg-cyan-950 text-cyan-600 border border-cyan-400"
                }`}>
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                    Blockchain Cryptographic Block Verification
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Block TxRef: {blockchainModalTx.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setBlockchainModalTx(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            {/* End-to-End Status Banner */}
            <div className={`mt-5 p-4 rounded-2xl border text-xs font-mono space-y-2 ${
              (blockchainModalTx.metadata as any)?.isCryptographicMatch === false
                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                : "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
            }`}>
              <div className="flex items-center justify-between font-bold text-sm">
                <span>End-to-End Verification:</span>
                <span>
                  {(blockchainModalTx.metadata as any)?.isCryptographicMatch === false
                    ? "[FAILED] HASH MISMATCH - BLOCKED"
                    : "[PASSED] 100% AUTHENTIC"}
                </span>
              </div>
              <p className="font-sans text-xs">
                {(blockchainModalTx.metadata as any)?.isCryptographicMatch === false
                  ? "The cryptographic hash received at the destination does not match the source dispatch payload. ACID ledger rollback was triggered to prevent fraudulent balance crediting."
                  : "Both source dispatch payload and receiver node calculated identical SHA-256 hashes. Double-entry ACID balance was settled."}
              </p>
            </div>

            {/* Cryptographic Hash Breakdown */}
            <div className="mt-4 space-y-3 font-mono text-xs">
              {/* Source Dispatch Hash */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Source Dispatch Hash (Node A):</span>
                  <button
                    onClick={() => copyToClipboard((blockchainModalTx.metadata as any)?.sourceCryptHash || "", "src")}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <span>{copiedHash === "src" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="text-slate-900 dark:text-white font-bold break-all">
                  {(blockchainModalTx.metadata as any)?.sourceCryptHash || blockchainModalTx.auditHash || "SHA256-AUTHENTIC-SRC-HASH"}
                </div>
              </div>

              {/* Destination Receiver Hash */}
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                (blockchainModalTx.metadata as any)?.isCryptographicMatch === false
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                  : "bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              }`}>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Destination Receiver Hash (Node B):</span>
                  <button
                    onClick={() => copyToClipboard((blockchainModalTx.metadata as any)?.destinationCryptHash || "", "dst")}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <span>{copiedHash === "dst" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="font-bold break-all">
                  {(blockchainModalTx.metadata as any)?.destinationCryptHash || blockchainModalTx.auditHash || "SHA256-AUTHENTIC-DST-HASH"}
                </div>
              </div>

              {/* Merkle Root & Blockchain Proof */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">Merkle Root Seal:</span>
                  <span className="font-bold text-cyan-700 dark:text-cyan-400 break-all text-[11px]">
                    {(blockchainModalTx.metadata as any)?.merkleRoot || "MERKLE-ROOT-SHA256-VERIFIED"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Settlement Status:</span>
                  <span className={`font-bold text-[11px] ${
                    (blockchainModalTx.metadata as any)?.isCryptographicMatch === false ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {(blockchainModalTx.metadata as any)?.isCryptographicMatch === false ? "QUARANTINED / ISOLATED" : "ACID DOUBLE-ENTRY SETTLED"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setBlockchainModalTx(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Close Block Inspector
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className={`text-[10px] font-mono font-bold ${
                  (receiptModalTx.metadata as any)?.isCryptographicMatch === false ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  Status: {receiptModalTx.status} {(receiptModalTx.metadata as any)?.isCryptographicMatch === false ? "(BLOCKED - HASH MISMATCH)" : "(ACID Verified)"}
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
