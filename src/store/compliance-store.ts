import { create } from "zustand";
import { TransactionWithAccounts, CompliancePolicyItem } from "@/lib/types";

interface ComplianceState {
  selectedTransaction: TransactionWithAccounts | null;
  selectedPolicy: CompliancePolicyItem | null;
  activeFilter: string;
  isQuickTransferOpen: boolean;
  activeTab: "transactions" | "policies";
  
  setSelectedTransaction: (tx: TransactionWithAccounts | null) => void;
  setSelectedPolicy: (policy: CompliancePolicyItem | null) => void;
  setActiveFilter: (filter: string) => void;
  setQuickTransferOpen: (open: boolean) => void;
  setActiveTab: (tab: "transactions" | "policies") => void;
}

export const useComplianceStore = create<ComplianceState>((set) => ({
  selectedTransaction: null,
  selectedPolicy: null,
  activeFilter: "ALL",
  isQuickTransferOpen: false,
  activeTab: "transactions",

  setSelectedTransaction: (tx) => set({ selectedTransaction: tx }),
  setSelectedPolicy: (policy) => set({ selectedPolicy: policy }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setQuickTransferOpen: (open) => set({ isQuickTransferOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
