"use client";

import { useState, useEffect, useCallback } from "react";
import { getStats, getDonations } from "@/lib/api";
import { POLL_INTERVAL } from "@/lib/constants";
import type { Stats, Donation } from "@/lib/types";

const DEFAULT_STATS: Stats = {
  totalRaised: 0,
  donationCount: 0,
  goal: 2500000,
  deadline: null,
  campaignName: null,
  popularAmount: null,
};

export function useDonations() {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, donationsData] = await Promise.all([
        getStats(),
        getDonations(20),
      ]);
      setStats(statsData);
      setDonations(donationsData);
    } catch (err: unknown) {
      console.error("Failed to fetch donation data:", err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { stats, donations, loading, refetch: fetchData };
}
