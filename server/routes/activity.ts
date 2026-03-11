import { Router } from "express";
import db from "../db";

const router = Router();

interface ActivityRow {
  type: string;
  name: string;
  created_at: string;
}

// GET /api/activity — recent donations for live ticker
router.get("/", (_req, res) => {
  const activities = db
    .prepare(
      `SELECT 'donation' AS type, name, created_at
       FROM donations
       WHERE tikkie_status = 'paid'
       ORDER BY created_at DESC
       LIMIT 20`
    )
    .all() as ActivityRow[];

  res.json(activities);
});

export default router;
