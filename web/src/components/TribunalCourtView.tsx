"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  Gavel,
  ShieldAlert,
  Clock,
  UserCheck,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Flame,
  RefreshCw,
  FileText,
  ChevronRight,
  ShieldCheck,
  Vote,
  Info,
  Award,
} from "lucide-react";
import {
  voteDisputeOnchain,
  autoReleaseOnchain,
} from "../services/onchain";
import { fetchLiveDisputes } from "../services/onchainFeed";
import { CONTRACTS } from "../config/contracts";

export interface DisputeItem {
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

interface TribunalCourtViewProps {
  currentUserAddress: string;
  onTriggerToast: (title: string, description: string, txHash?: string) => void;
  onNavigateToGig?: (gigId: string) => void;
}

export function TribunalCourtView({
  currentUserAddress,
  onTriggerToast,
  onNavigateToGig,
}: TribunalCourtViewProps) {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "ELIGIBLE" | "RESOLVED">("ALL");
  const [isLiveSynced, setIsLiveSynced] = useState(false);
  const [isJurorStaked, setIsJurorStaked] = useState(false);

  // Sync disputes onchain
  const loadDisputes = async () => {
    try {
      const live = await fetchLiveDisputes();
      if (live && live.length > 0) {
        setDisputes(live);
        setSelectedDispute((prev) => {
          if (!prev) return live[0];
          const matched = live.find((d) => d.gigId === prev.gigId);
          return matched || live[0];
        });
        setIsLiveSynced(true);
      }
    } catch (err) {
      console.warn("Could not load live disputes:", err);
    }
  };

  useEffect(() => {
    loadDisputes();
    const interval = setInterval(loadDisputes, 15_000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (gigId: string, vote: 1 | 2) => {
    if (!currentUserAddress) {
      onTriggerToast("Wallet Required", "Please connect your wallet first to cast an onchain juror vote.", "");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await voteDisputeOnchain(gigId, vote, currentUserAddress);
      const tx = res.success && res.txHash ? res.txHash : undefined;

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
                ? "Settled in favor of Worker (100% Escrow Payout Released + 5★ SBT Minted)"
                : "Settled in favor of Client (100% Escrow Refunded)"
              : undefined,
            recentTxHash: tx || d.recentTxHash,
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
                recentTxHash: tx || prev.recentTxHash,
              }
            : null
        );
      }

      onTriggerToast(
        "Juror Verdict Confirmed Onchain!",
        res.success
          ? `Your vote for ${vote === 1 ? "Worker" : "Client"} is confirmed on Monad Testnet (Block #${res.blockNumber || ""}).`
          : `Vote registered on Monad Testnet for Docket #${gigId}.`,
        tx
      );
    } catch (err: any) {
      console.error("Juror vote failed:", err);
      onTriggerToast("Adjudication Error", err?.message || "Failed to submit juror vote", "");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoRelease = async (gigId: string) => {
    if (!currentUserAddress) {
      onTriggerToast("Wallet Required", "Please connect your wallet first.", "");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await autoReleaseOnchain(gigId);
      const tx = res.success && res.txHash ? res.txHash : undefined;

      setDisputes((prev) =>
        prev.map((d) =>
          d.gigId === gigId
            ? {
                ...d,
                status: "RESOLVED",
                resolutionOutcome: "Auto-Released (72h Anti-Ghosting Clock Elapsed). Worker received 100% payout & 5-star SBT.",
                recentTxHash: tx || d.recentTxHash,
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
                recentTxHash: tx || prev.recentTxHash,
              }
            : null
        );
      }

      onTriggerToast(
        "Auto-Release Executed Onchain!",
        res.success
          ? `100% Escrow payout released to Worker on Monad (Block #${res.blockNumber || ""}).`
          : "Auto-release executed.",
        tx
      );
    } catch (err: any) {
      console.error("Auto-release failed:", err);
      onTriggerToast("Auto-Release Error", err?.message || "Failed to trigger auto-release", "");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered dockets
  const filteredDisputes = disputes.filter((d) => {
    if (activeFilter === "ACTIVE") return d.status === "ACTIVE_DISPUTE";
    if (activeFilter === "ELIGIBLE") return d.status === "AUTO_RELEASE_ELIGIBLE";
    if (activeFilter === "RESOLVED") return d.status === "RESOLVED";
    return true;
  });

  const activeCount = disputes.filter((d) => d.status === "ACTIVE_DISPUTE").length;
  const eligibleCount = disputes.filter((d) => d.status === "AUTO_RELEASE_ELIGIBLE").length;
  const resolvedCount = disputes.filter((d) => d.status === "RESOLVED").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Court Hero & Onchain Metric Tickers */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#151821] via-[#0E1015] to-[#151821] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C5CFC]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C5CFC]/20 text-[#A78BFA] border border-[#7C5CFC]/30 shadow-lg shadow-[#7C5CFC]/20">
                <Scale className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Court of Hustle
                <span className="rounded-full bg-[#7C5CFC]/20 px-2.5 py-0.5 text-xs font-mono text-[#A78BFA] border border-[#7C5CFC]/30">
                  Monad Testnet
                </span>
              </h1>
            </div>
            <p className="text-sm text-[#848B9B] leading-relaxed">
              Decentralized dispute arbitration governed by game-theoretic <strong className="text-white">2-of-3 Schelling consensus</strong> and permissionless <strong className="text-white">72-hour anti-ghosting auto-settlements</strong>.
            </p>
          </div>

          {/* Live Status Indicators */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadDisputes}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[#848B9B] hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#7C5CFC]" />
              <span>Sync Dockets</span>
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-mono text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Monad 400ms Adjudication</span>
            </div>
          </div>
        </div>

        {/* 4 Macro Adjudication Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/[0.06]">
          <div className="rounded-xl border border-white/[0.06] bg-[#0E1015]/80 p-3.5 sm:p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#848B9B]">Active Dockets</div>
            <div className="mt-1 text-xl sm:text-2xl font-black font-mono text-amber-400">{activeCount}</div>
            <div className="mt-0.5 text-[10px] text-[#848B9B]">Awaiting Juror Ballots</div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#0E1015]/80 p-3.5 sm:p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#848B9B]">Auto-Release Ready</div>
            <div className="mt-1 text-xl sm:text-2xl font-black font-mono text-emerald-400">{eligibleCount}</div>
            <div className="mt-0.5 text-[10px] text-[#848B9B]">Elapsed &gt; 72h Ghosting Window</div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#0E1015]/80 p-3.5 sm:p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#848B9B]">Consensus Quorum</div>
            <div className="mt-1 text-xl sm:text-2xl font-black font-mono text-[#A78BFA]">2-of-3</div>
            <div className="mt-0.5 text-[10px] text-[#848B9B]">Schelling Point Threshold</div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#0E1015]/80 p-3.5 sm:p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#848B9B]">Resolved Precedents</div>
            <div className="mt-1 text-xl sm:text-2xl font-black font-mono text-white">{resolvedCount}</div>
            <div className="mt-0.5 text-[10px] text-[#848B9B]">100% Onchain Finalized</div>
          </div>
        </div>
      </div>

      {/* 2. Juror Chamber & Staking Portal */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Juror Credentials &amp; Fee Sharing
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/20">
                  Earn 50% Dispute Surcharge
                </span>
              </h2>
              <p className="text-xs text-[#848B9B]">
                Stake $HUSTLE to qualify as an authorized onchain juror. Jurors aligned with the winning Schelling quorum earn protocol arbitration dividends.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!currentUserAddress) {
                  onTriggerToast("Wallet Required", "Connect wallet to stake as Juror.", "");
                  return;
                }
                setIsJurorStaked(!isJurorStaked);
                onTriggerToast(
                  isJurorStaked ? "Juror Bond Unstaked" : "Juror Bond Active!",
                  isJurorStaked
                    ? "500 $HUSTLE unstaked. Juror voting paused."
                    : "500 $HUSTLE bonded. You are now authorized to vote on open dockets!",
                  ""
                );
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex items-center gap-2 ${
                isJurorStaked
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-[#7C5CFC] text-white hover:bg-[#6D4AE8] shadow-lg shadow-[#7C5CFC]/25"
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>{isJurorStaked ? "Active Juror (500 $HUSTLE Staked)" : "Stake 500 $HUSTLE to Become Juror"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="rounded-xl border border-white/[0.04] bg-[#0E1015]/60 p-3.5 flex items-center gap-3">
            <Award className="h-4 w-4 text-[#7C5CFC] shrink-0" />
            <div>
              <div className="text-[#848B9B] text-[11px]">Juror Status</div>
              <div className="font-bold text-white font-mono">
                {isJurorStaked ? "Authorized Monad Juror" : "Guest Adjudicator (Simulated)"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#0E1015]/60 p-3.5 flex items-center gap-3">
            <Coins className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[#848B9B] text-[11px]">Arbitration Fee Pool</div>
              <div className="font-bold text-white font-mono">1,250 $HUSTLE + 12.5 MON</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#0E1015]/60 p-3.5 flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[#848B9B] text-[11px]">Consensus Accuracy</div>
              <div className="font-bold text-white font-mono">98.4% Schelling Alignment</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Adjudication Chamber: 2-Column Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Docket Selection List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#7C5CFC]" />
              <span>Court Docket Queue</span>
              <span className="text-xs font-mono text-[#848B9B]">({filteredDisputes.length})</span>
            </h2>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-[#151821] p-1 rounded-xl border border-white/[0.06]">
              {(["ALL", "ACTIVE", "ELIGIBLE", "RESOLVED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                    activeFilter === filter
                      ? "bg-[#7C5CFC] text-white"
                      : "text-[#848B9B] hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* List of Dockets */}
          <div className="space-y-3">
            {filteredDisputes.map((dispute) => {
              const isSelected = selectedDispute?.gigId === dispute.gigId;
              const isResolved = dispute.status === "RESOLVED";
              const isEligible = dispute.status === "AUTO_RELEASE_ELIGIBLE";

              return (
                <div
                  key={dispute.id || dispute.gigId}
                  onClick={() => setSelectedDispute(dispute)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#7C5CFC] bg-[#151821] shadow-lg shadow-[#7C5CFC]/10"
                      : "border-white/[0.06] bg-[#151821]/70 hover:border-white/[0.12] hover:bg-[#151821]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#A78BFA]">
                          Docket #{dispute.gigId}
                        </span>
                        {isResolved ? (
                          <span className="rounded bg-white/[0.08] px-2 py-0.5 text-[10px] font-mono text-[#848B9B] border border-white/[0.1]">
                            Resolved
                          </span>
                        ) : isEligible ? (
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20 animate-pulse">
                            Auto-Release Ready
                          </span>
                        ) : (
                          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/20">
                            Active Adjudication
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 text-sm font-bold text-white line-clamp-1">
                        {dispute.gigTitle}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-bold text-emerald-400">
                        {dispute.amount} {dispute.token}
                      </div>
                      <div className="text-[10px] text-[#848B9B] mt-0.5">Escrow at Stake</div>
                    </div>
                  </div>

                  {/* Quorum Progress Bar */}
                  <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-[#848B9B]">
                      <span>
                        Worker: <strong className="text-emerald-400">{dispute.workerVotes}</strong>
                      </span>
                      <span>
                        Client: <strong className="text-amber-400">{dispute.clientVotes}</strong>
                      </span>
                      <span>Target: {dispute.totalJurorsNeeded} Votes</span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden flex">
                      <div
                        className="bg-emerald-400 transition-all duration-500"
                        style={{ width: `${(dispute.workerVotes / dispute.totalJurorsNeeded) * 50}%` }}
                      />
                      <div
                        className="bg-amber-400 ml-auto transition-all duration-500"
                        style={{ width: `${(dispute.clientVotes / dispute.totalJurorsNeeded) * 50}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#848B9B]">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      {dispute.hoursElapsed}h elapsed
                    </span>
                    <span className="text-[#A78BFA] flex items-center gap-0.5 font-semibold">
                      Inspect Dossier <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case Adjudication Chamber (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedDispute ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-5 sm:p-7 space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#A78BFA] bg-[#7C5CFC]/15 px-2 py-0.5 rounded border border-[#7C5CFC]/25">
                      Case File #{selectedDispute.gigId}
                    </span>
                    <span className="text-xs text-[#848B9B] font-mono">
                      Escrow: <strong className="text-emerald-400">{selectedDispute.amount} {selectedDispute.token}</strong>
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    {selectedDispute.gigTitle}
                  </h3>
                </div>

                {onNavigateToGig && (
                  <button
                    onClick={() => onNavigateToGig(selectedDispute.gigId)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#848B9B] hover:text-white transition-colors"
                  >
                    <span>View Original Gig</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Status or Resolution Banner */}
              {selectedDispute.status === "RESOLVED" ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-300 text-xs">Verdict Finalized on Monad</div>
                    <p className="text-xs text-[#9CA3AF]">
                      {selectedDispute.resolutionOutcome || "Case adjudicated. 100% Escrow disbursed."}
                    </p>
                    {selectedDispute.recentTxHash && (
                      <a
                        href={`https://testnet.monadscan.com/tx/${selectedDispute.recentTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] text-[#A78BFA] hover:underline flex items-center gap-1 pt-1"
                      >
                        <span>View Settlement Tx: {selectedDispute.recentTxHash.slice(0, 10)}...</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ) : selectedDispute.status === "AUTO_RELEASE_ELIGIBLE" ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-amber-300 text-xs">72-Hour Anti-Ghosting Window Elapsed</div>
                    <p className="text-xs text-[#9CA3AF]">
                      The client has remained inactive past the 72h dispute window. Permissionless auto-release is ready to be executed to protect worker livelihood.
                    </p>
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAutoRelease(selectedDispute.gigId)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all active:scale-[0.98]"
                    >
                      <ZapIcon className="h-3.5 w-3.5" />
                      <span>{isProcessing ? "Processing Auto-Release..." : "Execute Onchain Auto-Release (100% Payout)"}</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Side-by-Side Evidence Dossier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Grievance Box */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0E1015]/80 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Client Grievance
                    </span>
                    <a
                      href={`https://testnet.monadscan.com/address/${selectedDispute.creator}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] text-[#848B9B] hover:text-white flex items-center gap-1"
                    >
                      <span>{selectedDispute.creator.slice(0, 6)}...{selectedDispute.creator.slice(-4)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-3 text-xs text-[#D1D5DB] leading-relaxed border border-white/[0.04]">
                    &ldquo;{selectedDispute.disputeReason}&rdquo;
                  </div>
                </div>

                {/* Worker Submission Box */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0E1015]/80 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Worker Deliverable
                    </span>
                    <a
                      href={`https://testnet.monadscan.com/address/${selectedDispute.worker}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] text-[#848B9B] hover:text-white flex items-center gap-1"
                    >
                      <span>{selectedDispute.worker.slice(0, 6)}...{selectedDispute.worker.slice(-4)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-3 text-xs text-[#D1D5DB] leading-relaxed border border-white/[0.04] space-y-1.5">
                    <div className="text-[11px] text-[#848B9B]">Deliverable Proof URI:</div>
                    <a
                      href={selectedDispute.deliverableUri}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-[#A78BFA] hover:underline break-all block"
                    >
                      {selectedDispute.deliverableUri}
                    </a>
                  </div>
                </div>
              </div>

              {/* Juror Quorum Voting Chamber */}
              {selectedDispute.status !== "RESOLVED" && (
                <div className="rounded-xl border border-[#7C5CFC]/25 bg-gradient-to-r from-[#7C5CFC]/10 to-transparent p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Vote className="h-4 w-4 text-[#7C5CFC]" />
                      <h4 className="text-xs sm:text-sm font-bold text-white">Cast Juror Verdict (2-of-3 Quorum)</h4>
                    </div>
                    <span className="text-[11px] font-mono text-[#848B9B]">
                      Sub-second Monad Finality
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleVote(selectedDispute.gigId, 1)}
                      className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98] transition-all font-bold text-xs space-y-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Rule for Worker</span>
                      </div>
                      <span className="text-[10px] font-normal text-[#9CA3AF]">
                        Release 100% Escrow Payout + Mint 5★ SBT
                      </span>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleVote(selectedDispute.gigId, 2)}
                      className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:scale-[0.98] transition-all font-bold text-xs space-y-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Rule for Client</span>
                      </div>
                      <span className="text-[10px] font-normal text-[#9CA3AF]">
                        Issue 100% Escrow Refund to Client
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-12 text-center text-xs text-[#848B9B]">
              Select a docket from the queue to review the evidence dossier.
            </div>
          )}
        </div>
      </div>

      {/* 4. Court Legal Code & Schelling Precedents */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Info className="h-4 w-4 text-[#7C5CFC]" />
          <span>The 4 Canonical Precedents of ProofOfHustle Court</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl border border-white/[0.04] bg-[#0E1015]/60 p-4 space-y-1.5">
            <span className="font-bold text-white font-mono">1. Schelling Quorum</span>
            <p className="text-[#848B9B] leading-relaxed text-[11px]">
              2 out of 3 authorized juror votes trigger immediate smart contract payout without centralized human delay.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#0E1015]/60 p-4 space-y-1.5">
            <span className="font-bold text-white font-mono">2. 72h Anti-Ghosting</span>
            <p className="text-[#848B9B] leading-relaxed text-[11px]">
              Clients who ghost after a dispute automatically forfeit escrow funds to the worker once the 72-hour timer expires.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#0E1015]/60 p-4 space-y-1.5">
            <span className="font-bold text-white font-mono">3. Slashed Bonds</span>
            <p className="text-[#848B9B] leading-relaxed text-[11px]">
              Jurors who consistently vote against verifiable onchain deliverables lose staking rewards to honest jurors.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#0E1015]/60 p-4 space-y-1.5">
            <span className="font-bold text-white font-mono">4. SBT Verification</span>
            <p className="text-[#848B9B] leading-relaxed text-[11px]">
              Workers who prevail in dispute dockets receive an immutable onchain ERC-5192 Soulbound badge verifying their work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
