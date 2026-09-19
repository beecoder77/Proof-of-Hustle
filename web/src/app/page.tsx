"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { ActivityTicker } from "../components/ActivityTicker";
import { GigCard } from "../components/GigCard";
import { SubmissionDrawer } from "../components/SubmissionDrawer";
import { CreateGigModal } from "../components/CreateGigModal";
import { MeraEncryptionDrawer } from "../components/MeraEncryptionDrawer";
import { CommunityBountyHub } from "../components/CommunityBountyHub";
import { BurnTrackerWidget } from "../components/BurnTrackerWidget";
import { HustlerProfileView } from "../components/HustlerProfileView";
import { ProofOfWinModal } from "../components/ProofOfWinModal";
import { INITIAL_GIGS } from "../data/mockGigs";
import { GigItem } from "../types";
import { Search, Filter, Flame, Zap, Shield, Sparkles, Plus, Award } from "lucide-react";

export default function Home() {
  const [gigs, setGigs] = useState<GigItem[]>(INITIAL_GIGS);
  const [selectedGig, setSelectedGig] = useState<GigItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMeraDrawerOpen, setIsMeraDrawerOpen] = useState(false);
  const [sealedSubmissionData, setSealedSubmissionData] = useState<{
    commitHash: string;
    encryptedUri: string;
  } | null>(null);
  const [proofOfWinData, setProofOfWinData] = useState<{
    isOpen: boolean;
    title: string;
    amount: string;
    token: string;
  }>({
    isOpen: false,
    title: "",
    amount: "",
    token: "",
  });

  const [activeNavTab, setActiveNavTab] = useState("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "CONTEST" | "FCFS" | "SEALED">("ALL");

  // Keyboard Navigation: "/" focuses search, "Esc" closes drawers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        document.getElementById("gig-search-input")?.focus();
      } else if (e.key === "Escape") {
        setSelectedGig(null);
        setIsCreateModalOpen(false);
        setIsMeraDrawerOpen(false);
        setProofOfWinData((prev) => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleHype = (gigId: string) => {
    setGigs((prev) =>
      prev.map((g) => (g.id === gigId ? { ...g, hypeCount: g.hypeCount + 1 } : g))
    );
  };

  const handleClaimTask = (gigId: string) => {
    setGigs((prev) =>
      prev.map((g) => (g.id === gigId ? { ...g, status: "IN_PROGRESS" } : g))
    );
    if (selectedGig?.id === gigId) {
      setSelectedGig((prev) => (prev ? { ...prev, status: "IN_PROGRESS" } : null));
    }
  };

  const handleSubmitWork = (
    gigId: string,
    deliverableUri: string,
    isSealed?: boolean,
    commitHash?: string
  ) => {
    setGigs((prev) =>
      prev.map((g) =>
        g.id === gigId
          ? {
              ...g,
              status: "IN_REVIEW",
              submissionsCount: g.submissionsCount + 1,
            }
          : g
      )
    );
    if (selectedGig?.id === gigId) {
      setSelectedGig((prev) =>
        prev
          ? {
              ...prev,
              status: "IN_REVIEW",
              submissionsCount: prev.submissionsCount + 1,
            }
          : null
      );
    }
  };

  const handleApprovePayout = (gigId: string) => {
    const target = gigs.find((g) => g.id === gigId);
    if (target) {
      setGigs((prev) =>
        prev.map((g) => (g.id === gigId ? { ...g, status: "SETTLED" } : g))
      );
      setSelectedGig(null);

      // Trigger viral celebration modal!
      setProofOfWinData({
        isOpen: true,
        title: target.title,
        amount: target.rewardAmount,
        token: target.rewardToken,
      });
    }
  };

  const handleCreateGig = (newGigData: Partial<GigItem>) => {
    const newId = (gigs.length + 1).toString();
    const created: GigItem = {
      id: newId,
      title: newGigData.title || "Untitled Gig",
      summary: newGigData.summary || "",
      description: newGigData.description || "",
      creator: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      rewardAmount: newGigData.rewardAmount || "500",
      rewardToken: newGigData.rewardToken || "USDT",
      gigType: newGigData.gigType || "CONTEST",
      status: "OPEN",
      isSealed: !!newGigData.isSealed,
      deadlineTimestamp: Math.floor(Date.now() / 1000) + 3 * 86400,
      hypeCount: 1,
      submissionsCount: 0,
      skillTags: newGigData.skillTags || ["Monad"],
      deliverables: newGigData.deliverables || ["Final Deliverables"],
      createdAt: Math.floor(Date.now() / 1000),
    };

    setGigs((prev) => [created, ...prev]);
  };

  // Filter & Search Logic
  const filteredGigs = gigs.filter((gig) => {
    const matchesSearch =
      gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.skillTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === "CONTEST") return gig.gigType === "CONTEST";
    if (selectedFilter === "FCFS") return gig.gigType === "FCFS";
    if (selectedFilter === "SEALED") return gig.isSealed;

    return true;
  });

  return (
    <div className="min-h-screen bg-[#0E1015] text-[#F9FAFB] flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
      />

      {/* Live Activity Marquee Ticker */}
      <ActivityTicker />

      {/* Main Container */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tab Switching */}
        {activeNavTab === "community" && <CommunityBountyHub />}
        {activeNavTab === "burn" && <BurnTrackerWidget />}
        {activeNavTab === "profile" && <HustlerProfileView />}

        {activeNavTab === "explore" && (
          <div className="space-y-8">
            {/* Hero Stats Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#151821] via-[#1B1E2B] to-[#151821] p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-[#7C5CFC]/15 px-2.5 py-1 text-xs font-semibold text-[#A78BFA]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Monad Track 03: Social, Attention & Culture</span>
                  </div>
                  <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Where Freelance Hustles Become Verifiable Onchain Equity
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
                    Zero predatory 20% fees. Sub-second escrow payouts via Monad. Stake attention on promising gigs to earn curation yield, and build portable Soulbound reputation.
                  </p>
                </div>

                {/* Quick KPI Pills */}
                <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
                  <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3.5 text-center">
                    <span className="block text-[10px] uppercase font-semibold text-[#848B9B]">Escrow Settled</span>
                    <span className="font-mono text-base font-bold text-[#34D399] tabular-numbers">$48,200</span>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3.5 text-center">
                    <span className="block text-[10px] uppercase font-semibold text-[#848B9B]">Block Finality</span>
                    <span className="font-mono text-base font-bold text-[#7C5CFC] tabular-numbers">400ms</span>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-[#0E1015]/80 p-3.5 text-center">
                    <span className="block text-[10px] uppercase font-semibold text-[#848B9B]">$HUSTLE Burned</span>
                    <span className="font-mono text-base font-bold text-[#F87171] tabular-numbers">28.4K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 self-start rounded-xl border border-white/[0.07] bg-[#151821] p-1 text-xs">
                {(["ALL", "CONTEST", "FCFS", "SEALED"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                      selectedFilter === filter
                        ? "bg-[#7C5CFC] text-white shadow-sm"
                        : "text-[#848B9B] hover:text-[#F9FAFB]"
                    }`}
                  >
                    {filter === "ALL" && "All Hustles"}
                    {filter === "CONTEST" && "Contests"}
                    {filter === "FCFS" && "FCFS Tasks"}
                    {filter === "SEALED" && "Mera Sealed"}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#848B9B]" />
                <input
                  id="gig-search-input"
                  type="text"
                  placeholder="Search skills, bounties, tags... (Press /)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#151821] pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:border-[#7C5CFC] focus:outline-none"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-[#848B9B]">
                  /
                </kbd>
              </div>
            </div>

            {/* Gigs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGigs.map((gig) => (
                <GigCard
                  key={gig.id}
                  gig={gig}
                  onSelect={(g) => setSelectedGig(g)}
                  onHype={handleHype}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Slide-in Submission Drawer */}
      <SubmissionDrawer
        gig={selectedGig}
        onClose={() => setSelectedGig(null)}
        onClaim={handleClaimTask}
        onSubmitWork={handleSubmitWork}
        onApprovePayout={handleApprovePayout}
        onOpenMeraDrawer={() => setIsMeraDrawerOpen(true)}
        sealedData={sealedSubmissionData}
        onClearSealedData={() => setSealedSubmissionData(null)}
      />

      {/* 3-Step Create Gig Modal */}
      <CreateGigModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGig={handleCreateGig}
      />

      {/* MERA Passkey PRF Encryption Drawer */}
      <MeraEncryptionDrawer
        isOpen={isMeraDrawerOpen}
        onClose={() => setIsMeraDrawerOpen(false)}
        gigId={selectedGig?.id || "1"}
        onEncryptedResult={(hash, payload) => {
          setSealedSubmissionData({ commitHash: hash, encryptedUri: payload });
        }}
      />

      {/* Proof of Win Viral Loop Celebration Modal */}
      <ProofOfWinModal
        isOpen={proofOfWinData.isOpen}
        onClose={() => setProofOfWinData((p) => ({ ...p, isOpen: false }))}
        gigTitle={proofOfWinData.title}
        payoutAmount={proofOfWinData.amount}
        rewardToken={proofOfWinData.token}
      />

      {/* Minimalist Studio Footer */}
      <footer className="mt-auto border-t border-white/[0.06] bg-[#0E1015] py-6 text-center text-xs text-[#848B9B]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">ProofOfHustle</span>
            <span>• Built natively on Monad</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Monad Testnet (Chain ID 10143)</span>
            <a
              href="https://testnet.monadscan.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#7C5CFC] underline decoration-white/20"
            >
              MonadVision Explorer
            </a>
            <span>Alchemy High-Speed Transport</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
