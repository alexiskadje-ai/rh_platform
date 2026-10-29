import { NextResponse } from "next/server";
import { applyStripeStatus, saveStripeReceiptByReference } from "@/lib/payments/sync";
import { verifyStripeWebhook } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  try {
    const event = verifyStripeWebhook(rawBody, signature);

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      if (typeof session.id === "string") {
        await applyStripeStatus(session.id);
      }
    }

    if (event.type === "invoice.paid" || event.type === "invoice.finalized") {
      const invoice = event.data.object;
      const reference = invoice.metadata?.reference;
      if (reference && invoice.hosted_invoice_url) {
        await saveStripeReceiptByReference(reference, invoice.hosted_invoice_url);
      }
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object;
      if (typeof session.id === "string") {
        await applyStripeStatus(session.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe webhook]", error);
    return NextResponse.json(
      { received: false, error: "invalid_signature" },
      { status: 400 },
    );
  }
}
