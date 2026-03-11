const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

function timestamp(): string {
  return new Date().toLocaleTimeString("nl-NL", { hour12: false });
}

function formatAmount(cents: number): string {
  return `\u20AC${(cents / 100).toFixed(2)}`;
}

function log(icon: string, color: string, category: string, message: string) {
  console.log(
    `${COLORS.dim}${timestamp()}${COLORS.reset} ${color}${icon} [${category}]${COLORS.reset} ${message}`
  );
}

export const logger = {
  // Server lifecycle
  startup(message: string) {
    log("\uD83D\uDE80", COLORS.green, "SERVER", message);
  },
  config(message: string) {
    log("\u2699\uFE0F ", COLORS.cyan, "CONFIG", message);
  },

  // Donations
  donationCreated(id: number | bigint, name: string, amount: number, status: string) {
    log("\uD83D\uDCB0", COLORS.green, "DONATIE", `#${id} ${name} \u2014 ${formatAmount(amount)} (${status})`);
  },
  donationPaid(id: number, name: string, amount: number) {
    log("\u2705", COLORS.green, "BETAALD", `#${id} ${name} \u2014 ${formatAmount(amount)} bevestigd via Tikkie`);
  },
  donationFailed(name: string, amount: number, error: string) {
    log("\u274C", COLORS.red, "DONATIE", `${name} \u2014 ${formatAmount(amount)} mislukt: ${error}`);
  },
  donationDeleted(id: string) {
    log("\uD83D\uDDD1\uFE0F ", COLORS.yellow, "DONATIE", `#${id} verwijderd door admin`);
  },

  // Tikkie
  tikkieRequest(name: string, amount: number) {
    log("\uD83D\uDD17", COLORS.blue, "TIKKIE", `Betaallink aanmaken voor ${name} \u2014 ${formatAmount(amount)}`);
  },
  tikkieSuccess(tikkieId: string, url: string) {
    log("\uD83D\uDD17", COLORS.green, "TIKKIE", `Link aangemaakt: ${tikkieId} \u2192 ${url}`);
  },
  tikkieError(status: number, error: string) {
    log("\u274C", COLORS.red, "TIKKIE", `API fout (${status}): ${error}`);
  },
  tikkiePollStart(count: number) {
    log("\uD83D\uDD04", COLORS.cyan, "TIKKIE", `${count} openstaande betaling(en) controleren...`);
  },

  // Admin
  adminAuth(success: boolean, ip: string) {
    if (success) return; // Don't log successful auths
    log("\uD83D\uDD12", COLORS.red, "AUTH", `Ongeldige login poging vanaf ${ip}`);
  },
  adminSettings(keys: string[]) {
    log("\u2699\uFE0F ", COLORS.blue, "ADMIN", `Instellingen bijgewerkt: ${keys.join(", ")}`);
  },

  // Requests (for middleware)
  request(method: string, path: string, status: number, ms: number) {
    const color = status >= 400 ? COLORS.red : status >= 300 ? COLORS.yellow : COLORS.dim;
    log("\u2192", color, "HTTP", `${method} ${path} ${status} (${ms}ms)`);
  },

  // Errors
  error(category: string, message: string) {
    log("\u274C", COLORS.red, category, message);
  },
  warn(category: string, message: string) {
    log("\u26A0\uFE0F ", COLORS.yellow, category, message);
  },
};
