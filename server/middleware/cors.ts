import cors from "cors";

const isProduction = process.env.NODE_ENV === "production";

// In production: same origin (Express serves everything), no CORS needed
// In dev: allow Next.js dev server on :3000
const ALLOWED_ORIGINS = isProduction
  ? []
  : ["http://localhost:3000", "http://localhost:3001"];

if (process.env.CORS_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.CORS_ORIGIN);
}

export const corsMiddleware = cors({
  origin: isProduction ? false : ALLOWED_ORIGINS,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
