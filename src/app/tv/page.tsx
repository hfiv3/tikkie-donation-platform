"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getStats, getDonations } from "@/lib/api";
import { formatEuros } from "@/lib/format";
import type { Stats, Donation } from "@/lib/types";

// --- Config ---
// TODO: Pas SITE_URL aan naar jouw domein
const SLIDE_DURATION_DEFAULT = 12_000; // 12s per slide
const SLIDE_DURATION_QR = 20_000; // 20s for QR slide (longer)
const DATA_REFRESH = 30_000; // refresh data every 30s
const SITE_URL = "jouwdomein.nl";
const HERO_IMAGE = "/images/hero.jpg";
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${SITE_URL}&format=svg`;

const SLIDE_NAMES = ["Voortgang", "Donaties", "De brief", "Doneer"];
const QR_SLIDE_INDEX = 3;

// --- Helpers ---

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + "Z").getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "zojuist";
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}u geleden`;
  return `${Math.floor(diff / 86400)}d geleden`;
}

// --- Component ---

export default function TVPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState<Stats>({
    totalRaised: 0,
    donationCount: 0,
    goal: 2500000,
    deadline: null,
    campaignName: null,
    popularAmount: null,
  });
  const [donations, setDonations] = useState<Donation[]>([]);
  const [showNav, setShowNav] = useState(false);
  const [paused, setPaused] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([
        getStats(),
        getDonations(50),
      ]);
      setStats(s);
      setDonations(d);
    } catch {
      // silent retry next interval
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, DATA_REFRESH);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Auto-advance slides (QR slide gets longer)
  const slideDuration = currentSlide === QR_SLIDE_INDEX ? SLIDE_DURATION_QR : SLIDE_DURATION_DEFAULT;

  useEffect(() => {
    if (paused) return;
    const timeout = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_NAMES.length);
    }, slideDuration);
    return () => clearTimeout(timeout);
  }, [paused, currentSlide, slideDuration]);

  // Nav visibility on mouse move
  const handleMouseMove = useCallback(() => {
    setShowNav(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowNav(false), 3000);
  }, []);

  // Stats
  const percentage = stats.goal > 0 ? (stats.totalRaised / stats.goal) * 100 : 0;
  const remaining = Math.max(0, stats.goal - stats.totalRaised);

  return (
    <div
      className="fixed inset-0 bg-brand-black overflow-hidden cursor-none"
      onMouseMove={handleMouseMove}
    >
      {/* Navigation bar (hidden until mouse) */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 bg-brand-charcoal/90 backdrop-blur-sm transition-all duration-500 ${
          showNav ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="flex items-center justify-center gap-2 py-3 px-4">
          {SLIDE_NAMES.map((name, i) => (
            <button
              key={name}
              onClick={() => {
                setCurrentSlide(i);
                setPaused(false);
              }}
              className={`px-4 py-2 rounded-full text-sm font-heading uppercase tracking-wide transition-all ${
                i === currentSlide
                  ? "bg-brand-primary text-brand-black font-bold"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {name}
            </button>
          ))}
          <div className="w-px h-6 bg-white/20 mx-2" />
          <button
            onClick={() => setPaused(!paused)}
            className="text-white/50 hover:text-white/80 text-sm px-3 py-2"
          >
            {paused ? "\u25B6 Play" : "\u23F8 Pauze"}
          </button>
        </div>
        {/* Progress bar for current slide */}
        {!paused && (
          <div className="h-0.5 bg-white/10">
            <div
              className="h-full bg-brand-primary transition-none"
              style={{
                animation: `slideProgress ${slideDuration}ms linear`,
                width: "100%",
              }}
              key={`progress-${currentSlide}-${Date.now()}`}
            />
          </div>
        )}
      </div>

      {/* Slides */}
      <div className="w-full h-full">
        {/* SLIDE 1: Voortgang */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ${
            currentSlide === 0 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Hero background photo */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${HERO_IMAGE})`, backgroundPosition: "center 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

          <div className="relative z-10 flex flex-col items-center">
            {/* TODO: Pas aan naar jouw actienaam */}
            <p className="font-heading text-brand-primary text-2xl uppercase tracking-[0.3em] mb-4">
              {"Donatieactie"}
            </p>

            <p className="font-heading text-white text-[8rem] md:text-[12rem] leading-none font-bold">
              {formatEuros(stats.totalRaised)}
            </p>

            <p className="text-white/40 text-2xl mt-2 mb-12">
              {"van "}{formatEuros(stats.goal)}
            </p>

            {/* Big progress bar */}
            <div className="w-[80%] max-w-[900px] h-8 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 progress-bar-fill"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            <div className="flex gap-16 mt-12 text-center">
              <div>
                <p className="font-heading text-white text-5xl font-bold">{stats.donationCount}</p>
                <p className="text-white/40 text-lg mt-1">{"donaties"}</p>
              </div>
              <div>
                <p className="font-heading text-brand-primary text-5xl font-bold">
                  {percentage >= 100 ? "Bereikt!" : `${percentage.toFixed(0)}%`}
                </p>
                <p className="text-white/40 text-lg mt-1">
                  {percentage >= 100 ? "doelbedrag" : `nog ${formatEuros(remaining)}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 2: Donaties */}
        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-700 ${
            currentSlide === 1 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex-1 flex flex-col px-12 py-16">
            <h2 className="font-heading text-4xl font-bold uppercase tracking-wide text-white mb-2">
              {"Recente "}
              <span className="text-brand-primary">{"donaties"}</span>
            </h2>
            <p className="text-white/40 text-lg mb-8">
              {stats.donationCount}{" donaties \u2014 "}{formatEuros(stats.totalRaised)}{" opgehaald"}
            </p>

            <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
              {donations.slice(0, 12).map((d) => (
                <div
                  key={d.id}
                  className="bg-brand-charcoal/60 rounded-xl p-5 flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-full bg-brand-primary/20 flex items-center justify-center text-2xl shrink-0">
                    {"\uD83D\uDCB0"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-heading text-xl font-bold truncate">
                      {d.name || "Anoniem"}
                    </p>
                    {d.message && (
                      <p className="text-white/50 text-sm truncate italic">{d.message}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-brand-primary font-heading text-2xl font-bold">
                      {formatEuros(d.amount)}
                    </p>
                    <p className="text-white/30 text-xs">{timeAgo(d.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SLIDE 3: De brief */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
            currentSlide === 2 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="max-w-[800px] px-12">
            {/* TODO: Pas deze tekst aan naar jouw eigen brief */}
            <div className="text-white/80 text-2xl leading-[2.4rem] italic space-y-6">
              <p className="not-italic font-heading text-brand-primary text-3xl font-bold uppercase tracking-wide mb-8">
                {"Beste supporters,"}
              </p>
              <p>
                {"Wij hebben jullie hulp nodig. Al lange tijd werken we aan ons doel, en we zijn er bijna. Maar zonder jullie steun lukt het niet."}
              </p>
              <p>
                {"Met deze donatieactie willen we het laatste stuk financieren. Elke bijdrage, groot of klein, brengt ons dichter bij ons doel."}
              </p>
              <p>
                {"Doneren is eenvoudig via Tikkie. Kies een bedrag en rond de betaling af. Binnen een paar klikken heb je bijgedragen aan iets moois."}
              </p>
              <p className="text-brand-primary not-italic font-heading text-3xl font-bold pt-4">
                {"Samen maken we het mogelijk."}
              </p>
            </div>
          </div>
        </div>

        {/* SLIDE 4: QR / CTA */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
            currentSlide === 3 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="text-center">
            <p className="font-heading text-brand-primary text-3xl uppercase tracking-[0.3em] mb-8">
              {"Help mee!"}
            </p>

            {/* QR code */}
            <div className="bg-white rounded-3xl p-6 inline-block mb-8">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://${SITE_URL}&format=svg`}
                alt={`QR code naar ${SITE_URL}`}
                width={300}
                height={300}
                className="block"
              />
            </div>

            <p className="font-heading text-white text-5xl font-bold mb-3">
              {"Scan & Doneer"}
            </p>
            <p className="text-white/50 text-xl mb-1">
              {"Veilig betalen via Tikkie"}
            </p>
            <p className="text-white/30 text-lg">
              {SITE_URL}
            </p>

            <div className="flex gap-12 mt-12 justify-center text-center">
              <div>
                <p className="font-heading text-brand-primary text-4xl font-bold">
                  {formatEuros(stats.totalRaised)}
                </p>
                <p className="text-white/40 mt-1">{"opgehaald"}</p>
              </div>
              <div>
                <p className="font-heading text-white text-4xl font-bold">
                  {stats.donationCount}
                </p>
                <p className="text-white/40 mt-1">{"donaties"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent QR code (bottom-right, hidden on QR slide) */}
      <div
        className={`absolute bottom-6 right-8 z-40 flex items-center gap-4 transition-opacity duration-500 ${
          currentSlide === QR_SLIDE_INDEX ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="text-right">
          <p className="text-white/40 text-xs font-heading uppercase tracking-wide">{"Doneer via Tikkie"}</p>
          <p className="text-white/25 text-xs">{SITE_URL}</p>
        </div>
        <div className="bg-white rounded-lg p-1.5">
          <img
            src={QR_URL}
            alt="QR code"
            width={64}
            height={64}
            className="block"
          />
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-6 left-8 text-white/10 font-heading text-xl uppercase tracking-widest">
        {"DONATIE"}
      </div>
    </div>
  );
}
