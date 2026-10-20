import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPaymentOwner, readNotchpayPaymentStatus } from "@/lib/payments/notchpay-status";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ reference: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { reference } = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Paiement introuvable." }, { status: 401 });
  }

  const payment = await db.payment.findUnique({
    where: { reference },
    include: { order: { select: { userId: true } } },
  });
  const viewer = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, companyId: true },
  });
  if (!payment || !isPaymentOwner(viewer, payment)) {
    return NextResponse.json({ message: "Paiement introuvable." }, { status: 404 });
  }

  const result = await readNotchpayPaymentStatus(payment);
  return NextResponse.json({ etat: result.etat, reference: payment.reference });
}
