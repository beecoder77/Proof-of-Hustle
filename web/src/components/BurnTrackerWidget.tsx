"use client";

import React, { useState, useEffect } from "react";
import { Flame, ExternalLink, ArrowDownRight, CheckCircle2, AlertCircle } from "lucide-react";
import { CONTRACTS } from "../config/contracts";
import { fetchTotalBurnedOnchain, burnHustleOnchain } from "../services/onchain";
import { fetchLiveBurnData } from "../services/onchainFeed";
import seededOnchainData from "../data/seededOnchainData.json";

interface BurnRecord {
  amount: string;
  gig: string;
  time: string;
  tx: string;
}

export function BurnTrackerWidget() {
  const [burnedTotal, setBurnedTotal] = useState<number>(769);
  const [onchainBurnedWei, setOnchainBurnedWei] = useState<number>(0);
  const [isBurning, setIsBurning] = useState(false);
  const [burnSuccessTx, setBurnSuccessTx] = useState<string | null>(null);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [isLiveBurnSynced, setIsLiveBurnSynced] = useState(false);

  const [burnHistory, setBurnHistory] = useState<BurnRecord[]>([
    {
      amount: "300",
      gig: "ProtocolBurnPool Permissionless Deflation Burn",
      time: "Block #64156542",
      tx: seededOnchainData.protocolBurns[0]?.burnTx || "0x271661972466136df0a72126123abbb1cd452a27df426cffbd4314d8a4ec691f",
    },
    {
      amount: "300",
      gig: "Genesis Protocol Burn Pool Initialization",
      time: "Block #64070002",
      tx: "0xd53917e92336cb87b1c4b711e7ba259be2466f244199f36b6f04baeb27a2fbdf",
    },
    {
      amount: "25",
      gig: "Parallel EVM Benchmark Escrow Fee Burn (Gig #23)",
      time: "Block #64156452",
      tx: seededOnchainData.completedGigs[0]?.payoutTx || "0xd79166346457375455b5248724aec65307d307e2e33778d69d8e726beb843f5e",
    },
    {
      amount: "12",
      gig: "Alchemy Multi-Transport Escrow Fee Burn (Gig #24)",
      time: "Block #64156469",
      tx: seededOnchainData.completedGigs[1]?.payoutTx || "0xafc8d609315d0052a556d1ae9d9bb541da2673796ec267684a3d12d0f7224e63",
    },
  ]);

  // Read onchain totalHustleBurned and burn events from ProtocolBurnPool
  useEffect(() => {
    let active = true;
    async function loadOnchainBurn() {
      try {
        const live = await fetchLiveBurnData();
        if (active && live) {
          if (live.totalBurned > 0) {
            setBurnedTotal(Math.round(live.totalBurned));
            setOnchainBurnedWei(live.totalBurned);
          }
          if (live.burnHistory && live.burnHistory.length > 0) {
            setBurnHistory(live.burnHistory);
          }
          setIsLiveBurnSynced(true);
        }
      } catch (err) {
        console.warn("Could not load live burn data:", err);
      }
    }
    loadOnchainBurn();
    const interval = setInterval(loadOnchainBurn, 12_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleManualBurn = async () => {
    setIsBurning(true);
    setBurnSuccessTx(null);
    setBurnError(null);

    try {
      const res = await burnHustleOnchain("150");
      if (res.success && res.txHash) {
        setBurnSuccessTx(res.txHash);
        setBurnedTotal((prev) => prev + 150);
        setOnchainBurnedWei((prev) => prev + 150);

        setBurnHistory((prev) => [
          {
            amount: "150",
            gig: "Permissionless Monad Burn Trigger",
            time: "Just now",
            tx: res.txHash!,
          },
          ...prev,
        ]);
      } else {
        setBurnError(res.error || "Onchain burn transaction reverted.");
      }
    } catch (err: any) {
      setBurnError(err.message || "Failed to trigger burn");
    } finally {
      setIsBurning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Burn Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-[#1C1318] via-[#151821] to-[#0E1015] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-[#F87171]">
                <Flame className="h-3.5 w-3.5 text-red-500 fill-current animate-pulse" />
                <span>40% Protocol Escrow Allocation</span>
              </div>
              {isLiveBurnSynced && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#34D399]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Live Monad Burn Pool
                </span>
              )}
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#F9FAFB]">
              Deflationary Auto-Burn Flywheel
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#9CA3AF] max-w-xl leading-relaxed">
              Every completed gig automatically routes 40% of its 1.0% protocol fee directly to the Burn Pool, permanently destroying $HUSTLE tokens at <span className="font-mono text-xs text-white">0x000...dEaD</span>.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-[#848B9B]">Burn Pool Contract:</span>
              <a
                href={`https://testnet.monadscan.com/address/${CONTRACTS.protocolBurnPool.address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[#F87171] hover:underline bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"
              >
                <span>{CONTRACTS.protocolBurnPool.address.slice(0, 8)}...{CONTRACTS.protocolBurnPool.address.slice(-4)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
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

            {burnSuccessTx && (
              <div className="mt-2 flex items-center justify-center sm:justify-end gap-1.5 text-[11px] text-emerald-400 font-mono">
                <CheckCircle2 className="h-3 w-3" />
                <a
                  href={`https://testnet.monadscan.com/tx/${burnSuccessTx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-emerald-300"
                >
                  Burn Confirmed: {burnSuccessTx.slice(0, 6)}...{burnSuccessTx.slice(-4)}
                </a>
              </div>
            )}

            {burnError && (
              <div className="mt-2 flex items-center justify-center sm:justify-end gap-1.5 text-[11px] text-red-400">
                <AlertCircle className="h-3 w-3" />
                <span>{burnError}</span>
              </div>
            )}
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
          {burnHistory.map((item, idx) => (
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
                  <span className="font-mono">
                    {item.tx.slice(0, 8)}...{item.tx.slice(-4)}
                  </span>
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
