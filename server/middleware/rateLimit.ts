import rateLimit from "express-rate-limit";

// Global rate limiter
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuut
  max: 120, // 120 requests per minuut per IP
  message: { error: "Te veel verzoeken. Probeer het later opnieuw." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip health checks
    return req.path === "/api/health";
  },
});

export const donationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Te veel verzoeken. Probeer het later opnieuw." },
  standardHeaders: true,
  legacyHeaders: false,
});
