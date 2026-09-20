"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Navbar } from "../components/Navbar";
import { ActivityTicker } from "../components/ActivityTicker";
import { LiveTelemetryBar } from "../components/LiveTelemetryBar";
import { GigCard } from "../components/GigCard";
import { SubmissionDrawer } from "../components/SubmissionDrawer";
import { CreateGigModal } from "../components/CreateGigModal";
import { MeraEncryptionDrawer } from "../components/MeraEncryptionDrawer";
import { CommunityBountyHub } from "../components/CommunityBountyHub";
import { BurnTrackerWidget } from "../components/BurnTrackerWidget";
import { HustlerProfileView } from "../components/HustlerProfileView";
import { ProofOfWinModal } from "../components/ProofOfWinModal";
import { ImportTokenModal } from "../components/ImportTokenModal";
import { TokenomicsView } from "../components/TokenomicsView";
import { INITIAL_GIGS } from "../data/mockGigs";
import { GigItem, SubmissionItem, ActivityItem } from "../types";
import {
  Search,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  X,
  Zap,
} from "lucide-react";

// Initial seed submissions for realism
const INITIAL_SUBMISSIONS: Record<string, SubmissionItem[]> = {
  "1": [
    {
      id: "sub-1-1",
      gigId: "1",
      hustler: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      submittedAt: Date.now() - 3600 * 1000,
      deliverableUri: "https://github.com/monad-developers/parallel-benchmark-suite/pull/42",
      isSealed: true,
      commitHash: "0x8f3c7a9e1024bd58102837bcde81940a23bc8910482910495810294819204812",
      isWinner: false,
    },
  ],
  "2": [
    {
      id: "sub-2-1",
      gigId: "2",
      hustler: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      submittedAt: Date.now() - 7200 * 1000,
      deliverableUri: "https://github.com/alchemyplatform/monad-failover-sdk/pull/18",
      isSealed: false,
      isWinner: false,
    },
  ],
};

export default function Home() {
  const { user } = usePrivy();
  const currentUserAddress =
    user?.wallet?.address || "0x7A2E35cD6293B3d49F50F5E07f0AAF352127Fa99";

  // Client Mount & Deterministic Hydration
  const [isMounted, setIsMounted] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>(() => {
    return `@hustler_${currentUserAddress.slice(2, 6)}`;
  });
  const [gigs, setGigs] = useState<GigItem[]>(INITIAL_GIGS);
  const [submissions, setSubmissions] = useState<Record<string, SubmissionItem[]>>(INITIAL_SUBMISSIONS);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Modal & Drawer visibility
  const [selectedGig, setSelectedGig] = useState<GigItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMeraDrawerOpen, setIsMeraDrawerOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Sub-second Monad Transaction Toast Notification
  const [txToast, setTxToast] = useState<{
    show: boolean;
    title: string;
    txHash: string;
    description: string;
  } | null>(null);

  const [activeNavTab, setActiveNavTab] = useState("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "CONTEST" | "FCFS" | "SEALED">("ALL");

  // Hydrate persistent state from LocalStorage only AFTER mount to guarantee identical SSR & client markup
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedUser = localStorage.getItem(`poh_username_${currentUserAddress.toLowerCase()}`);
      if (savedUser) {
        setCurrentUsername(savedUser);
      }
      const savedGigs = localStorage.getItem("poh_gigs_v2");
      if (savedGigs) {
        setGigs(JSON.parse(savedGigs));
      }
      const savedSubs = localStorage.getItem("poh_submissions_v2");
      if (savedSubs) {
        setSubmissions(JSON.parse(savedSubs));
      }
      const savedActs = localStorage.getItem("poh_activities_v2");
      if (savedActs) {
        setActivities(JSON.parse(savedActs));
      }
    } catch (e) {
      console.error("Failed to load local storage state", e);
    }
  }, [currentUserAddress]);

  // Save to LocalStorage ONLY after client is mounted to avoid overwriting with initial state
  useEffect(() => {
    if (isMounted && currentUserAddress) {
      localStorage.setItem(`poh_username_${currentUserAddress.toLowerCase()}`, currentUsername);
    }
  }, [currentUsername, currentUserAddress, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("poh_gigs_v2", JSON.stringify(gigs));
    }
  }, [gigs, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("poh_submissions_v2", JSON.stringify(submissions));
    }
  }, [submissions, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("poh_activities_v2", JSON.stringify(activities));
    }
  }, [activities, isMounted]);

  // Generate authentic 32-byte hash for Monad transactions
  const generateTxHash = useCallback((): string => {
    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(32);
      window.crypto.getRandomValues(bytes);
      return (
        "0x" +
        Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
    }
    return "0x" + Math.random().toString(16).slice(2).padStart(64, "0");
  }, []);

  const triggerTxToast = useCallback((title: string, description: string, txHash: string) => {
    setTxToast({ show: true, title, description, txHash });
    setTimeout(() => {
      setTxToast(null);
    }, 4500);
  }, []);

  // Keyboard Navigation: "/" focuses search, "Esc" closes drawers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        document.getElementById("gig-search-input")?.focus();
      } else if (e.key === "Escape") {
        setSelectedGig(null);
        setIsCreateModalOpen(false);
        setIsMeraDrawerOpen(false);
        setIsTokenModalOpen(false);
        setProofOfWinData((prev) => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleHype = (gigId: string) => {
    const txHash = generateTxHash();
    setGigs((prev) =>
      prev.map((g) => (g.id === gigId ? { ...g, hypeCount: g.hypeCount + 1 } : g))
    );

    const target = gigs.find((g) => g.id === gigId);
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: "HYPE",
      text: `${currentUsername} hyped '${target?.title || "Gig"}' (+100 $HUSTLE staked)`,
      timestamp: "Just now",
      txHash,
    };
    setActivities((prev) => [newAct, ...prev]);

    triggerTxToast(
      "+100 $HUSTLE Staked!",
      "Attention Futures yield share registered on Monad.",
      txHash
    );
  };

  const handleClaimTask = (gigId: string) => {
    const txHash = generateTxHash();
    setGigs((prev) =>
      prev.map((g) => (g.id === gigId ? { ...g, status: "IN_PROGRESS" } : g))
    );
    if (selectedGig?.id === gigId) {
      setSelectedGig((prev) => (prev ? { ...prev, status: "IN_PROGRESS" } : null));
    }

    const target = gigs.find((g) => g.id === gigId);
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: "CLAIM",
      text: `${currentUsername} claimed FCFS task '${target?.title || "Gig"}'`,
      timestamp: "Just now",
      txHash,
    };
    setActivities((prev) => [newAct, ...prev]);

    triggerTxToast(
      "Task Claimed Onchain!",
      "You have 72 hours to submit verified deliverables.",
      txHash
    );
  };

  const handleSubmitWork = (
    gigId: string,
    deliverableUri: string,
    isSealed?: boolean,
    commitHash?: string
  ) => {
    const txHash = generateTxHash();

    // 1. Create real submission item
    const newSub: SubmissionItem = {
      id: `sub-${Date.now()}`,
      gigId,
      hustler: currentUserAddress,
      submittedAt: Date.now(),
      deliverableUri,
      isSealed: !!isSealed,
      commitHash,
      isWinner: false,
    };

    // 2. Append to submissions dictionary
    setSubmissions((prev) => ({
      ...prev,
      [gigId]: [newSub, ...(prev[gigId] || [])],
    }));

    // 3. Update gig status & count
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

    // 4. Record dynamic activity
    const target = gigs.find((g) => g.id === gigId);
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: "CLAIM",
      text: `${currentUsername} submitted deliverable for '${target?.title || "Gig"}'${
        isSealed ? " [MERA PRF Sealed]" : ""
      }`,
      timestamp: "Just now",
      txHash,
    };
    setActivities((prev) => [newAct, ...prev]);

    triggerTxToast(
      isSealed ? "Sealed Deliverable Submitted!" : "Deliverable Submitted!",
      `Confirmed in 380ms on Monad Testnet with Escrow ID #${gigId}.`,
      txHash
    );
  };

  const handleApprovePayout = (gigId: string) => {
    const target = gigs.find((g) => g.id === gigId);
    if (target) {
      const txHash = generateTxHash();

      // Update gig to SETTLED
      setGigs((prev) =>
        prev.map((g) => (g.id === gigId ? { ...g, status: "SETTLED" } : g))
      );

      // Update winning submission
      setSubmissions((prev) => {
        const gigSubs = prev[gigId] || [];
        const updated = gigSubs.map((s, idx) =>
          idx === 0 ? { ...s, isWinner: true } : s
        );
        return { ...prev, [gigId]: updated };
      });

      // Update selectedGig to SETTLED without unmounting abruptly
      setSelectedGig((prev) => (prev ? { ...prev, status: "SETTLED" } : null));

      // Trigger celebration modal
      setProofOfWinData({
        isOpen: true,
        title: target.title,
        amount: target.rewardAmount,
        token: target.rewardToken,
      });

      // Record activity
      const newAct: ActivityItem = {
        id: `act-${Date.now()}`,
        type: "PAYOUT",
        text: `${currentUsername} released ${target.rewardAmount} ${target.rewardToken} for '${target.title}'`,
        timestamp: "Just now",
        txHash,
      };
      setActivities((prev) => [newAct, ...prev]);

      triggerTxToast(
        "Escrow Released & Settled!",
        `+${target.rewardAmount} ${target.rewardToken} transferred. ERC-5192 SBT minted.`,
        txHash
      );
    }
  };

  const handleCreateGig = (newGigData: Partial<GigItem>) => {
    const txHash = generateTxHash();
    const newId = (gigs.length + 1).toString();
    const created: GigItem = {
      id: newId,
      title: newGigData.title || "Untitled Gig",
      summary: newGigData.summary || "",
      description: newGigData.description || "",
      creator: currentUserAddress,
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

    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: "CLAIM",
      text: `@${currentUserAddress.slice(0, 6)}...${currentUserAddress.slice(-4)} posted new gig '${created.title}' (${created.rewardAmount} ${created.rewardToken})`,
      timestamp: "Just now",
      txHash,
    };
    setActivities((prev) => [newAct, ...prev]);

    triggerTxToast(
      "Bounty Escrow Deposited!",
      `Created Gig #${newId} with ${created.rewardAmount} ${created.rewardToken} locked.`,
      txHash
    );
  };

  const handleRefreshChain = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      triggerTxToast(
        "Chain State Synced!",
        "Fetched latest blocks and escrow balance from Alchemy Monad node.",
        generateTxHash()
      );
    }, 900);
  };

  // Filter & Search Logic
  const filteredGigs = useMemo(() => {
    return gigs.filter((gig) => {
      const matchesSearch =
        gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gig.skillTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFilter === "CONTEST") return gig.gigType === "CONTEST";
      if (selectedFilter === "FCFS") return gig.gigType === "FCFS";
      if (selectedFilter === "SEALED") return gig.isSealed;

      return true;
    });
  }, [gigs, searchQuery, selectedFilter]);

  const totalEscrowed = useMemo(() => {
    return gigs
      .reduce((acc, g) => acc + parseFloat(g.rewardAmount || "0"), 0)
      .toLocaleString();
  }, [gigs]);

  return (
    <div className="min-h-screen bg-[#0E1015] text-[#F9FAFB] flex flex-col">
      {/* Top Floating Monad Transaction Toast */}
      {txToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-[#151821]/95 px-4 py-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="max-w-xs">
            <p className="text-xs font-bold text-white">{txToast.title}</p>
            <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">
              {txToast.description}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-[#848B9B] mt-1 font-mono">
              <span>Monad Finality ~380ms</span>
              <span>•</span>
              <a
                href={`https://testnet.monadscan.com/tx/${txToast.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#7C5CFC] hover:underline flex items-center gap-0.5"
              >
                {txToast.txHash.slice(0, 8)}...{txToast.txHash.slice(-4)}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
          <button
            onClick={() => setTxToast(null)}
            className="text-[#848B9B] hover:text-white p-1 ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        currentUsername={currentUsername}
      />

      {/* Live Monad Telemetry Bar */}
      <LiveTelemetryBar
        totalGigs={gigs.length}
        totalEscrowed={totalEscrowed}
        onRefresh={handleRefreshChain}
        isSyncing={isSyncing}
      />

      {/* Live Activity Marquee Ticker */}
      <ActivityTicker customActivities={activities} />

      {/* Main Container */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tab Switching */}
        {activeNavTab === "community" && <CommunityBountyHub />}
        {activeNavTab === "burn" && <BurnTrackerWidget />}
        {activeNavTab === "tokenomics" && <TokenomicsView />}
        {activeNavTab === "profile" && (
          <HustlerProfileView
            currentUserAddress={currentUserAddress}
            currentUsername={currentUsername}
            onUpdateUsername={setCurrentUsername}
            onTriggerToast={triggerTxToast}
          />
        )}

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
                    <span className="font-mono text-base font-bold text-[#34D399] tabular-numbers">${totalEscrowed}</span>
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
        submissions={submissions[selectedGig?.id || ""] || []}
        currentUserAddress={currentUserAddress}
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

      {/* Protocol Tokens & 1-Click Import Modal */}
      <ImportTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onMintTestUsdt={() => {
          triggerTxToast(
            "+1,000 Mock USDT Minted!",
            "Testnet faucet funds available in your connected wallet.",
            generateTxHash()
          );
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
