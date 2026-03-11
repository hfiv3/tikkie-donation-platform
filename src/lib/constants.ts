// Production: same-origin ("") — Express serves both frontend + API
// Local dev: set NEXT_PUBLIC_API_URL=http://localhost:3001 in .env
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const PRESET_AMOUNTS = [2000, 5000, 10000, 25000]; // in cents

export const POLL_INTERVAL = 15000; // 15 seconds

// TODO: Pas deze tekst aan naar jouw donatieactie
export const WHATSAPP_SHARE_TEXT =
  "Wij zijn een donatieactie gestart! Elke bijdrage helpt ons het doel te bereiken. Doneren kan makkelijk via Tikkie.\n\n\uD83D\uDC49";
