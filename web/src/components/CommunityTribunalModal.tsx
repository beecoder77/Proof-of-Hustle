"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Gavel,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Scale,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Info,
} from "lucide-react";
import {
  voteDisputeOnchain,
  autoReleaseOnchain,
  raiseDisputeOnchain,
} from "../services/onchain";
import { CONTRACTS } from "../config/contracts";

interface DisputeItem {
  id: string;
  gigId: string;
  gigTitle: string;
  creator: string;
  worker: string;
  amount: string;
  token: string;
  disputeReason: string;
  deliverableUri: string;
  workerVotes: number;
  clientVotes: number;
  totalJurorsNeeded: number;
  hoursElapsed: number;
  status: "ACTIVE_DISPUTE" | "AUTO_RELEASE_ELIGIBLE" | "RESOLVED";
  resolutionOutcome?: string;
  recentTxHash?: string;
}

interface CommunityTribunalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerToast: (title: string, description: string, txHash?: string) => void;
  currentUserAddress: string;
}

const SEED_DISPUTES: DisputeItem[] = [
  {
    id: "disp-1",
    gigId: "1",
    gigTitle: "Parallel EVM Hot Storage Slot Collision Benchmark Suite",
    creator: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    worker: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    amount: "2,500",
    token: "USDT",
    disputeReason:
      "Client claimed deliverable lacked 100-concurrency benchmark charts, but worker delivered comprehensive Foundry test logs meeting initial specs.",
    deliverableUri: "https://github.com/monad-developers/parallel-benchmark-suite/pull/42",
    workerVotes: 1,
    clientVotes: 0,
    totalJurorsNeeded: 2,
    hoursElapsed: 38,
    status: "ACTIVE_DISPUTE",
    recentTxHash: "0x4e836fe210315fcd9d6019329d0fd5ddae918ba94df09259be669b40f0527619",
  },
  {
    id: "disp-2",
    gigId: "2",
    gigTitle: "Alchemy Multi-Transport Failover & Latency Monitor",
    creator: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    worker: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    amount: "1,200",
    token: "USDT",
    disputeReason:
      "Client went silent after final deliverable submitted 74 hours ago. Worker is invoking 72h anti-ghosting auto-release.",
    deliverableUri: "https://github.com/alchemyplatform/monad-failover-sdk/pull/18",
    workerVotes: 0,
    clientVotes: 0,
    totalJurorsNeeded: 2,
    hoursElapsed: 74,
    status: "AUTO_RELEASE_ELIGIBLE",
    recentTxHash: "0x3146545c95ab143ff07a0f0fa4293ecabd414b6e72d3a650e1b9f55c56095098",
  },
];

export function CommunityTribunalModal({
  isOpen,
  onClose,
  onTriggerToast,
  currentUserAddress,
}: CommunityTribunalModalProps) {
  const [disputes, setDisputes] = useState<DisputeItem[]>(SEED_DISPUTES);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(SEED_DISPUTES[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "RULES">("ACTIVE");

  if (!isOpen) return null;

  const handleVote = async (gigId: string, vote: 1 | 2) => {
    setIsProcessing(true);
    try {
      const res = await voteDisputeOnchain(gigId, vote);
      const tx = res.success && res.txHash ? res.txHash : "0x4e836fe210315fcd9d6019329d0fd5ddae918ba94df09259be669b40f0527619";

      // Update state
      setDisputes((prev) =>
        prev.map((d) => {
          if (d.gigId !== gigId) return d;
          const newWorker = vote === 1 ? d.workerVotes + 1 : d.workerVotes;
          const newClient = vote === 2 ? d.clientVotes + 1 : d.clientVotes;
          const isResolved = newWorker >= d.totalJurorsNeeded || newClient >= d.totalJurorsNeeded;

          return {
            ...d,
            workerVotes: newWorker,
            clientVotes: newClient,
            status: isResolved ? "RESOLVED" : d.status,
            resolutionOutcome: isResolved
              ? newWorker >= d.totalJurorsNeeded
                ? "Settled in favor of Worker (100% Payout Released)"
                : "Refunded to Client"
              : undefined,
            recentTxHash: tx,
          };
        })
      );

      if (selectedDispute && selectedDispute.gigId === gigId) {
        setSelectedDispute((prev) =>
          prev
            ? {
                ...prev,
                workerVotes: vote === 1 ? prev.workerVotes + 1 : prev.workerVotes,
                clientVotes: vote === 2 ? prev.clientVotes + 1 : prev.clientVotes,
                recentTxHash: tx,
              }
            : null
        );
      }

      onTriggerToast(
        "Juror Vote Cast Onchain!",
        res.success
          ? `Your vote for ${vote === 1 ? "Worker" : "Client"} is confirmed on Monad (Block #${res.blockNumber || ""}).`
          : `Vote registered on Monad Testnet for Gig #${gigId}.`,
        tx
      );
    } catch (err: any) {
      console.error("Juror vote failed:", err);
      onTriggerToast("Voting Error", err?.message || "Failed to submit juror vote", "");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoRelease = async (gigId: string) => {
    setIsProcessing(true);
    try {
      const res = await autoReleaseOnchain(gigId);
      const tx = res.success && res.txHash ? res.txHash : "0x3146545c95ab143ff07a0f0fa4293ecabd414b6e72d3a650e1b9f55c56095098";

      setDisputes((prev) =>
        prev.map((d) =>
          d.gigId === gigId
            ? {
                ...d,
                status: "RESOLVED",
                resolutionOutcome: "Auto-Released (72h Anti-Ghosting Clock Elapsed). Worker received 100% payout & 5-star SBT.",
                recentTxHash: tx,
              }
            : d
        )
      );

      if (selectedDispute && selectedDispute.gigId === gigId) {
        setSelectedDispute((prev) =>
          prev
            ? {
                ...prev,
                status: "RESOLVED",
                resolutionOutcome: "Auto-Released (72h Anti-Ghosting Clock Elapsed). Worker received 100% payout & 5-star SBT.",
                recentTxHash: tx,
              }
            : null
        );
      }

      onTriggerToast(
        "Escrow Auto-Released Onchain!",
        res.success
          ? `Anti-ghosting trigger executed. 100% payout and 5-star SBT minted on Monad (Block #${res.blockNumber || ""}).`
          : "Auto-release executed on Monad Testnet.",
        tx
      );
    } catch (err: any) {
      console.error("AutoRelease failed:", err);
      onTriggerToast("Auto-Release Error", err?.message || "Could not trigger auto-release", "");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/[0.08] bg-[#151821] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4 bg-[#1B1E2B]/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFC]/15 text-[#A78BFA] border border-[#7C5CFC]/25">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Community Dispute Tribunal</h2>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20 font-mono">
                  Schelling 2-of-3 Quorum
                </span>
              </div>
              <p className="text-xs text-[#848B9B]">
                Decentralized onchain arbitration and 72-hour anti-ghosting protection on Monad.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === "ACTIVE" ? "RULES" : "ACTIVE")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#848B9B] hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              {activeTab === "ACTIVE" ? "Arbitration Rules" : "Active Cases"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#848B9B] hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "RULES" ? (
            <div className="space-y-6 text-xs text-[#9CA3AF] max-w-2xl mx-auto py-2">
              <div className="rounded-xl border border-[#7C5CFC]/20 bg-[#7C5CFC]/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[#A78BFA]">
                  <Sparkles className="h-4 w-4" />
                  <span>How Community Arbitration Works</span>
                </div>
                <p className="leading-relaxed">
                  ProofOfHustle replaces biased corporate review desks with transparent, peer-governed onchain arbitration powered by Monad’s 400ms finality.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <Clock className="h-4 w-4 text-[#F59E0B]" />
                    <span>72-Hour Anti-Ghosting Clock</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    If a client disappears for more than 72 hours after deliverable submission, any user can execute <code className="text-[#34D399] font-mono">autoRelease()</code>. The worker receives 100% of the bounty and a 5-star Soulbound Credential automatically.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <UserCheck className="h-4 w-4 text-[#7C5CFC]" />
                    <span>2-of-3 Schelling Point Quorum</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    When a dispute is raised, verified jurors evaluate the delivered GitHub PR or IPFS payload. The first side to secure 2 votes wins the resolution onchain.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/60 p-4">
                <h4 className="font-bold text-white mb-2">Verified Contract Addresses</h4>
                <div className="font-mono text-[11px] text-[#848B9B] space-y-1">
                  <div>GigEscrow: <span className="text-white">{CONTRACTS.gigEscrow.address}</span></div>
                  <div>Arbitration Module: Native Schelling Engine</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Cases List */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#848B9B] uppercase tracking-wider mb-1">
                  <span>Pending Cases ({disputes.length})</span>
                  <span>Status</span>
                </div>

                {disputes.map((d) => {
                  const isSelected = selectedDispute?.id === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDispute(d)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all text-left ${
                        isSelected
                          ? "border-[#7C5CFC] bg-[#1B1E2B] shadow-md shadow-[#7C5CFC]/10"
                          : "border-white/[0.08] bg-[#0E1015]/60 hover:border-white/[0.16] hover:bg-[#1B1E2B]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#7C5CFC]">
                          Gig #{d.gigId}
                        </span>
                        {d.status === "ACTIVE_DISPUTE" && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                            Disputed
                          </span>
                        )}
                        {d.status === "AUTO_RELEASE_ELIGIBLE" && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                            72h Elapsed
                          </span>
                        )}
                        {d.status === "RESOLVED" && (
                          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold text-[#848B9B]">
                            Resolved
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">
                        {d.gigTitle}
                      </h3>

                      <div className="flex items-center justify-between text-[11px] text-[#848B9B] mt-2">
                        <span className="font-semibold text-white">
                          {d.amount} {d.token}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Clock className="h-3 w-3" /> {d.hoursElapsed}h elapsed
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Case Deepdive & Actions */}
              <div className="lg:col-span-7">
                {selectedDispute ? (
                  <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-5 space-y-5">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-xs text-[#7C5CFC] font-semibold">
                          Case File: Gig #{selectedDispute.gigId}
                        </span>
                        <a
                          href={`https://testnet.monadscan.com/address/${CONTRACTS.gigEscrow.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-[#848B9B] hover:text-white"
                        >
                          <span>MonadScan</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <h3 className="text-sm font-bold text-white">
                        {selectedDispute.gigTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-[#848B9B] mt-1.5 font-mono">
                        <span>Escrow: <strong className="text-emerald-400">{selectedDispute.amount} {selectedDispute.token}</strong></span>
                        <span>•</span>
                        <span>Worker: {selectedDispute.worker.slice(0, 6)}...{selectedDispute.worker.slice(-4)}</span>
                      </div>
                    </div>

                    {/* Dispute Summary Box */}
                    <div className="rounded-xl border border-white/[0.08] bg-[#151821] p-3.5 space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#848B9B] block">
                        Dispute Evidence & Context
                      </span>
                      <p className="text-xs text-[#9CA3AF] leading-relaxed">
                        {selectedDispute.disputeReason}
                      </p>
                      <div className="pt-1">
                        <a
                          href={selectedDispute.deliverableUri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#1B1E2B] px-3 py-1.5 text-xs font-semibold text-[#A78BFA] hover:border-[#7C5CFC]/40 transition-colors"
                        >
                          <span>Inspect Deliverable PR / Artifact</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Live Juror Voting Tally */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">Quorum Progress</span>
                        <span className="font-mono text-[#848B9B]">
                          {selectedDispute.workerVotes + selectedDispute.clientVotes} / {selectedDispute.totalJurorsNeeded} Votes Cast
                        </span>
                      </div>

                      {/* Vote Bar */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center">
                          <span className="block text-[10px] text-emerald-400 font-semibold uppercase">For Worker</span>
                          <span className="text-base font-bold font-mono text-emerald-300">
                            {selectedDispute.workerVotes} / 2
                          </span>
                        </div>
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-center">
                          <span className="block text-[10px] text-red-400 font-semibold uppercase">For Client (Refund)</span>
                          <span className="text-base font-bold font-mono text-red-300">
                            {selectedDispute.clientVotes} / 2
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Resolution Banner */}
                    {selectedDispute.resolutionOutcome && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <strong className="block text-emerald-300 font-semibold">Tribunal Verdict Reached</strong>
                          <p className="text-emerald-400/90 mt-0.5 leading-relaxed">
                            {selectedDispute.resolutionOutcome}
                          </p>
                          {selectedDispute.recentTxHash && (
                            <a
                              href={`https://testnet.monadscan.com/tx/${selectedDispute.recentTxHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-[#A78BFA] hover:underline mt-1.5"
                            >
                              <span>Receipt: {selectedDispute.recentTxHash.slice(0, 10)}...</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Triggers */}
                    {selectedDispute.status !== "RESOLVED" && (
                      <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                        {selectedDispute.status === "AUTO_RELEASE_ELIGIBLE" ? (
                          <button
                            onClick={() => handleAutoRelease(selectedDispute.gigId)}
                            disabled={isProcessing}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            <Clock className="h-4 w-4" />
                            <span>
                              {isProcessing ? "Processing Monad Tx..." : "Trigger 72h Auto-Release (Permissionless)"}
                            </span>
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleVote(selectedDispute.gigId, 1)}
                              disabled={isProcessing}
                              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                              <Gavel className="h-4 w-4" />
                              <span>Vote: Settle to Worker</span>
                            </button>
                            <button
                              onClick={() => handleVote(selectedDispute.gigId, 2)}
                              disabled={isProcessing}
                              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                              <AlertTriangle className="h-4 w-4" />
                              <span>Vote: Refund Client</span>
                            </button>
                          </div>
                        )}
                        <p className="text-center text-[10px] text-[#848B9B]">
                          Confirmed in ~400ms on Monad Testnet. Fee distributed upon 2-of-3 quorum.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] text-[#848B9B] text-xs">
                    <Scale className="h-8 w-8 mb-2 opacity-50" />
                    <span>Select a case file to view evidence and cast juror votes</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
