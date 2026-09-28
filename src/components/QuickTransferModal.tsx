"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Wallet,
  Building2,
  Sparkles,
  ShieldCheck,
  Scale,
  Calculator,
  UserPlus,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import { sanitizeText, inspectPiiPresence } from "@/lib/security/guardrails";
import { MathAnomalyMetrics } from "@/lib/types";

interface AccountOption {
  id: string;
  accountNumber: string;
  accountName: string;
  balance: string;
  currency: string;
  status: string;
}

export default function QuickTransferModal() {
  const isOpen = useComplianceStore((s) => s.isQuickTransferOpen);
  const setIsOpen = useComplianceStore((s) => s.setQuickTransferOpen);
  const setCreateAccountOpen = useComplianceStore((s) => s.setCreateAccountOpen);
  const setProcessingTransaction = useComplianceStore((s) => s.setProcessingTransaction);

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [amount, setAmount] = useState("250000");
  const [type, setType] = useState<"TRANSFER" | "SETTLEMENT" | "DISBURSEMENT" | "CROSS_BORDER">("TRANSFER");
  const [note, setNote] = useState("Payment invoice #8841. Recipient Citizen ID: 1-1004-99882-12-9");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    riskAssessment?: {
      riskScore: number;
      riskReason: string;
      isHighRisk: boolean;
      flags?: string[];
      mathBreakdown?: MathAnomalyMetrics;
    };
    auditHash?: string;
  } | null>(null);

  const fetchAccounts = () => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length >= 1) {
          setAccounts(data.data);
          if (!sourceId && data.data[0]) setSourceId(data.data[0].id);
          if (!destinationId && data.data[1]) setDestinationId(data.data[1].id);
        }
      })
      .catch((err) => console.error("Could not load accounts:", err));
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      setResult(null);
    }
  }, [isOpen]);

  const piiInspection = inspectPiiPresence(note);
  const maskedNotePreview = sanitizeText(note);

  // Source & Destination Account Objects
  const sourceAccount = useMemo(() => accounts.find((a) => a.id === sourceId), [accounts, sourceId]);
  const destAccount = useMemo(() => accounts.find((a) => a.id === destinationId), [accounts, destinationId]);

  // Balance calculation preview
  const numAmount = parseFloat(amount) || 0;
  const sourceCurrentBal = sourceAccount ? parseFloat(sourceAccount.balance) : 0;
  const destCurrentBal = destAccount ? parseFloat(destAccount.balance) : 0;
  const sourceAfterBal = sourceCurrentBal - numAmount;
  const destAfterBal = destCurrentBal + numAmount;
  const isOverdraft = sourceAfterBal < 0;

  // Real-time Mathematical Condition Evaluation Preview
  const isAmloMandate = numAmount >= 2000000;
  const isBotAlert = numAmount >= 500000 && numAmount < 2000000;
  const isWatchlistInvolved =
    sourceAccount?.status === "UNDER_INVESTIGATION" ||
    destAccount?.status === "UNDER_INVESTIGATION";

  let estimatedRiskScore = 0.05;
  if (isAmloMandate) estimatedRiskScore += 0.65;
  else if (isBotAlert) estimatedRiskScore += 0.35;
  else if (numAmount >= 200000) estimatedRiskScore += 0.15;

  if (type === "CROSS_BORDER") estimatedRiskScore += 0.25;
  if (isWatchlistInvolved) estimatedRiskScore += 0.5;
  estimatedRiskScore = Math.min(1.0, estimatedRiskScore);

  // Scenario Presets
  const applyScenario = (preset: {
    amount: string;
    type: "TRANSFER" | "SETTLEMENT" | "DISBURSEMENT" | "CROSS_BORDER";
    note: string;
    sourceIndex?: number;
    destIndex?: number;
  }) => {
    setAmount(preset.amount);
    setType(preset.type);
    setNote(preset.note);
    if (accounts.length > 0 && preset.sourceIndex !== undefined && accounts[preset.sourceIndex]) {
      setSourceId(accounts[preset.sourceIndex].id);
    }
    if (accounts.length > 0 && preset.destIndex !== undefined && accounts[preset.destIndex]) {
      setDestinationId(accounts[preset.destIndex].id);
    }
    setResult(null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverdraft) return;
    setLoading(true);
    setResult(null);
    setProcessingTransaction(true, "Executing ACID Double-Entry transfer & hashing...");

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceAccountId: sourceId,
          destinationAccountId: destinationId,
          amount: parseFloat(amount),
          type,
          metadata: {
            note,
            channel: "BFSI_PORTAL",
            initiatedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          riskAssessment: data.riskAssessment,
          auditHash: data.auditHash,
        });
        // Dispatch global event for live table sync
        window.dispatchEvent(new Event("finguard_tx_updated"));
        fetchAccounts();
      } else {
        setResult({
          success: false,
          error: data.error || data.message || "Transaction rejected",
        });
      }
    } catch (_err) {
      setResult({
        success: false,
        error: "Network failure while reaching ACID transaction engine",
      });
    } finally {
      setLoading(false);
      setProcessingTransaction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-6 relative shadow-2xl text-slate-800 dark:text-slate-200 max-h-[92vh] overflow-y-auto">
        {/* Glow accent */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                ACID Double-Entry Ledger Transfer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mathematical anomaly screening, Bank of Thailand & AMLO compliance rules
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Simulation Scenario Pills */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              <span>Select Simulation Scenario (Quick Presets):</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setCreateAccountOpen(true);
              }}
              className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ Provision Account</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() =>
                applyScenario({
                  amount: "45000",
                  type: "TRANSFER",
                  note: "Invoice payment to supplier. Beneficiary PAN: 4111 2222 3333 4444",
                  sourceIndex: 0,
                  destIndex: 1,
                })
              }
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition text-left cursor-pointer border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none hover:border-cyan-400/50"
            >
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-[10px] text-slate-900 dark:text-white">฿45K Normal</span>
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">Standard domestic transfer</div>
            </button>

            <button
              type="button"
              onClick={() =>
                applyScenario({
                  amount: "750000",
                  type: "DISBURSEMENT",
                  note: "Contractor milestone. Citizen ID: 1-1004-99882-12-9",
                  sourceIndex: 0,
                  destIndex: 1,
                })
              }
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition text-left cursor-pointer border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none hover:border-amber-400/50"
            >
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-bold text-[10px] text-slate-900 dark:text-white">฿750K BOT Alert</span>
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">&ge; ฿500K threshold alert</div>
            </button>

            <button
              type="button"
              onClick={() =>
                applyScenario({
                  amount: "2500000",
                  type: "CROSS_BORDER",
                  note: "Cross-border capital deployment. AMLO declaration required.",
                  sourceIndex: 0,
                  destIndex: 1,
                })
              }
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition text-left cursor-pointer border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none hover:border-rose-400/50"
            >
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-bold text-[10px] text-slate-900 dark:text-white">฿2.5M AMLO</span>
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">Mandatory STR filing</div>
            </button>

            <button
              type="button"
              onClick={() =>
                applyScenario({
                  amount: "350000",
                  type: "CROSS_BORDER",
                  note: "Wire to overseas shell entity. Recipient ID: 1-1004-99882-12-9",
                  sourceIndex: 0,
                  destIndex: 4,
                })
              }
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition text-left cursor-pointer border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none hover:border-purple-400/50"
            >
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="font-bold text-[10px] text-slate-900 dark:text-white">Watchlist</span>
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">AML Watchlist entity</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Wallet className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Source Account (Debit)</span>
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {acc.accountName} ({acc.accountNumber}) - ฿{Number(acc.balance).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Destination Account (Credit)</span>
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {acc.accountName} ({acc.accountNumber}) - ฿{Number(acc.balance).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Transfer Amount (THB)</span>
                {numAmount >= 2000000 ? (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 font-mono">AMLO &ge; ฿2M (Mandatory STR)</span>
                ) : numAmount >= 500000 ? (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono">BOT &ge; ฿500K (Elevated Alert)</span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">Standard (&lt; ฿500K)</span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">฿</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="any"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Transaction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "TRANSFER" | "SETTLEMENT" | "DISBURSEMENT" | "CROSS_BORDER")}
                className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="TRANSFER" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Domestic Transfer</option>
                <option value="SETTLEMENT" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Inter-Bank Settlement</option>
                <option value="DISBURSEMENT" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Corporate Disbursement</option>
                <option value="CROSS_BORDER" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Cross-Border Wire Transfer</option>
              </select>
            </div>
          </div>

          {/* Mathematical Anomaly & Double-Entry Calculation Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Calculator className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Heuristic Math & AI Risk Evaluation:</span>
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  estimatedRiskScore >= 0.65
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                    : estimatedRiskScore >= 0.35
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                }`}
              >
                {(estimatedRiskScore * 100).toFixed(0)}% Estimated Risk ({estimatedRiskScore >= 0.65 ? "High Risk Anomaly" : estimatedRiskScore >= 0.35 ? "Elevated Alert" : "Normal Settlement"})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Debit (Source)</span>
                <span className="text-slate-700 dark:text-slate-300">฿{sourceCurrentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <div className={`font-bold mt-0.5 ${sourceAfterBal < 0 ? "text-rose-600 dark:text-rose-400" : "text-cyan-700 dark:text-cyan-300"}`}>
                  → ฿{sourceAfterBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Credit (Destination)</span>
                <span className="text-slate-700 dark:text-slate-300">฿{destCurrentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <div className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  → ฿{destAfterBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Note & Real-time PDPA Masking Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Transaction Reference / Note (PDPA Ingress Masking)</span>
              {piiInspection.hasPii && (
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>PII Detected: {piiInspection.detectedTypes.join(", ")}</span>
                </span>
              )}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter reference note with National ID, PAN or account credentials..."
              className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
            />

            {/* Sanitized Live Preview */}
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 text-[11px] text-cyan-900 dark:text-cyan-200">
              <span className="text-[9px] uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-bold block mb-0.5">
                PDPA Auto-Masked Ingress Preview (Sent to AI & Blockchain):
              </span>
              <span className="font-mono">{maskedNotePreview}</span>
            </div>
          </div>

          {/* Error / Result Banner */}
          {result && (
            <div
              className={`p-3.5 rounded-2xl border text-xs ${
                result.success
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/70 text-emerald-900 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700/70 text-rose-900 dark:text-rose-300"
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center space-x-2">
                  {result.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                  <span>{result.success ? "Settlement Successful" : "Transaction Blocked"}</span>
                </div>
                {result.riskAssessment && (
                  <span className="font-mono text-[10px]">
                    Risk: {(result.riskAssessment.riskScore * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">{result.message || result.error}</p>
              {result.riskAssessment?.flags && result.riskAssessment.flags.length > 0 && (
                <div className="mt-2 space-y-1">
                  {result.riskAssessment.flags.map((flag, idx) => (
                    <div key={idx} className="text-[10px] font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-1 rounded border border-amber-200 dark:border-amber-800/50">
                      &bull; {flag}
                    </div>
                  ))}
                </div>
              )}
              {result.auditHash && (
                <div className="mt-2 text-[10px] font-mono text-cyan-800 dark:text-cyan-300 bg-white dark:bg-slate-950/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Audit Hash: </span>
                  {result.auditHash}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isOverdraft}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center space-x-2 cursor-pointer shadow-lg ${
                isOverdraft
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 shadow-cyan-600/30"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Committing to Ledger...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Commit ACID Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
