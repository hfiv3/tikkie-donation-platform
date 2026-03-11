"use client";

import { useState, useEffect } from "react";
import { formatEuros } from "@/lib/format";

interface ProgressBarProps {
  totalRaised: number;
  donationCount: number;
  goal: number;
  deadline?: string | null;
}

function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr + "T23:59:59");
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function ProgressBar({
  totalRaised,
  donationCount,
  goal,
  deadline,
}: ProgressBarProps) {
  const percentage = goal > 0 ? (totalRaised / goal) * 100 : 0;
  const barWidth = Math.min(percentage, 100);
  const overGoal = percentage > 100;

  // Compute daysLeft only on client to avoid hydration mismatch
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  useEffect(() => {
    if (deadline) setDaysLeft(daysUntil(deadline));
  }, [deadline]);

  return (
    <section className="relative min-h-screen md:min-h-[80vh] flex items-end justify-center overflow-hidden">
      {/* Background photo — TODO: vervang door je eigen hero afbeelding */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/images/hero.jpg)",
          backgroundPosition: "center 30%",
        }}
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

      <div className="relative z-10 max-w-3xl w-full mx-auto text-center px-4 pb-10 pt-32 md:pb-14">
        {/* Title — TODO: pas aan naar jouw actie */}
        <h1 className="font-heading text-[2.75rem] md:text-[4rem] font-extrabold uppercase leading-[0.95] text-white mb-4 drop-shadow-lg">
          {"SAMEN MAKEN"}
          <br />
          {"WE HET "}
          <span className="text-brand-primary">{"MOGELIJK"}</span>
        </h1>

        <p className="font-heading text-white/70 text-base md:text-lg uppercase tracking-[0.2em] mb-10">
          {"Steun onze donatieactie"}
        </p>

        {/* Donation meter */}
        <div className="bg-black/70 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10">
          <div className="mb-5">
            <span className="font-heading text-[3rem] md:text-[4.5rem] font-extrabold text-brand-primary leading-none drop-shadow-lg">
              {formatEuros(totalRaised)}
            </span>
            <span className="text-white/50 text-base md:text-lg ml-2 font-heading uppercase">
              {"/ "}{formatEuros(goal)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-lg h-8 mb-4 overflow-hidden relative" role="progressbar" aria-valuenow={Math.round(percentage)} aria-valuemin={0} aria-valuemax={100} aria-label={`Donatievoortgang: ${Math.round(percentage)}%`}>
            <div
              className={`h-full rounded-lg transition-all duration-1000 ${overGoal ? "progress-bar-over" : "progress-bar-fill"}`}
              style={{ width: `${barWidth}%` }}
            />
            {overGoal && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-heading font-bold text-white drop-shadow-lg tracking-wider uppercase">
                  {"Doel bereikt!"}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-sm font-heading uppercase tracking-wide">
            <span className="text-white/60">
              {donationCount} {"donaties"}
              {daysLeft !== null && (
                <span className="ml-3 text-white/40">
                  {daysLeft === 0 ? "Laatste dag!" : `Nog ${daysLeft} dagen`}
                </span>
              )}
            </span>
            <span className={`font-bold ${overGoal ? "text-brand-success" : "text-brand-primary"}`}>
              {Math.round(percentage)}{"%"}
            </span>
          </div>
        </div>

        {/* CTA */}
        <a
          href="#doneren"
          className="inline-block mt-8 cta-button font-heading font-bold uppercase tracking-wide text-brand-black px-10 py-4 rounded-xl text-lg"
          style={{ background: "linear-gradient(90deg, var(--brand-primary-dark), var(--brand-primary), var(--brand-primary-light))" }}
        >
          {"DONEER NU"}
        </a>
      </div>
    </section>
  );
}
