"use client";

import React, { useState, useEffect } from "react";
import { Zap, Flame, CheckCircle, ShieldCheck } from "lucide-react";

import { ActivityItem } from "../types";
import { fetchLiveActivities } from "../services/onchainFeed";

const NETWORK_STATUS_ACTIVITIES: {
  icon: typeof CheckCircle;
  color: string;
  text: string;
  time: string;
  tx: string;
}[] = [
  {
    icon: Zap as typeof CheckCircle,
    color: "text-[#7C5CFC]",
    text: "Connected to Monad Testnet (Chain ID 10143) • 400ms Sub-Second Finality Active",
    time: "Live Ledger",
    tx: "",
  },
  {
    icon: ShieldCheck,
    color: "text-[#34D399]",
    text: "Onchain Escrow Vaults, SBT Credentials & Protocol Burns Active",
    time: "Monad EVM",
    tx: "",
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
      return NETWORK_STATUS_ACTIVITIES;
    }

    const mapped = source.map((act) => {
      let icon = Zap as typeof CheckCircle;
      let color = "text-[#7C5CFC]";
      if (act.type === "PAYOUT") {
        icon = CheckCircle;
        color = "text-[#34D399]";
      } else if (act.type === "HYPE") {
        icon = Flame as typeof CheckCircle;
        color = "text-[#FBBF24]";
      } else if (act.type === "BURN") {
        icon = Flame as typeof CheckCircle;
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

    return mapped;
  }, [customActivities, liveActivities]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  const active = items[currentIndex % items.length] || NETWORK_STATUS_ACTIVITIES[0];
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
          {active.tx && active.tx.startsWith("0x") ? (
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
          ) : (
            <span className="text-[#34D399] font-mono text-[10px]">Monad Testnet</span>
          )}
        </div>
      </div>
    </div>
  );
}
