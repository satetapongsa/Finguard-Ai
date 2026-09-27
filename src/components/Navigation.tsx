"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Bot,
  FileCheck,
  UserCheck,
  Sun,
  Moon,
  PlusCircle,
  UserPlus,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import type { RoleType } from "@/lib/types";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const setQuickTransferOpen = useComplianceStore((s) => s.setQuickTransferOpen);
  const setCreateAccountOpen = useComplianceStore((s) => s.setCreateAccountOpen);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeRole, setActiveRole] = useState<RoleType>("COMPLIANCE_OFFICER");
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider: string;
    isNeon?: boolean;
    latencyMs?: number;
  }>({
    connected: false,
    provider: "Checking Database...",
  });

  useEffect(() => {
    // Read saved theme
    const savedTheme = (localStorage.getItem("finguard_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);

    // Read active role from cookie
    const match = document.cookie.match(/(?:^|; )finguard_role=([^;]*)/);
    if (match && (match[1] === "ADMIN" || match[1] === "COMPLIANCE_OFFICER" || match[1] === "AUDITOR")) {
      setActiveRole(match[1] as RoleType);
    }

    // Check database connection status
    fetch("/api/database/status")
      .then((res) => res.json())
      .then((data) => {
        setDbStatus({
          connected: data.connected,
          provider: data.provider || "PostgreSQL",
          isNeon: data.provider?.includes("Neon"),
          latencyMs: data.latencyMs,
        });
      })
      .catch(() => {
        setDbStatus({
          connected: false,
          provider: "Neon PostgreSQL",
        });
      });
  }, []);

  const handleRoleChange = (newRole: RoleType) => {
    setActiveRole(newRole);
    document.cookie = `finguard_role=${newRole}; path=/; max-age=86400; SameSite=Lax`;
    router.refresh();
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("finguard_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  };

  const navItems = [
    { label: "แดชบอร์ด (Dashboard)", href: "/dashboard", icon: LayoutDashboard },
    { label: "บล็อกเชน (Audit Trail)", href: "/audit", icon: FileCheck },
    { label: "ตรวจกฎหมาย (Compliance)", href: "/compliance", icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#040810]/95 backdrop-blur-xl transition-colors duration-200 shadow-sm dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <Link href="/dashboard" className="flex items-center space-x-3 group shrink-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/25 group-hover:shadow-cyan-400/40 transition duration-300">
              <ShieldAlert className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
              FinGuard <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">AI</span>
            </span>
          </div>
        </Link>

        {/* Center: Horizontal Navigation Menu */}
        <nav className="hidden md:flex items-center space-x-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/90">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? "bg-white text-cyan-800 border border-cyan-200 shadow-sm dark:bg-gradient-to-r dark:from-cyan-950/90 dark:to-slate-800/90 dark:text-cyan-300 dark:border-cyan-500/30"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Controls & Indicator Bar */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Create Account Button */}
          <button
            onClick={() => setCreateAccountOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95 shadow-sm"
            title="สร้างบัญชีใหม่สำหรับจำลองการโอนเงินสด"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">+ สร้างบัญชี</span>
            <span className="sm:hidden">+ บัญชี</span>
          </button>

          {/* Quick Transfer Button */}
          <button
            onClick={() => setQuickTransferOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-600/25 transition cursor-pointer active:scale-95"
            title="เปิดหน้าต่างโอนเงินจำลองตัดยอดแบบ Double-Entry ACID ลงฐานข้อมูลจริง"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ โอนเงินจำลอง</span>
            <span className="sm:hidden">+ โอน</span>
          </button>

          {/* Neon Database Status Badge */}
          <div
            title={dbStatus.connected ? "Connected to Neon Serverless PostgreSQL" : "Connecting to Neon Database..."}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              dbStatus.connected
                ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-700/60 text-amber-800 dark:text-amber-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"
              }`}
            />
            <span className="font-mono text-[10px] hidden sm:inline">
              {dbStatus.connected ? "Neon DB" : "Connecting..."}
            </span>
          </div>

          {/* RBAC Role Switcher */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <select
              value={activeRole}
              onChange={(e) => handleRoleChange(e.target.value as RoleType)}
              className="bg-transparent text-slate-800 dark:text-cyan-300 text-xs font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="ADMIN" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">ADMIN</option>
              <option value="COMPLIANCE_OFFICER" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">OFFICER</option>
              <option value="AUDITOR" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">AUDITOR</option>
            </select>
          </div>

          {/* Dark / Light Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={theme === "dark" ? "เปลี่ยนเป็นธีมสว่าง (Light Mode)" : "เปลี่ยนเป็นธีมมืด (Dark Mode)"}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs font-bold transition cursor-pointer text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center space-x-1"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline text-[11px]">สว่าง</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-600" />
                <span className="hidden lg:inline text-[11px]">มืด</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Floating Bottom Navigation Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#040810]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/90 px-3 py-2 flex items-center justify-around shadow-lg dark:shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all duration-150 ${
                isActive
                  ? "text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-500/30"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setCreateAccountOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold text-cyan-600 dark:text-cyan-400"
        >
          <UserPlus className="w-4 h-4 mb-0.5" />
          <span>+ บัญชี</span>
        </button>
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 mb-0.5 text-amber-400" /> : <Moon className="w-4 h-4 mb-0.5 text-cyan-600" />}
          <span>{theme === "dark" ? "สว่าง" : "มืด"}</span>
        </button>
      </div>
    </header>
  );
}
