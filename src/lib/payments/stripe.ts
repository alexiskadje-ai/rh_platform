import Stripe from "stripe";
import { APP_NAME } from "@/lib/constants";

let client: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function stripeCurrency() {
  return (process.env.STRIPE_CURRENCY?.trim() || "xaf").toLowerCase();
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
}) {
  const stripe = getStripe();
  const currency = stripeCurrency();
  const origin = appOrigin();

  return stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/boutique/commande/${input.orderId}/paiement?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/boutique/commande/${input.orderId}/paiement?stripe=cancel`,
    client_reference_id: input.orderId,
    customer_email: input.customerEmail,
    locale: "fr",
    metadata: {
      orderId: input.orderId,
      reference: input.reference,
    },
    payment_intent_data: {
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
          unit_amount: input.amount,
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
  return getStripe().checkout.sessions.retrieve(sessionId);
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
