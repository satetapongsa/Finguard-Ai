import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import QuickTransferModal from "@/components/QuickTransferModal";
import CreateAccountModal from "@/components/CreateAccountModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinGuard AI | Autonomous Financial Compliance & Intelligence",
  description:
    "Tier-1 BFSI Autonomous Financial Compliance, Double-Entry ACID Ledger & Transaction Intelligence Agent with pgvector and PDPA Guardrails.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('finguard_theme');
                if (savedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen text-foreground bg-background antialiased selection:bg-cyan-500 selection:text-white font-sans transition-colors duration-200">
        <div className="relative flex min-h-screen flex-col">
          {/* Subtle Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent pointer-events-none blur-3xl -z-10" />

          <Navigation />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
            {children}
          </main>
          <QuickTransferModal />
          <CreateAccountModal />

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#03060c] py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  FinGuard AI Autonomous Compliance Engine
                </span>
                <span className="text-slate-400 dark:text-slate-600">&bull;</span>
                <span className="text-slate-500 dark:text-slate-400">Bank of Thailand & AMLO Framework</span>
              </div>
              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                  Double-Entry Invariant: Verified
                </span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                  SHA-256 Non-Repudiation
                </span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
