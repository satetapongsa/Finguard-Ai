"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  FileSearch,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Scale,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import { TransactionWithAccounts, CompliancePolicyItem } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export default function ComplianceCopilotPage() {
  const selectedTransaction = useComplianceStore((s) => s.selectedTransaction);
  const setSelectedTransaction = useComplianceStore((s) => s.setSelectedTransaction);

  const [activeTab, setActiveTab] = useState<"transaction" | "policies">("transaction");
  const [policies, setPolicies] = useState<CompliancePolicyItem[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<CompliancePolicyItem | null>(null);
  const [policyCategory, setPolicyCategory] = useState("ALL");

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `### 👋 FinGuard AI Autonomous Compliance Copilot Active
I am your specialized BFSI Compliance Intelligence Agent. I continuously verify transactions against Bank of Thailand (BOT), Anti-Money Laundering Office (AMLO), and PDPA frameworks.

Select a transaction or regulatory policy on the left, or ask a question below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Policies
  useEffect(() => {
    fetch("/api/policies")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPolicies(data.data);
          if (data.data.length > 0) setSelectedPolicy(data.data[0]);
        }
      })
      .catch((err) => console.error("Could not load policies:", err));
  }, []);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Handle Send to Stream API
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput("");
    setIsStreaming(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, initialAssistantMsg]);

    try {
      const response = await fetch("/api/compliance/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: promptToSend,
          transactionId: selectedTransaction?.id,
          category: selectedPolicy?.category,
          contextData: selectedPolicy
            ? {
                policyCode: selectedPolicy.code,
                policyTitle: selectedPolicy.title,
              }
            : undefined,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to streaming compliance agent");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Vercel AI SDK text stream chunk format: 0:"token"
            try {
              const textContent = JSON.parse(line.slice(2));
              accumulatedText += textContent;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulatedText }
                    : msg
                )
              );
            } catch (_err) {
              // Ignore non-json chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  "⚠️ *Communication error with Compliance Agent engine. Please retry.*",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-4">
      {/* ========================================================================= */}
      {/* LEFT PANEL: DOCUMENT / TRANSACTION INSPECTOR                             */}
      {/* ========================================================================= */}
      <div className="w-full md:w-5/12 flex flex-col bfsi-glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {/* Panel Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab("transaction")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "transaction"
                ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>Active Transaction</span>
          </button>
          <button
            onClick={() => setActiveTab("policies")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "policies"
                ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Regulatory Policies ({policies.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeTab === "transaction" ? (
            selectedTransaction ? (
              <div className="space-y-4">
                {/* Transaction Header Banner */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">TXN REF</span>
                    <p className="font-mono font-bold text-white text-xs">{selectedTransaction.id}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedTransaction.status === "APPROVED"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-rose-950 text-rose-400 border border-rose-800 animate-pulse"
                    }`}
                  >
                    {selectedTransaction.status}
                  </span>
                </div>

                {/* Amount & Risk Overview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Ledger Amount</span>
                    <p className="text-base font-bold font-mono text-white mt-0.5">
                      ฿{Number(selectedTransaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-cyan-400 font-mono">{selectedTransaction.currency}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Heuristic Risk Score</span>
                    <p
                      className={`text-base font-bold font-mono mt-0.5 ${
                        selectedTransaction.riskScore >= 0.65
                          ? "text-rose-400"
                          : selectedTransaction.riskScore >= 0.3
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {Math.round(selectedTransaction.riskScore * 100)}%
                    </p>
                    <span className="text-[10px] text-slate-400">Autonomous Index</span>
                  </div>
                </div>

                {/* Accounts */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-[10px] text-slate-400">Source (Debit)</span>
                      <p className="font-semibold text-slate-200">{selectedTransaction.sourceAccount.accountName}</p>
                      <p className="font-mono text-[10px] text-slate-500">
                        {selectedTransaction.sourceAccount.accountNumber}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Destination (Credit)</span>
                    <p className="font-semibold text-slate-200">{selectedTransaction.destinationAccount.accountName}</p>
                    <p className="font-mono text-[10px] text-slate-500">
                      {selectedTransaction.destinationAccount.accountNumber}
                    </p>
                  </div>
                </div>

                {/* Risk Reasons & Breach Flags */}
                {selectedTransaction.riskReason && (
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-200">
                    <div className="flex items-center space-x-1.5 font-semibold text-[11px] mb-1 text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Regulatory Flags Triggered</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{selectedTransaction.riskReason}</p>
                  </div>
                )}

                {/* Quick Analyze Button */}
                <button
                  onClick={() =>
                    handleSendMessage(
                      `Please perform an exhaustive Bank of Thailand (BOT) and AMLO compliance inspection for transaction ${selectedTransaction.id} of amount ฿${selectedTransaction.amount}. Identify potential structuring, reporting thresholds, and mandatory regulatory filings.`
                    )
                  }
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-600/20 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Send Transaction to AI Copilot</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <FileSearch className="w-10 h-10 text-slate-600 mb-3" />
                <p className="font-semibold text-slate-300">No Transaction Currently Selected</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Go to the Executive Dashboard and click &apos;Copilot&apos; on any transaction, or ask a general regulatory query.
                </p>
              </div>
            )
          ) : (
            /* Regulatory Policies Browser */
            <div className="space-y-3">
              <div className="flex items-center space-x-2 pb-2">
                {["ALL", "AML", "PDPA", "FRAUD"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPolicyCategory(cat)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition cursor-pointer ${
                      policyCategory === cat
                        ? "bg-cyan-900/60 text-cyan-300 border border-cyan-700"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {policies
                .filter((p) => policyCategory === "ALL" || p.category === policyCategory)
                .map((pol) => {
                  const isSelected = selectedPolicy?.id === pol.id;
                  return (
                    <div
                      key={pol.id}
                      onClick={() => setSelectedPolicy(pol)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "bg-slate-800/80 border-cyan-500/60"
                          : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-cyan-400 text-[11px]">{pol.code}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                          {pol.category}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white mt-1 text-xs">{pol.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{pol.rawContent}</p>

                      {isSelected && (
                        <div className="mt-2 pt-2 border-t border-slate-700/60 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendMessage(
                                `Analyze the regulatory requirements of [${pol.code}] ("${pol.title}") and how our institution should enforce automated controls.`
                              );
                            }}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Interrogate with Copilot</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: STREAMING AI COPILOT CHAT INTERFACE                          */}
      {/* ========================================================================= */}
      <div className="w-full md:w-7/12 flex flex-col bfsi-glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {/* Chat Header */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs">FinGuard Regulatory RAG Copilot</h3>
              <p className="text-[10px] text-slate-400">
                Connected to BOT, AMLO & PDPA Vector Knowledge Base
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                setMessages([
                  {
                    id: "reset",
                    role: "assistant",
                    content: "Conversation session refreshed. How may I assist your compliance inquiry?",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ])
              }
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Reset Conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Message Stream Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg) => {
            const isBot = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${
                  isBot ? "justify-start" : "justify-end"
                }`}
              >
                {isBot && (
                  <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed relative group ${
                    isBot
                      ? "bg-slate-900/90 border border-slate-800 text-slate-200"
                      : "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                    {msg.content}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {isBot && msg.content && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-white flex items-center space-x-1"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex items-center space-x-2 text-cyan-400 text-xs pl-8">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>FinGuard Agent Synthesizing Regulatory Citations...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Prompt Chips */}
        <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto text-[10px]">
          <span className="text-slate-500 font-semibold uppercase text-[9px] shrink-0">Prompts:</span>
          <button
            onClick={() =>
              handleSendMessage(
                "Evaluate Bank of Thailand threshold rules (BOT-NO-12/2566) for large transfers exceeding 500,000 THB."
              )
            }
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
          >
            BOT 500K THB Rule
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                "Draft an AMLO Suspicious Transaction Report (STR) justification based on high-risk transaction velocity."
              )
            }
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
          >
            Draft AMLO STR
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                "Check PDPA Section 2562 guardrail requirements for masking Thai National IDs and payment cards."
              )
            }
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
          >
            PDPA Masking Audit
          </button>
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FinGuard Copilot regarding BOT/AMLO policies or transaction risks..."
              disabled={isStreaming}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 disabled:opacity-40 transition cursor-pointer flex items-center space-x-1"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
