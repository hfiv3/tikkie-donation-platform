"use client";

import { useState, useEffect } from "react";
import ProgressBar from "@/components/ProgressBar";
import PersonalLetter from "@/components/PersonalLetter";
import DonateSection from "@/components/DonateSection";
import DonationWall from "@/components/DonationWall";
import ShareButton from "@/components/ShareButton";
import Footer from "@/components/Footer";
import ActivityTicker from "@/components/ActivityTicker";
import { useDonations } from "@/hooks/useDonations";
import { WHATSAPP_SHARE_TEXT } from "@/lib/constants";

export default function Home() {
  const { stats, refetch: refetchDonations } = useDonations();
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("bedankt")) {
      setShowThankYou(true);
      // Clean up URL without reload
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <main className="min-h-screen bg-brand-black">
      {/* Thank you banner after payment */}
      {showThankYou && (
        <div className="bg-brand-primary/10 border-b border-brand-primary/30 px-4 py-6 md:py-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="font-heading text-brand-primary text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2">
              {"Bedankt voor je donatie!"}
            </p>
            <p className="text-white/70 mb-5">
              {"Wat kun je nog meer doen?"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${WHATSAPP_SHARE_TEXT} ${typeof window !== "undefined" ? window.location.origin : ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-heading font-bold py-3 px-6 rounded-full text-sm uppercase tracking-wide hover:bg-[#20BA5C] transition-all"
              >
                {"Deel via WhatsApp"}
              </a>
            </div>
            <button
              onClick={() => setShowThankYou(false)}
              className="mt-4 text-white/30 text-xs hover:text-white/50 transition-colors"
            >
              {"Sluiten"}
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <ProgressBar
        totalRaised={stats.totalRaised}
        donationCount={stats.donationCount}
        goal={stats.goal}
        deadline={stats.deadline}
      />

      <div className="stripe-divider" />

      {/* Personal Letter */}
      <PersonalLetter />

      <div className="stripe-divider" />

      {/* Donate Section */}
      <DonateSection onDonationCreated={refetchDonations} />

      <div className="stripe-divider" />

      {/* Share Button */}
      <ShareButton />

      {/* Activity wall — recente donaties */}
      <DonationWall />

      {/* Footer */}
      <Footer />

      {/* Live activity ticker */}
      <ActivityTicker />
    </main>
  );
}
