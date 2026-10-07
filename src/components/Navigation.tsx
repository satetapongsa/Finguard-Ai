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
  CreditCard,
  Scale,
} from "lucide-react";
import type { RoleType } from "@/lib/types";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

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
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Regulatory Watch", href: "/dashboard/regulations", icon: Bot },
    { label: "Compliance Gaps", href: "/dashboard/gap-analysis", icon: Scale },
    { label: "Agent Activity", href: "/dashboard/agents", icon: ShieldAlert },
    { label: "Audit Trail", href: "/audit", icon: FileCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#040810]/95 backdrop-blur-xl transition-colors duration-200 shadow-sm dark:shadow-none">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2.5 sm:space-x-3 group shrink-0">
          <div className="relative">
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/25 group-hover:shadow-cyan-400/40 transition duration-300">
              <ShieldAlert className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
              FinGuard <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">AI</span>
            </span>
          </div>
        </Link>

        {/* Center: Horizontal Navigation Menu (Desktop) */}
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
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Neon Database Status Badge */}
          <div
            title={dbStatus.connected ? "Connected to Neon Serverless PostgreSQL" : "Connecting to Neon Database..."}
            className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border ${
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
            <span className="font-mono text-[10px]">
              {dbStatus.connected ? "Neon DB" : "Connecting..."}
            </span>
          </div>

          {/* RBAC Role Switcher */}
          <div className="flex items-center space-x-1 px-2 py-1.5 h-9 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <select
              value={activeRole}
              onChange={(e) => handleRoleChange(e.target.value as RoleType)}
              className="bg-transparent text-slate-800 dark:text-cyan-300 text-[11px] sm:text-xs font-bold focus:outline-none cursor-pointer pr-1"
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
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs font-bold transition cursor-pointer text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center space-x-1"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden xl:inline text-[11px]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-600" />
                <span className="hidden xl:inline text-[11px]">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Floating Bottom Navigation Dock (Mobile App Experience) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#040810]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800/90 px-2 py-2 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-all duration-150 ${
                isActive
                  ? "text-cyan-700 dark:text-cyan-300 bg-cyan-50/90 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-500/40 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? "text-cyan-600 dark:text-cyan-400" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 mb-0.5 text-amber-400" /> : <Moon className="w-4 h-4 mb-0.5 text-cyan-600" />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </div>
    </header>
  );
}
