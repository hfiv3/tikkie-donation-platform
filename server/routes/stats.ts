import { Router } from "express";
import db from "../db";

const router = Router();

router.get("/", (_req, res) => {
  const stats = db
    .prepare(
      `SELECT
        COALESCE(SUM(amount), 0) AS total_raised,
        COUNT(*) AS donation_count
      FROM donations
      WHERE tikkie_status = 'paid'`
    )
    .get() as { total_raised: number; donation_count: number };

  // Most popular donation amount
  const popular = db
    .prepare(
      `SELECT amount, COUNT(*) AS cnt
      FROM donations
      WHERE tikkie_status = 'paid'
      GROUP BY amount
      ORDER BY cnt DESC
      LIMIT 1`
    )
    .get() as { amount: number; cnt: number } | undefined;

  // Read goal, deadline, campaign_name from settings
  const settingsRows = db
    .prepare("SELECT key, value FROM settings WHERE key IN ('goal_cents', 'deadline', 'campaign_name')")
    .all() as Array<{ key: string; value: string }>;

  const settings: Record<string, string> = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  res.json({
    totalRaised: stats.total_raised,
    donationCount: stats.donation_count,
    goal: Number(settings.goal_cents) || 2500000,
    deadline: settings.deadline || null,
    campaignName: settings.campaign_name || null,
    popularAmount: popular?.amount ?? null,
  });
});

export default router;
