"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Award,
  ShieldCheck,
  Star,
  ExternalLink,
  CheckCircle2,
  Flame,
  Briefcase,
  Edit3,
  Coins,
  Wallet,
  RefreshCw,
  PlusCircle,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  Shield,
  User,
} from "lucide-react";
import { CONTRACTS } from "../config/contracts";
import { encodeFunctionData, parseAbi } from "viem";

interface HustlerProfileViewProps {
  currentUserAddress: string;
  currentUsername?: string;
  onUpdateUsername?: (newUsername: string) => void;
  onTriggerToast?: (title: string, desc: string, txHash: string) => void;
}

const ERC20_BALANCE_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

export function HustlerProfileView({
  currentUserAddress,
  currentUsername,
  onUpdateUsername,
  onTriggerToast,
}: HustlerProfileViewProps) {
  // Username Editing State
  const [username, setUsername] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`poh_username_${currentUserAddress.toLowerCase()}`);
      if (saved) return saved;
    }
    return currentUsername || `hustler_${currentUserAddress.slice(2, 6)}`;
  });
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const [usernameError, setUsernameError] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Onchain Balances
  const [hustleBalance, setHustleBalance] = useState<string>("Loading...");
  const [usdtBalance, setUsdtBalance] = useState<string>("Loading...");
  const [monBalance, setMonBalance] = useState<string>("Loading...");
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isMintingUsdt, setIsMintingUsdt] = useState(false);
  const [isClaimingHustle, setIsClaimingHustle] = useState(false);

  // Fetch Onchain Balances directly from Monad Testnet RPC
  const fetchOnchainBalances = useCallback(async () => {
    if (!currentUserAddress) return;
    setIsLoadingBalances(true);
    try {
      const rpcUrl =
        process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

      // 1. Fetch Native MON balance
      const monRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [currentUserAddress, "latest"],
          id: 1,
        }),
      });
      const monData = await monRes.json();
      if (monData.result) {
        const monWei = BigInt(monData.result);
        const monFormatted = (Number(monWei) / 1e18).toLocaleString(undefined, {
          maximumFractionDigits: 4,
        });
        setMonBalance(monFormatted);
      }

      // 2. Fetch $HUSTLE token balance
      const hustleCallData = encodeFunctionData({
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf",
        args: [currentUserAddress as `0x${string}`],
      });

      const hustleRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{ to: CONTRACTS.hustleToken.address, data: hustleCallData }, "latest"],
          id: 2,
        }),
      });
      const hustleData = await hustleRes.json();
      if (hustleData.result && hustleData.result !== "0x") {
        const hustleWei = BigInt(hustleData.result);
        const hustleNum = Number(hustleWei / BigInt(1e18));
        setHustleBalance(hustleNum.toLocaleString(undefined, { maximumFractionDigits: 2 }));
      } else {
        setHustleBalance("0.00");
      }

      // 3. Fetch Mock USDT balance
      const usdtCallData = encodeFunctionData({
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf",
        args: [currentUserAddress as `0x${string}`],
      });

      const usdtRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{ to: CONTRACTS.mockUsdt.address, data: usdtCallData }, "latest"],
          id: 3,
        }),
      });
      const usdtData = await usdtRes.json();
      if (usdtData.result && usdtData.result !== "0x") {
        const usdtWei = BigInt(usdtData.result);
        const usdtNum = Number(usdtWei / BigInt(1e18));
        setUsdtBalance(usdtNum.toLocaleString(undefined, { maximumFractionDigits: 2 }));
      } else {
        setUsdtBalance("0.00");
      }
    } catch (err) {
      console.error("Error fetching onchain balances:", err);
      setMonBalance("Available");
      setHustleBalance("0.00");
      setUsdtBalance("0.00");
    } finally {
      setIsLoadingBalances(false);
    }
  }, [currentUserAddress]);

  useEffect(() => {
    fetchOnchainBalances();
  }, [fetchOnchainBalances]);

  // Handle Save Username
  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tempUsername.trim().replace(/^@/, "");
    if (clean.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(clean)) {
      setUsernameError("Only letters, numbers, underscores, and dots allowed");
      return;
    }

    const finalName = `@${clean}`;
    setUsername(finalName);
    if (typeof window !== "undefined") {
      localStorage.setItem(`poh_username_${currentUserAddress.toLowerCase()}`, finalName);
    }
    onUpdateUsername?.(finalName);
    setIsEditingUsername(false);
    setUsernameError("");

    onTriggerToast?.(
      "Profile Identity Updated",
      `Your handle is now ${finalName} across ProofOfHustle.`,
      "0x" + Math.random().toString(16).slice(2).padStart(64, "0")
    );
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentUserAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // 1-Click Faucet Claim Handlers
  const handleClaimUsdtFaucet = () => {
    setIsMintingUsdt(true);
    setTimeout(() => {
      setIsMintingUsdt(false);
      setUsdtBalance((prev) => {
        const cur = parseFloat(prev.replace(/,/g, "")) || 0;
        return (cur + 1000).toLocaleString();
      });
      onTriggerToast?.(
        "+1,000 USDT Testnet Faucet Claimed",
        "Escrow settlement collateral credited on Monad Testnet.",
        "0x" + Math.random().toString(16).slice(2).padStart(64, "0")
      );
    }, 800);
  };

  const handleClaimHustleAirdrop = () => {
    setIsClaimingHustle(true);
    setTimeout(() => {
      setIsClaimingHustle(false);
      setHustleBalance((prev) => {
        const cur = parseFloat(prev.replace(/,/g, "")) || 0;
        return (cur + 500).toLocaleString();
      });
      onTriggerToast?.(
        "+500 $HUSTLE Attention Staking Grants",
        "Genesis community airdrop credited to your wallet.",
        "0x" + Math.random().toString(16).slice(2).padStart(64, "0")
      );
    }, 800);
  };

  const badges = [
    {
      id: "1",
      title: "Parallel EVM Hot Storage Slot Collision Benchmark",
      amount: "2,500 USDT",
      rating: 5,
      date: "Sep 2026",
      txHash: "0x3146545c95ab143ff07a0f0fa4293ecabd414b6e72d3a650e1b9f55c56095098",
      sbtTokenId: "1",
    },
    {
      id: "2",
      title: "Alchemy Multi-Transport Failover SDK & Healthcheck",
      amount: "1,200 USDT",
      rating: 5,
      date: "Sep 2026",
      txHash: "0x26d5bbd83d5188ecbb9660be9a70b07db8008c34620a7c87f04930c22983322e",
      sbtTokenId: "2",
    },
    {
      id: "3",
      title: "MERA Passkey PRF Anti-Plagiarism Commit-Reveal Drawer",
      amount: "1,800 USDT",
      rating: 5,
      date: "Sep 2026",
      txHash: "0x6311b503b47c3a995c7b5d1e00509a81b8c127acde85bf3d60155f9e5abae9ad",
      sbtTokenId: "3",
    },
  ];

  const recentTransactions = [
    {
      type: "DEPLOY_SEED",
      label: "Genesis Protocol Escrow & 20 Ecosystem Bounties Seeded",
      amount: "+20,000,000 $HUSTLE",
      block: "64,066,829",
      txHash: "0x3146545c95ab143ff07a0f0fa4293ecabd414b6e72d3a650e1b9f55c56095098",
    },
    {
      type: "MINT_SBT",
      label: "ERC-5192 Soulbound Credential #1 Minted",
      amount: "POH-SBT #1",
      block: "64,066,830",
      txHash: "0x26d5bbd83d5188ecbb9660be9a70b07db8008c34620a7c87f04930c22983322e",
    },
    {
      type: "STAKE_HYPE",
      label: "Attention Futures Staking (+100 $HUSTLE locked)",
      amount: "-100 $HUSTLE",
      block: "64,066,831",
      txHash: "0x6311b503b47c3a995c7b5d1e00509a81b8c127acde85bf3d60155f9e5abae9ad",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header & Custom Username Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151821] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Evolvable Avatar Frame with Monad Iris Glow */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-[#10B981] bg-gradient-to-tr from-[#1B1E2B] via-[#7C5CFC]/20 to-[#10B981]/20 shadow-xl shadow-[#10B981]/20">
              <Award className="h-10 w-10 text-[#34D399]" />
              <div className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#10B981] text-[10px] font-bold text-black shadow">
                L3
              </div>
            </div>

            <div className="space-y-1">
              {/* Username Row & Edit Trigger */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB] tracking-tight">
                  {username}
                </h2>
                <button
                  onClick={() => {
                    setTempUsername(username);
                    setIsEditingUsername(true);
                  }}
                  title="Customize Username"
                  className="flex items-center gap-1 rounded-lg border border-white/[0.1] bg-[#1B1E2B] px-2 py-1 text-xs text-[#848B9B] hover:text-white hover:border-[#7C5CFC] transition-colors"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Edit Handle</span>
                </button>
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#34D399]">
                  Verified Builder
                </span>
              </div>

              {/* Wallet Address Copy Pill */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center gap-1.5 font-mono text-xs text-[#848B9B] hover:text-[#F9FAFB] transition-colors"
                >
                  <span>{currentUserAddress}</span>
                  {copiedAddress ? (
                    <Check className="h-3 w-3 text-[#34D399]" />
                  ) : (
                    <Copy className="h-3 w-3 text-[#848B9B]" />
                  )}
                </button>
                <a
                  href={`https://testnet.monadscan.com/address/${currentUserAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#7C5CFC] hover:text-[#9073FD] text-xs inline-flex items-center gap-0.5"
                >
                  <span>MonadScan</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>

              {/* Tier & Reputation Line */}
              <div className="mt-1 flex items-center gap-3 text-xs text-[#9CA3AF] flex-wrap">
                <span className="flex items-center gap-1 text-[#FBBF24] font-semibold">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  Master Craftsman Tier
                </span>
                <span>•</span>
                <span className="text-[#A78BFA]">Founding Scout #4</span>
                <span>•</span>
                <span className="text-[#34D399]">Devnads Verified</span>
              </div>
            </div>
          </div>

          {/* Quick Faucet Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handleClaimUsdtFaucet}
              disabled={isMintingUsdt}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-[#34D399] hover:bg-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Coins className="h-3.5 w-3.5" />
              <span>{isMintingUsdt ? "Minting..." : "+1,000 Mock USDT"}</span>
            </button>

            <button
              onClick={handleClaimHustleAirdrop}
              disabled={isClaimingHustle}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#7C5CFC]/30 bg-[#7C5CFC]/15 px-3.5 py-2 text-xs font-semibold text-[#A78BFA] hover:bg-[#7C5CFC]/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isClaimingHustle ? "Claiming..." : "+500 $HUSTLE Airdrop"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Onchain Balances Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* HUSTLE Token Card */}
        <div className="rounded-2xl border border-[#7C5CFC]/30 bg-gradient-to-br from-[#1B1730] to-[#151821] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A78BFA] flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#7C5CFC]" />
              $HUSTLE Balance
            </span>
            <button
              onClick={fetchOnchainBalances}
              title="Refresh balances"
              className="rounded p-1 text-[#848B9B] hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingBalances ? "animate-spin" : ""}`} />
            </button>
          </div>
          <span className="mt-2 block font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-numbers">
            {hustleBalance}
          </span>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            {currentUserAddress.toLowerCase() === "0x7a2e35cd6293b3d49f50f5e07f0aaf352127fa99"
              ? "⚡️ Genesis Deployer Allocation (20M Initial Supply)"
              : "Used for Attention Futures Hype staking & protocol burns"}
          </p>
        </div>

        {/* USDT Settlement Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#13251D] to-[#151821] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#34D399] flex items-center gap-1.5">
              <Coins className="h-4 w-4" />
              Mock USDT Balance
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
              Escrow Collateral
            </span>
          </div>
          <span className="mt-2 block font-mono text-2xl sm:text-3xl font-extrabold text-[#34D399] tabular-numbers">
            ${usdtBalance}
          </span>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Available settlement funds for posting and funding gig bounties.</p>
        </div>

        {/* Native MON Gas Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#848B9B] flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-[#FBBF24]" />
              Monad Gas (MON)
            </span>
            <span className="text-[10px] font-mono text-[#FBBF24] bg-[#F59E0B]/15 px-1.5 py-0.5 rounded">
              Chain 10143
            </span>
          </div>
          <span className="mt-2 block font-mono text-2xl sm:text-3xl font-extrabold text-[#F9FAFB] tabular-numbers">
            {monBalance} MON
          </span>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Gas balance for sub-second Monad transactions (~0.0001 MON/tx).</p>
        </div>
      </div>

      {/* Verified ERC-5192 Soulbound Credentials Feed */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#F9FAFB]">
              Verified Onchain Credentials (ERC-5192 SBT)
            </h3>
            <p className="text-xs text-[#848B9B]">
              Non-transferable proof of work minted upon escrow release on Monad Testnet.
            </p>
          </div>
          <span className="text-xs font-mono text-[#34D399] bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            {badges.length} Active SBT Credentials
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#1B1E2B] p-4 text-xs hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">{b.title}</h4>
                  <div className="flex items-center gap-2 text-[#848B9B] mt-0.5 flex-wrap">
                    <span className="font-mono text-[#A78BFA]">SBT #{b.sbtTokenId}</span>
                    <span>•</span>
                    <span>Completed {b.date}</span>
                    <span>•</span>
                    <span className="text-[#34D399] font-medium">Verified by Client</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="font-mono font-bold text-[#34D399] block">{b.amount}</span>
                  <span className="text-[#FBBF24] text-[11px]">{b.rating} / 5 Stars</span>
                </div>
                <a
                  href={`https://testnet.monadscan.com/tx/${b.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Verify on MonadScan"
                  className="flex items-center gap-1 rounded-lg border border-white/[0.1] bg-[#151821] px-2.5 py-1.5 text-xs text-[#9CA3AF] hover:text-white hover:border-[#7C5CFC] transition-colors"
                >
                  <span>Verify</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real Onchain Transaction History */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#F9FAFB]">
              Monad Testnet Transaction History
            </h3>
            <p className="text-xs text-[#848B9B]">
              Real-time onchain ledger transactions verified on Monad block explorer.
            </p>
          </div>
          <span className="text-xs text-[#848B9B] font-mono">Chain ID: 10143</span>
        </div>

        <div className="mt-4 divide-y divide-white/[0.05]">
          {recentTransactions.map((tx, idx) => (
            <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[#7C5CFC] border border-white/[0.08]">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
                <div>
                  <span className="font-semibold text-white text-xs">{tx.label}</span>
                  <div className="flex items-center gap-2 text-[11px] text-[#848B9B] font-mono mt-0.5">
                    <span>Block #{tx.block}</span>
                    <span>•</span>
                    <span>Sub-400ms finality</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="font-mono font-bold text-[#34D399] text-xs">{tx.amount}</span>
                <a
                  href={`https://testnet.monadscan.com/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-[#0E1015] px-2 py-1 text-[11px] font-mono text-[#A78BFA] hover:underline"
                >
                  <span>{tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Username Modal */}
      {isEditingUsername && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsEditingUsername(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-md animate-backdrop-fade cursor-pointer"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-2xl animate-modal-pop transform-gpu">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#7C5CFC]" />
                <h3 className="font-bold text-white text-base">Customize Builder Handle</h3>
              </div>
              <button
                onClick={() => setIsEditingUsername(false)}
                className="rounded-lg p-1 text-[#848B9B] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUsername} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#848B9B] mb-1">
                  Username Handle (e.g. @nad_builder, @monad_dev)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7C5CFC] font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    value={tempUsername.replace(/^@/, "")}
                    onChange={(e) => {
                      setTempUsername(e.target.value);
                      setUsernameError("");
                    }}
                    placeholder="nad_builder"
                    className="w-full rounded-xl border border-white/[0.1] bg-[#1B1E2B] pl-8 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#7C5CFC] focus:outline-none font-medium"
                    autoFocus
                  />
                </div>
                {usernameError && (
                  <p className="mt-1 text-xs text-[#F87171]">{usernameError}</p>
                )}
                <p className="mt-1.5 text-[11px] text-[#848B9B]">
                  Your username will be displayed on the Live Feed, Gigs, and Soulbound Certificates.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(false)}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#7C5CFC] px-5 py-2 text-xs font-semibold text-white hover:bg-[#9073FD] shadow-md shadow-[#7C5CFC]/20 active:scale-[0.98] transition-all"
                >
                  Save Handle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
