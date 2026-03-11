"use client";

import { useState, useEffect } from "react";
import { formatEuros } from "@/lib/format";
import { getSettings, updateSettings } from "@/lib/adminApi";
import type { AdminSettings as SettingsType } from "@/lib/adminApi";

interface AdminSettingsProps {
  onRefresh: () => void;
}

export default function AdminSettings({ onRefresh }: AdminSettingsProps) {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err: unknown) {
      console.error("Failed to fetch settings:", err instanceof Error ? err.message : err);
    }
  };

  const startEdit = (key: string, currentValue: string) => {
    setEditing(key);
    // For goal_cents, show as euros
    if (key === "goal_cents") {
      setEditValue(String(Number(currentValue) / 100));
    } else {
      setEditValue(currentValue);
    }
    setError(null);
  };

  const handleSave = async () => {
    if (!editing || !settings) return;
    setSaving(true);
    setError(null);

    try {
      let value = editValue;
      if (editing === "goal_cents") {
        const cents = Math.round(Number(editValue) * 100);
        if (isNaN(cents) || cents <= 0) {
          setError("Ongeldig bedrag.");
          setSaving(false);
          return;
        }
        value = String(cents);
      }

      await updateSettings({ [editing]: value });
      await fetchSettings();
      onRefresh();
      setEditing(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fout bij opslaan.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValue("");
    setError(null);
  };

  if (!settings) {
    return <p className="text-white/40">{"Instellingen laden..."}</p>;
  }

  const fields = [
    {
      key: "campaign_name",
      label: "Campagnenaam",
      display: settings.campaign_name,
      type: "text" as const,
    },
    {
      key: "goal_cents",
      label: "Doelbedrag",
      display: formatEuros(Number(settings.goal_cents)),
      type: "number" as const,
      prefix: "\u20AC",
    },
    {
      key: "deadline",
      label: "Deadline",
      display: settings.deadline,
      type: "date" as const,
    },
  ];

  return (
    <div className="bg-brand-charcoal rounded-xl p-5 border border-white/5 mb-6">
      <h3 className="font-heading text-lg font-bold uppercase text-white mb-4">
        {"Campagne-instellingen"}
      </h3>

      <div className="space-y-3">
        {fields.map((field) => (
          <div
            key={field.key}
            className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-white/40 text-xs uppercase tracking-wide">
                {field.label}
              </p>
              {editing === field.key ? (
                <div className="flex items-center gap-2 mt-1">
                  {field.prefix && (
                    <span className="text-white/50">{field.prefix}</span>
                  )}
                  <input
                    type={field.type}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") handleCancel();
                    }}
                    autoFocus
                    className="px-3 py-1.5 bg-brand-black border border-white/20 rounded-lg text-white text-sm focus:border-brand-primary focus:outline-none w-full max-w-[250px]"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-brand-success text-sm font-bold hover:underline"
                  >
                    {saving ? "..." : "Opslaan"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-white/40 text-sm hover:text-white"
                  >
                    {"Annuleer"}
                  </button>
                </div>
              ) : (
                <p className="text-white font-medium text-sm">
                  {field.display}
                </p>
              )}
            </div>

            {editing !== field.key && (
              <button
                onClick={() => startEdit(field.key, settings[field.key as keyof SettingsType])}
                className="text-brand-primary text-xs font-bold uppercase hover:underline shrink-0"
              >
                {"Wijzig"}
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-brand-error text-sm mt-3">{error}</p>
      )}
    </div>
  );
}
