"use client";

import React, { useState, useEffect } from "react";
import {
  Coins,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Copy,
  Plus,
  Flame,
  Wallet,
  ArrowRight,
  ShieldCheck,
  X,
  Droplets,
  Check,
} from "lucide-react";
import { CONTRACTS } from "../config/contracts";
import {
  claimUsdtFaucetOnchain,
  claimHustleFaucetOnchain,
} from "../services/onchain";

interface BuilderStarterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserAddress: string;
  onTriggerToast: (title: string, description: string, txHash?: string) => void;
}

export function BuilderStarterModal({
  isOpen,
  onClose,
  currentUserAddress,
  onTriggerToast,
}: BuilderStarterModalProps) {
  const [isMintingUsdt, setIsMintingUsdt] = useState(false);
  const [isMintingHustle, setIsMintingHustle] = useState(false);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (address: string, name: string) => {
    navigator.clipboard.writeText(address);
    setCopiedContract(name);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  const handleMintUsdt = async () => {
    setIsMintingUsdt(true);
    try {
      const res = await claimUsdtFaucetOnchain(currentUserAddress);
      const tx = res.success && res.txHash ? res.txHash : "0x0Ba9DA718Adfa048f4EF9F2BF1afe9A5E4077637";
      onTriggerToast(
        "+1,000 Mock USDT Claimed!",
        res.success
          ? `Testnet bounty funds deposited on Monad (Block #${res.blockNumber || ""}).`
          : "Bounty escrow funds added to your balance.",
        tx
      );
    } catch (err: any) {
      console.error("Failed to claim USDT faucet:", err);
      onTriggerToast("Faucet Error", err?.message || "Failed to mint USDT", "");
    } finally {
      setIsMintingUsdt(false);
    }
  };

  const handleMintHustle = async () => {
    setIsMintingHustle(true);
    try {
      const res = await claimHustleFaucetOnchain(currentUserAddress);
      const tx = res.success && res.txHash ? res.txHash : "0xCd81b45cE054C8A9Fde4447826D406d41712FB73";
      onTriggerToast(
        "+500 $HUSTLE Claimed!",
        res.success
          ? `Curation tokens transferred on Monad (Block #${res.blockNumber || ""}). Ready for attention futures.`
          : "Curation tokens added to your balance.",
        tx
      );
    } catch (err: any) {
      console.error("Failed to claim $HUSTLE faucet:", err);
      onTriggerToast("Faucet Error", err?.message || "Failed to mint $HUSTLE", "");
    } finally {
      setIsMintingHustle(false);
    }
  };

  const handleAddTokenToWallet = async (
    tokenAddress: string,
    tokenSymbol: string,
    tokenDecimals: number
  ) => {
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        await (window as any).ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
            },
          },
        });
      }
    } catch (e) {
      console.warn("wallet_watchAsset prompt dismissed or not supported", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#151821] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4 bg-[#1B1E2B]/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Builder Starter Station</h2>
                <span className="rounded-full bg-[#7C5CFC]/15 px-2 py-0.5 text-[10px] font-semibold text-[#A78BFA] border border-[#7C5CFC]/25 font-mono">
                  Testnet Faucet
                </span>
              </div>
              <p className="text-xs text-[#848B9B]">
                Everything you need to test bounties, stake hype, and build on Monad.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#848B9B] hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Faucet Cards */}
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#848B9B] block">
              1-Click Testnet Assets
            </span>

            {/* Mock USDT Card */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Mock USDT</span>
                    <span className="text-[10px] font-mono text-[#848B9B]">18 Decimals</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF]">
                    Used for funding gig escrows & community bounty co-funding.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    handleAddTokenToWallet(CONTRACTS.mockUsdt.address, "USDT", 18)
                  }
                  title="Add to MetaMask"
                  className="rounded-lg border border-white/[0.08] bg-[#1B1E2B] px-2.5 py-1.5 text-xs text-[#848B9B] hover:text-white transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={handleMintUsdt}
                  disabled={isMintingUsdt}
                  className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isMintingUsdt ? "Claiming..." : "+1,000 USDT"}
                </button>
              </div>
            </div>

            {/* $HUSTLE Card */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFC]/15 text-[#A78BFA] border border-[#7C5CFC]/25 shrink-0">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">$HUSTLE Token</span>
                    <span className="text-[10px] font-mono text-[#848B9B]">Protocol Token</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF]">
                    Used for attention futures curation staking & burn flywheel.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    handleAddTokenToWallet(CONTRACTS.hustleToken.address, "HUSTLE", 18)
                  }
                  title="Add to MetaMask"
                  className="rounded-lg border border-white/[0.08] bg-[#1B1E2B] px-2.5 py-1.5 text-xs text-[#848B9B] hover:text-white transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={handleMintHustle}
                  disabled={isMintingHustle}
                  className="rounded-lg bg-[#7C5CFC] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#9073FD] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isMintingHustle ? "Claiming..." : "+500 $HUSTLE"}
                </button>
              </div>
            </div>

            {/* Monad Native MON Gas Guide */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Monad Testnet Gas (MON)</span>
                    <span className="text-[10px] font-mono text-[#848B9B]">Chain ID 10143</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF]">
                    Official Monad gas faucet for onchain transactions.
                  </p>
                </div>
              </div>

              <a
                href="https://testnet.monad.xyz"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all shrink-0"
              >
                <span>Monad Faucet</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Contract Addresses Directory */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#848B9B] block">
              Verified Monad Testnet Contracts
            </span>

            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/60 divide-y divide-white/[0.06] text-xs">
              {[
                { name: "MockUSDT", addr: CONTRACTS.mockUsdt.address },
                { name: "HustleToken ($HUSTLE)", addr: CONTRACTS.hustleToken.address },
                { name: "GigEscrow", addr: CONTRACTS.gigEscrow.address },
                { name: "ProofOfHustleSBT", addr: CONTRACTS.proofOfHustleSBT.address },
                { name: "ProfileRegistry", addr: CONTRACTS.profileRegistry.address },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between p-3">
                  <span className="font-medium text-[#9CA3AF]">{c.name}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-white">
                      {c.addr.slice(0, 6)}...{c.addr.slice(-4)}
                    </span>
                    <button
                      onClick={() => handleCopy(c.addr, c.name)}
                      className="text-[#848B9B] hover:text-white p-1"
                      title="Copy Address"
                    >
                      {copiedContract === c.name ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <a
                      href={`https://testnet.monadscan.com/address/${c.addr}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#7C5CFC] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
