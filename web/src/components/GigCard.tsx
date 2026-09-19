"use client";

import React, { useState } from "react";
import { GigItem } from "../types";
import { Flame, Clock, Users, Lock, CircleDot, FileSearch, CheckCircle2, AlertTriangle } from "lucide-react";

interface GigCardProps {
  gig: GigItem;
  onSelect: (gig: GigItem) => void;
  onHype: (gigId: string) => void;
}

export function GigCard({ gig, onSelect, onHype }: GigCardProps) {
  const [hyped, setHyped] = useState(false);
  const [hypeCount, setHypeCount] = useState(gig.hypeCount);

  const handleHypeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hyped) {
      setHyped(true);
      setHypeCount((prev) => prev + 1);
      onHype(gig.id);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = () => {
    switch (gig.status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-[#34D399]">
            <CircleDot className="h-3 w-3" />
            OPEN
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-[#FBBF24]">
            <Clock className="h-3 w-3" />
            IN PROGRESS
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-[#A78BFA]">
            <FileSearch className="h-3 w-3" />
            IN REVIEW (72h)
          </span>
        );
      case "SETTLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-[#9CA3AF]">
            <CheckCircle2 className="h-3 w-3" />
            SETTLED
          </span>
        );
      case "DISPUTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-[#F87171]">
            <AlertTriangle className="h-3 w-3" />
            DISPUTED
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelect(gig)}
      className="group relative cursor-pointer rounded-xl border border-white/[0.07] bg-[#151821] p-5 transition-all duration-150 hover:border-white/[0.18] hover:bg-[#181C26] hover:shadow-lg hover:shadow-black/40"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Gig Type Pill */}
          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-[#848B9B]">
            {gig.gigType}
          </span>
          {renderStatusBadge()}
          {gig.isSealed && (
            <span
              title="MERA Passkey Encrypted Submission"
              className="inline-flex items-center gap-1 rounded-md border border-[#7C5CFC]/25 bg-[#7C5CFC]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#A78BFA]"
            >
              <Lock className="h-2.5 w-2.5" />
              Sealed
            </span>
          )}
        </div>

        {/* Reward Pill */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-[#34D399] tabular-numbers shadow-sm shadow-emerald-500/10">
          {gig.rewardAmount} {gig.rewardToken}
        </div>
      </div>

      {/* Gig Title & Summary */}
      <h3 className="text-base font-semibold text-[#F9FAFB] line-clamp-1 group-hover:text-white transition-colors">
        {gig.title}
      </h3>
      <p className="mt-1.5 text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
        {gig.summary}
      </p>

      {/* Skill Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {gig.skillTags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#848B9B]"
          >
            #{tag}
          </span>
        ))}
        {gig.skillTags.length > 3 && (
          <span className="text-[10px] text-[#848B9B] self-center">
            +{gig.skillTags.length - 3}
          </span>
        )}
      </div>

      {/* Footer Meta Row */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3 text-xs text-[#848B9B]">
        {/* 1-Click Hype Button */}
        <button
          onClick={handleHypeClick}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 transition-all active:scale-[0.96] ${
            hyped
              ? "bg-[#F59E0B]/15 text-[#FBBF24] font-semibold"
              : "hover:bg-white/[0.06] hover:text-[#FBBF24]"
          }`}
        >
          <Flame
            className={`h-3.5 w-3.5 transition-transform ${
              hyped ? "fill-current scale-110 text-[#FBBF24]" : "text-[#848B9B]"
            }`}
          />
          <span className="tabular-numbers text-xs">{hypeCount}</span>
        </button>

        {/* Submissions & Time */}
        <div className="flex items-center gap-3 text-[11px] tabular-numbers">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{gig.submissionsCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>2d left</span>
          </span>
        </div>
      </div>
    </div>
  );
}
