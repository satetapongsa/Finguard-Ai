"use client";

import { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Wallet,
  Building2,
  Sparkles,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import { sanitizeText, inspectPiiPresence } from "@/lib/security/guardrails";

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

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [amount, setAmount] = useState("250000");
  const [type, setType] = useState<"TRANSFER" | "SETTLEMENT" | "DISBURSEMENT" | "CROSS_BORDER">("TRANSFER");
  const [note, setNote] = useState("Payment for invoice #8841. Recipient Thai ID: 1-1004-99882-12-9");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    riskAssessment?: {
      riskScore: number;
      riskReason: string;
      isHighRisk: boolean;
    };
    auditHash?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/accounts")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.length >= 2) {
            setAccounts(data.data);
            setSourceId(data.data[0].id);
            setDestinationId(data.data[1].id);
          }
        })
        .catch((err) => console.error("Could not load accounts:", err));
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const piiInspection = inspectPiiPresence(note);
  const maskedNotePreview = sanitizeText(note);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

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
            channel: "BFSI_DESKTOP_PORTAL",
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
      } else {
        setResult({
          success: false,
          error: data.error || "Transaction could not be executed",
        });
      }
    } catch (_err) {
      setResult({
        success: false,
        error: "Network failure while reaching ACID transaction engine",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#080d1a] border border-slate-700/80 rounded-3xl p-6 sm:p-7 relative shadow-2xl shadow-cyan-950/40 text-slate-200">
        {/* Glow accent */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight">
                ACID Double-Entry Ledger Transfer
              </h3>
              <p className="text-xs text-slate-400">
                Serializable balance guard, heuristic risk index & SHA-256 audit log
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Source Account (Debit)</span>
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} - {acc.accountName} (฿{Number(acc.balance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Destination (Credit)</span>
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} - {acc.accountName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Amount (THB)
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
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-7 pr-3 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Amount Presets */}
              <div className="flex space-x-1.5 pt-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setAmount("50000")}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
                >
                  50K
                </button>
                <button
                  type="button"
                  onClick={() => setAmount("750000")}
                  className="px-2 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800/50 hover:bg-amber-900/60 font-medium transition cursor-pointer"
                >
                  750K (AMLO)
                </button>
                <button
                  type="button"
                  onClick={() => setAmount("2500000")}
                  className="px-2 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/50 hover:bg-rose-900/60 font-medium transition cursor-pointer"
                >
                  2.5M (Critical)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Transaction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              >
                <option value="TRANSFER">TRANSFER (Standard Domestic)</option>
                <option value="SETTLEMENT">SETTLEMENT (Treasury Reserve)</option>
                <option value="DISBURSEMENT">DISBURSEMENT (Payroll/Escrow)</option>
                <option value="CROSS_BORDER">CROSS_BORDER (FATF Travel Rule)</option>
              </select>
            </div>
          </div>

          {/* Note with Live PDPA Sanitization */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Transaction Metadata (PDPA Guardrail Shield)</span>
              </label>
              {piiInspection.hasPii && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/60 flex items-center space-x-1 animate-pulse">
                  <span>PII Intercepted: {piiInspection.detectedTypes.join(", ")}</span>
                </span>
              )}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
            />
            {piiInspection.hasPii && (
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-slate-300 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-cyan-400 font-semibold">Guardrail Masked Result: </span>
                  <span className="font-mono text-slate-200">{maskedNotePreview}</span>
                </div>
              </div>
            )}
          </div>

          {/* Result Banner */}
          {result && (
            <div
              className={`p-3.5 rounded-2xl border text-xs transition duration-300 ${
                result.success
                  ? result.riskAssessment?.isHighRisk
                    ? "bg-amber-950/50 border-amber-600/60 text-amber-200"
                    : "bg-emerald-950/50 border-emerald-600/60 text-emerald-200"
                  : "bg-rose-950/50 border-rose-600/60 text-rose-200"
              }`}
            >
              <div className="flex items-start space-x-2.5">
                {result.success ? (
                  result.riskAssessment?.isHighRisk ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-white text-xs">{result.message || result.error}</p>
                  {result.riskAssessment && (
                    <div className="mt-1.5 text-[11px] space-y-1">
                      <div className="flex items-center space-x-2">
                        <span>Autonomous Risk Score:</span>
                        <span className="font-mono font-bold text-white px-1.5 py-0.2 rounded bg-black/40">
                          {(result.riskAssessment.riskScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium">Evaluation: {result.riskAssessment.riskReason}</p>
                    </div>
                  )}
                  {result.auditHash && (
                    <p className="mt-2 text-[10px] font-mono text-cyan-300/80 break-all bg-black/40 p-2 rounded-lg border border-cyan-900/40">
                      SHA-256: {result.auditHash}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 disabled:opacity-50 transition cursor-pointer"
            >
              <span>{loading ? "Committing Ledger..." : "Commit Transaction"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
