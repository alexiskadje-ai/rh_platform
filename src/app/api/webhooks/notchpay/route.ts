import { NextResponse } from "next/server";
import { processNotchpayWebhook } from "@/lib/payments/notchpay-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-notch-signature");
  const result = await processNotchpayWebhook(rawBody, signature);
  if (result.httpStatus === 401) {
    return NextResponse.json({ received: false }, { status: 401 });
  }
  if (result.httpStatus === 500) {
    return NextResponse.json({ received: false }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
