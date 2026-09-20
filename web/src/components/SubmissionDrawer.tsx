"use client";

import React, { useState } from "react";
import {
  X,
  Clock,
  ShieldCheck,
  Lock,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Send,
  Award,
  Key,
} from "lucide-react";

import { GigItem, SubmissionItem } from "../types";

interface SubmissionDrawerProps {
  gig: GigItem | null;
  submissions?: SubmissionItem[];
  currentUserAddress?: string;
  onClose: () => void;
  onClaim: (gigId: string) => void;
  onSubmitWork: (
    gigId: string,
    deliverableUri: string,
    isSealed?: boolean,
    commitHash?: string
  ) => void;
  onApprovePayout: (gigId: string) => void;
  onOpenMeraDrawer?: () => void;
  sealedData?: { commitHash: string; encryptedUri: string } | null;
  onClearSealedData?: () => void;
}

export function SubmissionDrawer({
  gig,
  submissions = [],
  currentUserAddress,
  onClose,
  onClaim,
  onSubmitWork,
  onApprovePayout,
  onOpenMeraDrawer,
  sealedData,
  onClearSealedData,
}: SubmissionDrawerProps) {
  const [activeTab, setActiveTab] = useState<"scope" | "submissions" | "creator">("scope");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Sync sealed payload if available
  React.useEffect(() => {
    if (sealedData?.encryptedUri) {
      setSubmissionUrl(sealedData.encryptedUri);
    }
  }, [sealedData]);

  if (!gig) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionUrl) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitWork(
        gig.id,
        submissionUrl,
        !!sealedData?.commitHash,
        sealedData?.commitHash
      );
      setIsSubmitting(false);
      setSubmissionUrl("");
      onClearSealedData?.();
      setActiveTab("submissions");
    }, 600);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with Smooth Blur Fade */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[4px] animate-backdrop-fade cursor-pointer"
      />

      {/* Slide-in Drawer Container with Smooth Hardware Transform */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 animate-drawer-slide transform-gpu">
        <div className="w-screen max-w-[580px] border-l border-white/[0.08] bg-[#151821] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="border-b border-white/[0.07] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded bg-white/[0.06] px-2 py-0.5 text-xs font-semibold text-[#848B9B]">
                  {gig.gigType}
                </span>
                <span className="text-xs text-[#848B9B]">ID: #{gig.id}</span>
                {gig.isSealed && (
                  <span className="inline-flex items-center gap-1 rounded bg-[#7C5CFC]/15 px-2 py-0.5 text-[11px] font-medium text-[#A78BFA]">
                    <Lock className="h-3 w-3" />
                    Mera PRF Sealed
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#9CA3AF] transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="mt-3 text-lg font-bold text-[#F9FAFB] leading-snug">
              {gig.title}
            </h2>

            {/* Escrow Reward Pill */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#848B9B]">
                <span>Escrow Deposit:</span>
                <span className="font-bold text-[#34D399] tabular-numbers text-sm">
                  {gig.rewardAmount} {gig.rewardToken}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#848B9B]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
                <span>100% Non-Custodial</span>
              </div>
            </div>

            {/* 72h Anti-Ghosting Clock Banner */}
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-[#FBBF24]">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                <strong>72h Auto-Release Guarantee:</strong> If the client goes offline after submission, funds automatically unlock to the worker.
              </span>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex border-b border-white/[0.08] gap-6 text-xs font-medium">
              <button
                onClick={() => setActiveTab("scope")}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === "scope"
                    ? "border-[#7C5CFC] text-[#F9FAFB]"
                    : "border-transparent text-[#848B9B] hover:text-[#F9FAFB]"
                }`}
              >
                Scope & Requirements
              </button>
              <button
                onClick={() => setActiveTab("submissions")}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === "submissions"
                    ? "border-[#7C5CFC] text-[#F9FAFB]"
                    : "border-transparent text-[#848B9B] hover:text-[#F9FAFB]"
                }`}
              >
                Submissions ({gig.submissionsCount})
              </button>
              <button
                onClick={() => setActiveTab("creator")}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === "creator"
                    ? "border-[#7C5CFC] text-[#F9FAFB]"
                    : "border-transparent text-[#848B9B] hover:text-[#F9FAFB]"
                }`}
              >
                Creator Credentials
              </button>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 text-sm">
            {activeTab === "scope" && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#848B9B]">
                    Description
                  </h4>
                  <div className="mt-2 text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-line">
                    {gig.description}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#848B9B]">
                    Required Deliverables
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#F9FAFB]">
                    {gig.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#848B9B]">
                    Skill Tags
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {gig.skillTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-white/[0.05] px-2.5 py-1 text-xs text-[#9CA3AF]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/[0.12] p-8 text-center text-xs text-[#848B9B]">
                    <p className="font-semibold text-[#F9FAFB]">No submissions yet</p>
                    <p className="mt-1">
                      Be the first pioneer to submit and gain priority client review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => {
                      const isCurrentUser =
                        currentUserAddress &&
                        sub.hustler.toLowerCase() === currentUserAddress.toLowerCase();

                      return (
                        <div
                          key={sub.id}
                          className="rounded-lg border border-white/[0.08] bg-[#1B1E2B] p-4 text-xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#7C5CFC] font-semibold">
                                {sub.hustler.slice(0, 6)}...{sub.hustler.slice(-4)}
                              </span>
                              {isCurrentUser && (
                                <span className="rounded bg-[#7C5CFC]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#A78BFA] border border-[#7C5CFC]/30">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[#848B9B]">
                              {typeof sub.submittedAt === "number" && sub.submittedAt > 0
                                ? "Just now"
                                : "Recent"}
                            </span>
                          </div>

                          {/* Deliverable link or description */}
                          <div className="rounded bg-[#151821] p-2.5 border border-white/[0.05] flex items-center justify-between">
                            <span className="font-mono text-[11px] text-[#F9FAFB] truncate max-w-[340px]">
                              {sub.deliverableUri}
                            </span>
                            <a
                              href={
                                sub.deliverableUri.startsWith("http")
                                  ? sub.deliverableUri
                                  : "https://github.com"
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[#7C5CFC] hover:underline shrink-0 ml-2"
                            >
                              <span>Open</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          {/* MERA PRF Commit Hash if Sealed */}
                          {sub.isSealed && sub.commitHash && (
                            <div className="rounded bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 p-2.5 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#A78BFA]">
                                  <Lock className="h-3 w-3" />
                                  MERA PRF Commit Hash (SHA-256)
                                </span>
                                <button
                                  onClick={() => handleCopyHash(sub.commitHash!)}
                                  className="text-[10px] text-[#848B9B] hover:text-white"
                                >
                                  {copiedHash === sub.commitHash ? "Copied" : "Copy"}
                                </button>
                              </div>
                              <p className="font-mono text-[10px] text-[#9CA3AF] truncate">
                                {sub.commitHash}
                              </p>
                              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <CheckCircle className="h-2.5 w-2.5" />
                                Zero-Knowledge Sealed Onchain
                              </div>
                            </div>
                          )}

                          {/* Bottom Row / Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                            <span className="text-emerald-400 flex items-center gap-1 font-medium">
                              <CheckCircle className="h-3 w-3" />
                              {sub.isWinner
                                ? "Awarded Winner • Payout Settled"
                                : "Code Deliverable Submitted"}
                            </span>

                            {gig.status !== "SETTLED" && (
                              <button
                                onClick={() => onApprovePayout(gig.id)}
                                className="flex items-center gap-1 rounded bg-[#10B981] px-2.5 py-1 text-xs font-semibold text-black hover:bg-[#34D399] transition-all active:scale-95 shadow-sm shadow-emerald-500/20"
                                title="Approve this submission and release bounty"
                              >
                                <Award className="h-3 w-3" />
                                <span>Approve Payout (+{gig.rewardAmount} {gig.rewardToken})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "creator" && (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-white/[0.08] bg-[#1B1E2B] p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#7C5CFC] to-[#F59E0B] flex items-center justify-center font-bold text-white text-base">
                      C
                    </div>
                    <div>
                      <p className="font-bold text-[#F9FAFB]">{gig.creator}</p>
                      <p className="text-[#848B9B]">Monad Ecosystem Verified Creator</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
                    <div>
                      <span className="block text-[#848B9B] text-[10px]">Gigs Posted</span>
                      <span className="font-bold text-[#F9FAFB] text-sm tabular-numbers">14</span>
                    </div>
                    <div>
                      <span className="block text-[#848B9B] text-[10px]">Total Escrow Paid</span>
                      <span className="font-bold text-[#10B981] text-sm tabular-numbers">$18,450</span>
                    </div>
                    <div>
                      <span className="block text-[#848B9B] text-[10px]">Avg Review</span>
                      <span className="font-bold text-[#F59E0B] text-sm tabular-numbers">4.9 ★</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Dock */}
          <div className="border-t border-white/[0.08] bg-[#151821] p-5">
            {gig.status === "OPEN" && gig.gigType === "FCFS" && (
              <button
                onClick={() => onClaim(gig.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C5CFC] py-3 text-sm font-bold text-white shadow-lg shadow-[#7C5CFC]/20 transition-all hover:bg-[#9073FD] active:scale-[0.98]"
              >
                <Award className="h-4 w-4" />
                <span>Claim Task & Start Sprint (FCFS)</span>
              </button>
            )}

            {gig.status === "OPEN" && gig.gigType === "CONTEST" && (
              <div className="space-y-3">
                {gig.isSealed && onOpenMeraDrawer && (
                  <button
                    type="button"
                    onClick={onOpenMeraDrawer}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#7C5CFC]/30 bg-[#7C5CFC]/10 py-2.5 text-xs font-semibold text-[#A78BFA] transition-colors hover:bg-[#7C5CFC]/20"
                  >
                    <Key className="h-4 w-4" />
                    <span>
                      {sealedData?.commitHash
                        ? "MERA PRF Sealed • View / Re-encrypt Key"
                        : "Seal Deliverable via MERA Biometric Passkey"}
                    </span>
                  </button>
                )}

                {sealedData?.commitHash && (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2.5 text-emerald-400 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Deliverable Sealed with Biometric PRF
                      </span>
                      <button
                        type="button"
                        onClick={onClearSealedData}
                        className="text-[10px] text-[#848B9B] hover:text-white underline"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-white/80 truncate">
                      Commit: {sealedData.commitHash}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={
                      gig.isSealed
                        ? "Deliverable URL or Sealed MERA Ciphertext..."
                        : "Submit deliverable (URL, GitHub PR, or IPFS CID)..."
                    }
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    className="flex-1 rounded-xl border border-white/[0.12] bg-[#1B1E2B] px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-[#7C5CFC] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl bg-[#7C5CFC] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#9073FD] active:scale-[0.98] disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{sealedData?.commitHash ? "Submit Sealed" : "Submit"}</span>
                  </button>
                </form>
              </div>
            )}

            {gig.status === "IN_REVIEW" && (
              <button
                onClick={() => onApprovePayout(gig.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10B981] py-3 text-sm font-bold text-white shadow-lg shadow-[#10B981]/20 transition-all hover:bg-[#059669] active:scale-[0.98]"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve Deliverables & Release Payout (Sub-Second)</span>
              </button>
            )}

            {gig.status === "SETTLED" && (
              <div className="text-center text-xs font-medium text-[#848B9B]">
                Task settled on Monad. Proof-of-Work Soulbound SBT minted.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
