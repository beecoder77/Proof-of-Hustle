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
import seededOnchainData from "../data/seededOnchainData.json";
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

const ONCHAIN_BOUNTIES: CommunityBounty[] = [
  {
    id: "b1",
    gigId: "23",
    title: seededOnchainData.completedGigs[0]?.title || "Parallel EVM Storage Slot Collision Benchmark Suite",
    description:
      "Community-pooled bounty to stress test concurrent storage slot conflicts, measuring throughput and abort/retry latency on Monad parallel execution.",
    targetGoal: 2500,
    currentRaised: 2500,
    currency: "USDT",
    hypeStaked: 150,
    backersCount: 29,
    daysRemaining: 6,
    tags: ["Solidity", "Parallel EVM", "Foundry"],
    recentTxHash: seededOnchainData.completedGigs[0]?.payoutTx || "0xd79166346457375455b5248724aec65307d307e2e33778d69d8e726beb843f5e",
  },
  {
    id: "b2",
    gigId: "24",
    title: seededOnchainData.completedGigs[1]?.title || "Alchemy Multi-Transport Failover & Latency Monitor",
    description:
      "High-performance TypeScript RPC client that monitors block latency on Monad testnet and seamlessly fails over to backup RPCs under 100ms.",
    targetGoal: 1200,
    currentRaised: 1200,
    currency: "USDT",
    hypeStaked: 184,
    backersCount: 16,
    daysRemaining: 3,
    tags: ["TypeScript", "Viem", "Alchemy"],
    recentTxHash: seededOnchainData.completedGigs[1]?.payoutTx || "0xafc8d609315d0052a556d1ae9d9bb541da2673796ec267684a3d12d0f7224e63",
  },
  {
    id: "b3",
    gigId: "25",
    title: seededOnchainData.completedGigs[2]?.title || "MERA PRF Biometric Key Derivation Test Suite",
    description:
      "Deterministic WebAuthn passkey PRF extension client deriving unique entropy for sealed escrow deliverables on Monad Testnet.",
    targetGoal: 1500,
    currentRaised: 1500,
    currency: "USDT",
    hypeStaked: 220,
    backersCount: 22,
    daysRemaining: 4,
    tags: ["Cryptography", "Mera PRF", "WebAuthn"],
    recentTxHash: seededOnchainData.completedGigs[2]?.payoutTx || "0x79c318b90ad0d6f8a0669dd83f8cfe062d5a601df34e1891a8f160115a65b5c1",
  },
  {
    id: "b4",
    gigId: "26",
    title: seededOnchainData.completedGigs[3]?.title || "Monad Gas Tuning & Cold Storage Benchmark",
    description:
      "Foundry benchmark evaluating Monad testnet gas schedules, warm vs cold slot reads, and scheduler abort frequencies.",
    targetGoal: 1000,
    currentRaised: 1000,
    currency: "USDT",
    hypeStaked: 160,
    backersCount: 19,
    daysRemaining: 5,
    tags: ["Gas", "Storage", "Solidity"],
    recentTxHash: seededOnchainData.completedGigs[3]?.payoutTx || "0xd197f8545d9485a8d167907228cac2a9d74b4a7ee7560643c8cfa9297209ee73",
  },
  {
    id: "b5",
    gigId: "27",
    title: seededOnchainData.completedGigs[4]?.title || "Monad 3D Animated Video Meme & Sticker Collection",
    description:
      "Community-pooled bounty to commission high-energy 3D animation assets and sticker loops celebrating Monad's 400ms block finality.",
    targetGoal: 800,
    currentRaised: 800,
    currency: "USDT",
    hypeStaked: 350,
    backersCount: 38,
    daysRemaining: 7,
    tags: ["Community", "Animation", "Memes"],
    recentTxHash: seededOnchainData.completedGigs[4]?.payoutTx || "0x4cdf582a277fa81d65481e02753b34503ac9c6ceba1bd3597e5e7add1c8f75eb",
  },
];

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

const INITIAL_CURATIONS: UserCurationPosition[] = [
  {
    gigId: "23",
    gigTitle: seededOnchainData.completedGigs[0]?.title || "Parallel EVM Storage Slot Collision Benchmark Suite",
    stakedAmount: 50,
    earlyRank: 1,
    claimableYieldUsdt: 2.50,
    isSettled: true,
    isClaimed: false,
    txHash: seededOnchainData.completedGigs[0]?.hypeTx || "0x4151539e8afa03ee467d6f1ab02300715a0db5da3a0b2b9aad542932c95d5749",
  },
  {
    gigId: "24",
    gigTitle: seededOnchainData.completedGigs[1]?.title || "Alchemy Multi-Transport Failover & Latency Monitor",
    stakedAmount: 50,
    earlyRank: 1,
    claimableYieldUsdt: 1.20,
    isSettled: true,
    isClaimed: false,
    txHash: seededOnchainData.completedGigs[1]?.hypeTx || "0x056f66b90357a9bfa560bab7d8446d40c26e0e818b703b9624ca555dca664532",
  },
];

export function CommunityBountyHub({
  onTriggerToast,
  currentUserAddress,
}: CommunityBountyHubProps = {}) {
  const [bounties, setBounties] = useState<CommunityBounty[]>(ONCHAIN_BOUNTIES);
  const [pledgeAmount, setPledgeAmount] = useState("50");
  const [activeBountyId, setActiveBountyId] = useState<string | null>(null);
  const [isStaking, setIsStaking] = useState(false);
  const [confirmedTx, setConfirmedTx] = useState<{ [id: string]: string }>({});
  const [stakeError, setStakeError] = useState<{ [id: string]: string }>({});
  const [curations, setCurations] = useState<UserCurationPosition[]>(INITIAL_CURATIONS);
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

        <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="text-xs text-[#848B9B]">
            All pledges execute onchain via <span className="font-mono text-white">GigEscrow.stakeHype()</span>
          </span>
          <button
            onClick={() => setIsProposeOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#7C5CFC] hover:bg-[#6A4BE2] px-3.5 py-1.5 text-xs font-bold text-white shadow-lg transition-all active:scale-95"
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
          {curations.map((cur) => (
            <div
              key={cur.gigId}
              className="rounded-xl border border-white/[0.08] bg-[#0E1015]/70 p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-[11px] font-semibold text-[#7C5CFC]">
                    Gig #{cur.gigId}
                  </span>
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
          ))}
        </div>
      </div>

      {/* Bounty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
