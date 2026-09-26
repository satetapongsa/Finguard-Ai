"use client";

import { useState, useEffect, useMemo } from "react";
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
  Zap,
  ShieldCheck,
  Scale,
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
  const [note, setNote] = useState("Payment invoice #8841. Recipient Thai ID: 1-1004-99882-12-9");

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

  const fetchAccounts = () => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length >= 2) {
          setAccounts(data.data);
          if (!sourceId) setSourceId(data.data[0].id);
          if (!destinationId) setDestinationId(data.data[1].id);
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-7 relative shadow-2xl text-slate-800 dark:text-slate-200 max-h-[92vh] overflow-y-auto">
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
                Serializable balance guard, heuristic risk index & SHA-256 audit log
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
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>Click Scenario to Pre-fill Simulation:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() =>
                applyScenario({
                  amount: "45000",
                  type: "TRANSFER",
                  note: "Invoice payment to supplier. Beneficiary PAN: 4111 2222 3333 4444",
                  sourceIndex: 2,
                  destIndex: 3,
                })
              }
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition text-left cursor-pointer border border-slate-200 dark:border-slate-700/60"
            >
              <div className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">Standard ฿45K</div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">Low Risk Domestic</div>
            </button>

            <button
              type="button"
              onClick={() =>
                applyScenario({
                  amount: "750000",
                  type: "DISBURSEMENT",
                  note: "Contractor milestone. Citizen ID: 1-1004-99882-12-9",
                  sourceIndex: 2,
                  destIndex: 3,
                })
              }
              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40 transition text-left cursor-pointer"
            >
              <div className="text-amber-700 dark:text-amber-400 text-[10px] font-bold">BOT ฿750K</div>
              <div className="text-[9px] text-amber-600 dark:text-amber-300/70">&gt; 500K Anomaly</div>
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
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800/40 transition text-left cursor-pointer"
            >
              <div className="text-rose-700 dark:text-rose-400 text-[10px] font-bold">AMLO ฿2.5M</div>
              <div className="text-[9px] text-rose-600 dark:text-rose-300/70">Mandatory STR</div>
            </button>

            <button
              type="button"
              onClick={() =>
                applyScenario({
                  amount: "350000",
                  type: "CROSS_BORDER",
                  note: "Wire to overseas shell entity. Recipient ID: 1-1004-99882-12-9",
                  sourceIndex: 2,
                  destIndex: 4, // Offshore Apex (Flagged)
                })
              }
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/40 transition text-left cursor-pointer"
            >
              <div className="text-purple-700 dark:text-purple-400 text-[10px] font-bold">Watchlist Account</div>
              <div className="text-[9px] text-purple-600 dark:text-purple-300/70">Flagged Counterparty</div>
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
                    {acc.accountNumber} - {acc.accountName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Destination (Credit)</span>
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {acc.accountNumber} - {acc.accountName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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

          {/* Double-Entry Balance Calculation Visualizer */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>ACID Balance Adjustment Preview:</span>
              </span>
              <span className={`font-mono text-[10px] ${isOverdraft ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-700 dark:text-emerald-400"}`}>
                {isOverdraft ? "❌ Overdraft Rejected" : "✓ Balanced: Debits = Credits"}
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
              <span>Transaction Note / Metadata</span>
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
              placeholder="Enter reference note with Thai ID, card numbers, phone or email..."
              className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
            />

            {/* Sanitized Live Preview */}
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 text-[11px] text-cyan-900 dark:text-cyan-200">
              <span className="text-[9px] uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-bold block mb-0.5">
                PDPA Auto-Masked Ingress Preview (Sent to LLM & Audit):
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
              <div className="flex items-center space-x-2 font-bold">
                {result.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                <span>{result.success ? "Settlement Successful" : "Execution Blocked"}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">{result.message || result.error}</p>
              {result.auditHash && (
                <div className="mt-2 text-[10px] font-mono text-cyan-800 dark:text-cyan-300 bg-white dark:bg-slate-950/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Audit Checksum: </span>
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
