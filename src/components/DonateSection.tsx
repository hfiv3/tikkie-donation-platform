"use client";

import { useState } from "react";
import { PRESET_AMOUNTS } from "@/lib/constants";
import { formatEuros } from "@/lib/format";
import { createDonation } from "@/lib/api";

interface DonateSectionProps {
  onDonationCreated?: () => void;
}

export default function DonateSection({ onDonationCreated }: DonateSectionProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Invoice fields
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPostcode, setCompanyPostcode] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyKvk, setCompanyKvk] = useState("");
  const [companyBtw, setCompanyBtw] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  const activeAmount = selectedAmount ?? (customAmount ? Number(customAmount) * 100 : 0);

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setError(null);
  };

  const handleCustomChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setCustomAmount(cleaned);
    setSelectedAmount(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!activeAmount || activeAmount < 100) {
      setError("Kies een bedrag van minimaal \u20AC1.");
      return;
    }

    if (activeAmount > 10000000) {
      setError("Maximaal bedrag is \u20AC100.000.");
      return;
    }

    if (wantsInvoice) {
      if (!companyName.trim()) {
        setError("Vul een bedrijfsnaam in voor de factuur.");
        return;
      }
      if (!companyEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail.trim())) {
        setError("Vul een geldig e-mailadres in voor de factuur.");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createDonation({
        amount: activeAmount,
        name: name.trim() || undefined,
        message: message.trim() || undefined,
        wantsInvoice: wantsInvoice || undefined,
        companyName: companyName.trim() || undefined,
        companyAddress: companyAddress.trim() || undefined,
        companyPostcode: companyPostcode.trim() || undefined,
        companyCity: companyCity.trim() || undefined,
        companyKvk: companyKvk.trim() || undefined,
        companyBtw: companyBtw.trim() || undefined,
        companyEmail: companyEmail.trim() || undefined,
      });

      // Open Tikkie payment link
      if (result.tikkieUrl) {
        window.open(result.tikkieUrl, "_blank");
      }

      setSuccess(true);
      setSelectedAmount(null);
      setCustomAmount("");
      setName("");
      setMessage("");
      setWantsInvoice(false);
      setCompanyName("");
      setCompanyAddress("");
      setCompanyPostcode("");
      setCompanyCity("");
      setCompanyKvk("");
      setCompanyBtw("");
      setCompanyEmail("");
      onDonationCreated?.();

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="doneren" className="py-16 md:py-24 px-4 bg-brand-cream">
      <div className="max-w-[600px] mx-auto">
        {/* TODO: Pas de titel aan naar jouw actie */}
        <h2 className="font-heading text-[1.75rem] md:text-[2.25rem] font-bold uppercase tracking-wide text-brand-black mb-8 text-center">
          {"STEUN ONZE "}
          <span className="text-brand-primary">{"ACTIE"}</span>
        </h2>

        {/* Preset amounts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => handlePresetClick(amount)}
              className={`py-4 px-4 rounded-lg font-heading text-[1.5rem] md:text-[2rem] font-bold border-2 transition-all min-h-[56px] ${
                selectedAmount === amount
                  ? "bg-brand-primary text-brand-black border-brand-primary shadow-lg"
                  : "bg-brand-black text-white border-brand-primary hover:bg-brand-primary hover:text-brand-black"
              }`}
            >
              {formatEuros(amount)}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="mb-5">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-lg font-heading font-bold">
              {"\u20AC"}
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ander bedrag"
              value={customAmount}
              onChange={(e) => handleCustomChange(e.target.value)}
              maxLength={7}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-brand-charcoal/20 rounded-lg text-lg font-heading font-bold text-brand-black focus:border-brand-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Name */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Je naam (optioneel, anders Anoniem)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-3 bg-white border-2 border-brand-charcoal/20 rounded-lg font-body text-brand-black focus:border-brand-primary focus:outline-none"
          />
        </div>

        {/* Message */}
        <div className="mb-5">
          <textarea
            placeholder="Laat een bericht achter (optioneel)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full px-4 py-3 bg-white border-2 border-brand-charcoal/20 rounded-lg font-body text-brand-black focus:border-brand-primary focus:outline-none resize-none"
          />
        </div>

        {/* Invoice option */}
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={wantsInvoice}
              onChange={(e) => setWantsInvoice(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-brand-charcoal/20 text-brand-primary focus:ring-brand-primary accent-brand-primary"
            />
            <span className="font-body text-brand-black text-sm">
              {"Ik wil een factuur ontvangen (zakelijk)"}
            </span>
          </label>

          {wantsInvoice && (
            <div className="mt-3 space-y-3 pl-8">
              <input
                type="text"
                placeholder="Bedrijfsnaam *"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-3 bg-white border-2 border-brand-charcoal/20 rounded-lg font-body text-brand-black focus:border-brand-primary focus:outline-none"
              />
              <input
                type="text"
                placeholder="Adres"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-3 bg-white border-2 border-brand-charcoal/20 rounded-lg font-body text-brand-black focus:border-brand-primary focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Postcode"
                  value={companyPostcode}
                  onChange={(e) => setCompanyPostcode(e.target.value)}
                  maxLength={10}
                  className="w-full px-4 py-3 bg-white border-2 border-brand-charcoal/20 rounded-lg font-body text-brand-black focus:border-brand-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Plaats"
                  value={companyCity}
                  onChange={(e) => setCompanyCity(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-white border-2 border-brand-charcoal/20 rounded-lg font-body text-brand-black focus:border-brand-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="KvK-nummer"
                  value={companyKvk}
                  onChange={(e) => setCompanyKvk(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3 bg-white border-2 border-brand-charcoal/20 rounded-lg font-body text-brand-black focus:border-brand-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="BTW-nummer"
                  value={companyBtw}
                  onChange={(e) => setCompanyBtw(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3 bg-white border-2 border-brand-charcoal/20 rounded-lg font-body text-brand-black focus:border-brand-primary focus:outline-none"
                />
              </div>
              <input
                type="email"
                placeholder="E-mailadres voor factuur *"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-3 bg-white border-2 border-brand-charcoal/20 rounded-lg font-body text-brand-black focus:border-brand-primary focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-brand-error/10 border border-brand-error/30 text-brand-error p-3 rounded-lg mb-4 text-center text-sm font-medium">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-brand-success/10 border border-brand-success/30 text-brand-success p-4 rounded-xl mb-4 text-center font-bold">
            {"Bedankt! Rond je betaling af via Tikkie. Je donatie verschijnt zodra de betaling is verwerkt."}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={!activeAmount || isSubmitting}
          className="cta-button w-full py-4 rounded-xl font-heading text-lg uppercase font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{
            background: !activeAmount || isSubmitting
              ? "#9E9E9E"
              : "linear-gradient(90deg, var(--brand-primary-dark) 0%, var(--brand-primary) 50%, var(--brand-primary-light) 100%)",
            color: "var(--brand-black)",
            boxShadow: activeAmount && !isSubmitting
              ? "0 4px 16px rgba(212, 137, 28, 0.4)"
              : "none",
            minHeight: "56px",
          }}
        >
          {isSubmitting
            ? "BEZIG..."
            : activeAmount
            ? `DONEER ${formatEuros(activeAmount)}`
            : "KIES EEN BEDRAG"}
        </button>

        {/* Disclaimer */}
        <p className="text-center text-xs text-brand-muted mt-4">
          {"Je donatie wordt verwerkt via Tikkie. Wil je een factuur? Vink hierboven de optie aan en vul je bedrijfsgegevens in."}
        </p>
      </div>
    </section>
  );
}
