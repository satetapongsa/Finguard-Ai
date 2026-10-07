"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle,
  FileText,
  Building2,
  Clock,
  ArrowRight,
  Send,
  Sparkles,
  Edit3,
  X,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Lock,
} from "lucide-react";
import {
  approveComplianceGapAction,
  rejectComplianceGapAction,
  requestComplianceReviewAction,
  dispatchApprovedGapAction,
} from "@/app/actions/approval-actions";

export interface GapRecord {
  id: string;
  gapTitle: string;
  finding: string;
  actionItem: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "REVIEWED" | "APPROVED" | "DISMISSED";
  confidence: number;
  reasoning?: string | null;
  evidenceRegulation?: string | null;
  evidencePolicy?: string | null;
  reasoningProvider?: string | null;
  promptVersion?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | Date | null;
  approvedAt?: string | Date | null;
  regulation: {
    regulationCode: string;
    title: string;
    version: string;
    sourceType?: string | null;
    documentUrl?: string | null;
  };
  regulationChunk?: {
    clauseRef: string;
    heading?: string | null;
    content: string;
  } | null;
  internalPolicy: {
    id: string;
    policyCode: string;
    title: string;
    ownerDepartment: string;
  };
  tickets: Array<{
    id: string;
    ticketNumber: string;
    targetDepartment: string;
    priority: string;
    status: string;
    actionItems: string;
    dispatchedAt: string | Date;
    dueDate?: string | Date | null;
  }>;
}

interface GapMatrixTableProps {
  gaps: GapRecord[];
  userRole?: string;
}

export function GapMatrixTable({ gaps, userRole = "COMPLIANCE_OFFICER" }: GapMatrixTableProps) {
  const [selectedGap, setSelectedGap] = useState<GapRecord | null>(null);
  const [officerNotes, setOfficerNotes] = useState("");
  const [customActionItem, setCustomActionItem] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const isAuditor = userRole === "AUDITOR";

  const filteredGaps = gaps.filter((g) => {
    if (statusFilter !== "ALL" && g.status !== statusFilter) return false;
    if (riskFilter !== "ALL" && g.riskLevel !== riskFilter) return false;
    return true;
  });

  const openModal = (gap: GapRecord) => {
    setSelectedGap(gap);
    setOfficerNotes("");
    setCustomActionItem(gap.actionItem);
    setRejectReason("");
    setReviewNotes("");
    setConfirmApprove(false);
    setDispatchResult(null);
  };

  const closeModal = () => {
    setSelectedGap(null);
    setConfirmApprove(false);
  };

  // Human-in-the-Loop Actions
  const handleApprove = async () => {
    if (!selectedGap) return;
    setSubmitting(true);
    try {
      const res = await approveComplianceGapAction({
        gapId: selectedGap.id,
        officerNotes,
        customActionItem,
      });

      if (res.success && res.data) {
        // Automatically prompt to dispatch
        const dispatchRes = await dispatchApprovedGapAction(selectedGap.id);
        if (dispatchRes.success && "data" in dispatchRes && dispatchRes.data) {
          setDispatchResult(dispatchRes.data);
        }
        setSelectedGap({
          ...selectedGap,
          status: "APPROVED",
          reviewedBy: res.data.reviewedBy,
          reviewedAt: res.data.reviewedAt,
          actionItem: customActionItem,
        });
        setConfirmApprove(false);
      } else {
        alert("Approval failed: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedGap || !rejectReason.trim()) {
      alert("Please enter a dismissal rationale.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await rejectComplianceGapAction({
        gapId: selectedGap.id,
        rejectionReason: rejectReason,
      });
      if (res.success) {
        setSelectedGap({
          ...selectedGap,
          status: "DISMISSED",
        });
      } else {
        alert("Rejection failed: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestReview = async () => {
    if (!selectedGap || !reviewNotes.trim()) {
      alert("Please enter clarification notes for the review team.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestComplianceReviewAction({
        gapId: selectedGap.id,
        reviewNotes,
      });
      if (res.success) {
        setSelectedGap({
          ...selectedGap,
          status: "REVIEWED",
        });
      } else {
        alert("Request failed: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualDispatch = async () => {
    if (!selectedGap) return;
    setSubmitting(true);
    try {
      const res = await dispatchApprovedGapAction(selectedGap.id);
      if (res.success && "data" in res && res.data) {
        setDispatchResult(res.data);
      } else {
        alert("Dispatch failed: " + ("error" in res ? res.error : "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-rose-950/80 text-rose-300 border border-rose-700/60 animate-pulse">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-700/60">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Approved
          </span>
        );
      case "REVIEWED":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
            In Review
          </span>
        );
      case "DISMISSED":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            Dismissed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/90 text-amber-400 border border-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Open Gap
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Statuses ({gaps.length})</option>
              <option value="OPEN">Open Gaps</option>
              <option value="APPROVED">Approved</option>
              <option value="REVIEWED">In Review</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {isAuditor && (
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/40">
            <Lock className="w-3 h-3" /> Read-Only Mode (Auditor Role)
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
              <th className="py-3.5 px-4">BOT Clause</th>
              <th className="py-3.5 px-4">Impacted Internal Policy</th>
              <th className="py-3.5 px-4">Owner Department</th>
              <th className="py-3.5 px-4">Risk</th>
              <th className="py-3.5 px-4">Confidence</th>
              <th className="py-3.5 px-4 min-w-[280px]">AI Recommended Action</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Human-in-the-Loop</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredGaps.map((gap) => (
              <tr
                key={gap.id}
                className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                onClick={() => openModal(gap)}
              >
                <td className="py-3.5 px-4">
                  <div className="font-mono font-bold text-cyan-400">
                    {gap.regulationChunk?.clauseRef || "Clause"}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                    {gap.regulation.regulationCode} v{gap.regulation.version}
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>{gap.internalPolicy.policyCode}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {gap.internalPolicy.title}
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="inline-flex items-center gap-1 text-slate-300">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{gap.internalPolicy.ownerDepartment}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4">{getRiskBadge(gap.riskLevel)}</td>

                <td className="py-3.5 px-4">
                  <span className="font-mono font-bold text-emerald-400">
                    {Math.round(gap.confidence * 100)}%
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <div className="line-clamp-2 text-slate-300 text-[11px] leading-relaxed">
                    {gap.actionItem}
                  </div>
                  <div className="text-[10px] text-rose-400/90 mt-1 line-clamp-1 italic">
                    {gap.finding}
                  </div>
                </td>

                <td className="py-3.5 px-4">{getStatusBadge(gap.status)}</td>

                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(gap);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 ${
                      gap.status === "APPROVED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                    }`}
                  >
                    <span>{gap.status === "APPROVED" ? "View Ticket" : "Review"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Human-in-the-Loop Review & Evidence Modal */}
      {selectedGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{selectedGap.gapTitle}</h3>
                  {getRiskBadge(selectedGap.riskLevel)}
                </div>
                <p className="text-xs text-slate-400">
                  Human-in-the-Loop Governance & Traceable Evidence Triad
                </p>
              </div>
            </div>

            {/* Traceable Evidence Triad */}
            <div className="mt-5 space-y-4 text-xs">
              {/* Box 1: External Regulatory Evidence */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px]">
                    1. External Regulatory Evidence (BOT)
                  </span>
                  <span className="font-mono text-cyan-400 text-xs font-bold">
                    {selectedGap.regulation.regulationCode} v{selectedGap.regulation.version} — {selectedGap.regulationChunk?.clauseRef}
                  </span>
                </div>
                <p className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-900/30 text-cyan-100 font-mono text-[11px] leading-relaxed">
                  &ldquo;{selectedGap.regulationChunk?.content}&rdquo;
                </p>
              </div>

              {/* Box 2: Internal Policy Evidence */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                    2. Internal Bank Policy Evidence
                  </span>
                  <span className="font-bold text-white text-xs">
                    {selectedGap.internalPolicy.policyCode} — {selectedGap.internalPolicy.ownerDepartment}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mb-1 font-semibold">{selectedGap.internalPolicy.title}</div>
                <p className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-slate-200 font-mono text-[11px] leading-relaxed">
                  &ldquo;{selectedGap.finding}&rdquo;
                </p>
              </div>

              {/* Box 3: AI Reasoning & Confidence */}
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-rose-400" /> 3. Grounded Impact Finding & Risk Assessment
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <span>{Math.round(selectedGap.confidence * 100)}%</span>
                    <span className="text-[9px] text-slate-400 font-sans font-normal">(Evidence-backed)</span>
                  </span>
                </div>
                <p className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-slate-200 leading-relaxed text-[11px]">
                  {selectedGap.reasoning}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-rose-950/40 text-[10px] text-slate-400">
                  <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Model: {selectedGap.reasoningProvider || "DeterministicDemoProvider"}
                  </span>
                  <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Prompt: {selectedGap.promptVersion || "REGULATORY_GAP_PROMPT_V1"}
                  </span>
                  {selectedGap.regulation.sourceType === "OFFICIAL_BOT" ? (
                    <span className="font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                      OFFICIAL BOT PROVENANCE
                    </span>
                  ) : (
                    <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      SYNTHETIC DEMO
                    </span>
                  )}
                </div>
              </div>

              {/* Recommended Action (Editable by Officer) */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  Recommended Remediation Action (Editable by Compliance Officer)
                </label>
                <textarea
                  rows={2}
                  value={customActionItem}
                  onChange={(e) => setCustomActionItem(e.target.value)}
                  disabled={isAuditor || selectedGap.status === "APPROVED"}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-sans disabled:opacity-60"
                />
              </div>

              {/* Officer Decision Notes */}
              {selectedGap.status !== "APPROVED" && !isAuditor && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1.5">
                    Officer Justification / Remediation Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Approved. Prioritize for Q3 Core Banking and Policy revision."
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>
              )}

              {/* Dispatch Ticket Result Banner (If already dispatched) */}
              {(dispatchResult || selectedGap.tickets.length > 0) && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Dispatch Ticket: {dispatchResult?.ticketNumber || selectedGap.tickets[0]?.ticketNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900 border border-emerald-700 text-emerald-200">
                      DISPATCHED
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>
                      <span className="text-slate-400 font-semibold">Assigned Unit: </span>
                      {dispatchResult?.targetDepartment || selectedGap.tickets[0]?.targetDepartment}
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Priority: </span>
                      <span className="text-amber-400 font-bold">{dispatchResult?.priority || selectedGap.tickets[0]?.priority}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">SLA Due Date: </span>
                      {new Date(dispatchResult?.dueDate || selectedGap.tickets[0]?.dueDate || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Step for Human Approval */}
              {confirmApprove && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Confirm Compliance Officer Approval
                  </div>
                  <p className="text-[11px] text-slate-300">
                    This will formally approve the compliance gap finding and authorize FinGuard AI&apos;s Dispatcher Agent
                    to create an operational remediation ticket for {selectedGap.internalPolicy.ownerDepartment}.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{submitting ? "Authorizing..." : "Confirm & Authorize Dispatch"}</span>
                    </button>
                    <button
                      onClick={() => setConfirmApprove(false)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                Close
              </button>

              {/* Human-in-the-Loop Controls (Hidden for Auditors) */}
              {!isAuditor && selectedGap.status !== "APPROVED" && !confirmApprove && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => {
                      const reason = prompt("Enter rationale for dismissing this gap:");
                      if (reason) {
                        setRejectReason(reason);
                        handleReject();
                      }
                    }}
                    disabled={submitting}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 transition cursor-pointer"
                  >
                    Reject / Dismiss
                  </button>

                  <button
                    onClick={() => {
                      const notes = prompt("Enter clarification notes for review team:");
                      if (notes) {
                        setReviewNotes(notes);
                        handleRequestReview();
                      }
                    }}
                    disabled={submitting}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-indigo-300 hover:bg-indigo-950/40 border border-indigo-900/50 transition cursor-pointer"
                  >
                    Request Review
                  </button>

                  <button
                    onClick={() => setConfirmApprove(true)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve & Dispatch Action</span>
                  </button>
                </div>
              )}

              {/* If Approved but no ticket yet */}
              {!isAuditor && selectedGap.status === "APPROVED" && selectedGap.tickets.length === 0 && !dispatchResult && (
                <button
                  onClick={handleManualDispatch}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition flex items-center gap-1.5 ml-auto cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Dispatching..." : "Dispatch Remediation Ticket"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
