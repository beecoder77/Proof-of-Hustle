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
  Loader2,
  Sparkles,
} from "lucide-react";
import { CONTRACTS } from "../config/contracts";
import { encodeFunctionData, parseAbi } from "viem";
import {
  fetchProfileOnchain,
  registerHandleOnchain,
  claimUsdtFaucetOnchain,
  claimHustleAirdropOnchain,
} from "../services/onchain";
import { fetchLiveUserSBTs, OnchainBadge } from "../services/onchainFeed";

interface HustlerProfileViewProps {
  currentUserAddress: string;
  currentUsername?: string;
  onUpdateUsername?: (newUsername: string) => void;
  onTriggerToast?: (title: string, desc: string, txHash: string) => void;
  isConnectedWallet?: boolean;
  onResetToMyProfile?: () => void;
}

const ERC20_BALANCE_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

interface OnchainTxRecord {
  type: string;
  label: string;
  amount: string;
  block: string;
  txHash: string;
}

export function HustlerProfileView({
  currentUserAddress,
  currentUsername,
  onUpdateUsername,
  onTriggerToast,
  isConnectedWallet = false,
  onResetToMyProfile,
}: HustlerProfileViewProps) {
  // Username Editing State
  const [username, setUsername] = useState<string>(() => {
    if (typeof window !== "undefined" && currentUserAddress) {
      const saved = localStorage.getItem(`poh_username_${currentUserAddress.toLowerCase()}`);
      if (saved) return saved;
    }
    return currentUsername || (currentUserAddress ? `hustler_${currentUserAddress.slice(2, 6)}` : "");
  });
  const [isOnchainVerifiedHandle, setIsOnchainVerifiedHandle] = useState<boolean>(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isRegisteringHandle, setIsRegisteringHandle] = useState(false);
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

  // Dynamic Onchain Ledger History per address
  const [recentTransactions, setRecentTransactions] = useState<OnchainTxRecord[]>(() => {
    if (typeof window !== "undefined" && currentUserAddress) {
      const saved = localStorage.getItem(`poh_txs_${currentUserAddress.toLowerCase()}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined" && currentUserAddress) {
      const saved = localStorage.getItem(`poh_txs_${currentUserAddress.toLowerCase()}`);
      if (saved) {
        try {
          setRecentTransactions(JSON.parse(saved));
          return;
        } catch {}
      }
    }
    setRecentTransactions([]);
  }, [currentUserAddress]);

  // Read Profile Handle directly from Monad Testnet Smart Contract
  useEffect(() => {
    let active = true;
    async function checkOnchainProfile() {
      if (!currentUserAddress) return;
      try {
        const onchain = await fetchProfileOnchain(currentUserAddress);
        if (onchain && onchain.handle && active) {
          setUsername(onchain.handle);
          setIsOnchainVerifiedHandle(true);
          onUpdateUsername?.(onchain.handle);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `poh_username_${currentUserAddress.toLowerCase()}`,
              onchain.handle
            );
          }
        }
      } catch (err) {
        console.warn("Could not fetch onchain profile:", err);
      }
    }
    checkOnchainProfile();
    return () => {
      active = false;
    };
  }, [currentUserAddress, onUpdateUsername]);

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

  // Handle Save Username — 100% REAL ONCHAIN TRANSACTION on Monad Testnet
  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tempUsername.trim().replace(/^@/, "");
    if (clean.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    if (clean.length > 24) {
      setUsernameError("Username cannot exceed 24 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(clean)) {
      setUsernameError("Only alphanumeric characters, underscores, and dots allowed");
      return;
    }

    const finalName = `@${clean}`;
    setIsRegisteringHandle(true);
    setUsernameError("");

    try {
      // Execute REAL ONCHAIN call to HustlerProfileRegistry
      const res = await registerHandleOnchain(currentUserAddress, clean);

      if (res.success && res.txHash) {
        setUsername(finalName);
        setIsOnchainVerifiedHandle(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(`poh_username_${currentUserAddress.toLowerCase()}`, finalName);
        }
        onUpdateUsername?.(finalName);
        setIsEditingUsername(false);

        // Prepend real onchain transaction & persist to address ledger
        const newRecord: OnchainTxRecord = {
          type: "REGISTER_HANDLE",
          label: `Onchain Handle Registered (${finalName})`,
          amount: "0.00 MON Gas",
          block: res.blockNumber || "Pending",
          txHash: res.txHash!,
        };
        setRecentTransactions((prev) => {
          const updated = [newRecord, ...prev];
          if (typeof window !== "undefined" && currentUserAddress) {
            localStorage.setItem(`poh_txs_${currentUserAddress.toLowerCase()}`, JSON.stringify(updated));
          }
          return updated;
        });

        onTriggerToast?.(
          "Handle Registered Onchain!",
          `Handle ${finalName} permanently recorded on Monad Testnet (Block #${res.blockNumber || ""}).`,
          res.txHash
        );
      } else {
        setUsernameError(res.error || "Failed to broadcast registration transaction");
      }
    } catch (err: any) {
      console.error("Handle registration failed:", err);
      setUsernameError(err.message || "Onchain transaction failed. Please retry.");
    } finally {
      setIsRegisteringHandle(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentUserAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Real 1-Click Faucet Claim Handlers on Monad Testnet
  const handleClaimUsdtFaucet = async () => {
    setIsMintingUsdt(true);
    try {
      const res = await claimUsdtFaucetOnchain(currentUserAddress);
      if (res.success && res.txHash) {
        await fetchOnchainBalances();
        const newRecord: OnchainTxRecord = {
          type: "FAUCET_USDT",
          label: "+1,000 Mock USDT Minted (Collateral Faucet)",
          amount: "+1,000 USDT",
          block: res.blockNumber || "Current",
          txHash: res.txHash!,
        };
        setRecentTransactions((prev) => {
          const updated = [newRecord, ...prev];
          if (typeof window !== "undefined" && currentUserAddress) {
            localStorage.setItem(`poh_txs_${currentUserAddress.toLowerCase()}`, JSON.stringify(updated));
          }
          return updated;
        });
        onTriggerToast?.(
          "+1,000 USDT Testnet Faucet Minted",
          `Collateral minted on Monad Testnet (Block #${res.blockNumber || ""}).`,
          res.txHash
        );
      } else {
        onTriggerToast?.("Faucet Error", res.error || "Unable to mint USDT", "");
      }
    } catch (err: any) {
      console.error("USDT Faucet failed:", err);
    } finally {
      setIsMintingUsdt(false);
    }
  };

  const handleClaimHustleAirdrop = async () => {
    setIsClaimingHustle(true);
    try {
      const res = await claimHustleAirdropOnchain(currentUserAddress);
      if (res.success && res.txHash) {
        await fetchOnchainBalances();
        const newRecord: OnchainTxRecord = {
          type: "AIRDROP_HUSTLE",
          label: "+500 $HUSTLE Attention Grant Transferred",
          amount: "+500 $HUSTLE",
          block: res.blockNumber || "Current",
          txHash: res.txHash!,
        };
        setRecentTransactions((prev) => {
          const updated = [newRecord, ...prev];
          if (typeof window !== "undefined" && currentUserAddress) {
            localStorage.setItem(`poh_txs_${currentUserAddress.toLowerCase()}`, JSON.stringify(updated));
          }
          return updated;
        });
        onTriggerToast?.(
          "+500 $HUSTLE Attention Staking Grant",
          `Grant transferred on Monad Testnet (Block #${res.blockNumber || ""}).`,
          res.txHash
        );
      } else {
        onTriggerToast?.("Airdrop Error", res.error || "Unable to claim $HUSTLE", "");
      }
    } catch (err: any) {
      console.error("HUSTLE Faucet failed:", err);
    } finally {
      setIsClaimingHustle(false);
    }
  };

  const [badges, setBadges] = useState<OnchainBadge[]>([]);
  const [isOnchainSbtLoaded, setIsOnchainSbtLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadSBTs() {
      if (!currentUserAddress) return;
      try {
        const live = await fetchLiveUserSBTs(currentUserAddress);
        if (active && live && live.length > 0) {
          setBadges(live);
          setIsOnchainSbtLoaded(true);
        }
      } catch (err) {
        console.warn("Could not load onchain SBTs:", err);
      }
    }
    loadSBTs();
    return () => {
      active = false;
    };
  }, [currentUserAddress]);

  const builderLevel = badges.length;
  const builderTier =
    builderLevel >= 4
      ? "Grandmaster Craftsman"
      : builderLevel >= 2
      ? "Master Craftsman Tier"
      : builderLevel >= 1
      ? "Verified Builder"
      : "Unverified Hustler";

  return (
    <div className="space-y-6">
      {/* Account Mode Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#151821] p-4 text-xs shadow-lg">
        <div className="flex items-center gap-2 flex-wrap">
          {isConnectedWallet ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected Wallet (Your Personal Profile)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 px-3 py-1 text-xs font-bold text-[#A78BFA]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Public Verified Hustler Profile (Read-Only)
            </span>
          )}
          <span className="text-[#848B9B] text-[11px] hidden md:inline">• Verifiable onchain reputation on Monad</span>
        </div>

        {/* Back to My Profile Button if inspecting another profile */}
        {!isConnectedWallet && onResetToMyProfile && (
          <button
            onClick={onResetToMyProfile}
            className="flex items-center gap-1.5 rounded-xl bg-[#7C5CFC] px-3.5 py-1.5 font-bold text-xs text-white hover:bg-[#9073FD] transition-all active:scale-[0.98] shadow-md shadow-[#7C5CFC]/20"
          >
            <User className="h-3.5 w-3.5" />
            <span>← Return to My Profile</span>
          </button>
        )}
      </div>

      {/* Profile Header & Custom Username Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151821] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full lg:w-auto">
            {/* Evolvable Avatar Frame with Monad Iris Glow */}
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-[#10B981] bg-gradient-to-tr from-[#1B1E2B] via-[#7C5CFC]/20 to-[#10B981]/20 shadow-xl shadow-[#10B981]/20">
              <Award className="h-8 w-8 sm:h-10 sm:w-10 text-[#34D399]" />
              <div className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#10B981] text-[10px] font-bold text-black shadow">
                L{builderLevel}
              </div>
            </div>

            <div className="space-y-1 min-w-0 w-full sm:w-auto">
              {/* Username Row & Edit Trigger */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB] tracking-tight truncate">
                  {username}
                </h2>
                {isConnectedWallet && (
                  <button
                    onClick={() => {
                      setTempUsername(username);
                      setIsEditingUsername(true);
                    }}
                    title="Customize Username Onchain"
                    className="flex items-center gap-1 rounded-lg border border-white/[0.1] bg-[#1B1E2B] px-2.5 py-1 text-xs text-[#848B9B] hover:text-white hover:border-[#7C5CFC] active:scale-[0.98] transition-all shrink-0"
                  >
                    <Edit3 className="h-3 w-3 text-[#7C5CFC]" />
                    <span>Edit Handle</span>
                  </button>
                )}
                {isOnchainVerifiedHandle ? (
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#34D399] flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    Onchain Verified
                  </span>
                ) : (
                  <span className="rounded-full border border-[#7C5CFC]/25 bg-[#7C5CFC]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#A78BFA] shrink-0">
                    Syncing Onchain
                  </span>
                )}
              </div>

              {/* Wallet Address Copy Pill */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center gap-1.5 font-mono text-xs text-[#848B9B] hover:text-[#F9FAFB] transition-colors truncate max-w-[200px] xs:max-w-[260px] sm:max-w-none"
                >
                  <span className="truncate">{currentUserAddress}</span>
                  {copiedAddress ? (
                    <Check className="h-3 w-3 text-[#34D399] shrink-0" />
                  ) : (
                    <Copy className="h-3 w-3 text-[#848B9B] shrink-0" />
                  )}
                </button>
                <a
                  href={`https://testnet.monadscan.com/address/${currentUserAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#7C5CFC] hover:text-[#9073FD] text-xs inline-flex items-center gap-0.5 shrink-0"
                >
                  <span>MonadScan</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>

              {/* Tier & Reputation Line */}
              <div className="mt-1 flex items-center gap-3 text-xs text-[#9CA3AF] flex-wrap">
                <span className="flex items-center gap-1 text-[#FBBF24] font-semibold">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  {builderTier}
                </span>
                <span>•</span>
                <span className="text-[#A78BFA]">
                  {badges.length > 0 ? `${badges.length} SBT Credentials` : "Active Hustler"}
                </span>
                <span>•</span>
                <span className="text-[#34D399]">Devnads Verified</span>
              </div>
            </div>
          </div>

          {/* Quick Faucet Actions — Only for Connected Wallet */}
          {isConnectedWallet ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <button
                onClick={handleClaimUsdtFaucet}
                disabled={isMintingUsdt}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-[#34D399] hover:bg-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isMintingUsdt ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Coins className="h-3.5 w-3.5" />
                )}
                <span>Claim 500 USDT Faucet</span>
              </button>

              <button
                onClick={handleClaimHustleAirdrop}
                disabled={isClaimingHustle}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-[#A78BFA] hover:bg-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isClaimingHustle ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>+500 $HUSTLE Airdrop</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Primary Financial Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-[#848B9B]">
            <span className="text-xs uppercase tracking-wider font-medium">Earned Balance</span>
            <Coins className="h-4 w-4 text-[#34D399]" />
          </div>
          <span className="mt-2 font-mono text-xl sm:text-2xl font-black text-[#F9FAFB] block">
            {usdtBalance} USDT
          </span>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Escrow rewards settled directly via MockUSDT.</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-[#848B9B]">
            <span className="text-xs uppercase tracking-wider font-medium">Staked Power</span>
            <Zap className="h-4 w-4 text-[#7C5CFC]" />
          </div>
          <span className="mt-2 font-mono text-xl sm:text-2xl font-black text-[#F9FAFB] block">
            {hustleBalance} $HUSTLE
          </span>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Ecosystem governance & staking tier token.</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-[#848B9B]">
            <span className="text-xs uppercase tracking-wider font-medium">Reputation Credentials</span>
            <Star className="h-4 w-4 text-[#FBBF24]" />
          </div>
          <span className="mt-2 font-mono text-xl sm:text-2xl font-black text-[#F9FAFB] block">
            {badges.length} Proofs
          </span>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Verified ERC-5192 Soulbound tokens held onchain.</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-[#848B9B]">
            <span className="text-xs uppercase tracking-wider font-medium">Monad Gas Reserve</span>
            <Wallet className="h-4 w-4 text-[#60A5FA]" />
          </div>
          <span className="mt-2 font-mono text-xl sm:text-2xl font-black text-[#F9FAFB] block">
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

        {badges.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#1B1E2B]/50 p-8 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-[#848B9B]/50 mb-2" />
            <p className="text-sm font-medium text-white">No Soulbound Credentials Minted Yet</p>
            <p className="text-xs text-[#848B9B] mt-1 max-w-sm mx-auto">
              Complete gigs and receive escrow payout approvals to earn non-transferable ERC-5192 SBT reputation credentials onchain.
            </p>
          </div>
        ) : (
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
                    href={b.txHash && b.txHash !== "0x" ? `https://testnet.monadscan.com/tx/${b.txHash}` : `https://testnet.monadscan.com/token/${CONTRACTS.proofOfHustleSBT.address}`}
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
        )}
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
          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#848B9B]">
              <p className="font-semibold text-white">No Onchain Activity Recorded Yet for this Address</p>
              <p className="mt-1 text-[#848B9B]">
                {isConnectedWallet
                  ? "Claim starter USDT collateral or register your unique handle to record verified transactions on Monad Testnet."
                  : "This hustler has not recorded public transactions yet on Monad Testnet."}
              </p>
            </div>
          ) : (
            recentTransactions.map((tx, idx) => (
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
            ))
          )}
        </div>
      </div>

      {/* Edit Username Modal */}
      {isEditingUsername && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !isRegisteringHandle && setIsEditingUsername(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-md animate-backdrop-fade cursor-pointer"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-2xl animate-modal-pop transform-gpu">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#7C5CFC]" />
                <h3 className="font-bold text-white text-base">Register Onchain Handle</h3>
              </div>
              <button
                onClick={() => !isRegisteringHandle && setIsEditingUsername(false)}
                disabled={isRegisteringHandle}
                className="rounded-lg p-1 text-[#848B9B] hover:text-white disabled:opacity-30"
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
                    disabled={isRegisteringHandle}
                    value={tempUsername.replace(/^@/, "")}
                    onChange={(e) => {
                      setTempUsername(e.target.value);
                      setUsernameError("");
                    }}
                    placeholder="nad_builder"
                    className="w-full rounded-xl border border-white/[0.1] bg-[#1B1E2B] pl-8 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#7C5CFC] focus:outline-none font-medium disabled:opacity-50"
                    autoFocus
                  />
                </div>
                {usernameError && (
                  <p className="mt-1 text-xs text-[#F87171]">{usernameError}</p>
                )}
                <div className="mt-2 rounded-lg border border-white/[0.06] bg-[#0E1015]/60 p-2.5 text-[11px] text-[#848B9B] space-y-1">
                  <p className="text-white font-medium flex items-center gap-1">
                    <Shield className="h-3 w-3 text-[#7C5CFC]" />
                    Verified Monad Testnet Smart Contract
                  </p>
                  <p>
                    Handle will be permanently reserved on <span className="font-mono text-[#A78BFA]">0x6781...1B6D</span> with sub-400ms finality.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isRegisteringHandle}
                  onClick={() => setIsEditingUsername(false)}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-[#9CA3AF] hover:text-white disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegisteringHandle}
                  className="flex items-center gap-1.5 rounded-xl bg-[#7C5CFC] px-5 py-2 text-xs font-semibold text-white hover:bg-[#9073FD] shadow-md shadow-[#7C5CFC]/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isRegisteringHandle ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Broadcasting (~400ms)...</span>
                    </>
                  ) : (
                    <span>Save Onchain</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
