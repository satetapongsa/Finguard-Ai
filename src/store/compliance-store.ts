import { create } from "zustand";
import { TransactionWithAccounts, CompliancePolicyItem } from "@/lib/types";

export interface DashboardStatsData {
  totalVolume: number;
  transactionCount: number;
  verifiedLedgerBalance: number;
  highRiskFlags: number;
  activeComplianceAlerts: number;
}

export interface AccountData {
  id: string;
  accountNumber: string;
  accountName: string;
  balance: string;
  currency: string;
  status: string;
}

interface ComplianceState {
  selectedTransaction: TransactionWithAccounts | null;
  selectedPolicy: CompliancePolicyItem | null;
  activeFilter: string;
  isQuickTransferOpen: boolean;
  isCreateAccountOpen: boolean;
  activeTab: "transactions" | "policies";
  
  // Instant In-Memory Cache (Zero navigation lag & Instant Page Hydration)
  cachedStats: DashboardStatsData | null;
  cachedAccounts: AccountData[];
  cachedTransactions: TransactionWithAccounts[];
  lastFetchedAt: number;

  // Transaction In-Progress Loading Indicator
  isProcessingTransaction: boolean;
  processingMessage: string;
  setProcessingTransaction: (isProcessing: boolean, message?: string) => void;

  setSelectedTransaction: (tx: TransactionWithAccounts | null) => void;
  setSelectedPolicy: (policy: CompliancePolicyItem | null) => void;
  setActiveFilter: (filter: string) => void;
  setQuickTransferOpen: (open: boolean) => void;
  setCreateAccountOpen: (open: boolean) => void;
  setActiveTab: (tab: "transactions" | "policies") => void;

  setCachedStats: (stats: DashboardStatsData) => void;
  setCachedAccounts: (accounts: AccountData[]) => void;
  setCachedTransactions: (transactions: TransactionWithAccounts[]) => void;
  syncAllData: () => Promise<void>;
  triggerFullSyncAndRefresh: () => Promise<void>;
}

export const useComplianceStore = create<ComplianceState>((set, get) => ({
  selectedTransaction: null,
  selectedPolicy: null,
  activeFilter: "ALL",
  isQuickTransferOpen: false,
  isCreateAccountOpen: false,
  activeTab: "transactions",

  isProcessingTransaction: false,
  processingMessage: "Settling ACID Ledger Transaction...",

  setProcessingTransaction: (isProcessing, message = "Settling ACID Ledger Transaction...") =>
    set({ isProcessingTransaction: isProcessing, processingMessage: message }),

  cachedStats: null,
  cachedAccounts: [],
  cachedTransactions: [],
  lastFetchedAt: 0,

  setSelectedTransaction: (tx) => set({ selectedTransaction: tx }),
  setSelectedPolicy: (policy) => set({ selectedPolicy: policy }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setQuickTransferOpen: (open) => set({ isQuickTransferOpen: open }),
  setCreateAccountOpen: (open) => set({ isCreateAccountOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  setCachedStats: (stats) => set({ cachedStats: stats }),
  setCachedAccounts: (accounts) => set({ cachedAccounts: accounts }),
  setCachedTransactions: (transactions) => set({ cachedTransactions: transactions }),

  syncAllData: async () => {
    try {
      const [statsRes, txRes, accRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/transactions?limit=100"),
        fetch("/api/accounts"),
      ]);

      const [statsData, txData, accData] = await Promise.all([
        statsRes.json(),
        txRes.json(),
        accRes.json(),
      ]);

      set({
        cachedStats: statsData.success ? statsData.data : get().cachedStats,
        cachedTransactions: txData.success ? txData.data : get().cachedTransactions,
        cachedAccounts: accData.success ? accData.data : get().cachedAccounts,
        lastFetchedAt: Date.now(),
      });
    } catch (err) {
      console.error("Non-blocking background data sync failed:", err);
    }
  },

  triggerFullSyncAndRefresh: async () => {
    set({
      isProcessingTransaction: true,
      processingMessage: "Synchronizing database records & clearing cache...",
    });

    try {
      // Clear in-memory cache to force fresh pull
      set({
        cachedStats: null,
        cachedAccounts: [],
        cachedTransactions: [],
      });

      // Bust browser HTTP cache with timestamp query
      const bust = Date.now();
      const [statsRes, txRes, accRes] = await Promise.all([
        fetch(`/api/stats?_t=${bust}`),
        fetch(`/api/transactions?limit=100&_t=${bust}`),
        fetch(`/api/accounts?_t=${bust}`),
      ]);

      const [statsData, txData, accData] = await Promise.all([
        statsRes.json(),
        txRes.json(),
        accRes.json(),
      ]);

      set({
        cachedStats: statsData.success ? statsData.data : null,
        cachedTransactions: txData.success ? txData.data : [],
        cachedAccounts: accData.success ? accData.data : [],
        lastFetchedAt: Date.now(),
      });

      // Dispatch global sync event to notify all active views
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("finguard_tx_updated"));
      }

      // Small delay so user sees confirmation before overlay dismisses
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error("Full database sync and cache purge error:", err);
    } finally {
      set({ isProcessingTransaction: false });
    }
  },
}));
