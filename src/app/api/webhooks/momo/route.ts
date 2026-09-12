import { NextResponse } from "next/server";
import { applyMomoStatus } from "@/lib/payments/sync";

export const runtime = "nodejs";

function referenceFromRequest(request: Request, body: Record<string, unknown>) {
  const headerRef =
    request.headers.get("x-reference-id") ??
    request.headers.get("X-Reference-Id") ??
    request.headers.get("x-referenceid");
  if (headerRef?.trim()) return headerRef.trim();

  const url = new URL(request.url);
  const queryRef = url.searchParams.get("referenceId") ?? url.searchParams.get("externalId");
  if (queryRef?.trim()) return queryRef.trim();

  const candidates = [body.referenceId, body.externalId, body.financialTransactionId];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const referenceId = referenceFromRequest(request, body);
  if (!referenceId) {
    return NextResponse.json({ received: true, ignored: "missing_reference" }, { status: 202 });
  }

  try {
    const payment = await applyMomoStatus(referenceId);
    return NextResponse.json({
      received: true,
      status: payment?.status ?? "unknown",
    });
  } catch (error) {
    console.error("[momo webhook]", error);
    return NextResponse.json({ received: true, error: "sync_failed" }, { status: 202 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
