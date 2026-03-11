"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEuros } from "@/lib/format";
import {
  setAdminToken,
  getOverview,
  getDonations,
} from "@/lib/adminApi";
import type { AdminOverview, AdminDonation } from "@/lib/adminApi";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminDonations from "@/components/admin/AdminDonations";

type Tab = "overview" | "donations";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [donations, setDonations] = useState<AdminDonation[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [o, d] = await Promise.all([
        getOverview(),
        getDonations(),
      ]);
      setOverview(o);
      setDonations(d);
    } catch {
      // If auth fails, log out
      setLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) fetchAll();
  }, [loggedIn, fetchAll]);

  const handleLogin = async () => {
    setAdminToken(password);
    try {
      await getOverview();
      setLoggedIn(true);
      setLoginError(false);
    } catch {
      setLoginError(true);
    }
  };

  // Login screen
  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-brand-black flex items-center justify-center px-4">
        <div className="bg-brand-charcoal rounded-xl p-8 max-w-sm w-full border border-white/10">
          <h1 className="font-heading text-2xl font-bold text-white uppercase text-center mb-6">
            {"DONATIE "}
            <span className="text-brand-primary">{"ADMIN"}</span>
          </h1>
          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setLoginError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-3 bg-brand-black border-2 border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-brand-primary focus:outline-none mb-4"
          />
          {loginError && (
            <p className="text-brand-error text-sm text-center mb-3">
              {"Onjuist wachtwoord."}
            </p>
          )}
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-lg font-heading font-bold uppercase text-brand-black"
            style={{ background: "linear-gradient(90deg, var(--brand-primary-dark), var(--brand-primary), var(--brand-primary-light))" }}
          >
            {"INLOGGEN"}
          </button>
        </div>
      </main>
    );
  }

  // Dashboard
  return (
    <main className="min-h-screen bg-brand-black">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <h1 className="font-heading text-xl font-bold text-white uppercase">
            {"DONATIE "}
            <span className="text-brand-primary">{"ADMIN"}</span>
          </h1>
          <div className="flex gap-4 items-center">
            <a href="/" className="text-white/40 text-sm hover:text-white">
              {"Naar site \u2192"}
            </a>
            <button
              onClick={() => { setLoggedIn(false); setPassword(""); }}
              className="text-white/40 text-sm hover:text-brand-error"
            >
              {"Uitloggen"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-brand-charcoal rounded-lg p-1 w-fit">
          {(["overview", "donations"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md font-heading text-sm uppercase font-bold transition-colors ${
                tab === t
                  ? "bg-brand-primary text-brand-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {t === "overview" ? "Overzicht" : "Donaties"}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === "overview" && (
          <>
            <AdminSettings onRefresh={fetchAll} />

            {overview && (
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Opgehaald" value={formatEuros(overview.total_raised)} accent />
                <StatCard label="Donaties" value={String(overview.donation_count)} />
              </div>
            )}
          </>
        )}

        {/* Donations tab */}
        {tab === "donations" && (
          <AdminDonations donations={donations} onRefresh={fetchAll} />
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-brand-charcoal rounded-xl p-5 border border-white/5">
      <p className="text-white/40 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-heading text-2xl font-bold ${accent ? "text-brand-primary" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
