"use client";

import React, { useState } from "react";
import { X, Shield, Lock, ArrowRight, CheckCircle2, DollarSign } from "lucide-react";
import { GigItem, GigType } from "../types";

interface CreateGigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGig: (newGig: Partial<GigItem>) => void;
}

export function CreateGigModal({ isOpen, onClose, onCreateGig }: CreateGigModalProps) {
  const [step, setStep] = useState(1);
  const [gigType, setGigType] = useState<GigType>("CONTEST");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [rewardAmount, setRewardAmount] = useState("500");
  const [rewardToken, setRewardToken] = useState("USDT");
  const [isSealed, setIsSealed] = useState(true);
  const [skillTags, setSkillTags] = useState("Solidity, Next.js, Monad");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const numReward = parseFloat(rewardAmount) || 0;
  const protocolFee = (numReward * 0.01).toFixed(2);
  const burnCut = (numReward * 0.004).toFixed(2);
  const treasuryCut = (numReward * 0.004).toFixed(2);
  const curatorCut = (numReward * 0.002).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      onCreateGig({
        title,
        summary,
        description: summary,
        rewardAmount,
        rewardToken,
        gigType,
        isSealed,
        skillTags: skillTags.split(",").map((s) => s.trim()).filter(Boolean),
        deliverables: ["Verified GitHub PR", "Live Demo"],
      });
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-md animate-backdrop-fade cursor-pointer" />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#151821] p-5 sm:p-6 shadow-2xl animate-modal-pop transform-gpu max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C5CFC]">
              Step {step} of 3
            </span>
            <h3 className="text-lg font-bold text-[#F9FAFB]">
              {step === 1 && "Select Gig Format"}
              {step === 2 && "Scope & Requirements"}
              {step === 3 && "Escrow Deposit & Fee Breakdown"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#9CA3AF] transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <div
                onClick={() => setGigType("CONTEST")}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  gigType === "CONTEST"
                    ? "border-[#7C5CFC] bg-[#7C5CFC]/10"
                    : "border-white/[0.08] bg-[#1B1E2B] hover:border-white/[0.16]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#F9FAFB]">Contest Challenge</span>
                  {gigType === "CONTEST" && <CheckCircle2 className="h-4 w-4 text-[#7C5CFC]" />}
                </div>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Multiple contestants submit deliverables. You pick the winning entry. Ideal for design, research, and competitive hack sprints.
                </p>
              </div>

              <div
                onClick={() => setGigType("FCFS")}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  gigType === "FCFS"
                    ? "border-[#7C5CFC] bg-[#7C5CFC]/10"
                    : "border-white/[0.08] bg-[#1B1E2B] hover:border-white/[0.16]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#F9FAFB]">First-Come First-Served (FCFS)</span>
                  {gigType === "FCFS" && <CheckCircle2 className="h-4 w-4 text-[#7C5CFC]" />}
                </div>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  A single verified worker claims the task and works under an exclusive timer. Best for discrete bug fixes and translations.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#848B9B]">Gig Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Build Monad Staking Dashboard Widget"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/[0.12] bg-[#1B1E2B] px-3.5 py-2 text-white placeholder-gray-500 focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#848B9B]">Summary Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Briefly describe what needs to be built and acceptance criteria..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/[0.12] bg-[#1B1E2B] px-3.5 py-2 text-white placeholder-gray-500 focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#848B9B]">Skill Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Solidity, Next.js, Figma"
                  value={skillTags}
                  onChange={(e) => setSkillTags(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/[0.12] bg-[#1B1E2B] px-3.5 py-2 text-white placeholder-gray-500 focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              {gigType === "CONTEST" && (
                <div className="flex items-center gap-2 rounded-lg border border-[#7C5CFC]/25 bg-[#7C5CFC]/10 p-3">
                  <input
                    type="checkbox"
                    id="sealedToggle"
                    checked={isSealed}
                    onChange={(e) => setIsSealed(e.target.checked)}
                    className="rounded border-gray-600 accent-[#7C5CFC]"
                  />
                  <label htmlFor="sealedToggle" className="cursor-pointer text-xs text-[#F9FAFB]">
                    <strong>Enable MERA PRF Sealed Submissions:</strong> Encrypt deliverables client-side so early competitors cannot copy ideas.
                  </label>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#848B9B]">Bounty Amount</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/[0.12] bg-[#1B1E2B] px-3.5 py-2 text-white font-mono font-bold focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#848B9B]">Currency Asset</label>
                  <select
                    value={rewardToken}
                    onChange={(e) => setRewardToken(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/[0.12] bg-[#1B1E2B] px-3.5 py-2 text-white font-semibold focus:border-[#7C5CFC] focus:outline-none"
                  >
                    <option value="USDT">USDT (Stablecoin)</option>
                    <option value="MON">MON (Native Token)</option>
                    <option value="HUSTLE">$HUSTLE (0% Fee Discount)</option>
                  </select>
                </div>
              </div>

              {/* Protocol Fee Breakdown Card */}
              <div className="rounded-xl border border-white/[0.08] bg-[#1B1E2B] p-4 text-xs space-y-2">
                <div className="flex justify-between text-[#848B9B]">
                  <span>Escrow Reward Deposit</span>
                  <span className="font-mono text-white">${rewardAmount} {rewardToken}</span>
                </div>
                <div className="flex justify-between text-[#848B9B]">
                  <span>Flat Protocol Escrow Fee (1.0%)</span>
                  <span className="font-mono text-[#34D399]">${protocolFee}</span>
                </div>

                <div className="border-t border-white/[0.06] pt-2 space-y-1 text-[11px] text-[#848B9B]">
                  <div className="flex justify-between">
                    <span>↳ 40% Deflationary Auto-Burn:</span>
                    <span className="font-mono text-[#F87171]">${burnCut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>↳ 40% Community DAO Treasury:</span>
                    <span className="font-mono text-[#7C5CFC]">${treasuryCut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>↳ 20% Hype Curator Staking Yield:</span>
                    <span className="font-mono text-[#FBBF24]">${curatorCut}</span>
                  </div>
                </div>

                <div className="border-t border-white/[0.08] pt-2 flex justify-between font-bold text-[#F9FAFB] text-sm">
                  <span>Total Due Today:</span>
                  <span className="font-mono text-[#34D399]">${rewardAmount} {rewardToken}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#848B9B]">
                <Shield className="h-3.5 w-3.5 text-[#10B981]" />
                <span>Protected by 72-hour auto-release clock and 3-jury arbitration.</span>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-[#848B9B] hover:text-white"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1.5 rounded-lg bg-[#7C5CFC] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#9073FD] active:scale-[0.98]"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-lg bg-[#10B981] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#10B981]/25 transition-all hover:bg-[#059669] active:scale-[0.98] disabled:opacity-50"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Locking Escrow on Monad..." : "Deposit Escrow & Launch"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
