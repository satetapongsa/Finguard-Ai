import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import QuickTransferModal from "@/components/QuickTransferModal";
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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c14] text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
        <div className="relative flex min-h-screen flex-col">
          <Navigation />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <QuickTransferModal />

          {/* Footer */}
          <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
              <span>FinGuard AI Autonomous Compliance Engine &bull; Bank of Thailand & AMLO Framework</span>
              <span className="mt-1 sm:mt-0 font-mono text-[11px] text-slate-400">
                Double-Entry Ledger Verified &bull; SHA-256 Audit Trail
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
