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
  Sparkles,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";

export default function Navigation() {
  const pathname = usePathname();
  const setQuickTransferOpen = useComplianceStore((s) => s.setQuickTransferOpen);

  const navItems = [
    { label: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: "Live" },
    { label: "AI Compliance Copilot", href: "/compliance", icon: Bot, badge: "RAG" },
    { label: "Immutable Audit Explorer", href: "/audit", icon: FileCheck, badge: "SHA-256" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#040810]/85 backdrop-blur-xl">
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
                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
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
          {/* Sovereign Engine Badges */}
          <div className="hidden xl:flex items-center space-x-2 text-[11px] font-medium">
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ACID Engine</span>
            </span>
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>PDPA Shield</span>
            </span>
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-950/40 text-purple-400 border border-purple-800/40">
              <Database className="w-3 h-3 text-purple-400" />
              <span>pgvector</span>
            </span>
          </div>

          {/* Quick Transfer Button */}
          <button
            onClick={() => setQuickTransferOpen(true)}
            className="group relative flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 hover:shadow-cyan-500/40 transition duration-200 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            <span>Execute Transfer</span>
          </button>
        </div>
      </div>
    </header>
  );
}
