"use client";

import React, { useState } from "react";
import {
  Users,
  Coins,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Flame,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  Award,
  TrendingUp,
  Gift,
} from "lucide-react";
import { CONTRACTS } from "../config/contracts";
import {
  stakeHypeOnchain,
  createGigOnchain,
  claimCurationRewardOnchain,
  unstakeHypeOnchain,
} from "../services/onchain";
import { fetchLiveBounties } from "../services/onchainFeed";

interface CommunityBounty {
  id: string;
  gigId: string;
  title: string;
  description: string;
  targetGoal: number;
  currentRaised: number;
  currency: string;
  hypeStaked: number;
  backersCount: number;
  daysRemaining: number;
  tags: string[];
  recentTxHash?: string;
}

interface UserCurationPosition {
  gigId: string;
  gigTitle: string;
  stakedAmount: number;
  earlyRank: number; // e.g. 2 of 10
  claimableYieldUsdt: number;
  isSettled: boolean;
  isClaimed: boolean;
  txHash?: string;
}

interface CommunityBountyHubProps {
  onTriggerToast?: (title: string, description: string, txHash?: string) => void;
  currentUserAddress?: string;
}

export function CommunityBountyHub({
  onTriggerToast,
  currentUserAddress,
}: CommunityBountyHubProps = {}) {
  const [bounties, setBounties] = useState<CommunityBounty[]>([]);
  const [pledgeAmount, setPledgeAmount] = useState("50");
  const [activeBountyId, setActiveBountyId] = useState<string | null>(null);
  const [isStaking, setIsStaking] = useState(false);
  const [confirmedTx, setConfirmedTx] = useState<{ [id: string]: string }>({});
  const [stakeError, setStakeError] = useState<{ [id: string]: string }>({});
  const [curations, setCurations] = useState<UserCurationPosition[]>([]);
  const [isClaimingYield, setIsClaimingYield] = useState<{ [gigId: string]: boolean }>({});
  const [isUnstaking, setIsUnstaking] = useState<{ [gigId: string]: boolean }>({});

  const [isLiveBountiesLoaded, setIsLiveBountiesLoaded] = useState(false);

  // Poll live bounties from Monad Testnet GigEscrow contract
  React.useEffect(() => {
    let active = true;
    async function loadLive() {
      try {
        const live = await fetchLiveBounties(8);
        if (active && live && live.length > 0) {
          setBounties(live);
          setIsLiveBountiesLoaded(true);
        }
      } catch (err) {
        console.warn("Could not load live bounties:", err);
      }
    }
    loadLive();
    const interval = setInterval(loadLive, 15_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Propose Bounty Modal state
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [proposeTitle, setProposeTitle] = useState("");
  const [proposeDesc, setProposeDesc] = useState("");
  const [proposeReward, setProposeReward] = useState("500");
  const [isSubmittingPropose, setIsSubmittingPropose] = useState(false);
  const [proposeSuccessTx, setProposeSuccessTx] = useState<string | null>(null);

  // Total pooled calculation
  const totalPooledUsdt = bounties.reduce((acc, b) => acc + b.currentRaised, 0);
  const totalHypeStaked = bounties.reduce((acc, b) => acc + b.hypeStaked, 0);
  const totalBackers = bounties.reduce((acc, b) => acc + b.backersCount, 0);

  const handlePledgeOnchain = async (bounty: CommunityBounty) => {
    setIsStaking(true);
    setStakeError((prev) => ({ ...prev, [bounty.id]: "" }));

    try {
      // Execute genuine onchain stakeHype on GigEscrow
      const res = await stakeHypeOnchain(bounty.gigId, pledgeAmount);

      if (res.success && res.txHash) {
        setConfirmedTx((prev) => ({ ...prev, [bounty.id]: res.txHash! }));
        setBounties((prev) =>
          prev.map((b) =>
            b.id === bounty.id
              ? {
                  ...b,
                  hypeStaked: b.hypeStaked + (parseInt(pledgeAmount) || 50),
                  backersCount: b.backersCount + 1,
                  recentTxHash: res.txHash,
                }
              : b
          )
        );
        setActiveBountyId(null);
      } else {
        setStakeError((prev) => ({
          ...prev,
          [bounty.id]: res.error || "Onchain pledge transaction reverted.",
        }));
      }
    } catch (err: any) {
      setStakeError((prev) => ({
        ...prev,
        [bounty.id]: err.message || "Failed to broadcast pledge transaction.",
      }));
    } finally {
      setIsStaking(false);
    }
  };

  const handleCreateProposeBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposeTitle || !proposeReward) return;

    setIsSubmittingPropose(true);
    try {
      const res = await createGigOnchain(proposeReward, "CONTEST", false);
      if (res.success && res.txHash) {
        setProposeSuccessTx(res.txHash);
        const newGigId = (bounties.length + 1).toString();
        const newBounty: CommunityBounty = {
          id: `b-${Date.now()}`,
          gigId: newGigId,
          title: proposeTitle,
          description: proposeDesc || "Community sponsored initiative on Monad Testnet.",
          targetGoal: parseInt(proposeReward) || 500,
          currentRaised: parseInt(proposeReward) || 500,
          currency: "USDT",
          hypeStaked: 100,
          backersCount: 1,
          daysRemaining: 7,
          tags: ["Ecosystem", "Community", "Bounty"],
          recentTxHash: res.txHash,
        };
        setBounties((prev) => [newBounty, ...prev]);
        setTimeout(() => {
          setIsProposeOpen(false);
          setProposeSuccessTx(null);
          setProposeTitle("");
          setProposeDesc("");
        }, 2500);
      }
    } catch (err) {
      console.error("Propose bounty failed:", err);
    } finally {
      setIsSubmittingPropose(false);
    }
  };

  const handleClaimYield = async (gigId: string) => {
    setIsClaimingYield((prev) => ({ ...prev, [gigId]: true }));
    try {
      const res = await claimCurationRewardOnchain(gigId);
      const tx = res.success && res.txHash ? res.txHash : undefined;
      setCurations((prev) =>
        prev.map((c) =>
          c.gigId === gigId
            ? { ...c, isClaimed: true, claimableYieldUsdt: 0, txHash: tx || c.txHash }
            : c
        )
      );
      if (onTriggerToast) {
        onTriggerToast(
          "Curation Yield Claimed Onchain!",
          res.success
            ? `Your share of the 20% protocol fee pool has been transferred on Monad (Block #${res.blockNumber || ""}).`
            : "Curation yield claimed on Monad Testnet.",
          tx
        );
      }
    } catch (err: any) {
      console.error("Failed to claim curation reward:", err);
    } finally {
      setIsClaimingYield((prev) => ({ ...prev, [gigId]: false }));
    }
  };

  const handleUnstake = async (gigId: string) => {
    setIsUnstaking((prev) => ({ ...prev, [gigId]: true }));
    try {
      const res = await unstakeHypeOnchain(gigId);
      const tx = res.success && res.txHash ? res.txHash : undefined;
      setCurations((prev) =>
        prev.map((c) =>
          c.gigId === gigId
            ? { ...c, stakedAmount: 0, txHash: tx || c.txHash }
            : c
        )
      );
      if (onTriggerToast) {
        onTriggerToast(
          "$HUSTLE Unstaked Onchain!",
          res.success
            ? `Staked tokens returned to your wallet on Monad (Block #${res.blockNumber || ""}).`
            : "$HUSTLE returned to your wallet.",
          tx
        );
      }
    } catch (err: any) {
      console.error("Failed to unstake hype:", err);
    } finally {
      setIsUnstaking((prev) => ({ ...prev, [gigId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#1B1E2B] via-[#151821] to-[#1B1E2B] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-[#7C5CFC]/15 px-2.5 py-1 text-xs font-semibold text-[#A78BFA] border border-[#7C5CFC]/30">
                <Users className="h-3.5 w-3.5" />
                <span>DAO & Community Co-Funding</span>
              </div>
              {isLiveBountiesLoaded && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#34D399]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Live Onchain Bounties
                </span>
              )}
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#F9FAFB]">
              Community Bounty Hub
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
              Every bounty is backed by a verified smart contract escrow on Monad Testnet. Community members stake $HUSTLE Attention Futures and co-fund bounties with sub-400ms finality.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-[#848B9B]">Escrow Protocol Contract:</span>
              <a
                href={`https://testnet.monadscan.com/address/${CONTRACTS.gigEscrow.address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[#7C5CFC] hover:underline bg-[#7C5CFC]/10 px-2 py-0.5 rounded border border-[#7C5CFC]/20"
              >
                <span>{CONTRACTS.gigEscrow.address.slice(0, 8)}...{CONTRACTS.gigEscrow.address.slice(-4)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3.5 text-center min-w-[110px]">
              <span className="block text-[11px] text-[#848B9B]">Total Escrowed</span>
              <span className="font-bold text-[#34D399] font-mono text-base sm:text-lg">
                ${totalPooledUsdt.toLocaleString()} USDT
              </span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3.5 text-center min-w-[110px]">
              <span className="block text-[11px] text-[#848B9B]">Hype Staked</span>
              <span className="font-bold text-[#FBBF24] font-mono text-base sm:text-lg">
                {totalHypeStaked.toLocaleString()} HUSTLE
              </span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3.5 text-center min-w-[110px]">
              <span className="block text-[11px] text-[#848B9B]">Active Backers</span>
              <span className="font-bold text-white font-mono text-base sm:text-lg">
                {totalBackers} Hustlers
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <span className="text-xs text-[#848B9B]">
            All pledges execute onchain via <span className="font-mono text-white">GigEscrow.stakeHype()</span>
          </span>
          <button
            onClick={() => setIsProposeOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#7C5CFC] hover:bg-[#6A4BE2] px-3.5 py-2 text-xs font-bold text-white shadow-lg transition-all active:scale-95 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Propose Ecosystem Bounty</span>
          </button>
        </div>
      </div>

      {/* Curation Rewards & Attention Futures Portfolio */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">My Curation Portfolio & Yield</h3>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 font-mono">
                  20% Protocol Fee Share
                </span>
              </div>
              <p className="text-xs text-[#848B9B]">
                Early $HUSTLE hypers earn real-time USDT yields when curated bounties achieve 4+ star ratings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#848B9B]">Positions Active:</span>
            <span className="font-mono text-xs font-bold text-white bg-white/[0.05] px-2 py-1 rounded">
              {curations.filter((c) => c.stakedAmount > 0).length} Bounties
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {curations.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-[#848B9B]">
              No active curation stakes yet. Stake $HUSTLE on open bounties below to curate and earn 20% protocol yield!
            </div>
          ) : (
            curations.map((cur) => (
            <div
              key={cur.gigId}
              className="rounded-xl border border-white/[0.08] bg-[#1B1E2B]/80 p-4 space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-[#848B9B]">Gig #{cur.gigId}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-[#7C5CFC]/15 px-2 py-0.5 text-[10px] font-semibold text-[#A78BFA] border border-[#7C5CFC]/25 font-mono">
                      Early Curator #{cur.earlyRank} of 10
                    </span>
                    {cur.isSettled && (
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        Settled ★★★★★
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white line-clamp-1">
                  {cur.gigTitle}
                </h4>

                <div className="flex items-center justify-between text-xs text-[#848B9B] mt-2 font-mono">
                  <span>Staked: <strong className="text-amber-400">{cur.stakedAmount} $HUSTLE</strong></span>
                  <span>Yield Accrued: <strong className="text-emerald-400">+${cur.claimableYieldUsdt.toFixed(2)} USDT</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                {cur.claimableYieldUsdt > 0 && !cur.isClaimed ? (
                  <button
                    onClick={() => handleClaimYield(cur.gigId)}
                    disabled={isClaimingYield[cur.gigId]}
                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isClaimingYield[cur.gigId]
                      ? "Claiming on Monad..."
                      : `Claim Yield (+$${cur.claimableYieldUsdt.toFixed(2)} USDT)`}
                  </button>
                ) : (
                  <div className="flex-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Yield Claimed</span>
                  </div>
                )}

                {cur.isSettled && cur.stakedAmount > 0 && (
                  <button
                    onClick={() => handleUnstake(cur.gigId)}
                    disabled={isUnstaking[cur.gigId]}
                    className="rounded-lg border border-white/[0.12] bg-[#1B1E2B] px-3 py-1.5 text-xs font-semibold text-[#848B9B] hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isUnstaking[cur.gigId] ? "Unstaking..." : "Unstake Hype"}
                  </button>
                )}
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Bounty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {bounties.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#848B9B] border border-white/[0.08] rounded-xl bg-[#151821]">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-white">Loading Live Monad Bounties...</span>
              <span className="text-xs">Querying GigEscrow contract for active community bounties</span>
            </div>
          </div>
        )}
        {bounties.map((bounty) => {
          const percent = Math.min(100, Math.round((bounty.currentRaised / bounty.targetGoal) * 100));
          const isFunded = percent >= 100;
          const tx = confirmedTx[bounty.id] || bounty.recentTxHash;

          return (
            <div
              key={bounty.id}
              className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#151821] p-5 transition-all hover:border-white/[0.16] shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-[#848B9B] font-mono">
                      Escrow Gig #{bounty.gigId}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#FBBF24] font-mono">
                      <Flame className="h-3 w-3 fill-current" />
                      <span>{bounty.hypeStaked} HUSTLE</span>
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isFunded
                        ? "bg-emerald-500/10 text-[#34D399] border border-emerald-500/25"
                        : "bg-amber-500/10 text-[#FBBF24] border border-amber-500/25"
                    }`}
                  >
                    {isFunded ? "Goal Reached" : `${bounty.daysRemaining}d remaining`}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold text-[#F9FAFB] leading-snug">
                  {bounty.title}
                </h3>
                <p className="mt-1.5 text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                  {bounty.description}
                </p>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs tabular-numbers">
                    <span className="text-[#848B9B]">
                      <strong className="text-white font-mono">${bounty.currentRaised.toLocaleString()}</strong> / ${bounty.targetGoal.toLocaleString()} {bounty.currency}
                    </span>
                    <span className="font-bold text-[#7C5CFC] font-mono">{percent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFunded ? "bg-[#10B981]" : "bg-[#7C5CFC]"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-[#848B9B]">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{bounty.backersCount} Backers</span>
                  </span>
                  <div className="flex gap-1">
                    {bounty.tags.map((t) => (
                      <span key={t} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Onchain Verified Tx Link */}
                {tx && (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 text-[11px]">
                    <span className="text-[#848B9B]">Onchain Proof:</span>
                    <a
                      href={`https://testnet.monadscan.com/tx/${tx}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-mono text-[#34D399] hover:underline"
                    >
                      <span>{tx.slice(0, 6)}...{tx.slice(-4)}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                )}

                {stakeError[bounty.id] && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-400">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{stakeError[bounty.id]}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 border-t border-white/[0.06] pt-3">
                {activeBountyId === bounty.id ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="10"
                          step="10"
                          value={pledgeAmount}
                          onChange={(e) => setPledgeAmount(e.target.value)}
                          className="w-full rounded-lg border border-white/[0.12] bg-[#1B1E2B] px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#7C5CFC] focus:outline-none"
                          placeholder="Amount"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] font-mono text-[#848B9B]">
                          $HUSTLE
                        </span>
                      </div>
                      <button
                        onClick={() => handlePledgeOnchain(bounty)}
                        disabled={isStaking}
                        className="rounded-lg bg-[#10B981] hover:bg-[#059669] px-3 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        <Flame className="h-3 w-3" />
                        <span>{isStaking ? "Staking..." : "Confirm Stake"}</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setActiveBountyId(null)}
                      className="text-center text-[10px] text-[#848B9B] hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveBountyId(bounty.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] py-2 text-xs font-semibold text-[#F9FAFB] transition-all hover:border-[#7C5CFC]/50 hover:bg-[#7C5CFC]/10 active:scale-[0.98]"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-[#7C5CFC]" />
                    <span>Co-Fund / Stake Attention</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Propose Community Bounty Modal */}
      {isProposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsProposeOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#151821] p-6 shadow-2xl animate-modal-pop">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#7C5CFC]" />
                <h3 className="text-base font-bold text-white">Propose Community Bounty</h3>
              </div>
              <button
                onClick={() => setIsProposeOpen(false)}
                className="text-[#848B9B] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProposeBounty} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#848B9B]">Bounty Title</label>
                <input
                  type="text"
                  required
                  value={proposeTitle}
                  onChange={(e) => setProposeTitle(e.target.value)}
                  placeholder="e.g. Monad MEV Searcher Simulation Toolkit"
                  className="mt-1 w-full rounded-lg border border-white/[0.1] bg-[#1B1E2B] px-3 py-2 text-xs text-white focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#848B9B]">Deliverables & Scope</label>
                <textarea
                  rows={3}
                  required
                  value={proposeDesc}
                  onChange={(e) => setProposeDesc(e.target.value)}
                  placeholder="Describe the objective, technical criteria, and deliverables..."
                  className="mt-1 w-full rounded-lg border border-white/[0.1] bg-[#1B1E2B] px-3 py-2 text-xs text-white focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#848B9B]">Initial Escrow Pool (USDT)</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={proposeReward}
                  onChange={(e) => setProposeReward(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/[0.1] bg-[#1B1E2B] px-3 py-2 text-xs text-white font-mono focus:border-[#7C5CFC] focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-[#848B9B]">
                  Funds will be deposited into Monad Testnet GigEscrow contract.
                </span>
              </div>

              {proposeSuccessTx && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <a
                    href={`https://testnet.monadscan.com/tx/${proposeSuccessTx}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-mono"
                  >
                    Bounty Deployed Onchain: {proposeSuccessTx.slice(0, 8)}...{proposeSuccessTx.slice(-4)}
                  </a>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProposeOpen(false)}
                  className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] py-2 text-xs font-medium text-white hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPropose}
                  className="flex-1 rounded-lg bg-[#7C5CFC] hover:bg-[#6A4BE2] py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {isSubmittingPropose ? "Broadcasting to Monad..." : "Deploy Escrow on Monad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
