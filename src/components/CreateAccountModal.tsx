"use client";

import { useState } from "react";
import {
  X,
  PlusCircle,
  Building2,
  Wallet,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";

export default function CreateAccountModal() {
  const isOpen = useComplianceStore((s) => s.isCreateAccountOpen);
  const setIsOpen = useComplianceStore((s) => s.setCreateAccountOpen);

  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [balance, setBalance] = useState("200000");
  const [status, setStatus] = useState<"ACTIVE" | "UNDER_INVESTIGATION" | "FROZEN">("ACTIVE");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    account?: {
      accountNumber: string;
      accountName: string;
      balance: string;
      status: string;
    };
  } | null>(null);

  const applyPreset = (preset: {
    name: string;
    balance: string;
    status: "ACTIVE" | "UNDER_INVESTIGATION" | "FROZEN";
    prefix: string;
  }) => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setAccountName(preset.name);
    setAccountNumber(`${preset.prefix}-${new Date().getFullYear()}-${randomDigits}`);
    setBalance(preset.balance);
    setStatus(preset.status);
    setResult(null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim() || undefined,
          balance: parseFloat(balance) || 0,
          currency: "THB",
          status,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({
          success: true,
          message: "สร้างบัญชีการเงินใหม่ในฐานข้อมูล Neon เรียบร้อยแล้ว",
          account: data.account,
        });
        // Dispatch global event for live tables & selector updates
        window.dispatchEvent(new Event("finguard_tx_updated"));
        setTimeout(() => {
          setAccountName("");
          setAccountNumber("");
          setBalance("200000");
          setStatus("ACTIVE");
        }, 1500);
      } else {
        setResult({
          success: false,
          error: data.error || "ไม่สามารถสร้างบัญชีได้",
        });
      }
    } catch (_err) {
      setResult({
        success: false,
        error: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-7 relative shadow-2xl text-slate-800 dark:text-slate-200 max-h-[92vh] overflow-y-auto">
        {/* Glow accent */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                สร้างบัญชีการเงินใหม่ (Create Account)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เพิ่มบัญชีสำหรับจำลองการโอนเงินสดและทดสอบระบบความเสี่ยง
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

        {/* Presets Grid */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>เลือกประเภทบัญชีสำเร็จรูป (Quick Presets):</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() =>
                applyPreset({
                  name: "นาย สมชาย บัญชีเงินเดือนบุคคล",
                  balance: "150000",
                  status: "ACTIVE",
                  prefix: "IND",
                })
              }
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition text-left cursor-pointer border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none hover:border-cyan-400/50"
            >
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-[10px] text-slate-900 dark:text-white">บุคคลทั่วไป (฿150K)</span>
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">บัญชีบุคคลธรรมดาปกติ</div>
            </button>

            <button
              type="button"
              onClick={() =>
                applyPreset({
                  name: "บจก. สยาม คอร์ปอเรท เทรดดิ้ง",
                  balance: "8500000",
                  status: "ACTIVE",
                  prefix: "CORP",
                })
              }
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition text-left cursor-pointer border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none hover:border-blue-400/50"
            >
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-bold text-[10px] text-slate-900 dark:text-white">นิติบุคคล (฿8.5M)</span>
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">ยอดเงินสูงสำหรับธุรกิจ</div>
            </button>

            <button
              type="button"
              onClick={() =>
                applyPreset({
                  name: "นาย สิทธิชัย (บัญชีเฝ้าระวัง AML)",
                  balance: "60000",
                  status: "UNDER_INVESTIGATION",
                  prefix: "WATCH",
                })
              }
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition text-left cursor-pointer border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none hover:border-purple-400/50"
            >
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="font-bold text-[10px] text-slate-900 dark:text-white">บัญชีเฝ้าระวัง (฿60K)</span>
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">AML Watchlist Flag</div>
            </button>

            <button
              type="button"
              onClick={() =>
                applyPreset({
                  name: "Apex Inter-Bank Settlement Vault",
                  balance: "50000000",
                  status: "ACTIVE",
                  prefix: "VAULT",
                })
              }
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition text-left cursor-pointer border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none hover:border-cyan-400/50"
            >
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="font-bold text-[10px] text-slate-900 dark:text-white">กองทุนสภาพคล่อง (฿50M)</span>
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">Inter-Bank Liquidity</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>ชื่อบัญชี (Account Name) *</span>
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="เช่น นาย สมชาย ใจดี หรือ บจก. ตัวอย่างการค้า"
              required
              className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Wallet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>เลขที่บัญชี (Account Number)</span>
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="เว้นว่างเพื่อให้ระบบสร้างอัตโนมัติ"
                className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ยอดเงินเริ่มต้น (Initial Balance THB)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">฿</span>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  min="0"
                  step="any"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>สถานะบัญชี (Account Status)</span>
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "ACTIVE" | "UNDER_INVESTIGATION" | "FROZEN")
              }
              className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ACTIVE" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                ACTIVE (บัญชีปกติพร้อมทำธุรกรรม)
              </option>
              <option value="UNDER_INVESTIGATION" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                UNDER_INVESTIGATION (บัญชีเฝ้าระวัง AML Watchlist)
              </option>
              <option value="FROZEN" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                FROZEN (บัญชีถูกอายัด - ห้ามโอนออก)
              </option>
            </select>
          </div>

          {/* Feedback Banner */}
          {result && (
            <div
              className={`p-3.5 rounded-2xl border text-xs ${
                result.success
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/70 text-emerald-900 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700/70 text-rose-900 dark:text-rose-300"
              }`}
            >
              <div className="flex items-center space-x-2 font-bold">
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                )}
                <span>{result.success ? "สร้างบัญชีสำเร็จ" : "เกิดข้อผิดพลาด"}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
                {result.message || result.error}
              </p>
              {result.account && (
                <div className="mt-2 text-[10px] font-mono text-cyan-800 dark:text-cyan-300 bg-white dark:bg-slate-950/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <div>เลขบัญชี: {result.account.accountNumber}</div>
                  <div>ยอดเงินคงเหลือ: ฿{Number(result.account.balance).toLocaleString()}</div>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent transition cursor-pointer"
            >
              ยกเลิก (Cancel)
            </button>
            <button
              type="submit"
              disabled={loading || !accountName.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 shadow-lg shadow-cyan-600/30 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึกลง Neon DB...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>ยืนยันสร้างบัญชี (Create Account)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
