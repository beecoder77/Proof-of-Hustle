"use client";

import React, { useState, useEffect } from "react";
import { Zap, Flame, CheckCircle, ShieldCheck } from "lucide-react";

import { ActivityItem } from "../types";
import seededOnchainData from "../data/seededOnchainData.json";
import { fetchLiveActivities } from "../services/onchainFeed";

const DEFAULT_ACTIVITIES: {
  icon: typeof CheckCircle;
  color: string;
  text: string;
  time: string;
  tx: string;
}[] = [
  {
    icon: CheckCircle,
    color: "text-[#34D399]",
    text: `@nad_architect completed '${seededOnchainData.completedGigs[0]?.title}' — 2,500 USDT released via Escrow`,
    time: "Block #64156452",
    tx: seededOnchainData.completedGigs[0]?.payoutTx || "0xd79166346457375455b5248724aec65307d307e2e33778d69d8e726beb843f5e",
  },
  {
    icon: Flame,
    color: "text-[#FBBF24]",
    text: `@monad_vanguard hyped '${seededOnchainData.completedGigs[0]?.title}' (+50 $HUSTLE staked)`,
    time: "Block #64156450",
    tx: seededOnchainData.completedGigs[0]?.hypeTx || "0x4151539e8afa03ee467d6f1ab02300715a0db5da3a0b2b9aad542932c95d5749",
  },
  {
    icon: Flame,
    color: "text-[#F87171]",
    text: "769 $HUSTLE permanently burned on ProtocolBurnPool",
    time: "Block #64211923",
    tx: seededOnchainData.protocolBurns[0]?.burnTx || "0x271661972466136df0a72126123abbb1cd452a27df426cffbd4314d8a4ec691f",
  },
  {
    icon: ShieldCheck,
    color: "text-[#A78BFA]",
    text: "Verified ERC-5192 Proof-of-Work SBT #1 minted to @nad_architect",
    time: "Block #64156452",
    tx: seededOnchainData.completedGigs[0]?.payoutTx || "0xd79166346457375455b5248724aec65307d307e2e33778d69d8e726beb843f5e",
  },
  {
    icon: CheckCircle,
    color: "text-[#34D399]",
    text: `Community Tribunal resolved dispute on Gig #28 in favor of worker @solidity_samurai`,
    time: "Block #64156536",
    tx: seededOnchainData.disputes[0]?.resolutionTx || "0x1fae8417c21418ffab6314bbbae355eaf99be494958126db58e879bad627c493",
  },
];

interface ActivityTickerProps {
  customActivities?: ActivityItem[];
}

export function ActivityTicker({ customActivities }: ActivityTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liveActivities, setLiveActivities] = useState<ActivityItem[]>([]);
  const [isLiveSynced, setIsLiveSynced] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadActivities() {
      try {
        const acts = await fetchLiveActivities();
        if (active && acts.length > 0) {
          setLiveActivities(acts);
          setIsLiveSynced(true);
        }
      } catch (err) {
        console.warn("Could not load live activities:", err);
      }
    }
    loadActivities();
    const interval = setInterval(loadActivities, 12_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Convert custom or live activities to ticker items
  const items = React.useMemo(() => {
    const source = (customActivities && customActivities.length > 0)
      ? customActivities
      : liveActivities;

    if (!source || source.length === 0) {
      return DEFAULT_ACTIVITIES;
    }

    const mapped = source.map((act) => {
      let icon = Zap;
      let color = "text-[#7C5CFC]";
      if (act.type === "PAYOUT") {
        icon = CheckCircle;
        color = "text-[#34D399]";
      } else if (act.type === "HYPE") {
        icon = Flame;
        color = "text-[#FBBF24]";
      } else if (act.type === "BURN") {
        icon = Flame;
        color = "text-[#F87171]";
      } else if (act.type === "CLAIM") {
        icon = ShieldCheck;
        color = "text-[#A78BFA]";
      }

      return {
        icon,
        color,
        text: act.text,
        time: act.timestamp,
        tx: act.txHash,
      };
    });

    return [...mapped, ...DEFAULT_ACTIVITIES];
  }, [customActivities, liveActivities]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  const active = items[currentIndex % items.length];
  const Icon = active.icon;

  return (
    <div className="w-full border-b border-white/[0.05] bg-[#151821]/60 px-4 py-2 text-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex items-center gap-1 rounded bg-white/[0.06] px-1.5 py-0.5 font-semibold text-[#848B9B] text-[10px] uppercase tracking-wider">
            <span className={`h-1.5 w-1.5 rounded-full ${isLiveSynced ? "bg-[#10B981] animate-pulse" : "bg-[#7C5CFC]"}`} />
            Live Feed
          </span>
          <div className="flex items-center gap-2 transition-all duration-300">
            <Icon className={`h-3.5 w-3.5 ${active.color}`} />
            <span className="text-[#F9FAFB] font-medium truncate">{active.text}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[#848B9B] tabular-numbers text-[11px]">
          <span>{active.time}</span>
          <a
            href={`https://testnet.monadscan.com/tx/${active.tx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#7C5CFC] underline decoration-white/20 font-mono"
          >
            {active.tx.length > 16
              ? `${active.tx.slice(0, 8)}...${active.tx.slice(-4)}`
              : active.tx}
          </a>
        </div>
      </div>
    </div>
  );
}
