"use client";

import React, { useState, useEffect } from "react";
import { Zap, Flame, CheckCircle, ShieldCheck } from "lucide-react";

import { ActivityItem } from "../types";

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
    text: "@dev_alex completed 'Build Multi-RPC Dashboard' — 1,250 USDT released via Escrow",
    time: "12s ago",
    tx: "0x7a2d48b...f88",
  },
  {
    icon: Flame,
    color: "text-[#FBBF24]",
    text: "@hustler99 hyped 'Monad 3D Mascot Challenge' (+500 $HUSTLE staked)",
    time: "34s ago",
    tx: "0x3c4a19e...9bc",
  },
  {
    icon: Flame,
    color: "text-[#F87171]",
    text: "450 $HUSTLE permanently burned from recent escrow completions",
    time: "1m ago",
    tx: "0x9fE467...6e0",
  },
  {
    icon: ShieldCheck,
    color: "text-[#A78BFA]",
    text: "Verified ERC-5192 Proof-of-Work SBT #12 minted to @creative_nad",
    time: "2m ago",
    tx: "0xCf7Ed3...0Fc",
  },
];

interface ActivityTickerProps {
  customActivities?: ActivityItem[];
}

export function ActivityTicker({ customActivities }: ActivityTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Convert custom activities to ticker items if present
  const items = React.useMemo(() => {
    if (!customActivities || customActivities.length === 0) {
      return DEFAULT_ACTIVITIES;
    }

    const mapped = customActivities.map((act) => {
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
        tx: `${act.txHash.slice(0, 8)}...${act.txHash.slice(-4)}`,
      };
    });

    return [...mapped, ...DEFAULT_ACTIVITIES];
  }, [customActivities]);

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
            <Zap className="h-3 w-3 text-[#7C5CFC]" />
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
            className="hover:text-[#7C5CFC] underline decoration-white/20"
          >
            {active.tx}
          </a>
        </div>
      </div>
    </div>
  );
}
