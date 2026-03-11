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

export default function DonationWall() {
  const [activities, setActivities] = useState<Activity[]>([]);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/activity`);
      if (res.ok) setActivities(await res.json());
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  if (activities.length === 0) return null;

  return (
    <section className="py-12 md:py-16 px-4 bg-brand-black">
      <div className="max-w-[720px] mx-auto text-center">
        <h2 className="font-heading text-[1.5rem] md:text-[1.75rem] font-bold uppercase tracking-wide text-white mb-6">
          {"RECENTE "}
          <span className="text-brand-primary">{"DONATIES"}</span>
        </h2>

        <div className="space-y-2">
          {activities.map((a, i) => (
            <div
              key={`${a.type}-${a.name}-${a.created_at}-${i}`}
              className="flex items-center gap-3 bg-brand-charcoal/60 rounded-lg px-4 py-3 text-left"
            >
              <span className="text-lg shrink-0">
                {"\uD83D\uDCB0"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {`${a.name} heeft gedoneerd`}
                </p>
              </div>
              <span className="text-white/30 text-xs shrink-0 whitespace-nowrap">
                {timeAgo(a.created_at)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
