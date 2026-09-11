"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Bot,
  FileCheck,
  PlusCircle,
  Database,
  Lock,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";

export default function Navigation() {
  const pathname = usePathname();
  const setQuickTransferOpen = useComplianceStore((s) => s.setQuickTransferOpen);

  const navItems = [
    { label: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "AI Compliance Copilot", href: "/compliance", icon: Bot },
    { label: "Immutable Audit Explorer", href: "/audit", icon: FileCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bfsi-glass border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-wide">
                FinGuard <span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                BFSI Tier-1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Autonomous Compliance & Transaction Intelligence Agent
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action & Status Indicator */}
        <div className="flex items-center space-x-3">
          {/* Engine Badges */}
          <div className="hidden lg:flex items-center space-x-2 text-[11px]">
            <span className="flex items-center space-x-1 px-2 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ACID Engine</span>
            </span>
            <span className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>PDPA Guardrail</span>
            </span>
            <span className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
              <Database className="w-3 h-3 text-purple-400" />
              <span>pgvector</span>
            </span>
          </div>

          {/* Quick Transfer Button */}
          <button
            onClick={() => setQuickTransferOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Execute Transfer</span>
          </button>
        </div>
      </div>
    </header>
  );
}
