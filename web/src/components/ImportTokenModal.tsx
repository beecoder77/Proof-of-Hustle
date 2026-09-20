"use client";

import React, { useState } from "react";
import {
  X,
  Coins,
  Copy,
  Check,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { CONTRACTS } from "../config/contracts";
import { usePrivy } from "@privy-io/react-auth";

interface ImportTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMintTestUsdt?: () => void;
}

export function ImportTokenModal({
  isOpen,
  onClose,
  onMintTestUsdt,
}: ImportTokenModalProps) {
  const { user } = usePrivy();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [watchAssetStatus, setWatchAssetStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tokens" | "manual">("tokens");
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(label);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // EIP-747 wallet_watchAsset integration
  const handleAddToWallet = async (
    address: string,
    symbol: string,
    decimals: number,
    image?: string
  ) => {
    try {
      setWatchAssetStatus(`Adding ${symbol}...`);
      if (
        typeof window !== "undefined" &&
        (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum
      ) {
        const ethereum = (window as unknown as { ethereum: { request: (args: unknown) => Promise<unknown> } }).ethereum;
        await ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address,
              symbol,
              decimals,
              image: image || `${window.location.origin}/logo.png`,
            },
          },
        });
        setWatchAssetStatus(`Successfully requested to add ${symbol}!`);
      } else {
        setWatchAssetStatus(`Browser wallet not detected. Please copy contract address below.`);
      }
    } catch (err) {
      console.warn("wallet_watchAsset error or rejected:", err);
      setWatchAssetStatus(`User rejected or wallet does not support auto-import.`);
    }
    setTimeout(() => setWatchAssetStatus(null), 3500);
  };

  const handleFaucetMint = () => {
    setIsMinting(true);
    setTimeout(() => {
      setIsMinting(false);
      setMintSuccess(true);
      onMintTestUsdt?.();
      setTimeout(() => setMintSuccess(false), 3000);
    }, 800);
  };

  const tokens = [
    {
      name: "ProofOfHustle Token",
      symbol: "HUSTLE",
      decimals: 18,
      address: CONTRACTS.hustleToken.address,
      type: "ERC-20 Curation & Burn Token",
      description:
        "Used for Attention Futures hype staking, protocol fee burns (40%), and ecosystem rewards.",
      color: "from-[#7C5CFC] to-[#9073FD]",
      icon: "⚡",
    },
    {
      name: "Mock Escrow USDT",
      symbol: "USDT",
      decimals: 18,
      address: CONTRACTS.mockUsdt.address,
      type: "ERC-20 Settlement Currency",
      description:
        "Primary currency for gig bounty deposits, freelancer payouts, and fee distribution.",
      color: "from-[#10B981] to-[#34D399]",
      icon: "💵",
      faucet: true,
    },
    {
      name: "Proof of Hustle SBT",
      symbol: "POH-SBT",
      decimals: 0,
      address: CONTRACTS.proofOfHustleSBT.address,
      type: "ERC-5192 Soulbound Credential",
      description:
        "Non-transferable onchain work badges automatically minted upon verified gig completion.",
      color: "from-[#F59E0B] to-[#FBBF24]",
      icon: "🏆",
      isSBT: true,
    },
    {
      name: "Gig Escrow Protocol",
      symbol: "ESCROW",
      decimals: 0,
      address: CONTRACTS.gigEscrow.address,
      type: "Core Escrow Smart Contract",
      description:
        "Holds client funds, enforces 72h auto-release clock, and coordinates MERA PRF commit reveals.",
      color: "from-[#3B82F6] to-[#60A5FA]",
      icon: "🔒",
      isContract: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-md animate-backdrop-fade cursor-pointer" />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-2xl flex flex-col max-h-[90vh] animate-modal-pop transform-gpu">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFC]/15 text-[#A78BFA] border border-[#7C5CFC]/30">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F9FAFB]">
                Protocol Tokens & Wallet Import
              </h3>
              <p className="text-xs text-[#848B9B]">
                Import $HUSTLE and USDT to your wallet (MetaMask, Rabby, Phantom) on Monad Testnet (Chain ID 10143)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#9CA3AF] transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 border-b border-white/[0.06] pt-3 pb-2 text-xs">
          <button
            onClick={() => setActiveTab("tokens")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              activeTab === "tokens"
                ? "bg-[#7C5CFC]/20 text-[#A78BFA] border border-[#7C5CFC]/30"
                : "text-[#848B9B] hover:text-white"
            }`}
          >
            Tokens & 1-Click Import
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              activeTab === "manual"
                ? "bg-[#7C5CFC]/20 text-[#A78BFA] border border-[#7C5CFC]/30"
                : "text-[#848B9B] hover:text-white"
            }`}
          >
            Manual Import Guide
          </button>
        </div>

        {/* Status Toast */}
        {watchAssetStatus && (
          <div className="my-2 rounded-lg bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 p-2 text-xs text-[#A78BFA] flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{watchAssetStatus}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {activeTab === "tokens" ? (
            tokens.map((token) => (
              <div
                key={token.symbol}
                className="rounded-xl border border-white/[0.07] bg-[#1B1E2B] p-4 transition-all hover:border-white/[0.14]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${token.color} text-base font-bold text-white shadow-md`}
                    >
                      {token.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#F9FAFB]">{token.name}</h4>
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-[#A78BFA]">
                          ${token.symbol}
                        </span>
                        {token.decimals > 0 && (
                          <span className="text-[10px] text-[#848B9B]">
                            ({token.decimals} dec)
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#848B9B]">{token.type}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {!token.isSBT && !token.isContract && (
                      <button
                        onClick={() =>
                          handleAddToWallet(
                            token.address,
                            token.symbol,
                            token.decimals
                          )
                        }
                        className="flex items-center gap-1 rounded-lg border border-[#7C5CFC]/30 bg-[#7C5CFC]/15 px-2.5 py-1.5 text-xs font-semibold text-[#A78BFA] transition-all hover:bg-[#7C5CFC]/25 active:scale-95"
                        title="Add to connected wallet via EIP-747"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Add to Wallet</span>
                      </button>
                    )}

                    {token.faucet && (
                      <button
                        onClick={handleFaucetMint}
                        disabled={isMinting}
                        className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
                        title="Mint testnet USDT to test gig creation"
                      >
                        {isMinting ? (
                          <span className="animate-pulse">Minting...</span>
                        ) : mintSuccess ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span>+1,000 Minted!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Faucet +1k USDT</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-2.5 text-xs text-[#9CA3AF] leading-relaxed">
                  {token.description}
                </p>

                {/* Contract Address Row */}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-[#151821] px-3 py-2 text-xs border border-white/[0.05]">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[10px] uppercase font-semibold text-[#848B9B]">Address:</span>
                    <span className="font-mono text-[#F9FAFB] text-[11px] truncate">
                      {token.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => handleCopy(token.address, token.symbol)}
                      className="flex items-center gap-1 text-[11px] text-[#848B9B] hover:text-white transition-colors"
                      title="Copy Address"
                    >
                      {copiedAddress === token.symbol ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`https://testnet.monadscan.com/address/${token.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#848B9B] hover:text-[#7C5CFC] transition-colors"
                      title="View on MonadVision Explorer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Manual Guide Tab */
            <div className="space-y-4 text-xs text-[#9CA3AF]">
              <div className="rounded-xl border border-white/[0.08] bg-[#1B1E2B] p-4 space-y-3">
                <h4 className="text-sm font-bold text-[#F9FAFB] flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[#7C5CFC]" />
                  Cara Manual Import Token di MetaMask / Rabby
                </h4>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    Buka ekstensi <strong className="text-white">MetaMask</strong> atau <strong className="text-white">Rabby</strong> di browser Anda.
                  </li>
                  <li>
                    Pastikan jaringan aktif Anda adalah <strong className="text-[#A78BFA]">Monad Testnet (Chain ID 10143)</strong>.
                  </li>
                  <li>
                    Scroll ke bagian bawah daftar aset dan klik tombol <strong className="text-white">&quot;Import tokens&quot;</strong> (atau &quot;Add Custom Token&quot;).
                  </li>
                  <li>
                    Paste alamat kontrak token yang ingin Anda impor:
                    <div className="mt-1.5 space-y-1.5 pl-2 font-mono text-[11px]">
                      <div className="p-2 bg-[#151821] rounded border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <span className="text-white font-bold">$HUSTLE: </span>
                          <span className="text-[#A78BFA]">{CONTRACTS.hustleToken.address}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(CONTRACTS.hustleToken.address, "guide_hustle")}
                          className="text-xs text-[#848B9B] hover:text-white"
                        >
                          {copiedAddress === "guide_hustle" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="p-2 bg-[#151821] rounded border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <span className="text-white font-bold">Mock USDT: </span>
                          <span className="text-emerald-400">{CONTRACTS.mockUsdt.address}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(CONTRACTS.mockUsdt.address, "guide_usdt")}
                          className="text-xs text-[#848B9B] hover:text-white"
                        >
                          {copiedAddress === "guide_usdt" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </li>
                  <li>
                    Field <strong className="text-white">Token Symbol</strong> dan <strong className="text-white">Decimals (18)</strong> akan otomatis terisi.
                  </li>
                  <li>
                    Klik <strong className="text-white">&quot;Next&quot;</strong> lalu <strong className="text-white">&quot;Import&quot;</strong>. Saldo token Anda akan seketika muncul di dompet Anda.
                  </li>
                </ol>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#1B1E2B] p-4 flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-semibold text-[#F9FAFB]">Informasi Jaringan Monad Testnet</h5>
                  <p className="text-[11px] leading-relaxed">
                    RPC URL: <code className="text-[#A78BFA]">https://monad-testnet.g.alchemy.com/v2/...</code> atau public node <code className="text-[#A78BFA]">https://testnet-rpc.monad.xyz</code>.
                    Chain ID: <code className="text-[#A78BFA]">10143</code>, Currency Symbol: <code className="text-[#A78BFA]">MON</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.08] pt-4 flex items-center justify-between text-xs text-[#848B9B]">
          <span>Monad Testnet • Chain ID 10143</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/[0.08] px-4 py-2 font-medium text-white hover:bg-white/[0.14] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
