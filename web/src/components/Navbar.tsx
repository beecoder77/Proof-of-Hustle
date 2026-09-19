"use client";

import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Plus, Zap, Shield, Flame, Wallet, LogOut } from "lucide-react";

interface NavbarProps {
  onOpenCreateModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ onOpenCreateModal, activeTab, setActiveTab }: NavbarProps) {
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C5CFC] to-[#9073FD] shadow-lg shadow-[#7C5CFC]/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
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
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab("explore")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "explore"
                  ? "bg-white/[0.08] text-[#F9FAFB]"
                  : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
              }`}
            >
              Explore Gigs
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "community"
                  ? "bg-white/[0.08] text-[#F9FAFB]"
                  : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
              }`}
            >
              Community Bounties
            </button>
            <button
              onClick={() => setActiveTab("burn")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "burn"
                  ? "bg-white/[0.08] text-[#F9FAFB]"
                  : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
              }`}
            >
              Burn Flywheel
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "profile"
                  ? "bg-white/[0.08] text-[#F9FAFB]"
                  : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
              }`}
            >
              Hustler Profile
            </button>
          </nav>
        </div>

        {/* Action Controls & Wallet */}
        <div className="flex items-center gap-3">
          {/* Post a Gig CTA */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-[#7C5CFC] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#9073FD] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#7C5CFC]"
          >
            <Plus className="h-4 w-4" />
            <span>Post a Gig</span>
          </button>

          {/* Privy Passkey / Wallet Connect */}
          {ready && authenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#151821] px-3 py-1.5 text-xs font-medium text-[#F9FAFB]">
                <div className="h-2 w-2 rounded-full bg-[#10B981]" />
                <span className="tabular-numbers">{formattedAddress}</span>
              </div>
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
              className="flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#151821] px-3.5 py-2 text-xs font-medium text-[#F9FAFB] transition-all hover:border-white/[0.22] hover:bg-[#222634] active:scale-[0.98]"
            >
              <Wallet className="h-3.5 w-3.5 text-[#7C5CFC]" />
              <span>Connect</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
