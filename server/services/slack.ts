import fs from "fs";
import path from "path";
import db from "../db";
import { logger } from "../lib/logger";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";

async function sendSlack(text: string): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return;

  try {
    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      logger.error("SLACK", `Webhook fout: ${res.status}`);
    }
  } catch (err) {
    logger.error("SLACK", `Verzenden mislukt: ${err instanceof Error ? err.message : err}`);
  }
}

function formatEuros(cents: number): string {
  return `\u20AC${(cents / 100).toFixed(2).replace(".", ",")}`;
}

// --- Acute alerts (direct verzonden) ---

/** Send an immediate alert for critical issues */
export async function sendAlert(title: string, details: string): Promise<void> {
  await sendSlack(`\uD83D\uDEA8 *${title}*\n${details}`);
}

// --- Event notifications ---

/** Notify when a donation is confirmed as paid */
export async function notifyDonationPaid(name: string, amount: number): Promise<void> {
  await sendSlack(`\uD83D\uDCB0 *Donatie ontvangen!*\n${name} heeft ${formatEuros(amount)} gedoneerd.`);
}

/** Notify when a new donation is created (pending payment) */
export async function notifyDonationCreated(name: string, amount: number): Promise<void> {
  await sendSlack(`\uD83D\uDD14 *Nieuwe donatie aangemaakt*\n${name} \u2014 ${formatEuros(amount)} (wacht op betaling)`);
}

/** Daily summary with all key stats */
export async function sendDailySummary(): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return;

  try {
    // Overall donation stats
    const totals = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS total_raised, COUNT(*) AS total_count
         FROM donations WHERE tikkie_status = 'paid'`
      )
      .get() as { total_raised: number; total_count: number };

    // Today's donations
    const today = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS today_raised, COUNT(*) AS today_count
         FROM donations
         WHERE tikkie_status = 'paid' AND date(created_at) = date('now')`
      )
      .get() as { today_raised: number; today_count: number };

    // Pending donations
    const pending = db
      .prepare(
        `SELECT COUNT(*) AS pending_count
         FROM donations WHERE tikkie_status = 'pending'`
      )
      .get() as { pending_count: number };

    // Goal
    const goalRow = db
      .prepare("SELECT value FROM settings WHERE key = 'goal_cents'")
      .get() as { value: string } | undefined;
    const goalCents = Number(goalRow?.value) || 2500000;
    const remaining = Math.max(0, goalCents - totals.total_raised);
    const percentage = goalCents > 0 ? Math.min(100, (totals.total_raised / goalCents) * 100) : 0;

    // Server stats
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    const uptimeStr = `${Math.floor(uptime / 3600)}u ${Math.floor((uptime % 3600) / 60)}m`;
    const rssMB = Math.round(mem.rss / 1024 / 1024);
    const heapMB = Math.round(mem.heapUsed / 1024 / 1024);

    const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "donatieactie.db");
    let dbSizeMB = 0;
    try { dbSizeMB = Math.round((fs.statSync(dbPath).size / 1024 / 1024) * 100) / 100; } catch { /* ignore */ }

    const lines = [
      `\uD83D\uDCCA *Dagelijks overzicht donatieactie*`,
      ``,
      `*Donaties*`,
      `\u2022 Vandaag: ${today.today_count} donaties \u2014 ${formatEuros(today.today_raised)}`,
      `\u2022 Totaal: ${totals.total_count} donaties \u2014 ${formatEuros(totals.total_raised)}`,
      `\u2022 Streefbedrag: ${formatEuros(goalCents)} (${percentage.toFixed(1)}%)`,
      remaining > 0
        ? `\u2022 Nog te gaan: ${formatEuros(remaining)}`
        : `\u2022 \uD83C\uDF89 Doelbedrag bereikt!`,
      pending.pending_count > 0
        ? `\u2022 \u23F3 ${pending.pending_count} betaling(en) nog in afwachting`
        : null,
      ``,
      `*Server*`,
      `\u2022 Uptime: ${uptimeStr}`,
      `\u2022 Memory: ${rssMB}MB (heap: ${heapMB}MB)`,
      `\u2022 Database: ${dbSizeMB}MB`,
    ];

    await sendSlack(lines.filter(Boolean).join("\n"));
  } catch (err) {
    logger.error("SLACK", `Dagelijks overzicht mislukt: ${err instanceof Error ? err.message : err}`);
  }
}

// --- Health monitoring ---

const MEMORY_THRESHOLD_MB = 512;
const PENDING_THRESHOLD_MINUTES = 60;
let lastMemoryAlert = 0;
let lastPendingAlert = 0;
const ALERT_COOLDOWN = 30 * 60 * 1000; // 30 minuten tussen herhaalde alerts

/** Check server health and alert on issues */
async function checkHealth(): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return;
  const now = Date.now();

  // Check memory usage
  const mem = process.memoryUsage();
  const rssMB = Math.round(mem.rss / 1024 / 1024);
  if (rssMB > MEMORY_THRESHOLD_MB && now - lastMemoryAlert > ALERT_COOLDOWN) {
    lastMemoryAlert = now;
    await sendSlack(
      `\uD83D\uDEA8 *Server alert: hoog geheugengebruik*\n` +
      `RSS: ${rssMB}MB (drempel: ${MEMORY_THRESHOLD_MB}MB)\n` +
      `Heap: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`
    );
  }

  // Check for donations stuck in pending too long
  try {
    const stuck = db
      .prepare(
        `SELECT COUNT(*) AS cnt FROM donations
         WHERE tikkie_status = 'pending'
         AND datetime(created_at) < datetime('now', '-${PENDING_THRESHOLD_MINUTES} minutes')`
      )
      .get() as { cnt: number };

    if (stuck.cnt > 0 && now - lastPendingAlert > ALERT_COOLDOWN) {
      lastPendingAlert = now;
      await sendSlack(
        `\u26A0\uFE0F *Betaling alert*\n` +
        `${stuck.cnt} donatie(s) staan al langer dan ${PENDING_THRESHOLD_MINUTES} minuten op 'pending'.\n` +
        `Mogelijk is er een probleem met Tikkie of heeft de donateur niet betaald.`
      );
    }
  } catch (err) {
    logger.error("SLACK", `Health check fout: ${err instanceof Error ? err.message : err}`);
  }
}

/** Start the daily summary scheduler */
export function startDailySummaryScheduler(): void {
  if (!SLACK_WEBHOOK_URL) {
    logger.warn("SLACK", "Geen SLACK_WEBHOOK_URL geconfigureerd \u2014 notificaties uitgeschakeld");
    return;
  }

  logger.config("Slack notificaties actief");

  // Send daily summary at 20:00
  function scheduleNext() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(20, 0, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    const ms = next.getTime() - now.getTime();
    setTimeout(() => {
      sendDailySummary();
      // Schedule the next one
      setInterval(sendDailySummary, 24 * 60 * 60 * 1000);
    }, ms);

    const hoursUntil = (ms / 3_600_000).toFixed(1);
    logger.config(`Dagelijks Slack overzicht gepland om 20:00 (over ${hoursUntil}u)`);
  }

  scheduleNext();

  // Health monitor — check elke 5 minuten
  setInterval(checkHealth, 5 * 60 * 1000);
  logger.config("Slack health monitor actief (elke 5 min)");
}
