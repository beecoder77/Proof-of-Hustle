"use client";

import React, { useState, useMemo } from "react";
import {
  Trophy,
  Award,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Star,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Filter,
  CheckCircle2,
  Users,
} from "lucide-react";
import { CONTRACTS } from "../config/contracts";

interface LeaderboardUser {
  rank: number;
  handle: string;
  address: string;
  avatar: string;
  totalEarningsUsdt: number;
  completedTasks: number;
  sbtCount: number;
  rating: number; // e.g. 5.0
  hustleMined: number;
  topSkills: string[];
  recentWorkTitle: string;
  recentTxHash: string;
}

const LEADERBOARD_DATA: LeaderboardUser[] = [
  {
    rank: 1,
    handle: "@nad_architect",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    totalEarningsUsdt: 6850,
    completedTasks: 8,
    sbtCount: 8,
    rating: 5.0,
    hustleMined: 102.75,
    topSkills: ["Parallel EVM", "Foundry", "Gas Tuning"],
    recentWorkTitle: "Parallel EVM Storage Slot Collision Benchmark",
    recentTxHash: "0x4e836fe210315fcd9d6019329d0fd5ddae918ba94df09259be669b40f0527619",
  },
  {
    rank: 2,
    handle: "@monad_vanguard",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    totalEarningsUsdt: 5200,
    completedTasks: 6,
    sbtCount: 6,
    rating: 4.9,
    hustleMined: 78.0,
    topSkills: ["TypeScript", "Viem", "Alchemy Transport"],
    recentWorkTitle: "Alchemy Multi-Transport Failover & Latency Monitor",
    recentTxHash: "0x3146545c95ab143ff07a0f0fa4293ecabd414b6e72d3a650e1b9f55c56095098",
  },
  {
    rank: 3,
    handle: "@keccak_cipher",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
    totalEarningsUsdt: 4100,
    completedTasks: 5,
    sbtCount: 5,
    rating: 5.0,
    hustleMined: 61.5,
    topSkills: ["WebCrypto", "Mera PRF", "Zero-Knowledge"],
    recentWorkTitle: "MERA PRF Sealed Escrow Client Implementation",
    recentTxHash: "0x26d5bbd83d5188ecbb9660be9a70b07db8008c34620a7c87f04930c22983322e",
  },
  {
    rank: 4,
    handle: "@solidity_samurai",
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    totalEarningsUsdt: 3400,
    completedTasks: 4,
    sbtCount: 4,
    rating: 4.8,
    hustleMined: 51.0,
    topSkills: ["Solidity", "Reentrancy Guard", "ERC-5192"],
    recentWorkTitle: "Soulbound Credential Gas Optimization for Monad",
    recentTxHash: "0x8d1590b5d5d8fbda3b2b8006bf36055d045864111ce3d35a507aebff89fb9166",
  },
  {
    rank: 5,
    handle: "@monad_memelord",
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
    totalEarningsUsdt: 2950,
    completedTasks: 7,
    sbtCount: 7,
    rating: 4.9,
    hustleMined: 44.25,
    topSkills: ["Motion Graphics", "3D Blender", "Culture"],
    recentWorkTitle: "Monad 3D Animated Video Meme & Sticker Pack",
    recentTxHash: "0x9fac6c20e63e1c289fb668bd56e46b07c58b293625ea86e79fd6fe463340de6c",
  },
];

interface HustlerLeaderboardViewProps {
  onSelectUser?: (address: string) => void;
  onOpenProfile?: () => void;
}

export function HustlerLeaderboardView({
  onSelectUser,
  onOpenProfile,
}: HustlerLeaderboardViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const filteredUsers = useMemo(() => {
    return LEADERBOARD_DATA.filter((user) => {
      const matchesSearch =
        user.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.topSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFilter === "EVM") {
        return user.topSkills.some((s) => s.includes("EVM") || s.includes("Solidity"));
      }
      if (selectedFilter === "FRONTEND") {
        return user.topSkills.some((s) => s.includes("TypeScript") || s.includes("Viem"));
      }
      if (selectedFilter === "SECURITY") {
        return user.topSkills.some((s) => s.includes("Crypto") || s.includes("Gas"));
      }
      return true;
    });
  }, [searchQuery, selectedFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#151821] via-[#1B1E2B] to-[#151821] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-[#7C5CFC]/15 px-2.5 py-1 text-xs font-semibold text-[#A78BFA]">
              <Trophy className="h-3.5 w-3.5" />
              <span>Verifiable Onchain Proof-of-Work</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Hustler Hall of Fame & Reputation
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
              Discover top engineers, researchers, and creators on Monad. Every completed gig mints an irreversible ERC-5192 Soulbound Token backed by real escrow settlements.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3.5 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#848B9B]">Total SBTs Minted</span>
              <span className="font-mono text-base font-bold text-[#7C5CFC] tabular-numbers">142</span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3.5 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#848B9B]">Settled Volume</span>
              <span className="font-mono text-base font-bold text-[#34D399] tabular-numbers">$22.5K</span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3.5 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#848B9B]">Avg Rating</span>
              <span className="font-mono text-base font-bold text-[#F59E0B] tabular-numbers">4.96 ★</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 self-start rounded-xl border border-white/[0.07] bg-[#151821] p-1 text-xs">
          {[
            { id: "ALL", label: "All Builders" },
            { id: "EVM", label: "Parallel EVM & Solidity" },
            { id: "FRONTEND", label: "Frontend & Tooling" },
            { id: "SECURITY", label: "Cryptography & Gas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                selectedFilter === tab.id
                  ? "bg-[#7C5CFC] text-white shadow-sm"
                  : "text-[#848B9B] hover:text-[#F9FAFB]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#848B9B]" />
          <input
            type="text"
            placeholder="Search handle, skill, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-[#151821] pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-[#7C5CFC] focus:outline-none"
          />
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.07] bg-[#1B1E2B]/50 uppercase tracking-wider text-[10px] font-semibold text-[#848B9B]">
              <tr>
                <th className="px-6 py-4">Rank & Hustler</th>
                <th className="px-6 py-4">Verified Proofs (SBTs)</th>
                <th className="px-6 py-4">Total Earned</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">$HUSTLE Mined</th>
                <th className="px-6 py-4 text-right">Onchain Credentials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredUsers.map((user) => {
                return (
                  <tr
                    key={user.address}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Rank & Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold shrink-0">
                          {user.rank === 1 && (
                            <span className="text-[#F59E0B] flex items-center justify-center h-full w-full rounded-lg bg-amber-500/10 border border-amber-500/20">
                              🥇
                            </span>
                          )}
                          {user.rank === 2 && (
                            <span className="text-gray-300 flex items-center justify-center h-full w-full rounded-lg bg-gray-500/10 border border-gray-500/20">
                              🥈
                            </span>
                          )}
                          {user.rank === 3 && (
                            <span className="text-amber-700 flex items-center justify-center h-full w-full rounded-lg bg-amber-800/10 border border-amber-800/20">
                              🥉
                            </span>
                          )}
                          {user.rank > 3 && (
                            <span className="text-[#848B9B]">#{user.rank}</span>
                          )}
                        </div>

                        <img
                          src={user.avatar}
                          alt={user.handle}
                          className="h-10 w-10 rounded-full border border-white/[0.1] object-cover shrink-0"
                        />

                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                            <span>{user.handle}</span>
                            <ShieldCheck className="h-3.5 w-3.5 text-[#7C5CFC]" />
                          </div>
                          <span className="font-mono text-[10px] text-[#848B9B]">
                            {user.address.slice(0, 6)}...{user.address.slice(-4)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* SBTs Completed */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-[#A78BFA]" />
                        <span className="font-mono font-bold text-white">
                          {user.sbtCount}
                        </span>
                        <span className="text-[10px] text-[#848B9B]">ERC-5192</span>
                      </div>
                    </td>

                    {/* Total Earned */}
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-emerald-400">
                        ${user.totalEarningsUsdt.toLocaleString()} USDT
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                        <span className="font-mono font-bold text-white">
                          {user.rating.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-[#848B9B]">({user.completedTasks})</span>
                      </div>
                    </td>

                    {/* Hustle Mined */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-[#F87171] font-mono font-bold">
                        <Flame className="h-3.5 w-3.5" />
                        <span>+{user.hustleMined.toFixed(1)}</span>
                      </div>
                    </td>

                    {/* Proof Details & Explorer Link */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`https://testnet.monadscan.com/tx/${user.recentTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#0E1015] px-2.5 py-1.5 font-mono text-[10px] text-[#A78BFA] hover:border-[#7C5CFC]/40 hover:text-white transition-colors"
                        >
                          <span>MonadScan</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Community Callout Footer */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFC]/15 text-[#A78BFA] border border-[#7C5CFC]/25 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Want to rank on the Hustler Hall of Fame?</h3>
            <p className="text-xs text-[#9CA3AF]">
              Register your onchain handle, deliver verified PRs on open gigs, and mint permanent soulbound credentials.
            </p>
          </div>
        </div>

        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 rounded-xl bg-[#7C5CFC] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#9073FD] transition-all shrink-0 active:scale-[0.98]"
          >
            <span>Set Up Your Onchain Profile</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
