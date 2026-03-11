import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { corsMiddleware } from "./middleware/cors";
import statsRouter from "./routes/stats";
import donationsRouter from "./routes/donations";
import adminRouter from "./routes/admin";
import activityRouter from "./routes/activity";
import { seedIfEmpty } from "./data/seedOnStart";
import { checkPaymentStatus } from "./services/tikkie";
import db from "./db";
import { logger } from "./lib/logger";
import { notifyDonationPaid, sendAlert, startDailySummaryScheduler } from "./services/slack";
import { globalLimiter } from "./middleware/rateLimit";

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT ?? 3000;

// Seed database with default settings (first run)
seedIfEmpty();

// Security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Middleware
app.use(corsMiddleware);
app.use(globalLimiter);
app.use(express.json({ limit: "1mb" }));

// Request logging (only API + mutation requests, skip static files)
app.use((req, res, next) => {
  const isApi = req.path.startsWith("/api/");
  const isMutation = req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS";
  if (isApi || isMutation) {
    const start = Date.now();
    res.on("finish", () => {
      // Skip noisy polling requests (stats/donations GET)
      const isPolling = req.method === "GET" && (req.path === "/api/stats" || req.path === "/api/donations" || req.path === "/api/activity");
      if (!isPolling) {
        logger.request(req.method, req.path, res.statusCode, Date.now() - start);
      }
    });
  }
  next();
});

// API routes
app.use("/api/stats", statsRouter);
app.use("/api/donations", donationsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/activity", activityRouter);

// Health check — basic (for Uptime Kuma ping)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Extended health — detailed stats for monitoring
app.get("/api/health/details", (_req, res) => {
  const mem = process.memoryUsage();
  const uptime = process.uptime();

  // DB stats
  const dbStats = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM donations) AS total_donations,
        (SELECT COUNT(*) FROM donations WHERE tikkie_status = 'paid') AS paid_donations,
        (SELECT COUNT(*) FROM donations WHERE tikkie_status = 'pending') AS pending_donations,
        (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE tikkie_status = 'paid') AS total_raised`
    )
    .get() as Record<string, number>;

  // DB file size
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "donatieactie.db");
  let dbSizeMB = 0;
  try {
    dbSizeMB = Math.round((fs.statSync(dbPath).size / 1024 / 1024) * 100) / 100;
  } catch { /* ignore */ }

  res.json({
    status: "ok",
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      heap_used: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heap_total: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    },
    db: {
      size: `${dbSizeMB}MB`,
      ...dbStats,
    },
    tikkie_mode: process.env.TIKKIE_MODE || "stub",
    node_env: process.env.NODE_ENV || "development",
  });
});

// Serve Next.js static export — always try, not just in "production"
const candidates = [
  path.join(process.cwd(), "out"),
  path.join(__dirname, "../out"),
  path.join(__dirname, "../../out"),
];

const staticPath = candidates.find((p) => fs.existsSync(p));

if (staticPath) {
  logger.config(`Static files: ${staticPath}`);
  app.use(express.static(staticPath, { extensions: ["html"], redirect: false }));

  // Fallback: resolve Next.js static export pages
  app.get("*", (req, res) => {
    const clean = req.path.replace(/\/+$/, "") || "/index";
    // Try /admin -> admin.html
    const pagePath = path.join(staticPath, clean + ".html");
    if (fs.existsSync(pagePath)) {
      return res.sendFile(pagePath);
    }
    // Try /admin/ -> admin/index.html
    const dirIndex = path.join(staticPath, clean, "index.html");
    if (fs.existsSync(dirIndex)) {
      return res.sendFile(dirIndex);
    }
    // Default fallback to root index.html
    res.sendFile(path.join(staticPath, "index.html"));
  });
} else {
  logger.warn("SERVER", `Geen static files gevonden. Gecontroleerd: ${candidates.join(", ")}`);
  app.get("*", (_req, res) => {
    res.status(404).json({ error: "Frontend not found" });
  });
}

app.listen(Number(PORT), "0.0.0.0", () => {
  logger.startup(`Donatieplatform draait op 0.0.0.0:${PORT}`);
  logger.config(`Tikkie modus: ${process.env.TIKKIE_MODE || "stub"}`);
  logger.config(`Database: ${process.env.DB_PATH || "data/donatieactie.db"}`);

  // Poll Tikkie API for pending donations every 30 seconds
  if (process.env.TIKKIE_MODE === "production") {
    const POLL_INTERVAL = 30_000;

    async function pollPendingDonations() {
      try {
        const pending = db
          .prepare("SELECT id, tikkie_id FROM donations WHERE tikkie_status = 'pending' AND tikkie_id IS NOT NULL")
          .all() as Array<{ id: number; tikkie_id: string }>;

        if (pending.length > 0) {
          logger.tikkiePollStart(pending.length);
        }

        for (const donation of pending) {
          const paid = await checkPaymentStatus(donation.tikkie_id);
          if (paid) {
            const row = db.prepare("SELECT name, amount FROM donations WHERE id = ?").get(donation.id) as { name: string; amount: number };
            db.prepare("UPDATE donations SET tikkie_status = 'paid' WHERE id = ?").run(donation.id);
            logger.donationPaid(donation.id, row.name, row.amount);
            notifyDonationPaid(row.name, row.amount);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error("TIKKIE", `Polling fout: ${msg}`);
        sendAlert("Tikkie polling fout", msg);
      }
    }

    // Run immediately, then every 30 seconds
    pollPendingDonations();
    setInterval(pollPendingDonations, POLL_INTERVAL);
    logger.config("Tikkie polling actief (elke 30s)");
  }

  // Start Slack daily summary scheduler
  startDailySummaryScheduler();
});

// --- Acute alerts: crash & unhandled errors ---

process.on("uncaughtException", (err) => {
  logger.error("CRASH", `Uncaught exception: ${err.message}`);
  sendAlert("Server crash: uncaught exception", `${err.message}\n\`\`\`${err.stack?.slice(0, 500)}\`\`\``);
});

process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  logger.error("CRASH", `Unhandled rejection: ${msg}`);
  sendAlert("Server error: unhandled rejection", msg);
});
