import db from "../db";

/**
 * Seed default settings if they don't exist yet.
 */
function seedSettings(): void {
  const insertSetting = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
  );

  // TODO: Pas deze defaults aan naar jouw donatieactie
  const defaults: Record<string, string> = {
    goal_cents: "2500000",        // Streefbedrag: €25.000
    deadline: "2026-12-31",       // Deadline van de actie
    campaign_name: "Jouw Donatieactie",
  };

  for (const [key, value] of Object.entries(defaults)) {
    insertSetting.run(key, value);
  }
  console.log("Settings seeded (skipped existing).");
}

/**
 * Seed the database with default settings on first run.
 */
export function seedIfEmpty(): void {
  seedSettings();
  console.log("Database ready.");
}
