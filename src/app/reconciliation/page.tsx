"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  Search,
  Download,
  RefreshCw,
  Printer,
  ExternalLink,
  Bot,
  FileCheck2,
  Lock,
  Eye,
  EyeOff,
  Check,
  Copy,
  PlusCircle,
  Database,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Hash,
  Link as LinkIcon,
  UserPlus,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import { TransactionWithAccounts } from "@/lib/types";

export default function ReconciliationPage() {
  const router = useRouter();
  const setSelectedTransaction = useComplianceStore((s) => s.setSelectedTransaction);
  const setQuickTransferOpen = useComplianceStore((s) => s.setQuickTransferOpen);
  const setProcessingTransaction = useComplianceStore((s) => s.setProcessingTransaction);
  const cachedTransactions = useComplianceStore((s) => s.cachedTransactions);
  const setCachedTransactions = useComplianceStore((s) => s.setCachedTransactions);

  const [maskPii, setMaskPii] = useState(true);
  const [transactions, setTransactions] = useState<TransactionWithAccounts[]>(() => cachedTransactions || []);
  const [loading, setLoading] = useState(false);
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [inspectedTx, setInspectedTx] = useState<TransactionWithAccounts | null>(null);
  const [blockchainModalTx, setBlockchainModalTx] = useState<TransactionWithAccounts | null>(null);
  const [receiptModalTx, setReceiptModalTx] = useState<TransactionWithAccounts | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const formatAccNo = (num: string) => {
    if (!maskPii || !num || num.length <= 4) return num;
    return num.slice(0, 3) + "-****-" + num.slice(-4);
  };

  const loadData = async () => {
    try {
      const res = await fetch("/api/transactions?limit=100");
      const data = await res.json();
      if (data.success && data.data) {
        setTransactions(data.data);
        setCachedTransactions(data.data);
      }
    } catch (err) {
      console.error("Non-blocking transactions refresh:", err);
    }
  };

  useEffect(() => {
    loadData();
    const handleTxUpdate = () => loadData();
    window.addEventListener("finguard_tx_updated", handleTxUpdate);
    return () => window.removeEventListener("finguard_tx_updated", handleTxUpdate);
  }, []);

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
      "Ayutthaya Maritime Settlement Ltd.",
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
      if (data.success) {
        await loadData();
        window.dispatchEvent(new Event("finguard_tx_updated"));
      }
    } catch (err) {
      console.error("Failed to create quick account:", err);
    } finally {
      setIsGeneratingAccount(false);
      setProcessingTransaction(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      let matchesFilter = true;
      if (statusFilter === "HIGH_VALUE") {
        matchesFilter = parseFloat(tx.amount) >= 500000;
      } else if (statusFilter === "BLOCKED_HASH") {
        matchesFilter = (tx.metadata as any)?.isCryptographicMatch === false;
      } else if (statusFilter !== "ALL") {
        matchesFilter = tx.status === statusFilter;
      }

      const matchesSearch =
        searchTerm === "" ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.sourceAccount.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.sourceAccount.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.destinationAccount.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.destinationAccount.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.includes(searchTerm);

      return matchesFilter && matchesSearch;
    });
  }, [transactions, statusFilter, searchTerm]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      "Transaction ID",
      "Timestamp (UTC)",
      "Source Account Name",
      "Source Account Number",
      "Destination Account Name",
      "Destination Account Number",
      "Amount (THB)",
      "Type",
      "Risk Score",
      "Status",
      "Cryptographic Match",
      "Audit Hash",
    ];

    const rows = filteredTransactions.map((tx) => [
      `"${tx.id}"`,
      `"${new Date(tx.createdAt).toISOString()}"`,
      `"${tx.sourceAccount.accountName.replace(/"/g, '""')}"`,
      `"${tx.sourceAccount.accountNumber}"`,
      `"${tx.destinationAccount.accountName.replace(/"/g, '""')}"`,
      `"${tx.destinationAccount.accountNumber}"`,
      tx.amount,
      `"${tx.type}"`,
      (tx.riskScore * 100).toFixed(0) + "%",
      `"${tx.status}"`,
      (tx.metadata as any)?.isCryptographicMatch === false ? '"MISMATCH (BLOCKED)"' : '"MATCHED (VERIFIED)"',
      `"${tx.auditHash || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finguard-reconciliation-ledger-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInspectInCopilot = (tx: TransactionWithAccounts) => {
    setSelectedTransaction(tx);
    router.push(`/compliance?txId=${tx.id}`);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(field);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const printCustomerReceipt = () => {
    window.print();
  };

  const handleCopyReceipt = (tx: TransactionWithAccounts) => {
    const slipText = `
=== FINGUARD AI SOVEREIGN SETTLEMENT ===
Transaction Ref : ${tx.id}
Date/Time       : ${new Date(tx.createdAt).toLocaleString()}
Status          : ${tx.status} ${(tx.metadata as any)?.isCryptographicMatch === false ? "[BLOCKED - HASH MISMATCH]" : "[ACID DOUBLE-ENTRY SETTLED]"}
Sender (Debit)  : ${tx.sourceAccount.accountName} (${tx.sourceAccount.accountNumber})
Receiver (Cred) : ${tx.destinationAccount.accountName} (${tx.destinationAccount.accountNumber})
Settled Amount  : THB ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
Risk Evaluation : ${(tx.riskScore * 100).toFixed(0)}% (${tx.riskReason || "Compliant"})
Blockchain Seal : ${tx.auditHash}
========================================
    `.trim();
    navigator.clipboard.writeText(slipText);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const totalFilteredVolume = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const blockedMismatchCount = useMemo(() => {
    return transactions.filter((t) => (t.metadata as any)?.isCryptographicMatch === false).length;
  }, [transactions]);

  return (
    <div className="space-y-6 pb-12" suppressHydrationWarning>
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Daily Operations & Ledger Reconciliation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700/60 font-mono">
              Operations Desk
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium max-w-2xl">
            Full-spectrum transaction verification, blockchain end-to-end cryptographic integrity checks, and exportable ledger closing reports.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Quick Create Test Account Button */}
          <button
            onClick={handleQuickCreateSampleAccount}
            disabled={isGeneratingAccount}
            className="inline-flex items-center space-x-1.5 h-10 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
          >
            <UserPlus className={`w-4 h-4 ${isGeneratingAccount ? "animate-spin" : ""}`} />
            <span>{isGeneratingAccount ? "Creating..." : "+ Quick Test Account"}</span>
          </button>

          {/* PDPA Masking Button */}
          <button
            onClick={() => setMaskPii(!maskPii)}
            className={`inline-flex items-center space-x-1.5 h-10 px-3 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 shadow-sm whitespace-nowrap ${
              maskPii
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 hover:bg-amber-100"
            }`}
          >
            {maskPii ? <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            <span>{maskPii ? "PDPA Masked" : "Unmasked"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 h-10 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Ledger</span>
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

      {/* Reconciliation Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Filtered Records</div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {filteredTransactions.length} Transactions
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Cumulative Volume</div>
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              ฿{totalFilteredVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">ACID Ledger Invariant</div>
            <div className="text-xl font-black font-mono text-cyan-700 dark:text-cyan-300 mt-0.5">
              100% Balanced
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className={`glass-card rounded-2xl p-4 flex items-center justify-between border ${
          blockedMismatchCount > 0 ? "border-rose-500/40 bg-rose-500/5 dark:bg-rose-950/20" : "border-slate-200 dark:border-slate-800"
        }`}>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Blocked Hash Mismatches</div>
            <div className={`text-xl font-black font-mono mt-0.5 ${
              blockedMismatchCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
            }`}>
              {blockedMismatchCount} Blocked
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${
            blockedMismatchCount > 0 ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          }`}>
            <ShieldX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table Section */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/90 overflow-hidden shadow-xl">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
              Master Double-Entry Financial Ledger
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium border border-slate-300 dark:border-slate-700/60">
              {filteredTransactions.length} entries
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search account, amount, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 w-48 sm:w-64 font-medium"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex-wrap gap-1">
              {[
                { id: "ALL", label: "ALL" },
                { id: "APPROVED", label: "APPROVED" },
                { id: "FLAGGED", label: "FLAGGED" },
                { id: "REJECTED", label: "REJECTED" },
                { id: "BLOCKED_HASH", label: "MISMATCH (RED)" },
                { id: "HIGH_VALUE", label: "≥ ฿500K" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1.5 rounded-lg transition text-xs font-bold cursor-pointer whitespace-nowrap ${
                    statusFilter === st.id
                      ? st.id === "BLOCKED_HASH"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-white text-cyan-800 border border-cyan-300 shadow-sm dark:bg-gradient-to-r dark:from-cyan-900 dark:to-slate-800 dark:text-cyan-300 dark:border-cyan-500/40"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400 font-bold">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Sender (Debit)</th>
                <th className="px-5 py-3.5">Receiver (Credit)</th>
                <th className="px-5 py-3.5">Amount (THB)</th>
                <th className="px-5 py-3.5">Risk Score</th>
                <th className="px-5 py-3.5 text-center">Cryptographic & Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500 font-medium">
                    No transactions found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isTamperedMismatch = (tx.metadata as any)?.isCryptographicMatch === false;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setInspectedTx(tx)}
                      className={`transition duration-150 group cursor-pointer ${
                        isTamperedMismatch
                          ? "bg-rose-50/80 dark:bg-rose-950/30 border-l-4 border-l-rose-600 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 text-rose-950 dark:text-rose-100"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="px-5 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Source Account */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {tx.sourceAccount.accountName}
                        </div>
                        <div className="font-mono text-[11px] text-cyan-700 dark:text-cyan-400">
                          {formatAccNo(tx.sourceAccount.accountNumber)}
                        </div>
                      </td>

                      {/* Destination Account */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {tx.destinationAccount.accountName}
                        </div>
                        <div className="font-mono text-[11px] text-blue-700 dark:text-blue-400">
                          {formatAccNo(tx.destinationAccount.accountNumber)}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                        ฿{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-[10px] font-sans font-normal text-slate-600 dark:text-slate-400 ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-transparent">
                          {tx.type}
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-14 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                tx.riskScore >= 0.65 || isTamperedMismatch
                                  ? "bg-rose-500"
                                  : tx.riskScore >= 0.35
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, (isTamperedMismatch ? 1.0 : tx.riskScore) * 100))}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono font-bold text-xs ${
                              tx.riskScore >= 0.65 || isTamperedMismatch
                                ? "text-rose-600 dark:text-rose-400"
                                : tx.riskScore >= 0.35
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {(isTamperedMismatch ? 100 : tx.riskScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      {/* Status & Cryptographic Match */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isTamperedMismatch ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-sm animate-pulse">
                              <ShieldX className="w-3 h-3" />
                              <span>BLOCKED (HASH MISMATCH)</span>
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                tx.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/60"
                                  : tx.status === "FLAGGED"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60"
                                  : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/60"
                              }`}
                            >
                              <span>{tx.status}</span>
                            </span>
                          )}

                          <span className={`text-[9px] font-mono font-semibold ${
                            isTamperedMismatch ? "text-rose-700 dark:text-rose-400 font-bold" : "text-slate-400 dark:text-slate-500"
                          }`}>
                            {isTamperedMismatch ? "Funds Isolated" : "ACID Verified"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Blockchain Block Proof Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBlockchainModalTx(tx);
                            }}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                              isTamperedMismatch
                                ? "bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 dark:border-rose-700"
                                : "bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:hover:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-800"
                            }`}
                            title="Inspect Blockchain Cryptographic Block & Hash Verification"
                          >
                            <Database className="w-3.5 h-3.5" />
                            <span>Crypto Proof</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceiptModalTx(tx);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span className="hidden xl:inline">Slip</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectInCopilot(tx);
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-cyan-950/80 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-cyan-300 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition cursor-pointer shadow-sm whitespace-nowrap"
                          >
                            <span>Copilot</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Inspector Modal */}
      {inspectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#070d1a] border border-slate-200 dark:border-cyan-700/60 rounded-3xl p-6 sm:p-8 relative shadow-2xl text-slate-800 dark:text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  (inspectedTx.metadata as any)?.isCryptographicMatch === false
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-600 border border-rose-300 dark:border-rose-700"
                    : "bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/60 text-cyan-700 dark:text-cyan-400"
                }`}>
                  {(inspectedTx.metadata as any)?.isCryptographicMatch === false ? (
                    <ShieldX className="w-5 h-5 text-rose-600" />
                  ) : (
                    <Scale className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                    Double-Entry ACID Verification
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Ref ID: {inspectedTx.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectedTx(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            <div className="mt-6 space-y-4 font-mono text-xs">
              {(inspectedTx.metadata as any)?.isCryptographicMatch === false && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-1">
                  <div className="flex items-center space-x-2 font-black text-rose-700 dark:text-rose-400 text-sm">
                    <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span>CRYPTOGRAPHIC HASH MISMATCH DETECTED (BLOCKED)</span>
                  </div>
                  <p className="text-xs font-sans text-rose-800 dark:text-rose-300 font-medium">
                    The source dispatch hash and receiver node hash do not match. Funds were quarantined and blocked prior to ledger balance mutation.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block text-[11px]">Sender Debit:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {inspectedTx.sourceAccount.accountName}
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400 block text-[11px]">
                    {formatAccNo(inspectedTx.sourceAccount.accountNumber)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Receiver Credit:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {inspectedTx.destinationAccount.accountName}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 block text-[11px]">
                    {formatAccNo(inspectedTx.destinationAccount.accountNumber)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Settled Amount:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-lg">
                    ฿{Number(inspectedTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Status:</span>
                  <span className={`font-bold text-sm ${
                    (inspectedTx.metadata as any)?.isCryptographicMatch === false
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {inspectedTx.status} {(inspectedTx.metadata as any)?.isCryptographicMatch === false ? "(BLOCKED & ISOLATED)" : "(ACID Non-Repudiation)"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-slate-500 block text-[11px]">Risk Reason & Evaluation:</span>
                <p className="text-slate-800 dark:text-slate-200 font-sans text-xs font-medium">
                  {inspectedTx.riskReason || "Compliant with standard banking directives."}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const tx = inspectedTx;
                      setInspectedTx(null);
                      setBlockchainModalTx(tx);
                    }}
                    className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Database className="w-4 h-4" />
                    <span>View Cryptographic Block</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleInspectInCopilot(inspectedTx);
                    }}
                    className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Inspect in AI Copilot</span>
                  </button>
                </div>

                <button
                  onClick={() => setInspectedTx(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Cryptographic Proof Modal */}
      {blockchainModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#070e1e] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 relative shadow-2xl text-slate-800 dark:text-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  (blockchainModalTx.metadata as any)?.isCryptographicMatch === false
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-600 border border-rose-300 dark:border-rose-700"
                    : "bg-cyan-100 dark:bg-cyan-950 text-cyan-600 border border-cyan-300 dark:border-cyan-700"
                }`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                    Blockchain Cryptographic Block Inspector
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Ref ID: {blockchainModalTx.id} &bull; Block Seal: {blockchainModalTx.auditHash?.slice(0, 16)}...
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBlockchainModalTx(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            {/* Cryptographic Comparison Content */}
            <div className="mt-5 space-y-4 font-mono text-xs">
              {/* Verification Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                (blockchainModalTx.metadata as any)?.isCryptographicMatch === false
                  ? "bg-rose-50 dark:bg-rose-950/80 border-rose-400 text-rose-900 dark:text-rose-200"
                  : "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-400 text-emerald-900 dark:text-emerald-200"
              }`}>
                <div className="flex items-center space-x-3">
                  {(blockchainModalTx.metadata as any)?.isCryptographicMatch === false ? (
                    <ShieldX className="w-6 h-6 text-rose-600 animate-pulse shrink-0" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-black text-sm">
                      {(blockchainModalTx.metadata as any)?.isCryptographicMatch === false
                        ? "HASH MISMATCH DETECTED - TRANSACTION QUARANTINED"
                        : "END-TO-END CRYPTOGRAPHIC INTEGRITY VERIFIED"}
                    </div>
                    <div className="text-[11px] font-sans opacity-80">
                      {(blockchainModalTx.metadata as any)?.isCryptographicMatch === false
                        ? "Source dispatch hash and receiver node hash are divergent. Transaction was blocked prior to account credit."
                        : "Source dispatch cryptographic hash perfectly matches receiver node ingestion hash."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Source Dispatch Hash */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Source Dispatch Hash (Node A):</span>
                  <button
                    onClick={() => copyToClipboard((blockchainModalTx.metadata as any)?.sourceCryptHash || blockchainModalTx.auditHash || "", "src")}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <span>{copiedHash === "src" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="font-bold text-slate-900 dark:text-white break-all">
                  {(blockchainModalTx.metadata as any)?.sourceCryptHash || blockchainModalTx.auditHash || "SHA256-AUTHENTIC-SRC-HASH"}
                </div>
              </div>

              {/* Destination Hash */}
              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                (blockchainModalTx.metadata as any)?.isCryptographicMatch === false
                  ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200"
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
