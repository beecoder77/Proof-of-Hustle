"use client";

import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Plus, Zap, Shield, Flame, Wallet, LogOut, Coins, User } from "lucide-react";

interface NavbarProps {
  onOpenCreateModal: () => void;
  onOpenTokenModal?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUsername?: string;
}

export function Navbar({
  onOpenCreateModal,
  onOpenTokenModal,
  activeTab,
  setActiveTab,
  currentUsername,
}: NavbarProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const formattedAddress = user?.wallet?.address
    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
    : user?.email?.address || user?.twitter?.username || "Connect";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#0E1015]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Network Indicator */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("explore")}
            className="flex items-center gap-3 text-left transition-opacity hover:opacity-90"
          >
            <img
              src="/logo.svg"
              alt="ProofOfHustle"
              className="h-9 w-9 rounded-xl shadow-lg shadow-[#7C5CFC]/25"
            />
            <div>
              <span className="text-base font-bold tracking-tight text-[#F9FAFB]">
                ProofOfHustle
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-[#848B9B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>Monad 400ms • Alchemy RPC</span>
              </div>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab("explore")}
              className={`rounded-md px-2.5 py-1.5 transition-colors ${
                activeTab === "explore"
                  ? "bg-white/[0.08] text-[#F9FAFB]"
                  : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
              }`}
            >
              Explore Gigs
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`rounded-md px-2.5 py-1.5 transition-colors ${
                activeTab === "community"
                  ? "bg-white/[0.08] text-[#F9FAFB]"
                  : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
              }`}
            >
              Bounties & Yield
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`rounded-md px-2.5 py-1.5 transition-colors ${
                activeTab === "leaderboard"
                  ? "bg-white/[0.08] text-[#F9FAFB]"
                  : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
              }`}
            >
              Hall of Fame
            </button>
            <button
              onClick={() => setActiveTab("tribunal")}
              className={`rounded-md px-2.5 py-1.5 transition-colors ${
                activeTab === "tribunal"
                  ? "bg-white/[0.08] text-[#F9FAFB]"
                  : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
              }`}
            >
              Tribunal
            </button>
            <button
              onClick={() => setActiveTab("burn")}
              className={`rounded-md px-2.5 py-1.5 transition-colors ${
                activeTab === "burn"
                  ? "bg-white/[0.08] text-[#F9FAFB]"
                  : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
              }`}
            >
              Burn Flywheel
            </button>

            {/* ONLY DISPLAY MY PROFILE WHEN USER IS AUTHENTICATED */}
            {ready && authenticated && user?.wallet?.address && (
              <button
                onClick={() => setActiveTab("profile")}
                className={`rounded-md px-2.5 py-1.5 transition-colors flex items-center gap-1.5 ${
                  activeTab === "profile"
                    ? "bg-[#7C5CFC]/20 text-[#A78BFA] border border-[#7C5CFC]/40 font-semibold"
                    : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
                }`}
              >
                <User className="h-3.5 w-3.5 text-[#7C5CFC]" />
                <span>My Profile</span>
              </button>
            )}
          </nav>
        </div>

        {/* Action Controls & Wallet */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Builder Starter Faucet */}
          <button
            onClick={onOpenTokenModal}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20 active:scale-[0.98]"
            title="Claim Mock USDT, $HUSTLE & Gas Faucet"
          >
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Starter Faucet</span>
            <span className="sm:hidden">Faucet</span>
          </button>

          {/* Post a Gig CTA */}
          <button
            onClick={ready && authenticated ? onOpenCreateModal : login}
            className="flex items-center gap-1.5 rounded-lg bg-[#7C5CFC] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#9073FD] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#7C5CFC]"
          >
            <Plus className="h-4 w-4" />
            <span>Post a Gig</span>
          </button>

          {/* Privy Passkey / Wallet Connect */}
          {ready && authenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "profile"
                    ? "border-[#7C5CFC] bg-[#7C5CFC]/20 text-white shadow-sm shadow-[#7C5CFC]/30"
                    : "border-white/[0.08] bg-[#151821] text-[#F9FAFB] hover:border-[#7C5CFC]/50 hover:bg-[#1B1E2B]"
                }`}
                title="View your personal Hustler Profile"
              >
                <div className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="tabular-numbers font-semibold text-white">
                  {currentUsername || formattedAddress}
                </span>
                <span className="rounded bg-[#7C5CFC]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#A78BFA] uppercase tracking-wider">
                  Profile
                </span>
              </button>
              <button
                onClick={logout}
                title="Disconnect Wallet"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#151821] text-[#9CA3AF] transition-colors hover:bg-white/[0.08] hover:text-[#F9FAFB]"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-2 rounded-lg bg-[#7C5CFC] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#9073FD] active:scale-[0.98] shadow-md shadow-[#7C5CFC]/25"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
