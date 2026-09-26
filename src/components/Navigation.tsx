"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Bot,
  FileCheck,
  PlusCircle,
  Database,
  Lock,
  UserCheck,
  Activity,
  Server,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import type { RoleType } from "@/lib/types";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const setQuickTransferOpen = useComplianceStore((s) => s.setQuickTransferOpen);

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
          provider: "Simulation Ledger Engine",
        });
      });
  }, []);

  const handleRoleChange = (newRole: RoleType) => {
    setActiveRole(newRole);
    document.cookie = `finguard_role=${newRole}; path=/; max-age=86400; SameSite=Lax`;
    router.refresh();
  };

  const navItems = [
    { label: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: "Live" },
    { label: "AI Compliance Copilot", href: "/compliance", icon: Bot, badge: "RAG" },
    { label: "Immutable Audit Explorer", href: "/audit", icon: FileCheck, badge: "SHA-256" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#040810]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/dashboard" className="flex items-center space-x-3.5 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-400/40 transition duration-300">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-white tracking-tight">
                FinGuard <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-700/50">
                BFSI Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Autonomous Compliance & Transaction Intelligence
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-950/80 to-slate-800 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action & Status Indicator */}
        <div className="flex items-center space-x-3">
          {/* Neon Database Status Badge */}
          <div
            title={dbStatus.connected ? "Connected to PostgreSQL Database" : "Using High-Fidelity Simulation Ledger"}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              dbStatus.connected
                ? "bg-emerald-950/70 border-emerald-700/60 text-emerald-300"
                : "bg-amber-950/70 border-amber-700/60 text-amber-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="font-mono text-[10px]">
              {dbStatus.connected ? "Neon DB: Online" : "Neon: Simulator Ready"}
            </span>
          </div>

          {/* RBAC Role Switcher */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold hidden sm:inline">Role:</span>
            <select
              value={activeRole}
              onChange={(e) => handleRoleChange(e.target.value as RoleType)}
              className="bg-transparent text-cyan-300 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ADMIN" className="bg-slate-900 text-white">ADMIN</option>
              <option value="COMPLIANCE_OFFICER" className="bg-slate-900 text-white">OFFICER</option>
              <option value="AUDITOR" className="bg-slate-900 text-white">AUDITOR (Read-only)</option>
            </select>
          </div>

          {/* Quick Transfer Button */}
          <button
            onClick={() => setQuickTransferOpen(true)}
            className="group relative flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 hover:shadow-cyan-500/40 transition duration-200 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            <span className="hidden sm:inline">Simulate Transfer</span>
            <span className="sm:hidden">Transfer</span>
          </button>
        </div>
      </div>

      {/* Mobile Floating Bottom Navigation Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#040810]/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-2 flex items-center justify-around shadow-2xl">
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
                  ? "text-cyan-400 bg-cyan-950/50 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setQuickTransferOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30"
        >
          <PlusCircle className="w-4 h-4 mb-0.5 text-emerald-400" />
          <span>Simulate</span>
        </button>
      </div>
    </header>
  );
}
