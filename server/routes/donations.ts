import { Router, Request, Response } from "express";
import db from "../db";
import { createPaymentRequest } from "../services/tikkie";
import { donationLimiter } from "../middleware/rateLimit";
import { logger } from "../lib/logger";
import { notifyDonationCreated, sendAlert } from "../services/slack";

const router = Router();

// GET /api/donations — recent paid donations for the wall
router.get("/", (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const donations = db
    .prepare(
      `SELECT id, name, amount, message, created_at
      FROM donations
      WHERE tikkie_status = 'paid'
      ORDER BY created_at DESC
      LIMIT ?`
    )
    .all(limit);

  res.json(donations);
});

// POST /api/donations — create donation + Tikkie payment request
router.post("/", donationLimiter, async (req: Request, res: Response) => {
  const { name, amount, message } = req.body;

  // Validation
  const amountCents = Number(amount);
  if (!amountCents || amountCents < 100 || amountCents > 10000000) {
    res.status(400).json({ error: "Bedrag moet tussen \u20AC1 en \u20AC100.000 zijn." });
    return;
  }

  const sanitizedName = typeof name === "string" && name.trim().length > 0
    ? name.trim().slice(0, 100)
    : "Anoniem";

  const sanitizedMessage = typeof message === "string" && message.trim().length > 0
    ? message.trim().slice(0, 500)
    : null;

  const wantsInvoice = req.body.wantsInvoice === true ? 1 : 0;
  const companyName = typeof req.body.companyName === "string" ? req.body.companyName.trim().slice(0, 200) : null;
  const companyAddress = typeof req.body.companyAddress === "string" ? req.body.companyAddress.trim().slice(0, 300) : null;
  const companyPostcode = typeof req.body.companyPostcode === "string" ? req.body.companyPostcode.trim().slice(0, 10) : null;
  const companyCity = typeof req.body.companyCity === "string" ? req.body.companyCity.trim().slice(0, 100) : null;
  const companyKvk = typeof req.body.companyKvk === "string" ? req.body.companyKvk.trim().slice(0, 20) : null;
  const companyBtw = typeof req.body.companyBtw === "string" ? req.body.companyBtw.trim().slice(0, 30) : null;
  const companyEmail = typeof req.body.companyEmail === "string" ? req.body.companyEmail.trim().slice(0, 200) : null;

  try {
    logger.tikkieRequest(sanitizedName, amountCents);

    // Create Tikkie payment request
    // TODO: Pas de description aan naar jouw organisatienaam
    const tikkie = await createPaymentRequest({
      amount: amountCents,
      description: `Donatie - ${sanitizedName}`,
    });

    logger.tikkieSuccess(tikkie.tikkieId, tikkie.url);

    // Stub mode: auto-confirm; production: wait for polling
    const isStub = process.env.TIKKIE_MODE !== "production";
    const status = isStub ? "paid" : "pending";

    const result = db
      .prepare(
        `INSERT INTO donations (name, amount, message, tikkie_status, tikkie_id, tikkie_url, wants_invoice, company_name, company_address, company_postcode, company_city, company_kvk, company_btw, company_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(sanitizedName, amountCents, sanitizedMessage, status, tikkie.tikkieId, tikkie.url, wantsInvoice, companyName, companyAddress, companyPostcode, companyCity, companyKvk, companyBtw, companyEmail);

    logger.donationCreated(result.lastInsertRowid, sanitizedName, amountCents, status);
    notifyDonationCreated(sanitizedName, amountCents);

    res.status(201).json({
      id: result.lastInsertRowid,
      tikkieUrl: isStub ? null : tikkie.url,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Onbekende fout";
    logger.donationFailed(sanitizedName, amountCents, errorMessage);
    sendAlert("Donatie mislukt", `${sanitizedName} \u2014 ${errorMessage}`);
    res.status(500).json({ error: "Er ging iets mis. Probeer het opnieuw." });
  }
});

export default router;
