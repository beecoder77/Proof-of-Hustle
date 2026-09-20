"use client";

import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, Shield, Zap, Database, CheckCircle2 } from "lucide-react";

interface LiveTelemetryBarProps {
  totalGigs: number;
  totalEscrowed: string;
  onRefresh?: () => void;
  isSyncing?: boolean;
}

export function LiveTelemetryBar({
  totalGigs,
  totalEscrowed,
  onRefresh,
  isSyncing = false,
}: LiveTelemetryBarProps) {
  const [blockNumber, setBlockNumber] = useState<string>("64,001,580");
  const [latencyMs, setLatencyMs] = useState<number>(342);
  const [isLive, setIsLive] = useState<boolean>(true);

  // Poll live block number from Monad RPC
  useEffect(() => {
    let isMounted = true;
    const fetchBlock = async () => {
      try {
        const start = performance.now();
        const rpcUrl =
          process.env.NEXT_PUBLIC_MONAD_RPC_URL ||
          process.env.NEXT_PUBLIC_ALCHEMY_RPC ||
          "https://testnet-rpc.monad.xyz";

        const res = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_blockNumber",
            params: [],
            id: Date.now(),
          }),
        });

        const data = await res.json();
        const elapsed = Math.round(performance.now() - start);

        if (isMounted && data.result) {
          const num = parseInt(data.result, 16);
          setBlockNumber(num.toLocaleString());
          setLatencyMs(elapsed);
          setIsLive(true);
        }
      } catch {
        if (isMounted) {
          setIsLive(false);
        }
      }
    };

    fetchBlock();
    const interval = setInterval(fetchBlock, 7000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full border-b border-white/[0.06] bg-[#11141D] px-4 py-1.5 text-xs text-[#848B9B]">
      <div className="mx-auto flex max-w-7xl items-center justify-between flex-wrap gap-2">
        {/* Left: Chain Telemetry */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isLive ? "bg-[#10B981] animate-pulse" : "bg-[#F59E0B]"
              }`}
            />
            <span className="font-semibold text-[#F9FAFB]">Monad Testnet</span>
            <span className="font-mono text-[11px] text-[#A78BFA] bg-[#7C5CFC]/15 px-1.5 py-0.5 rounded border border-[#7C5CFC]/30">
              Chain 10143
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px]">
            <Database className="h-3.5 w-3.5 text-[#848B9B]" />
            <span>Block:</span>
            <span className="font-mono text-[#F9FAFB] font-semibold">
              #{blockNumber}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-[11px]">
            <Zap className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>Latency:</span>
            <span className="font-mono text-emerald-400 font-medium">
              {latencyMs}ms
            </span>
            <span className="text-[#848B9B]">(~400ms finality)</span>
          </div>
        </div>

        {/* Right: Escrow TVL & Sync Action */}
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#848B9B]">Live Escrows:</span>
            <span className="font-mono font-bold text-white">{totalGigs} Active</span>
            <span className="text-[#848B9B]">•</span>
            <span className="font-mono font-bold text-emerald-400">
              {totalEscrowed} USDT
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[#F9FAFB] transition-all hover:bg-white/[0.08] active:scale-95 disabled:opacity-50"
            title="Refresh onchain state"
          >
            <RefreshCw
              className={`h-3 w-3 text-[#7C5CFC] ${isSyncing ? "animate-spin" : ""}`}
            />
            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
