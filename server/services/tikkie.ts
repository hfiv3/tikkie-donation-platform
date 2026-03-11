import { v4 as uuidv4 } from "uuid";

const USE_STUB = process.env.TIKKIE_MODE !== "production";
const TIKKIE_API_KEY = process.env.TIKKIE_API_KEY || "";
const TIKKIE_APP_TOKEN = process.env.TIKKIE_APP_TOKEN || "";
const TIKKIE_API_URL = process.env.TIKKIE_SANDBOX === "true"
  ? "https://api-sandbox.abnamro.com/v2/tikkie"
  : "https://api.abnamro.com/v2/tikkie";

const AFTER_PAYMENT_URL = process.env.AFTER_PAYMENT_URL || "";

interface TikkiePaymentRequest {
  amount: number; // in cents
  description: string;
}

interface TikkiePaymentResponse {
  tikkieId: string;
  url: string;
}

/**
 * Create a Tikkie payment request.
 * Uses stub in development, real API in production.
 */
export async function createPaymentRequest(
  req: TikkiePaymentRequest
): Promise<TikkiePaymentResponse> {
  if (USE_STUB) {
    return createStubPayment(req);
  }
  return createRealPayment(req);
}

function createStubPayment(_req: TikkiePaymentRequest): TikkiePaymentResponse {
  const tikkieId = uuidv4();
  return {
    tikkieId,
    url: `https://tikkie.me/pay/stub/${tikkieId}`,
  };
}

async function createRealPayment(
  req: TikkiePaymentRequest
): Promise<TikkiePaymentResponse> {
  const response = await fetch(`${TIKKIE_API_URL}/paymentrequests`, {
    method: "POST",
    headers: {
      "API-Key": TIKKIE_API_KEY,
      "X-App-Token": TIKKIE_APP_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amountInCents: req.amount,
      description: req.description.slice(0, 35), // Tikkie max 35 chars
      expiryDate: getExpiryDate(),
      referenceId: uuidv4().replace(/-/g, "").slice(0, 20),
      ...(AFTER_PAYMENT_URL ? { afterPaymentUrl: AFTER_PAYMENT_URL } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Tikkie API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json() as { paymentRequestToken: string; url: string };

  return {
    tikkieId: data.paymentRequestToken,
    url: data.url,
  };
}

/**
 * Check if a payment request has been paid by querying the Tikkie API.
 * Returns true if at least one payment exists for this request.
 */
export async function checkPaymentStatus(paymentRequestToken: string): Promise<boolean> {
  if (USE_STUB) return false;

  try {
    const response = await fetch(
      `${TIKKIE_API_URL}/paymentrequests/${paymentRequestToken}/payments?pageNumber=0&pageSize=1`,
      {
        headers: {
          "API-Key": TIKKIE_API_KEY,
          "X-App-Token": TIKKIE_APP_TOKEN,
        },
      }
    );

    if (!response.ok) return false;

    const data = await response.json() as {
      totalElementCount?: number;
      payments?: Array<Record<string, unknown>>;
    };

    // If there are any payments, the request has been paid
    return (data.totalElementCount ?? 0) > 0;
  } catch (err) {
    console.error(`Tikkie status check failed for ${paymentRequestToken}:`, err);
    return false;
  }
}

/**
 * Expiry date: 7 days from now in YYYY-MM-DD format.
 */
function getExpiryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split("T")[0];
}
