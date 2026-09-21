"use client";

import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Plus,
  Zap,
  Shield,
  Flame,
  Wallet,
  LogOut,
  Coins,
  User,
  Trophy,
  Compass,
  Menu,
  X,
  Scale,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

interface NavbarProps {
  onOpenCreateModal: () => void;
  onOpenTokenModal?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUsername?: string;
  onOpenTribunal?: () => void;
}

export function Navbar({
  onOpenCreateModal,
  onOpenTokenModal,
  activeTab,
  setActiveTab,
  currentUsername,
  onOpenTribunal,
}: NavbarProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const walletAddress = user?.wallet?.address;
  const formattedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : user?.email?.address || user?.twitter?.username || "Connect";

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const navItems = [
    { id: "explore", label: "Explore Gigs", icon: Compass },
    { id: "community", label: "Bounties & Yield", icon: Zap },
    { id: "leaderboard", label: "Hall of Fame", icon: Trophy },
    { id: "tokenomics", label: "Tokenomics", icon: Coins },
    { id: "burn", label: "Burn Flywheel", icon: Flame },
  ];

  return (
    <>
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#0E1015]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
          {/* Brand & Network Indicator */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => {
                setActiveTab("explore");
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 sm:gap-3 text-left transition-opacity hover:opacity-90 shrink-0"
            >
              <img
                src="/logo.svg"
                alt="ProofOfHustle"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl shadow-lg shadow-[#7C5CFC]/25 shrink-0"
              />
              <div className="truncate">
                <span className="text-sm sm:text-base font-bold tracking-tight text-[#F9FAFB] block">
                  ProofOfHustle
                </span>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#848B9B]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
                  <span className="truncate">Monad 400ms • Alchemy RPC</span>
                </div>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                      isActive
                        ? "bg-white/[0.08] text-[#F9FAFB] font-semibold"
                        : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F9FAFB]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              {/* ONLY DISPLAY MY PROFILE WHEN USER IS AUTHENTICATED */}
              {ready && authenticated && walletAddress && (
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
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
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Builder Starter Faucet Button */}
            <button
              onClick={onOpenTokenModal}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20 active:scale-[0.98] shrink-0"
              title="Claim Mock USDT, $HUSTLE & Gas Faucet"
            >
              <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
              <span className="hidden sm:inline">Starter Faucet</span>
              <span className="sm:hidden text-[11px]">Faucet</span>
            </button>

            {/* Post a Gig CTA (Desktop + Tablet) */}
            <button
              onClick={ready && authenticated ? onOpenCreateModal : login}
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-[#7C5CFC] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#9073FD] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#7C5CFC] shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Post a Gig</span>
            </button>

            {/* Privy Passkey / Wallet Connect */}
            {ready && authenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-1.5 sm:gap-2 rounded-lg border px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all ${
                    activeTab === "profile"
                      ? "border-[#7C5CFC] bg-[#7C5CFC]/20 text-white shadow-sm shadow-[#7C5CFC]/30"
                      : "border-white/[0.08] bg-[#151821] text-[#F9FAFB] hover:border-[#7C5CFC]/50 hover:bg-[#1B1E2B]"
                  }`}
                  title="View your personal Hustler Profile"
                >
                  <div className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
                  <span className="tabular-numbers font-semibold text-white text-[11px] sm:text-xs">
                    {currentUsername || formattedAddress}
                  </span>
                  <span className="hidden sm:inline rounded bg-[#7C5CFC]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#A78BFA] uppercase tracking-wider">
                    Profile
                  </span>
                </button>

                <button
                  onClick={logout}
                  title="Disconnect Wallet"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#151821] text-[#9CA3AF] transition-colors hover:bg-white/[0.08] hover:text-[#F87171] shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#7C5CFC] px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white transition-all hover:bg-[#9073FD] active:scale-[0.98] shadow-md shadow-[#7C5CFC]/25 shrink-0"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Connect Wallet</span>
                <span className="xs:hidden">Connect</span>
              </button>
            )}

            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#151821] text-[#9CA3AF] hover:text-white transition-colors active:scale-95 shrink-0 ml-1"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Top Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-backdrop-fade"
          />

          {/* Drawer Panel */}
          <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-[340px] border-l border-white/[0.08] bg-[#151821] shadow-2xl p-5 flex flex-col justify-between animate-drawer-slide">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2">
                  <img src="/logo.svg" alt="ProofOfHustle" className="h-7 w-7 rounded-lg" />
                  <span className="font-bold text-white text-sm">Platform Menu</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-[#9CA3AF] hover:text-white hover:bg-white/[0.06]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Wallet Status Card in Drawer */}
              {ready && authenticated && walletAddress ? (
                <div className="rounded-xl border border-white/[0.08] bg-[#0E1015] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#848B9B]">Connected Account</span>
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400">
                      Monad Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-white truncate">
                      {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 text-[#848B9B] hover:text-white"
                      title="Copy Address"
                    >
                      {copiedAddress ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <a
                    href={`https://testnet.monadscan.com/address/${walletAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#7C5CFC] hover:underline flex items-center gap-1 font-mono pt-1 border-t border-white/[0.04]"
                  >
                    <span>View on MonadScan</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => {
                    login();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7C5CFC] py-3 text-xs font-bold text-white shadow-lg shadow-[#7C5CFC]/25 active:scale-[0.98]"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Connect Monad Wallet</span>
                </button>
              )}

              {/* Quick Actions in Mobile Drawer */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (ready && authenticated) {
                      onOpenCreateModal();
                    } else {
                      login();
                    }
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 px-3.5 py-2.5 text-xs font-bold text-[#A78BFA] hover:bg-[#7C5CFC] hover:text-white transition-all active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4 text-[#7C5CFC]" />
                  <span>Post a New Hustle / Gig</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenTokenModal?.();
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all active:scale-[0.98]"
                >
                  <Coins className="h-4 w-4 text-amber-400" />
                  <span>Starter Faucet (USDT & HUSTLE)</span>
                </button>

                {onOpenTribunal && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenTribunal();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#1B1E2B] px-3.5 py-2.5 text-xs font-semibold text-[#848B9B] hover:text-white transition-all active:scale-[0.98]"
                  >
                    <Scale className="h-4 w-4 text-[#848B9B]" />
                    <span>Dispute Tribunal Arbitration</span>
                  </button>
                )}
              </div>

              {/* Mobile Navigation List */}
              <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                <span className="block text-[10px] uppercase font-bold text-[#848B9B] px-2 mb-1">
                  Navigation
                </span>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/20 font-bold"
                          : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {ready && authenticated && walletAddress && (
                  <button
                    onClick={() => {
                      setActiveTab("profile");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      activeTab === "profile"
                        ? "bg-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/20 font-bold"
                        : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span>My Onchain Profile</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer / Disconnect */}
            {ready && authenticated && (
              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-all active:scale-[0.98]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ergonomic Mobile Bottom Navigation Bar (Fixed for Viewports < 1024px) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#0E1015]/95 backdrop-blur-xl px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.slice(0, ready && authenticated ? 4 : 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all active:scale-90 min-h-[46px] ${
                  isActive
                    ? "text-[#A78BFA] font-bold"
                    : "text-[#848B9B] hover:text-white"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? "bg-[#7C5CFC]/25 text-[#A78BFA]"
                      : "text-[#848B9B]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full">
                  {item.id === "explore"
                    ? "Explore"
                    : item.id === "community"
                    ? "Bounties"
                    : item.id === "leaderboard"
                    ? "Fame"
                    : item.id === "tokenomics"
                    ? "Tokens"
                    : "Burn"}
                </span>
              </button>
            );
          })}

          {/* If authenticated, 5th slot is Profile; otherwise 5th slot is Burn Flywheel */}
          {ready && authenticated && (
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all active:scale-90 min-h-[46px] ${
                activeTab === "profile"
                  ? "text-[#A78BFA] font-bold"
                  : "text-[#848B9B] hover:text-white"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                  activeTab === "profile"
                    ? "bg-[#7C5CFC]/25 text-[#A78BFA]"
                    : "text-[#848B9B]"
                }`}
              >
                <User className="h-4 w-4" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full">
                Profile
              </span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
