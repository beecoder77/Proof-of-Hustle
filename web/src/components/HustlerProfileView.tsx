"use client";

import React from "react";
import { Award, ShieldCheck, Star, ExternalLink, CheckCircle2, Flame, Briefcase } from "lucide-react";

export function HustlerProfileView() {
  const profile = {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    tierName: "Master Craftsman",
    tierLevel: 3,
    totalEarned: "14,850",
    completedGigs: 18,
    averageRating: "4.95",
    earlyScoutRank: "Founding Scout #4",
    badges: [
      { id: "1", title: "Monad Multi-RPC Dashboard", amount: "1,250 USDT", rating: 5, date: "Sep 2026" },
      { id: "2", title: "OpenZeppelin Governor Port", amount: "1,500 USDT", rating: 5, date: "Sep 2026" },
      { id: "3", title: "Metropolis Community Edit", amount: "600 USDT", rating: 5, date: "Sep 2026" },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Profile Header & Dynamic Avatar */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151821] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Dynamic Evolvable SVG Avatar Frame */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-[#10B981] bg-gradient-to-tr from-[#1B1E2B] via-[#7C5CFC]/20 to-[#10B981]/20 shadow-xl shadow-[#10B981]/20">
              <Award className="h-10 w-10 text-[#34D399]" />
              <div className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#10B981] text-[10px] font-bold text-black">
                L3
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#F9FAFB]">
                  hustler.monad
                </h2>
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-[#34D399]">
                  Verified Hustler
                </span>
              </div>
              <p className="font-mono text-xs text-[#848B9B] mt-0.5">{profile.address}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-[#9CA3AF]">
                <span className="flex items-center gap-1 text-[#FBBF24] font-semibold">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  {profile.tierName}
                </span>
                <span>•</span>
                <span className="text-[#A78BFA]">{profile.earlyScoutRank}</span>
              </div>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/70 p-3 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#848B9B]">Total Earned</span>
              <span className="font-mono text-base font-bold text-[#34D399] tabular-numbers">${profile.totalEarned}</span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/70 p-3 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#848B9B]">Sprints Done</span>
              <span className="font-mono text-base font-bold text-white tabular-numbers">{profile.completedGigs}</span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/70 p-3 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#848B9B]">Client Rating</span>
              <span className="font-mono text-base font-bold text-[#FBBF24] tabular-numbers">{profile.averageRating} ★</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified ERC-5192 Soulbound Credentials Feed */}
      <div className="rounded-xl border border-white/[0.08] bg-[#151821] p-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#F9FAFB]">
              Verified Onchain Credentials (ERC-5192 SBT)
            </h3>
            <p className="text-xs text-[#848B9B]">
              Non-transferable proof of work minted upon escrow release.
            </p>
          </div>
          <span className="text-xs font-mono text-[#848B9B]">3 Active Badges</span>
        </div>

        <div className="mt-4 space-y-3">
          {profile.badges.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#1B1E2B] p-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7C5CFC]/15 text-[#7C5CFC]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">{b.title}</h4>
                  <div className="flex items-center gap-2 text-[#848B9B] mt-0.5">
                    <span>SBT Credential #{b.id}</span>
                    <span>•</span>
                    <span>{b.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-mono font-bold text-[#34D399] block">{b.amount}</span>
                  <span className="text-[#FBBF24] text-[11px]">{b.rating} / 5 Stars</span>
                </div>
                <a
                  href="https://testnet.monadscan.com"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/[0.1] p-1.5 text-[#9CA3AF] hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
