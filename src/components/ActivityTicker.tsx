"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/constants";

interface Activity {
  type: "donation";
  name: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + "Z").getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "zojuist";
  if (diffMin < 60) return `${diffMin} min geleden`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}u geleden`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "gisteren";
  return `${diffDays} dagen geleden`;
}

export default function ActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Fetch on mount and every 30s
  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  // Cycle through activities
  useEffect(() => {
    if (activities.length === 0 || dismissed) return;

    // Show first notification after 2s delay
    const showTimeout = setTimeout(() => setVisible(true), 2000);

    const cycleInterval = setInterval(() => {
      // Fade out
      setVisible(false);
      // After fade-out, switch to next and fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
        setVisible(true);
      }, 500);
    }, 8000);

    return () => {
      clearTimeout(showTimeout);
      clearInterval(cycleInterval);
    };
  }, [activities, dismissed]);

  if (activities.length === 0 || dismissed) return null;

  const activity = activities[currentIndex];
  if (!activity) return null;

  const text = `${activity.name} heeft gedoneerd`;

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 max-w-xs transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="bg-brand-charcoal/95 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">{"\uD83D\uDCB0"}</span>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium leading-snug truncate">
            {text}
          </p>
          <p className="text-white/40 text-xs mt-0.5">
            {timeAgo(activity.created_at)}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/30 hover:text-white/60 text-sm leading-none shrink-0 mt-0.5"
          aria-label="Sluiten"
        >
          {"\u00D7"}
        </button>
      </div>
    </div>
  );
}
