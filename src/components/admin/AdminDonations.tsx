"use client";

import { useState } from "react";
import { formatEuros, formatDate } from "@/lib/format";
import { deleteDonation } from "@/lib/adminApi";
import type { AdminDonation } from "@/lib/adminApi";

interface AdminDonationsProps {
  donations: AdminDonation[];
  onRefresh: () => void;
}

export default function AdminDonations({ donations, onRefresh }: AdminDonationsProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Donatie van ${name} verwijderen?`)) return;
    try {
      await deleteDonation(id);
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Fout bij verwijderen.");
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold uppercase text-white mb-4">
        {"Donaties"}{" "}
        <span className="text-white/40 font-body text-sm normal-case">
          ({donations.length})
        </span>
      </h2>

      {donations.length === 0 ? (
        <p className="text-white/40">{"Nog geen donaties."}</p>
      ) : (
        <div className="space-y-2">
          {donations.map((d) => (
            <div key={d.id} className="bg-brand-charcoal rounded-xl border border-white/5 overflow-hidden">
              {/* Main row */}
              <button
                onClick={() => toggleExpand(d.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                {/* Status indicator */}
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    d.tikkie_status === "paid"
                      ? "bg-brand-success"
                      : d.tikkie_status === "pending"
                      ? "bg-brand-primary"
                      : "bg-brand-error"
                  }`}
                />

                <span className="text-white font-medium text-sm truncate min-w-0 flex-1">
                  {d.name}
                </span>

                <span className="text-brand-primary font-bold font-heading text-sm shrink-0">
                  {formatEuros(d.amount)}
                </span>

                <span className="text-white/30 text-xs shrink-0 hidden sm:inline">
                  {formatDate(d.created_at)}
                </span>

                <span className="text-white/30 text-xs shrink-0">
                  {expandedId === d.id ? "\u25B2" : "\u25BC"}
                </span>
              </button>

              {/* Expanded details */}
              {expandedId === d.id && (
                <div className="px-4 pb-4 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <DetailRow label="Naam" value={d.name} />
                    <DetailRow label="Bedrag" value={formatEuros(d.amount)} accent />
                    <DetailRow label="Datum" value={formatDate(d.created_at)} />
                    <DetailRow
                      label="Tikkie status"
                      value={d.tikkie_status}
                      badge={
                        d.tikkie_status === "paid"
                          ? "success"
                          : d.tikkie_status === "pending"
                          ? "warning"
                          : "error"
                      }
                    />
                    {d.tikkie_id && (
                      <DetailRow label="Tikkie ref" value={d.tikkie_id} mono />
                    )}
                    {d.tikkie_url && (
                      <div className="col-span-2">
                        <p className="text-white/40 text-xs uppercase tracking-wide">
                          {"Tikkie URL"}
                        </p>
                        <a
                          href={d.tikkie_url?.startsWith("https://") ? d.tikkie_url : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-primary text-sm hover:underline break-all"
                        >
                          {d.tikkie_url}
                        </a>
                      </div>
                    )}
                    {d.message && (
                      <div className="col-span-2">
                        <p className="text-white/40 text-xs uppercase tracking-wide">
                          {"Bericht"}
                        </p>
                        <p className="text-white/70 italic">{d.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleDelete(d.id, d.name)}
                      className="text-brand-error/60 hover:text-brand-error text-xs font-bold uppercase"
                    >
                      {"Verwijderen"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  accent,
  mono,
  badge,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
  badge?: "success" | "warning" | "error";
}) {
  return (
    <div>
      <p className="text-white/40 text-xs uppercase tracking-wide">{label}</p>
      {badge ? (
        <span
          className={`inline-block text-xs px-2 py-0.5 rounded mt-0.5 ${
            badge === "success"
              ? "bg-brand-success/20 text-brand-success"
              : badge === "warning"
              ? "bg-brand-primary/20 text-brand-primary"
              : "bg-brand-error/20 text-brand-error"
          }`}
        >
          {value}
        </span>
      ) : (
        <p
          className={`text-sm ${
            accent ? "text-brand-primary font-bold" : "text-white"
          } ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}
