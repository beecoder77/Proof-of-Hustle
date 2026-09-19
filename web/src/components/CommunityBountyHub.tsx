"use client";

import React, { useState } from "react";
import { Users, Coins, PlusCircle, ArrowUpRight, ShieldCheck, Flame } from "lucide-react";

interface CommunityBounty {
  id: string;
  title: string;
  description: string;
  targetGoal: number;
  currentRaised: number;
  currency: string;
  backersCount: number;
  daysRemaining: number;
  tags: string[];
}

const DEMO_BOUNTIES: CommunityBounty[] = [
  {
    id: "c1",
    title: "Monad 3D Animated Video Meme & Sticker Collection",
    description: "Community-pooled bounty to commission a world-class 3D animator to build official Monad Discord & Telegram sticker pack.",
    targetGoal: 2500,
    currentRaised: 1850,
    currency: "USDT",
    backersCount: 28,
    daysRemaining: 4,
    tags: ["Community", "Animation", "Memes"],
  },
  {
    id: "c2",
    title: "Cairo to Monad Solidity Transpiler Cheatsheet",
    description: "Sponsor a research engineer to document exact opcode equivalence and memory patterns when porting Starknet apps to Monad EVM.",
    targetGoal: 1500,
    currentRaised: 1500,
    currency: "USDT",
    backersCount: 14,
    daysRemaining: 1,
    tags: ["Research", "EVM", "DevTools"],
  },
  {
    id: "c3",
    title: "Monad Hacker House London Rapid Sprint Fund",
    description: "Community grant pool providing 500 USDT micro-bounties for builders shipping sub-second dapps at the London Hacker Lounge.",
    targetGoal: 5000,
    currentRaised: 3200,
    currency: "MON",
    backersCount: 45,
    daysRemaining: 12,
    tags: ["HackerHouse", "Grants", "IRL"],
  },
];

export function CommunityBountyHub() {
  const [bounties, setBounties] = useState(DEMO_BOUNTIES);
  const [pledgeAmount, setPledgeAmount] = useState("50");
  const [activeBountyId, setActiveBountyId] = useState<string | null>(null);

  const handlePledge = (id: string) => {
    const amount = parseFloat(pledgeAmount) || 0;
    setBounties((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              currentRaised: b.currentRaised + amount,
              backersCount: b.backersCount + 1,
            }
          : b
      )
    );
    setActiveBountyId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#1B1E2B] via-[#151821] to-[#1B1E2B] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-[#7C5CFC]/15 px-2.5 py-1 text-xs font-semibold text-[#A78BFA]">
              <Users className="h-3.5 w-3.5" />
              <span>DAO & Community Co-Funding</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-[#F9FAFB]">
              Community Bounty Hub
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
              Anyone can propose an ecosystem bounty. Multiple community members and sub-DAOs pool funds together in escrow. If the target is met, the bounty goes live automatically.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3 text-center">
              <span className="block text-[11px] text-[#848B9B]">Total Pooled</span>
              <span className="font-bold text-[#34D399] font-mono text-base">$6,550 USDT</span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3 text-center">
              <span className="block text-[11px] text-[#848B9B]">Active Backers</span>
              <span className="font-bold text-[#FBBF24] font-mono text-base">87 Contributors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bounty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {bounties.map((bounty) => {
          const percent = Math.min(100, Math.round((bounty.currentRaised / bounty.targetGoal) * 100));
          const isFunded = percent >= 100;

          return (
            <div
              key={bounty.id}
              className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#151821] p-5 transition-all hover:border-white/[0.16]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-[#848B9B]">
                    DAO Pool #{bounty.id}
                  </span>
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
                      <strong className="text-white font-mono">${bounty.currentRaised}</strong> / ${bounty.targetGoal} {bounty.currency}
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
              </div>

              {/* Action Button */}
              <div className="mt-5 border-t border-white/[0.06] pt-3">
                {activeBountyId === bounty.id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="10"
                      value={pledgeAmount}
                      onChange={(e) => setPledgeAmount(e.target.value)}
                      className="w-24 rounded-lg border border-white/[0.12] bg-[#1B1E2B] px-2 py-1.5 text-xs text-white font-mono"
                    />
                    <button
                      onClick={() => handlePledge(bounty.id)}
                      className="flex-1 rounded-lg bg-[#10B981] py-1.5 text-xs font-bold text-white transition-all hover:bg-[#059669]"
                    >
                      Confirm Pledge
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveBountyId(bounty.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] py-2 text-xs font-semibold text-[#F9FAFB] transition-all hover:border-white/[0.22] hover:bg-white/[0.08]"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-[#7C5CFC]" />
                    <span>Co-Fund This Bounty</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
