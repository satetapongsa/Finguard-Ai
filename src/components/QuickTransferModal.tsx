"use client";

import { useState, useEffect } from "react";
import { X, ShieldAlert, ArrowRight, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
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

  // Fetch accounts on open
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

  // Real-time PII Preview
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
    } catch (err) {
      setResult({
        success: false,
        error: "Network failure while reaching ACID transaction engine",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bfsi-glass-card rounded-2xl border border-slate-700/80 p-6 relative text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">ACID Double-Entry Ledger Transfer</h3>
              <p className="text-xs text-slate-400">
                Atomic balance check, heuristic risk scoring & immutable audit log
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Source Account (Debit)
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} - {acc.accountName} ({Number(acc.balance).toLocaleString()} THB)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destination Account (Credit)
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} - {acc.accountName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount and Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount (THB)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="any"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <div className="flex space-x-2 mt-1.5 text-[10px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setAmount("50000")}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                >
                  50K (Low)
                </button>
                <button
                  type="button"
                  onClick={() => setAmount("750000")}
                  className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 hover:bg-amber-900/60"
                >
                  750K (AMLO Flag)
                </button>
                <button
                  type="button"
                  onClick={() => setAmount("2500000")}
                  className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60"
                >
                  2.5M (Critical)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transaction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="TRANSFER">TRANSFER (Standard Domestic)</option>
                <option value="SETTLEMENT">SETTLEMENT (Inter-bank Treasury)</option>
                <option value="DISBURSEMENT">DISBURSEMENT (Corporate Payroll)</option>
                <option value="CROSS_BORDER">CROSS_BORDER (FATF Travel Rule)</option>
              </select>
            </div>
          </div>

          {/* Note with live PDPA Guardrail Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Transaction Note (Simulates PDPA PII Masking)</span>
              </label>
              {piiInspection.hasPii && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800/60">
                  PII Detected: {piiInspection.detectedTypes.join(", ")}
                </span>
              )}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            {piiInspection.hasPii && (
              <div className="mt-1 p-2 rounded bg-slate-900/90 border border-cyan-800/40 text-[11px] text-slate-300">
                <span className="text-cyan-400 font-semibold">Guardrail Sanitized Preview: </span>
                <span className="font-mono text-slate-200">{maskedNotePreview}</span>
              </div>
            )}
          </div>

          {/* Submission / Results */}
          {result && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                result.success
                  ? result.riskAssessment?.isHighRisk
                    ? "bg-amber-950/40 border-amber-700 text-amber-200"
                    : "bg-emerald-950/40 border-emerald-700 text-emerald-200"
                  : "bg-rose-950/40 border-rose-700 text-rose-200"
              }`}
            >
              <div className="flex items-start space-x-2">
                {result.success ? (
                  result.riskAssessment?.isHighRisk ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{result.message || result.error}</p>
                  {result.riskAssessment && (
                    <div className="mt-1 text-[11px] space-y-0.5 text-slate-300">
                      <p>
                        Risk Score:{" "}
                        <span className="font-bold text-white">
                          {(result.riskAssessment.riskScore * 100).toFixed(0)}%
                        </span>
                      </p>
                      <p className="text-slate-400">Reason: {result.riskAssessment.riskReason}</p>
                    </div>
                  )}
                  {result.auditHash && (
                    <p className="mt-1 text-[10px] font-mono text-slate-400 break-all">
                      Audit Hash: {result.auditHash}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 disabled:opacity-50"
            >
              <span>{loading ? "Committing Ledger..." : "Commit Transaction"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
