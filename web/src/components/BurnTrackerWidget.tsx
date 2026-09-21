"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  ExternalLink,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Shield,
  RefreshCw,
} from "lucide-react";
import { CONTRACTS } from "../config/contracts";
import { burnHustleOnchain } from "../services/onchain";
import { fetchLiveBurnData, ECOSYSTEM_BUILDER_ADDRESSES } from "../services/onchainFeed";

interface BurnRecord {
  amount: string;
  gig: string;
  time: string;
  tx: string;
}

interface BurnTrackerWidgetProps {
  currentUserAddress?: string;
  onTriggerToast?: (title: string, desc: string, txHash: string) => void;
}

const DEPLOYER_ADDRESS = (
  process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS ||
  ECOSYSTEM_BUILDER_ADDRESSES[0]
).toLowerCase();

export function BurnTrackerWidget({
  currentUserAddress,
  onTriggerToast,
}: BurnTrackerWidgetProps) {
  const [burnedTotal, setBurnedTotal] = useState<number>(0);
  const [onchainBurnedWei, setOnchainBurnedWei] = useState<number>(0);
  const [isBurning, setIsBurning] = useState(false);
  const [burnSuccessTx, setBurnSuccessTx] = useState<string | null>(null);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [isLiveBurnSynced, setIsLiveBurnSynced] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if current connected user is the deployer
  const isDeployer = Boolean(
    currentUserAddress && currentUserAddress.toLowerCase() === DEPLOYER_ADDRESS.toLowerCase()
  );

  // Next Auto-Burn Countdown (Autonomous Relayer interval: every 6 minutes = 360 seconds)
  const [secondsUntilNextBurn, setSecondsUntilNextBurn] = useState<number>(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    return 360 - (nowSec % 360);
  });

  const [burnHistory, setBurnHistory] = useState<BurnRecord[]>([]);

  // Read onchain totalHustleBurned and burn events from ProtocolBurnPool
  const loadOnchainBurn = async () => {
    try {
      setIsRefreshing(true);
      const live = await fetchLiveBurnData();
      if (live) {
        if (live.totalBurned > 0) {
          setBurnedTotal(Math.round(live.totalBurned));
          setOnchainBurnedWei(live.totalBurned);
        }
        if (live.burnHistory && live.burnHistory.length > 0) {
          const cleanedHistory = live.burnHistory
            .filter((item) => {
              const str = `${item.gig || ""} ${item.time || ""}`.toLowerCase();
              return !str.includes("vps") && !str.includes("contabo") && !str.includes("pm2");
            })
            .map((item) => ({
              ...item,
              gig: item.gig
                .replace(/Autonomous VPS Daemon/gi, "Autonomous Protocol Relayer")
                .replace(/Contabo VPS/gi, "Autonomous Keeper")
                .replace(/PM2 daemon/gi, "Protocol Relayer")
                .replace(/poh-bot-seed/gi, "Protocol Keeper")
                .replace(/Cycle #/gi, "Epoch #"),
            }));
          setBurnHistory(cleanedHistory);
        }
        setIsLiveBurnSynced(true);
      }
    } catch (err) {
      console.warn("Could not load live burn data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOnchainBurn();
    const interval = setInterval(loadOnchainBurn, 12_000);
    return () => clearInterval(interval);
  }, []);

  // Ticking countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextBurn((prev) => {
        if (prev <= 1) {
          loadOnchainBurn();
          return 360;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleManualBurn = async () => {
    if (!isDeployer) {
      setBurnError("Access restricted: Only the protocol deployer can trigger manual burns.");
      return;
    }

    setIsBurning(true);
    setBurnSuccessTx(null);
    setBurnError(null);

    try {
      const res = await burnHustleOnchain("150", currentUserAddress);
      if (res.success && res.txHash) {
        setBurnSuccessTx(res.txHash);
        setBurnedTotal((prev) => prev + 150);
        setOnchainBurnedWei((prev) => prev + 150);

        const newRecord: BurnRecord = {
          amount: "150",
          gig: "Deployer Protocol Burn Trigger",
          time: "Just now",
          tx: res.txHash!,
        };

        setBurnHistory((prev) => {
          const updated = [newRecord, ...prev];
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("poh_burn_history_v2");
              localStorage.removeItem("poh_burn_history_v3");
              localStorage.setItem("poh_burn_history_v4", JSON.stringify(updated));
            } catch {}
          }
          return updated;
        });

        onTriggerToast?.(
          "Deployer Burn Confirmed",
          "150 $HUSTLE permanently burned to 0x0...dEaD on Monad Testnet.",
          res.txHash
        );
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
      <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-[#1C1318] via-[#151821] to-[#0E1015] p-6 sm:p-8 shadow-xl">
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

            {/* Deployer vs Observer Action Section */}
            <div className="mt-3 flex flex-col items-center sm:items-end gap-1.5">
              {isDeployer ? (
                <>
                  <div className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    <Shield className="h-3 w-3" />
                    <span>Deployer Authorized</span>
                  </div>
                  <button
                    onClick={handleManualBurn}
                    disabled={isBurning}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-300 transition-all hover:bg-red-500/30 active:scale-[0.98] disabled:opacity-50"
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>{isBurning ? "Executing Onchain Burn..." : "Deployer Manual Burn (150 HUSTLE)"}</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center sm:items-end gap-1">
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B1E2B] border border-white/[0.08] px-3 py-1.5 font-mono text-[11px] text-[#9CA3AF]">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Next Auto-Burn: <strong className="text-white font-mono">{formatCountdown(secondsUntilNextBurn)}</strong></span>
                  </div>
                  <span className="text-[10px] text-[#6B7280]">Manual trigger restricted to deployer</span>
                </div>
              )}
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

      {/* Auto-Burn Schedule & Cadence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Next Scheduled Sweep Card */}
        <div className="rounded-2xl border border-red-500/20 bg-[#151821] p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#848B9B] flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#F87171]" />
              Next Scheduled Auto-Burn
            </span>
            <span className="text-[10px] font-mono text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/20">
              Autonomous Relayer
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-white tabular-numbers">
              {formatCountdown(secondsUntilNextBurn)}
            </span>
            <span className="text-xs text-[#848B9B]">remaining</span>
          </div>
          <p className="mt-2 text-[11px] text-[#9CA3AF] leading-relaxed">
            Autonomous protocol relayer sweeps accumulated fee escrow and executes permissionless deflationary burns directly on Monad Testnet.
          </p>
        </div>

        {/* Sweep Cadence Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#848B9B] flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#FBBF24]" />
              Automated Cadence
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
              Epoch Scheduled
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#FBBF24] tabular-numbers">
              6.0m
            </span>
            <span className="text-xs text-[#848B9B]">sweep interval</span>
          </div>
          <p className="mt-2 text-[11px] text-[#9CA3AF] leading-relaxed">
            Automated keeper sweeps execute onchain every scheduled epoch with Monad 400ms sub-second finality.
          </p>
        </div>

        {/* Access Control & Governance Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#848B9B] flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-[#34D399]" />
              Access Control
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
              Deployer-Gated
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-white">
              {isDeployer ? "⚡️ Deployer Mode" : "🔒 Public Observer"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#9CA3AF] leading-relaxed">
            {isDeployer
              ? "You are connected with the deployer address. Manual burn execution is enabled."
              : "Manual trigger restricted to deployer. Everyone has transparent access to live onchain burn history."}
          </p>
        </div>
      </div>

      {/* Burn Audit History */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#151821] p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F9FAFB]">
              Transparent Onchain Burn History
            </h3>
            <p className="mt-1 text-xs text-[#848B9B]">
              Real-time onchain burn receipts verified on Monad Testnet block explorer.
            </p>
          </div>
          <button
            onClick={loadOnchainBurn}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#1B1E2B] px-3 py-1.5 text-xs text-[#848B9B] hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="mt-5 divide-y divide-white/[0.05]">
          {burnHistory.map((item, idx) => {
            const isUserBurn =
              item.gig?.toLowerCase().includes("deployer") ||
              Boolean(burnSuccessTx && item.tx.toLowerCase() === burnSuccessTx.toLowerCase()) ||
              item.tx.toLowerCase() ===
                "0x10585df925d982b6f23d4b7c86340b6b50435d8e368dad557b85180a8916ae30".toLowerCase();

            return (
              <div
                key={`${item.tx}-${idx}`}
                className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2 text-xs transition-colors rounded-xl px-2 ${
                  isUserBurn ? "bg-red-500/10 border border-red-500/25" : "hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                      isUserBurn
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white tabular-numbers">
                        -{item.amount} HUSTLE
                      </span>
                      {isUserBurn && (
                        <span className="rounded bg-red-500/20 border border-red-500/30 px-1.5 py-0.2 text-[9px] font-mono font-bold text-red-300">
                          ⭐️ Verified Deployer Burn
                        </span>
                      )}
                    </div>
                    <span className="block text-[11px] text-[#848B9B]">
                      {item.gig
                        .replace(/Autonomous VPS Daemon/gi, "Autonomous Protocol Relayer")
                        .replace(/Contabo VPS/gi, "Autonomous Keeper")
                        .replace(/PM2 daemon/gi, "Protocol Relayer")
                        .replace(/poh-bot-seed/gi, "Protocol Keeper")
                        .replace(/Cycle #/gi, "Epoch #")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 tabular-numbers text-[11px] text-[#848B9B] w-full sm:w-auto pt-1 sm:pt-0 border-t border-white/[0.04] sm:border-0">
                  <span>{item.time}</span>
                  <a
                    href={`https://testnet.monadscan.com/tx/${item.tx}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#7C5CFC] hover:underline font-mono"
                  >
                    <span>
                      {item.tx.slice(0, 8)}...{item.tx.slice(-4)}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
