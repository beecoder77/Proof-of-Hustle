"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  Award,
  Key,
  Scale,
  Sparkles,
  Zap,
  Flame,
  Copy,
  Check,
  Share2,
  User,
  CheckCircle,
  Coins,
  FileCode,
} from "lucide-react";
import { GigItem, SubmissionItem } from "../types";
import { CONTRACTS } from "../config/contracts";

interface GigDetailViewProps {
  gig: GigItem;
  submissions?: SubmissionItem[];
  currentUserAddress?: string;
  onBack: () => void;
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
  onRaiseDispute?: (gigId: string) => void;
  onAutoRelease?: (gigId: string) => void;
  onConnect?: () => void;
  onHype?: (gigId: string) => void;
  onSelectCreator?: (address: string) => void;
}

export function GigDetailView({
  gig,
  submissions = [],
  currentUserAddress,
  onBack,
  onClaim,
  onSubmitWork,
  onApprovePayout,
  onOpenMeraDrawer,
  sealedData,
  onClearSealedData,
  onRaiseDispute,
  onAutoRelease,
  onConnect,
  onHype,
  onSelectCreator,
}: GigDetailViewProps) {
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [activeTab, setActiveTab] = useState<"scope" | "submissions">("scope");

  const isCreator =
    Boolean(currentUserAddress) &&
    Boolean(gig.creator) &&
    gig.creator.toLowerCase() === currentUserAddress?.toLowerCase();

  // Sync sealed payload if available from Mera Passkey PRF drawer
  React.useEffect(() => {
    if (sealedData?.encryptedUri) {
      setSubmissionUrl(sealedData.encryptedUri);
    }
  }, [sealedData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionUrl) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitWork(
        gig.id,
        submissionUrl,
        Boolean(sealedData?.commitHash),
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

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const daysLeft = Math.max(
    0,
    Math.ceil((gig.deadlineTimestamp * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation Breadcrumb & Back Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#151821] px-3.5 py-2 text-xs font-semibold text-[#848B9B] hover:text-white hover:border-[#7C5CFC] hover:bg-[#1B1E2B] transition-all active:scale-[0.98]"
            title="Return to Hustle Feed"
          >
            <ArrowLeft className="h-4 w-4 text-[#7C5CFC]" />
            <span>Back to Hustles</span>
          </button>

          <nav className="flex items-center gap-1.5 text-xs text-[#848B9B] font-mono">
            <span className="hidden sm:inline text-white/40">ProofOfHustle</span>
            <span className="hidden sm:inline text-white/30">/</span>
            <span className="text-white/60">Hustles</span>
            <span className="text-white/30">/</span>
            <span className="font-bold text-[#A78BFA]">#{gig.id}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#151821] px-3 py-1.5 text-xs text-[#848B9B] hover:text-white transition-colors active:scale-[0.98]"
            title="Copy Direct Link to this Hustle"
          >
            {copiedShare ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#34D399]" />
                <span className="text-[#34D399] font-medium">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Hustle</span>
              </>
            )}
          </button>

          <a
            href={`https://testnet.monadscan.com/address/${CONTRACTS.gigEscrow.address}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#151821] px-3 py-1.5 text-xs text-[#848B9B] hover:text-[#7C5CFC] transition-colors"
          >
            <span>Escrow Contract</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Primary Column: Work Scope & Submissions */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hustle Header Banner Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#151821] via-[#1A1D2A] to-[#151821] p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Top Status & Type Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="rounded-lg bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 px-3 py-1 text-xs font-bold text-[#A78BFA] uppercase tracking-wider">
                {gig.gigType}
              </span>

              {gig.isSealed && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-300">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Mera PRF Sealed</span>
                </span>
              )}

              <span
                className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  gig.status === "SETTLED"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : gig.status === "DISPUTED"
                    ? "bg-red-500/15 text-red-400 border border-red-500/30"
                    : gig.status === "IN_PROGRESS"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                }`}
              >
                {gig.status.replace("_", " ")}
              </span>

              <span className="ml-auto text-xs text-[#848B9B] font-mono">
                {daysLeft > 0 ? `${daysLeft}d left` : "Deadline passed"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#F9FAFB] tracking-tight leading-snug">
              {gig.title}
            </h1>

            {/* Creator Attribution Bar */}
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C5CFC]/20 text-[#A78BFA] border border-[#7C5CFC]/30 font-bold text-sm">
                  {gig.creator ? gig.creator.slice(2, 4).toUpperCase() : "PO"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      Posted by {gig.creator ? `${gig.creator.slice(0, 6)}...${gig.creator.slice(-4)}` : "Protocol"}
                    </span>
                    <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
                  </div>
                  <span className="text-[11px] text-[#848B9B] font-mono">
                    {gig.creator}
                  </span>
                </div>
              </div>

              {onSelectCreator && gig.creator && (
                <button
                  onClick={() => onSelectCreator(gig.creator)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0E1015] px-3 py-1.5 text-xs text-[#848B9B] hover:text-[#A78BFA] hover:border-[#7C5CFC]/40 transition-all active:scale-[0.98]"
                >
                  <User className="h-3.5 w-3.5 text-[#7C5CFC]" />
                  <span>View Creator Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Selection: Scope & Deliverables vs Submissions */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
            <button
              onClick={() => setActiveTab("scope")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "scope"
                  ? "bg-[#7C5CFC] text-white shadow-lg shadow-[#7C5CFC]/25"
                  : "text-[#848B9B] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Work Scope & Requirements</span>
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "submissions"
                  ? "bg-[#7C5CFC] text-white shadow-lg shadow-[#7C5CFC]/25"
                  : "text-[#848B9B] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Submissions ({submissions.length})</span>
            </button>
          </div>

          {/* TAB 1: SCOPE & REQUIREMENTS */}
          {activeTab === "scope" && (
            <div className="space-y-6">
              {/* Detailed Description Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#848B9B] flex items-center gap-2">
                  <span>Objective & Overview</span>
                </h3>
                <p className="text-sm text-[#D1D5DB] leading-relaxed whitespace-pre-line">
                  {gig.description || gig.summary}
                </p>

                {/* Skill Tags */}
                {gig.skillTags && gig.skillTags.length > 0 && (
                  <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#848B9B]">Required Skills:</span>
                    {gig.skillTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-white/[0.08] bg-[#1B1E2B] px-2.5 py-1 text-xs font-medium text-[#A78BFA]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Required Deliverables List */}
              {gig.deliverables && gig.deliverables.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#848B9B]">
                    Required Deliverables
                  </h3>
                  <ul className="space-y-2 text-xs text-[#F9FAFB]">
                    {gig.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#10B981] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Standard Verifiable Quality Floor Box */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#848B9B] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
                  <span>Onchain Acceptance Criteria</span>
                </h3>
                <ul className="space-y-2.5 text-xs text-[#9CA3AF]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#34D399] font-bold">✓</span>
                    <span>All code submissions must compile and pass automated CI checks without regressions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#34D399] font-bold">✓</span>
                    <span>No mock credentials or dummy hashes: verified using real Monad Testnet contracts and Web Crypto.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#34D399] font-bold">✓</span>
                    <span>Upon approval, escrow payout releases in &lt;400ms Monad block time, minting a permanent 5-Star Soulbound Token (ERC-5192) to the worker.</span>
                  </li>
                </ul>
              </div>

              {/* Worker Action CTA Box */}
              <div className="rounded-2xl border border-[#7C5CFC]/30 bg-gradient-to-r from-[#1B1E2B] via-[#151821] to-[#1B1E2B] p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Ready to take on this Hustle?</h3>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Submit verifiable work directly or use Mera Passkey PRF for zero-knowledge sealed commits.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("submissions")}
                      className="flex items-center gap-1.5 rounded-xl bg-[#7C5CFC] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#7C5CFC]/25 hover:bg-[#9073FD] transition-all active:scale-[0.98]"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Deliverable</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBMISSIONS & WORK DELIVERY */}
          {activeTab === "submissions" && (
            <div className="space-y-6">
              {/* Submission Form for Hustlers */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Send className="h-4 w-4 text-[#7C5CFC]" />
                      <span>Deliver Your Work</span>
                    </h3>
                    <p className="text-xs text-[#848B9B] mt-0.5">
                      Provide a GitHub PR, deployed preview link, or zero-knowledge encrypted commit.
                    </p>
                  </div>

                  {onOpenMeraDrawer && (
                    <button
                      type="button"
                      onClick={onOpenMeraDrawer}
                      className="flex items-center gap-1.5 rounded-xl border border-[#7C5CFC]/30 bg-[#7C5CFC]/15 px-3 py-1.5 text-xs font-semibold text-[#A78BFA] hover:bg-[#7C5CFC] hover:text-white transition-all active:scale-[0.98]"
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>Mera Sealed Commit</span>
                    </button>
                  )}
                </div>

                {sealedData?.commitHash && (
                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-xs text-purple-300 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Mera Passkey PRF Authenticated Commit</span>
                      </div>
                      <p className="text-[11px] text-purple-200/80 font-mono break-all">
                        Hash: {sealedData.commitHash}
                      </p>
                    </div>
                    {onClearSealedData && (
                      <button
                        onClick={onClearSealedData}
                        className="text-xs text-purple-300 hover:text-white underline shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#848B9B] mb-1.5">
                      Deliverable Link (GitHub PR, Commit URL, or IPFS CID)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://github.com/org/repo/pull/42 or https://..."
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#1B1E2B] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#7C5CFC] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    {!currentUserAddress ? (
                      <button
                        type="button"
                        onClick={onConnect}
                        className="flex items-center gap-1.5 rounded-xl bg-[#7C5CFC] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#7C5CFC]/25 hover:bg-[#9073FD] transition-all active:scale-[0.98]"
                      >
                        <span>Connect Wallet to Submit</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting || !submissionUrl}
                        className="flex items-center gap-1.5 rounded-xl bg-[#7C5CFC] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#7C5CFC]/25 hover:bg-[#9073FD] transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{isSubmitting ? "Broadcasting to Monad..." : "Submit Deliverable"}</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Submissions List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#848B9B]">
                  Live Submissions Archive ({submissions.length})
                </h3>

                {submissions.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-8 text-center text-xs text-[#848B9B]">
                    No submissions recorded for this hustle yet. Be the first to ship verifiable code!
                  </div>
                ) : (
                  submissions.map((sub) => {
                    const isMine =
                      currentUserAddress &&
                      sub.hustler.toLowerCase() === currentUserAddress.toLowerCase();

                    const submissionDate = sub.submittedAt
                      ? new Date(sub.submittedAt * 1000).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently";

                    return (
                      <div
                        key={sub.id}
                        className={`rounded-2xl border p-5 transition-all shadow-lg ${
                          sub.isWinner
                            ? "border-emerald-500/30 bg-emerald-950/15"
                            : "border-white/[0.08] bg-[#151821]"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C5CFC]/15 text-[#A78BFA] border border-[#7C5CFC]/25 shrink-0 font-bold text-xs">
                              {sub.hustler.slice(2, 4).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white font-mono">
                                  {sub.hustler.slice(0, 6)}...{sub.hustler.slice(-4)}
                                </span>
                                {isMine && (
                                  <span className="rounded bg-[#7C5CFC]/25 px-1.5 py-0.5 text-[9px] font-bold text-[#A78BFA]">
                                    YOU
                                  </span>
                                )}
                                {sub.isWinner && (
                                  <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                                    WINNER (PAID)
                                  </span>
                                )}
                                {sub.isSealed && (
                                  <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-purple-500/20 text-purple-300">
                                    SEALED
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#848B9B]">
                                Submitted {submissionDate}
                              </span>
                            </div>
                          </div>

                          {/* Client Payout Action */}
                          {isCreator && !sub.isWinner && gig.status !== "SETTLED" && (
                            <button
                              onClick={() => onApprovePayout(gig.id)}
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98]"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Approve Payout (5★ SBT)</span>
                            </button>
                          )}
                        </div>

                        {/* Deliverable URL or Commit */}
                        <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[#848B9B]">Deliverable:</span>
                            <a
                              href={sub.deliverableUri.startsWith("http") ? sub.deliverableUri : "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[#A78BFA] hover:underline truncate flex items-center gap-1"
                            >
                              <span className="truncate">{sub.deliverableUri}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </div>

                          {sub.commitHash && (
                            <button
                              onClick={() => handleCopyHash(sub.commitHash!)}
                              className="flex items-center gap-1 font-mono text-[11px] text-[#848B9B] hover:text-white bg-[#0E1015] px-2 py-1 rounded border border-white/[0.08]"
                              title="Copy SHA-256 Onchain Commit Hash"
                            >
                              <span>{sub.commitHash.slice(0, 10)}...</span>
                              {copiedHash === sub.commitHash ? (
                                <Check className="h-3 w-3 text-[#34D399]" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right / Secondary Column: Financial Overview, 72h Auto-Release, Escrow Telemetry */}
        <div className="lg:col-span-4 space-y-6">
          {/* Escrow Collateral Overview Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-[#151821] p-6 shadow-xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#848B9B] block">
              Guaranteed Escrow Bounty
            </span>

            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-black text-[#34D399] tabular-numbers">
                {gig.rewardAmount}
              </span>
              <span className="font-bold text-lg text-white font-mono">
                {gig.rewardToken}
              </span>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-[#10B981] shrink-0" />
              <div className="leading-snug">
                <span className="font-bold block">100% Non-Custodial Deposit</span>
                <span className="text-[11px] text-emerald-400/80">
                  Locked in Monad Testnet smart contract escrow until verification.
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#848B9B]">
              <span>Finality Cadence</span>
              <span className="font-mono font-bold text-[#7C5CFC]">400ms Sub-Second</span>
            </div>
          </div>

          {/* 72-Hour Anti-Ghosting Clock Protection */}
          <div className="rounded-2xl border border-amber-500/30 bg-[#151821] p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#848B9B] flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#FBBF24]" />
                <span>Anti-Ghosting Protection</span>
              </span>
              <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                72h Guarantee
              </span>
            </div>

            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              If the client fails to review or approve submitted deliverables within 72 hours, the escrow auto-releases 100% payout to the worker along with an automatic 5-star Soulbound rating.
            </p>

            {onAutoRelease && (
              <button
                onClick={() => onAutoRelease(gig.id)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 active:scale-[0.98] transition-all"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Verify / Trigger Auto-Release</span>
              </button>
            )}
          </div>

          {/* Attention Futures Curation Hype Pool */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#848B9B] flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-[#F87171]" />
                <span>Attention Hype Pool</span>
              </span>
              <span className="font-mono text-xs font-bold text-[#FBBF24]">
                {gig.hypeCount} Hypers
              </span>
            </div>

            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Stake $HUSTLE Attention Futures on this hustle. Early curators earn a 20% protocol fee yield upon successful delivery.
            </p>

            {onHype && (
              <button
                onClick={() => onHype(gig.id)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 active:scale-[0.98] transition-all shadow-sm"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Stake Attention (+1 Hype)</span>
              </button>
            )}
          </div>

          {/* Dispute Tribunal Escalation */}
          {onRaiseDispute && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-5 shadow-xl space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <Scale className="h-4 w-4" />
                <span>Dispute / Quality Deadlock?</span>
              </div>
              <p className="text-[#848B9B] text-[11px] leading-relaxed">
                Either party can escalate this hustle to the decentralized Community Tribunal for Schelling-point jury arbitration.
              </p>
              <button
                onClick={() => onRaiseDispute(gig.id)}
                className="w-full flex items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 font-semibold text-red-300 hover:bg-red-500/20 transition-all text-[11px]"
              >
                <span>Escalate to Community Tribunal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
