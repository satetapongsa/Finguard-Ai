"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  FileSearch,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  Zap,
  ArrowRight,
  BadgeAlert,
  SlidersHorizontal,
} from "lucide-react";
import { useComplianceStore } from "@/store/compliance-store";
import { CompliancePolicyItem } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export default function ComplianceCopilotPage() {
  const selectedTransaction = useComplianceStore((s) => s.selectedTransaction);

  const [activeTab, setActiveTab] = useState<"transaction" | "policies">("transaction");
  const [policies, setPolicies] = useState<CompliancePolicyItem[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<CompliancePolicyItem | null>(null);
  const [policyCategory, setPolicyCategory] = useState("ALL");

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `### 🛡️ FinGuard AI Sovereign Compliance Copilot
I am your autonomous regulatory intelligence agent. I continuously cross-reference transactions and inquiries against **Bank of Thailand (BOT)**, **Anti-Money Laundering Office (AMLO)**, and **PDPA B.E. 2562** legal directives.

Select a transaction or regulatory policy on the left, or query below.`,
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
              // Ignore non-json chunk fragments
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
                  "*Communication error with Compliance Agent engine. Please retry.*",
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
    <div className="h-[calc(100vh-9.5rem)] flex flex-col lg:flex-row gap-5 pb-4">
      {/* ========================================================================= */}
      {/* LEFT PANEL: DOCUMENT / TRANSACTION INSPECTOR                             */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-5/12 flex flex-col glass-panel rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl">
        {/* Panel Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-950/60 p-2 gap-1.5">
          <button
            onClick={() => setActiveTab("transaction")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "transaction"
                ? "bg-white text-cyan-800 border border-cyan-300 shadow-sm dark:bg-gradient-to-r dark:from-cyan-950 dark:to-slate-800 dark:text-cyan-300 dark:border-cyan-500/40"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <FileSearch className="w-4 h-4" />
            <span>Active Transaction</span>
          </button>
          <button
            onClick={() => setActiveTab("policies")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "policies"
                ? "bg-white text-cyan-800 border border-cyan-300 shadow-sm dark:bg-gradient-to-r dark:from-cyan-950 dark:to-slate-800 dark:text-cyan-300 dark:border-cyan-500/40"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Regulatory Library ({policies.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === "transaction" ? (
            selectedTransaction ? (
              <div className="space-y-4">
                {/* Transaction Reference Header */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-mono">
                      TRANSACTION ID
                    </span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {selectedTransaction.id}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                      selectedTransaction.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-700/60"
                        : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-700/60 animate-pulse"
                    }`}
                  >
                    {selectedTransaction.status}
                  </span>
                </div>

                {/* Amount & Risk Overview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                      Amount Settled
                    </span>
                    <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                      ฿{Number(selectedTransaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-semibold">{selectedTransaction.currency}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                      Heuristic Risk Score
                    </span>
                    <p
                      className={`text-xl font-extrabold font-mono mt-1 ${
                        selectedTransaction.riskScore >= 0.65
                          ? "text-rose-600 dark:text-rose-400"
                          : selectedTransaction.riskScore >= 0.3
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {Math.round(selectedTransaction.riskScore * 100)}%
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Autonomous Index</span>
                  </div>
                </div>

                {/* Account Details */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Source (Debit)
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                        {selectedTransaction.sourceAccount.accountName}
                      </p>
                      <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {selectedTransaction.sourceAccount.accountNumber}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Destination (Credit)
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                      {selectedTransaction.destinationAccount.accountName}
                    </p>
                    <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {selectedTransaction.destinationAccount.accountNumber}
                    </p>
                  </div>
                </div>

                {/* Risk Reasons & Breach Flags */}
                {selectedTransaction.riskReason && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200">
                    <div className="flex items-center space-x-2 font-bold text-xs mb-1.5 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Regulatory Triggers & Anomaly Flags</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                      {selectedTransaction.riskReason}
                    </p>
                  </div>
                )}

                {/* Action CTA */}
                <button
                  onClick={() =>
                    handleSendMessage(
                      `Please perform an exhaustive Bank of Thailand (BOT) and AMLO compliance inspection for transaction ${selectedTransaction.id} of amount ฿${selectedTransaction.amount}. Identify potential structuring, reporting thresholds, and mandatory regulatory filings.`
                    )
                  }
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Interrogate with AI Compliance Copilot</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 dark:text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-3">
                  <FileSearch className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
                </div>
                <p className="font-bold text-slate-900 dark:text-slate-200 text-sm">No Active Transaction Selected</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                  Go to the Dashboard and select &quot;Copilot&quot; on any transaction, or query general regulatory directives directly.
                </p>
              </div>
            )
          ) : (
            /* Regulatory Policies Browser */
            <div className="space-y-3">
              <div className="flex items-center space-x-1.5 pb-2 overflow-x-auto">
                {["ALL", "AML", "PDPA", "FRAUD"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPolicyCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      policyCategory === cat
                        ? "bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-700/80"
                        : "bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
                      className={`p-4 rounded-2xl border transition duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-cyan-50/80 dark:bg-slate-900/90 border-cyan-400 dark:border-cyan-500/60 shadow-md"
                          : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 text-xs">{pol.code}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 uppercase font-mono font-semibold">
                          {pol.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white mt-1.5 text-xs">{pol.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{pol.rawContent}</p>

                      {isSelected && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendMessage(
                                `Analyze the regulatory requirements of [${pol.code}] ("${pol.title}") and how our institution should enforce automated controls.`
                              );
                            }}
                            className="text-xs text-cyan-700 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
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
      <div className="w-full lg:w-7/12 flex flex-col glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/90 overflow-hidden shadow-xl dark:shadow-2xl">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">FinGuard Regulatory RAG Copilot</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Live inference against BOT, AMLO & PDPA Vector Knowledge Base
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
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {messages.map((msg) => {
            const isBot = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  isBot ? "justify-start" : "justify-end"
                }`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/60 flex items-center justify-center text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[90%] rounded-2xl p-4 leading-relaxed relative group ${
                    isBot
                      ? "bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 text-slate-800 dark:text-slate-200 shadow-sm dark:shadow-lg"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs space-y-2 leading-relaxed">
                    {msg.content}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/40 pt-1.5">
                    <span className="font-mono text-[10px]">{msg.timestamp}</span>
                    {isBot && msg.content && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
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
            <div className="flex items-center space-x-2 text-cyan-400 text-xs pl-10 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>FinGuard Agent Synthesizing Regulatory Citations...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Prompt Chips */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/60 flex items-center space-x-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-bold uppercase text-[9px] shrink-0">Prompts:</span>
          <button
            onClick={() =>
              handleSendMessage(
                "ตรวจสอบกฎหมายและระเบียบธนาคารแห่งประเทศไทย (BOT-NO-12/2566) สำหรับธุรกรรมโอนเงินเกิน 500,000 บาท ว่ามีข้อกำหนดอย่างไรบ้าง"
              )
            }
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 text-slate-700 dark:text-slate-300 font-medium shrink-0 cursor-pointer transition hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none"
          >
            เกณฑ์ ธปท. 500K THB
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                "ขอคำแนะนำการจัดทำรายงานธุรกรรมที่มีเหตุอันควรสงสัย (STR) ตาม พ.ร.บ. ป้องกันและปราบปรามการฟอกเงิน (AMLO-SEC-2024-01) สำหรับธุรกรรมเกิน 2,000,000 บาท"
              )
            }
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 text-slate-700 dark:text-slate-300 font-medium shrink-0 cursor-pointer transition hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none"
          >
            รายงาน ปปง. (STR) &gt; 2M
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                "ตรวจสอบข้อกำหนด PDPA B.E. 2562 ในภาคการเงินเกี่ยวกับการ Mask ข้อมูลเลขบัตรประชาชน 13 หลัก และเลขบัญชีธนาคาร"
              )
            }
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 text-slate-700 dark:text-slate-300 font-medium shrink-0 cursor-pointer transition hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none"
          >
            กฎหมาย PDPA & PII Masking
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                "วิเคราะห์ความเสี่ยงบัญชีม้าและการตรวจจับความผิดปกติของธุรกรรมแบบถี่ผิดปกติ (Velocity Burst Anomaly Detection)"
              )
            }
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 text-slate-700 dark:text-slate-300 font-medium shrink-0 cursor-pointer transition hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none"
          >
            ตรวจจับบัญชีม้า & Velocity Burst
          </button>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FinGuard Copilot regarding BOT/AMLO policies or transaction risks..."
              disabled={isStreaming}
              className="flex-1 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 disabled:opacity-40 transition cursor-pointer flex items-center space-x-1.5"
            >
              <span>Ask</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
