"use client";

import React, { useState } from "react";
import { Flame, ExternalLink, ShieldCheck, ArrowDownRight } from "lucide-react";

export function BurnTrackerWidget() {
  const [burnedTotal, setBurnedTotal] = useState(28450);
  const [isBurning, setIsBurning] = useState(false);

  const handleManualBurn = () => {
    setIsBurning(true);
    setTimeout(() => {
      setBurnedTotal((prev) => prev + 150);
      setIsBurning(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Hero Burn Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-[#1C1318] via-[#151821] to-[#0E1015] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-[#F87171]">
              <Flame className="h-3.5 w-3.5 text-red-500 fill-current animate-pulse" />
              <span>40% Protocol Escrow Allocation</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#F9FAFB]">
              Deflationary Auto-Burn Flywheel
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#9CA3AF] max-w-xl leading-relaxed">
              Every completed gig automatically routes 40% of its 1.0% protocol fee directly to the Burn Pool, permanently destroying $HUSTLE tokens at <span className="font-mono text-xs text-white">0x000...dEaD</span>.
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/30 bg-[#161219]/90 p-5 text-center sm:text-right shadow-xl">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#848B9B]">
              Total $HUSTLE Burned
            </span>
            <span className="mt-1 block font-mono text-3xl sm:text-4xl font-extrabold text-[#F87171] tabular-numbers">
              {burnedTotal.toLocaleString()} <span className="text-sm text-red-400 font-sans">HUSTLE</span>
            </span>
            <div className="mt-3">
              <button
                onClick={handleManualBurn}
                disabled={isBurning}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-300 transition-all hover:bg-red-500/30 active:scale-[0.98] disabled:opacity-50"
              >
                <Flame className="h-3.5 w-3.5" />
                <span>{isBurning ? "Executing Onchain Burn..." : "Permissionless Burn Trigger"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Burn Audit History */}
      <div className="rounded-xl border border-white/[0.08] bg-[#151821] p-5">
        <h3 className="text-sm font-bold text-[#F9FAFB]">
          Recent Transparent Burn Transactions
        </h3>
        <p className="mt-1 text-xs text-[#848B9B]">
          Verified on MonadVision explorer via Devnads API.
        </p>

        <div className="mt-4 divide-y divide-white/[0.05]">
          {[
            { amount: "1,200", gig: "Port OpenZeppelin Governor (#3)", time: "18m ago", tx: "0x9fe4...6e0" },
            { amount: "450", gig: "Monad Metropolis Community Edit (#5)", time: "2h ago", tx: "0x3bc1...a12" },
            { amount: "2,500", gig: "Weekly Escrow Fee Batch Sweep", time: "1d ago", tx: "0x8fa1...d45" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-mono font-bold text-white tabular-numbers">-{item.amount} HUSTLE</span>
                  <span className="block text-[11px] text-[#848B9B]">{item.gig}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 tabular-numbers text-[11px] text-[#848B9B]">
                <span>{item.time}</span>
                <a
                  href={`https://testnet.monadscan.com/tx/${item.tx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#7C5CFC] hover:underline"
                >
                  <span className="font-mono">{item.tx}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
