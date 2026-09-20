"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy, CheckCircle, ExternalLink, X, Share2 } from "lucide-react";

interface ProofOfWinModalProps {
  isOpen: boolean;
  onClose: () => void;
  gigTitle: string;
  payoutAmount: string;
  rewardToken: string;
  txHash?: string;
  sbtTokenId?: string;
}

export function ProofOfWinModal({
  isOpen,
  onClose,
  gigTitle,
  payoutAmount,
  rewardToken,
  txHash = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  sbtTokenId = "14",
}: ProofOfWinModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#7C5CFC", "#10B981", "#F59E0B", "#F9FAFB"],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tweetText = encodeURIComponent(
    `Just completed "${gigTitle}" on @ProofOfHustle and claimed ${payoutAmount} ${rewardToken} instantly on @Monad_xyz! ⚡️\n\nSub-second escrow settlement + minted my verified Proof-of-Work Soulbound SBT #${sbtTokenId}.\n\nCheck onchain proof: https://testnet.monadscan.com/tx/${txHash}\n#ProofOfHustle #Monad #Metropolis`
  );

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-md animate-backdrop-fade cursor-pointer" />

      <div className="relative w-full max-w-md rounded-2xl border border-[#10B981]/30 bg-[#151821] p-6 shadow-2xl text-center animate-modal-pop transform-gpu">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-[#9CA3AF] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Trophy Icon Badge */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10B981]/20 text-[#34D399] shadow-lg shadow-[#10B981]/20">
          <Trophy className="h-7 w-7" />
        </div>

        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-[#34D399]">
          <CheckCircle className="h-3.5 w-3.5" />
          Escrow Released • Monad Sub-Second Finality
        </span>

        <h3 className="mt-2 text-xl font-bold text-white">
          Proof of Win Verified!
        </h3>

        {/* Payout Display */}
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#1B1E2B] p-4">
          <span className="block text-xs text-[#848B9B]">Credited to Your Wallet</span>
          <span className="mt-1 block font-mono text-3xl font-extrabold text-[#34D399] tabular-numbers">
            +{payoutAmount} {rewardToken}
          </span>
          <span className="mt-1 block text-xs text-[#848B9B] truncate">
            {gigTitle}
          </span>
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-[#A78BFA] font-medium border-t border-white/[0.06] pt-2">
            <span>Minted ERC-5192 Soulbound Badge #{sbtTokenId}</span>
          </div>
        </div>

        {/* 1-Click Viral Loop Button */}
        <div className="mt-5 space-y-2">
          <a
            href={twitterShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C5CFC] py-3 text-xs font-bold text-white shadow-lg shadow-[#7C5CFC]/25 transition-all hover:bg-[#9073FD] active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Proof of Win to X (Twitter)</span>
          </a>

          <a
            href={`https://testnet.monadscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-xs text-[#848B9B] hover:text-[#7C5CFC] pt-1"
          >
            <span>View Verified Explorer Receipt</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
