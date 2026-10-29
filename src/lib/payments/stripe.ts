import Stripe from "stripe";
import { APP_NAME } from "@/lib/constants";

let client: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function stripeCurrency() {
  return (process.env.STRIPE_CURRENCY?.trim() || "xaf").toLowerCase();
}

const ZERO_DECIMAL = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

/** XAF is charged in whole francs. Other currencies are sent in minor units. */
export function stripeUnitAmount(amount: number, currency = stripeCurrency()) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Montant Stripe invalide.");
  }
  return ZERO_DECIMAL.has(currency) ? amount : amount * 100;
}

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("Stripe n'est pas configuré. Renseignez STRIPE_SECRET_KEY.");
  }
  if (!client) {
    client = new Stripe(secret);
  }
  return client;
}

function appOrigin() {
  return (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export async function createCheckoutSession(input: {
  orderId: string;
  reference: string;
  amount: number;
  customerEmail: string;
  description: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  const stripe = getStripe();
  const currency = stripeCurrency();
  const origin = appOrigin();

  return stripe.checkout.sessions.create({
    mode: "payment",
    success_url:
      input.successUrl ??
      `${origin}/boutique/commande/${input.orderId}/paiement?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:
      input.cancelUrl ??
      `${origin}/boutique/commande/${input.orderId}/paiement?stripe=cancel`,
    client_reference_id: input.orderId,
    customer_email: input.customerEmail,
    locale: "fr",
    metadata: {
      orderId: input.orderId,
      reference: input.reference,
    },
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: input.description,
        metadata: {
          orderId: input.orderId,
          reference: input.reference,
        },
      },
    },
    payment_intent_data: {
      receipt_email: input.customerEmail,
      metadata: {
        orderId: input.orderId,
        reference: input.reference,
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: stripeUnitAmount(input.amount, currency),
          product_data: {
            name: `${APP_NAME} — ${input.reference}`,
            description: input.description,
          },
        },
      },
    ],
  });
}

export async function retrieveCheckoutSession(sessionId: string) {
  return getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent.latest_charge", "invoice"],
  });
}

export async function resolveStripeReceiptUrl(session: Stripe.Checkout.Session) {
  const invoice = session.invoice;
  try {
    if (invoice && typeof invoice !== "string") {
      if (invoice.hosted_invoice_url) return invoice.hosted_invoice_url;
    } else if (typeof invoice === "string") {
      const full = await getStripe().invoices.retrieve(invoice);
      if (full.hosted_invoice_url) return full.hosted_invoice_url;
    }
  } catch {
    // The charge receipt remains if the hosted invoice is not ready yet.
  }
  const intent = session.payment_intent;
  if (!intent || typeof intent === "string") return null;
  const charge = intent.latest_charge;
  if (!charge || typeof charge === "string") return null;
  return charge.receipt_url ?? null;
}

export async function refundCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntent = session.payment_intent;
  const paymentIntentId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
  if (!paymentIntentId) {
    throw new Error("Paiement Stripe introuvable pour ce remboursement.");
  }
  await stripe.refunds.create({ payment_intent: paymentIntentId });
}

export function verifyStripeWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET n'est pas configuré.");
  }
  if (!signature) {
    throw new Error("Signature Stripe manquante.");
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}
