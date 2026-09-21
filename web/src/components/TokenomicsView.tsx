"use client";

import React, { useState } from "react";
import {
  Coins,
  Flame,
  ShieldCheck,
  TrendingUp,
  Download,
  ExternalLink,
  Copy,
  Check,
  PieChart,
  Users,
  Award,
  Zap,
  Percent,
  Sliders,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Layers,
  Activity,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { CONTRACTS } from "../config/contracts";
import { formatUnits } from "viem";
import { publicClient, fetchLiveBurnData } from "../services/onchainFeed";

export function TokenomicsView() {
  const [copied, setCopied] = useState(false);
  const [monthlyVolume, setMonthlyVolume] = useState(1_000_000); // $1M monthly volume default
  const [stakedAmount, setStakedAmount] = useState(10_000); // 10k HUSTLE staked default
  const [activeTab, setActiveTab] = useState<"overview" | "allocations" | "simulator" | "vesting">("overview");

  // Kuru DEX Integration State
  const [swapDirection, setSwapDirection] = useState<"HUSTLE_TO_MON" | "MON_TO_HUSTLE">("HUSTLE_TO_MON");
  const [swapAmount, setSwapAmount] = useState<string>("500");
  const [copiedKuruAddress, setCopiedKuruAddress] = useState<string | null>(null);
  const [isSimulatingSwap, setIsSimulatingSwap] = useState(false);
  const [simulatedReceipt, setSimulatedReceipt] = useState<string | null>(null);

  const [liveTotalSupply, setLiveTotalSupply] = useState<string>("20,000,000");
  const [liveBurnedAmount, setLiveBurnedAmount] = useState<string>("769");
  const [isLiveLoaded, setIsLiveLoaded] = useState(false);

  React.useEffect(() => {
    let active = true;
    async function loadTokenStats() {
      try {
        const [supplyWei, burnData] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.hustleToken.address,
            abi: CONTRACTS.hustleToken.abi,
            functionName: "totalSupply",
          }),
          fetchLiveBurnData(),
        ]);

        if (active) {
          const supplyNum = parseFloat(formatUnits(supplyWei as bigint, 18));
          if (supplyNum > 0) {
            setLiveTotalSupply(Math.round(supplyNum).toLocaleString());
          }
          if (burnData.totalBurned > 0) {
            setLiveBurnedAmount(Math.round(burnData.totalBurned).toLocaleString());
          }
          setIsLiveLoaded(true);
        }
      } catch (err) {
        console.warn("Could not load onchain token stats:", err);
      }
    }
    loadTokenStats();
    return () => {
      active = false;
    };
  }, []);

  const contractAddress = CONTRACTS.hustleToken.address;

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Calculations for Simulator
  // 1% protocol fee:
  const protocolFee = monthlyVolume * 0.01;
  const burnAmountUsd = protocolFee * 0.4;
  const curatorPoolUsd = protocolFee * 0.2;
  const treasuryPoolUsd = protocolFee * 0.4;

  // Assume a total staking pool of 2,000,000 HUSTLE
  const estimatedTotalStaked = 2_000_000;
  const userShareFraction = Math.min(stakedAmount / estimatedTotalStaked, 1);
  const userMonthlyYieldUsd = curatorPoolUsd * userShareFraction;
  const userAnnualYieldUsd = userMonthlyYieldUsd * 12;

  // Assuming $HUSTLE nominal value of ~$0.05 for APY estimation
  const userStakedValueUsd = stakedAmount * 0.05;
  const estimatedApy = userStakedValueUsd > 0 ? ((userAnnualYieldUsd / userStakedValueUsd) * 100).toFixed(1) : "0.0";

  const allocations = [
    {
      label: "Community & Hustle-to-Earn",
      amount: "40,000,000",
      percent: 40,
      color: "bg-[#7C5CFC]",
      textColor: "text-[#A78BFA]",
      description: "Distributed to developers and creators completing verified bounties and milestone reviews.",
      unlock: "Emitted per verified sprint onchain",
    },
    {
      label: "Genesis Seeding & Liquidity",
      amount: "20,000,000",
      percent: 20,
      color: "bg-[#10B981]",
      textColor: "text-[#34D399]",
      description: "Initial DEX liquidity pools, Monad testnet builder faucets, and testnet airdrop allocations.",
      unlock: "100% unlocked at Genesis TGE",
    },
    {
      label: "Ecosystem Grants & Builders",
      amount: "15,000,000",
      percent: 15,
      color: "bg-[#F59E0B]",
      textColor: "text-[#FBBF24]",
      description: "Hackathon prizes, integration incentives (MERA, Devnads), and university builder chapters.",
      unlock: "36-month linear vesting",
    },
    {
      label: "Protocol Treasury & Insurance",
      amount: "15,000,000",
      percent: 15,
      color: "bg-[#3B82F6]",
      textColor: "text-[#60A5FA]",
      description: "Dispute resolution juror collateral backing, emergency escrow reserves, and audits.",
      unlock: "DAO governance controlled",
    },
    {
      label: "Core Contributors & Advisors",
      amount: "10,000,000",
      percent: 10,
      color: "bg-[#EF4444]",
      textColor: "text-[#F87171]",
      description: "Founding engineering team, smart contract architects, and protocol security reviewers.",
      unlock: "12-month cliff, 24-month linear",
    },
  ];

  return (
    <div className="space-y-8 print:bg-white print:text-black">
      {/* Top Action Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#151821] via-[#1B1E2B] to-[#151821] p-6 sm:p-8 shadow-xl print:border-none print:shadow-none">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7C5CFC]/30 bg-[#7C5CFC]/15 px-3 py-1 text-xs font-semibold text-[#A78BFA]">
                <Coins className="h-3.5 w-3.5" />
                ProofOfHustle Protocol Economics
              </span>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-[#34D399]">
                Monad Testnet Verified
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F9FAFB] tracking-tight print:text-black">
              $HUSTLE Tokenomics & Value Engine
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-[#9CA3AF] leading-relaxed print:text-gray-700">
              A mathematically engineered, deflationary token model built natively on Monad.
              Engineered to align long-term incentives for Freelancers, Gig Creators, Attention Curators, and Stakers.
            </p>

            {/* Smart Contract Quick Copy */}
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#848B9B]">Contract:</span>
              <button
                onClick={handleCopy}
                title="Copy token contract address"
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0E1015] px-2.5 py-1 font-mono text-xs text-[#F9FAFB] hover:border-white/[0.18] transition-colors"
              >
                <span className="truncate max-w-[190px] xs:max-w-[250px] sm:max-w-none">{contractAddress}</span>
                {copied ? <Check className="h-3.5 w-3.5 text-[#34D399] shrink-0" /> : <Copy className="h-3.5 w-3.5 text-[#848B9B] shrink-0" />}
              </button>
              <a
                href={`https://testnet.monadscan.com/address/${contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-[#7C5CFC] hover:underline"
              >
                <span>View on MonadScan</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Export PDF Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 print:hidden">
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#9073FD] px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#7C5CFC]/25 transition-all hover:opacity-95 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>Download Tokenomics Paper (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-[#151821] p-5">
          <span className="block text-xs font-semibold uppercase text-[#848B9B]">Total Hardcap Supply</span>
          <span className="mt-1 block font-mono text-xl sm:text-2xl font-bold text-white tabular-numbers">
            100,000,000
          </span>
          <span className="text-[11px] text-[#848B9B]">Fixed maximum supply cap</span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#151821] p-5">
          <span className="block text-xs font-semibold uppercase text-[#848B9B]">Circulating Supply</span>
          <span className="mt-1 block font-mono text-xl sm:text-2xl font-bold text-[#34D399] tabular-numbers">
            {liveTotalSupply}
          </span>
          <span className="text-[11px] text-[#848B9B] flex items-center gap-1">
            {isLiveLoaded && <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />}
            Live Monad Contract
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#151821] p-5">
          <span className="block text-xs font-semibold uppercase text-[#848B9B]">Permanently Burned</span>
          <span className="mt-1 block font-mono text-xl sm:text-2xl font-bold text-[#F87171] tabular-numbers">
            {liveBurnedAmount} HUSTLE
          </span>
          <span className="text-[11px] text-[#848B9B]">Destroyed at 0x0...dEaD</span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#151821] p-5">
          <span className="block text-xs font-semibold uppercase text-[#848B9B]">Curator Staking Share</span>
          <span className="mt-1 block font-mono text-xl sm:text-2xl font-bold text-[#FBBF24] tabular-numbers">
            20% Real Yield
          </span>
          <span className="text-[11px] text-[#848B9B]">Attention Futures payout</span>
        </div>
      </div>

      {/* Kuru DEX Onchain OrderBook & Liquidity Terminal */}
      <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-[#161224] via-[#151821] to-[#0E1015] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 px-2.5 py-1 text-xs font-bold text-[#A78BFA]">
                <Activity className="h-3.5 w-3.5 text-[#A78BFA] animate-pulse" />
                <span>Kuru Central Limit Order Book (CLOB) DEX</span>
              </span>
              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-semibold text-[#34D399] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span>Monad 400ms Sub-Second Finality</span>
              </span>
            </div>

            <h2 className="mt-3 text-xl sm:text-2xl font-black text-white tracking-tight">
              Kuru Onchain Liquidity & $HUSTLE Marketplace
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
              Kuru is Monad&apos;s native high-frequency onchain orderbook exchange. Through Kuru&apos;s hybrid CLOB + AMM model, 
              ProofOfHustle builders and curators trade $HUSTLE with deep liquidity, institutional maker rebates, and sub-second execution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <a
              href={`https://testnet.kuru.io/trade/${CONTRACTS.hustleToken.address}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#9073FD] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#7C5CFC]/25 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <span>Trade $HUSTLE on Kuru</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Contract & Architecture Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/[0.06] bg-[#0E1015]/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#848B9B]">
              <span className="font-semibold uppercase tracking-wider">Kuru Router Contract</span>
              <span className="font-mono text-[10px] text-emerald-400">Verified</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-white truncate">
                0x7EFbE105Ca7415dE98F96622173458ac1c054630
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("0x7EFbE105Ca7415dE98F96622173458ac1c054630");
                  setCopiedKuruAddress("router");
                  setTimeout(() => setCopiedKuruAddress(null), 2000);
                }}
                className="text-[#848B9B] hover:text-white p-1"
                title="Copy Kuru Router"
              >
                {copiedKuruAddress === "router" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-[#848B9B]">
              Central orchestrator managing deterministic CREATE2 market deployments and multi-hop routing.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#0E1015]/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#848B9B]">
              <span className="font-semibold uppercase tracking-wider">Kuru Margin Account</span>
              <span className="font-mono text-[10px] text-[#A78BFA]">Custody & Limit</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-white truncate">
                0xd029C2D98ff85D8F64799017fE00a59B1159CE02
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("0xd029C2D98ff85D8F64799017fE00a59B1159CE02");
                  setCopiedKuruAddress("margin");
                  setTimeout(() => setCopiedKuruAddress(null), 2000);
                }}
                className="text-[#848B9B] hover:text-white p-1"
                title="Copy Margin Account"
              >
                {copiedKuruAddress === "margin" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-[#848B9B]">
              Handles market-maker collateral deposits, limit bids/asks, and zero-latency order cancellations.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#0E1015]/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#848B9B]">
              <span className="font-semibold uppercase tracking-wider">Market Dynamics</span>
              <span className="font-mono text-[10px] text-amber-400">Hybrid CLOB + AMM</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-white">
              <span>Taker: 0.15%</span>
              <span>Maker Rebate: -0.05%</span>
              <span>Tick: 0.0001 MON</span>
            </div>
            <p className="text-[11px] text-[#848B9B]">
              Incentivizes active automated market makers while KuruAMMVault guarantees instant fill for swaps.
            </p>
          </div>
        </div>

        {/* Interactive Swap & Slippage Simulator */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/90 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#7C5CFC]" />
              <h3 className="font-bold text-white text-sm">Instant Kuru CLOB Swap Simulator</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#848B9B]">Route:</span>
              <span className="font-mono text-xs text-white bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08]">
                Kuru Flow Aggregator • Single-Hop
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-[#848B9B] mb-1.5">
                  <span>Swap Direction:</span>
                  <button
                    onClick={() =>
                      setSwapDirection((prev) =>
                        prev === "HUSTLE_TO_MON" ? "MON_TO_HUSTLE" : "HUSTLE_TO_MON"
                      )
                    }
                    className="flex items-center gap-1 font-semibold text-[#A78BFA] hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Switch Direction</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    placeholder="500"
                    className="w-full rounded-xl border border-white/[0.1] bg-[#1B1E2B] px-4 py-3 text-sm font-mono font-bold text-white focus:border-[#7C5CFC] focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#848B9B]">
                    {swapDirection === "HUSTLE_TO_MON" ? "$HUSTLE" : "MON"}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-white/[0.03] p-3 text-[11px] text-[#848B9B] space-y-1">
                <div className="flex justify-between">
                  <span>Estimated Receive:</span>
                  <strong className="font-mono text-white">
                    {swapDirection === "HUSTLE_TO_MON"
                      ? `${((parseFloat(swapAmount) || 0) * 0.0005).toFixed(4)} MON`
                      : `${((parseFloat(swapAmount) || 0) * 2000).toLocaleString()} $HUSTLE`}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Price Impact / Slippage:</span>
                  <strong className="font-mono text-emerald-400">&lt; 0.05% (CLOB Depth)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Monad Finality Time:</span>
                  <strong className="font-mono text-[#A78BFA]">~340ms (Sub-second)</strong>
                </div>
              </div>
            </div>

            {/* Protocol Flywheel Callout */}
            <div className="rounded-xl border border-white/[0.08] bg-[#151821] p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Flame className="h-4 w-4 text-[#F87171]" />
                <span>Kuru Autonomous Protocol Buyback &amp; Burn</span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                40% of all platform gig fees locked in <span className="font-mono text-white">ProtocolBurnPool</span> stream 
                into Kuru Router swaps to execute automated market buybacks of $HUSTLE, permanently burning tokens to 
                <span className="font-mono text-xs text-red-400"> 0x0...dEaD</span> to elevate token scarcity.
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] border-t border-white/[0.06]">
                <span className="text-[#848B9B]">Deploy CLI:</span>
                <code className="font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-white/[0.06]">
                  npm run kuru:inspect
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Pillar Win-Win Value Matrix */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">The 4-Pillar Shared Prosperity Model</h2>
          <p className="text-xs text-[#848B9B] mt-1">
            How $HUSTLE creates positive-sum economic value for every participant in the Monad ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Freelancers */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-[#34D399]">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Freelancers & Builders</h3>
            <ul className="text-xs text-[#9CA3AF] space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">100% Payout:</strong> 0% deductions from worker earnings.</li>
              <li><strong className="text-white">Hustle-to-Earn:</strong> Bonus $HUSTLE mined upon deliverable approval.</li>
              <li><strong className="text-white">ERC-5192 SBT:</strong> Non-transferable onchain proof-of-skill credentials.</li>
            </ul>
          </div>

          {/* Pillar 2: Curators */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-[#FBBF24]">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Attention Curators</h3>
            <ul className="text-xs text-[#9CA3AF] space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">Attention Futures:</strong> Stake $HUSTLE on promising gig bounties early.</li>
              <li><strong className="text-white">20% Fee Share:</strong> Earn proportional real USDT yield from completed bounties.</li>
              <li><strong className="text-white">Algorithmic Boost:</strong> Hyped gigs receive top ranking across Monad feeds.</li>
            </ul>
          </div>

          {/* Pillar 3: Clients */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15 text-[#A78BFA]">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Gig Clients & Protocols</h3>
            <ul className="text-xs text-[#9CA3AF] space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">Tiered Discounts:</strong> Hold $HUSTLE for up to 100% platform fee discount.</li>
              <li><strong className="text-white">MERA Passkey PRF:</strong> Sealed commit submissions prevent plagiarized PRs.</li>
              <li><strong className="text-white">Sub-400ms Settlement:</strong> Instant escrow releases with Monad finality.</li>
            </ul>
          </div>

          {/* Pillar 4: Stakers & Holders */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 text-[#F87171]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Token Stakers & Treasury</h3>
            <ul className="text-xs text-[#9CA3AF] space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">40% Automated Burn:</strong> Constant supply shrinkage via ProtocolBurnPool.</li>
              <li><strong className="text-white">Treasury Insurance:</strong> 40% reserved for juror disputes and grants.</li>
              <li><strong className="text-white">Governance Rights:</strong> Vote on dispute policies and curriculum bounties.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Allocation Breakdown */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Supply Allocation & Distribution</h2>
            <p className="text-xs text-[#848B9B] mt-1">100,000,000 $HUSTLE Total Token Allocation</p>
          </div>
          <span className="font-mono text-xs font-semibold text-[#A78BFA] bg-[#7C5CFC]/15 px-3 py-1 rounded-lg border border-[#7C5CFC]/25">
            20% Genesis Minted • 80% Performance & Vesting
          </span>
        </div>

        {/* Visual Stacked Progress Bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-white/[0.05] p-0.5 border border-white/[0.08]">
          {allocations.map((item, idx) => (
            <div
              key={idx}
              style={{ width: `${item.percent}%` }}
              className={`${item.color} h-full first:rounded-l-full last:rounded-r-full transition-all`}
              title={`${item.label}: ${item.percent}% (${item.amount} $HUSTLE)`}
            />
          ))}
        </div>

        {/* Breakdown List */}
        <div className="mt-6 divide-y divide-white/[0.06]">
          {allocations.map((item, idx) => (
            <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full shrink-0 ${item.color}`} />
                <div>
                  <span className="font-bold text-white text-sm">{item.label}</span>
                  <p className="text-[#848B9B] text-xs">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:text-right shrink-0">
                <div>
                  <span className="font-mono font-bold text-white text-sm block">{item.amount}</span>
                  <span className={`${item.textColor} font-semibold text-[11px]`}>{item.percent}% of total</span>
                </div>
                <span className="text-[11px] text-[#9CA3AF] bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.06]">
                  {item.unlock}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attention Futures APY & Staking Simulator */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-[#FBBF24]" />
            <h2 className="text-xl font-bold text-white">Attention Futures Real-Yield Simulator</h2>
          </div>
          <p className="text-xs text-[#848B9B] mt-1">
            Simulate your monthly staking returns from the 20% protocol curator fee pool based on platform gig volume.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Controls */}
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#848B9B] mb-2">
                <span>Monthly Protocol Gig Volume (USDT)</span>
                <span className="font-mono font-bold text-white text-sm">
                  ${monthlyVolume.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="100000"
                max="10000000"
                step="100000"
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                className="w-full accent-[#7C5CFC] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#848B9B] mt-1 font-mono">
                <span>$100K/mo</span>
                <span>$5M/mo</span>
                <span>$10M/mo</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#848B9B] mb-2">
                <span>Your Staked $HUSTLE on Bounties</span>
                <span className="font-mono font-bold text-[#FBBF24] text-sm">
                  {stakedAmount.toLocaleString()} $HUSTLE
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={stakedAmount}
                onChange={(e) => setStakedAmount(Number(e.target.value))}
                className="w-full accent-[#FBBF24] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#848B9B] mt-1 font-mono">
                <span>1,000 $HUSTLE</span>
                <span>50,000 $HUSTLE</span>
                <span>100,000 $HUSTLE</span>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0E1015] p-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
              Estimated Earnings Breakdown
            </span>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="border-r border-white/[0.06] pr-4">
                <span className="text-xs text-[#848B9B] block">Your Monthly Yield</span>
                <span className="font-mono text-2xl font-extrabold text-[#34D399] block mt-1">
                  ${userMonthlyYieldUsd.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#848B9B]">in real stablecoins</span>
              </div>

              <div className="pl-2">
                <span className="text-xs text-[#848B9B] block">Estimated APY</span>
                <span className="font-mono text-2xl font-extrabold text-[#FBBF24] block mt-1">
                  {estimatedApy}%
                </span>
                <span className="text-[11px] text-[#848B9B]">Real protocol yield</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between text-[#848B9B]">
                <span>Total 1% Escrow Fees Generated:</span>
                <span className="font-mono font-bold text-white">${protocolFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#848B9B]">
                <span>$HUSTLE Permanently Burned (40%):</span>
                <span className="font-mono font-bold text-[#F87171]">${burnAmountUsd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#848B9B]">
                <span>Total Curator Pool (20%):</span>
                <span className="font-mono font-bold text-[#FBBF24]">${curatorPoolUsd.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vesting & Emission Schedule */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Vesting & Emissions Timeline</h2>
          <p className="text-xs text-[#848B9B] mt-1">
            Conservative unlock schedule protecting market stability and aligning team incentives over 36 months.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl border border-white/[0.06] bg-[#1B1E2B] p-4">
            <span className="font-bold text-[#7C5CFC] block">Genesis TGE (Day 1)</span>
            <span className="font-mono text-base font-bold text-white mt-1 block">20M $HUSTLE</span>
            <p className="text-[#848B9B] mt-1">20% circulating supply for testnet seeding and liquidity pools.</p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#1B1E2B] p-4">
            <span className="font-bold text-[#34D399] block">Month 1 – 12</span>
            <span className="font-mono text-base font-bold text-white mt-1 block">Hustle-to-Earn Mining</span>
            <p className="text-[#848B9B] mt-1">Emission occurs strictly upon verified deliverable approval.</p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#1B1E2B] p-4">
            <span className="font-bold text-[#FBBF24] block">Month 12 Cliff</span>
            <span className="font-mono text-base font-bold text-white mt-1 block">Team Vesting Starts</span>
            <p className="text-[#848B9B] mt-1">Zero core team tokens released before Month 12 milestone.</p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#1B1E2B] p-4">
            <span className="font-bold text-[#60A5FA] block">Month 36 Full Unlock</span>
            <span className="font-mono text-base font-bold text-white mt-1 block">Final Emission Milestone</span>
            <p className="text-[#848B9B] mt-1">100% emission achieved, balanced by ongoing monthly burns.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
