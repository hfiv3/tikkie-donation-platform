import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import db from "../db";
import { logger } from "../lib/logger";

const router = Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET || "change-me-to-a-secure-secret";

// Rate limiting for auth failures
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || "unknown";
  const now = Date.now();

  // Check rate limit
  const attempt = authAttempts.get(ip);
  if (attempt && attempt.count >= MAX_ATTEMPTS && now < attempt.resetAt) {
    res.status(429).json({ error: "Te veel pogingen. Probeer later opnieuw." });
    return;
  }

  const token = req.headers.authorization?.replace("Bearer ", "") || "";

  // Timing-safe comparison
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(ADMIN_SECRET);
  const valid =
    tokenBuf.length === secretBuf.length &&
    crypto.timingSafeEqual(tokenBuf, secretBuf);

  if (!valid) {
    // Track failed attempt
    if (attempt && now < attempt.resetAt) {
      attempt.count++;
    } else {
      authAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }
    logger.adminAuth(false, ip);
    res.status(401).json({ error: "Niet geautoriseerd." });
    return;
  }

  // Clear failed attempts on success
  authAttempts.delete(ip);
  next();
}

router.use(requireAuth);

// --- Settings ---

// GET /api/admin/settings
router.get("/settings", (_req, res) => {
  const rows = db
    .prepare("SELECT key, value FROM settings")
    .all() as Array<{ key: string; value: string }>;

  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

// PUT /api/admin/settings
router.put("/settings", (req: Request, res: Response) => {
  const updates = req.body as Record<string, string>;

  if (!updates || typeof updates !== "object") {
    res.status(400).json({ error: "Body moet een object zijn." });
    return;
  }

  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );

  const allowed = ["goal_cents", "deadline", "campaign_name"];
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key) && typeof value === "string") {
        upsert.run(key, value);
      }
    }
  });
  tx();

  logger.adminSettings(Object.keys(updates).filter((k) => allowed.includes(k)));

  res.json({ success: true });
});

// --- Overview ---

// GET /api/admin/overview — stats
router.get("/overview", (_req, res) => {
  const stats = db
    .prepare(
      `SELECT
        COALESCE(SUM(amount), 0) AS total_raised,
        COUNT(*) AS donation_count
      FROM donations WHERE tikkie_status = 'paid'`
    )
    .get() as { total_raised: number; donation_count: number };

  res.json(stats);
});

// --- Donations ---

// GET /api/admin/donations — all donations with tikkie details
router.get("/donations", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const donations = db
    .prepare(
      `SELECT id, name, amount, message, tikkie_status, tikkie_id, tikkie_url, created_at, wants_invoice, company_name, company_email
      FROM donations ORDER BY created_at DESC LIMIT ?`
    )
    .all(limit);
  res.json(donations);
});

// DELETE /api/admin/donations/:id
router.delete("/donations/:id", (req: Request, res: Response) => {
  const id = req.params.id as string;
  db.prepare("DELETE FROM donations WHERE id = ?").run(id);
  logger.donationDeleted(id);
  res.json({ success: true });
});

export default router;
