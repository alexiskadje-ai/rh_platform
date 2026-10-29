import { PaymentGateway, RefundStatus, Role } from "@prisma/client";

const NOTCHPAY_API_BASE = "https://api.notchpay.co";

export class NotchpayRequestError extends Error {
  readonly httpStatus: number;
  readonly body: string;

  constructor(message: string, httpStatus: number, body: string) {
    super(message);
    this.name = "NotchpayRequestError";
    this.httpStatus = httpStatus;
    this.body = body;
  }
}

export type NotchpayCustomer = {
  name: string;
  email: string;
  phone: string;
};

export type NotchpayTransaction = {
  reference: string;
  trxref: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  feeAmount: number | null;
  raw: unknown;
};

export type NotchpayOutcome = "success" | "failed" | "pending";

const KNOWN_NOTCHPAY_STATUSES = new Set([
  "pending",
  "processing",
  "complete",
  "failed",
  "canceled",
  "expired",
]);

type NotchpayCall = {
  method: "GET" | "POST" | "PUT";
  path: string;
  body?: unknown;
  grant?: boolean;
};

export function isNotchpayEnabled() {
  return process.env.NOTCHPAY_ENABLED?.trim() === "true";
}

export function isNotchpaySandbox() {
  return (process.env.NOTCHPAY_API_KEY ?? "").toLowerCase().includes("test");
}

export function isNotchpayRefundsEnabled() {
  return process.env.NOTCHPAY_REFUNDS_ENABLED?.trim() === "true";
}

export function normalizeOrangeWalletPhone(value: string) {
  const compact = value.trim().replace(/[\s.-]/g, "");
  const withPrefix = compact.startsWith("+237")
    ? compact
    : compact.startsWith("237")
      ? `+${compact}`
      : `+237${compact}`;
  if (!/^\+2376\d{8}$/.test(withPrefix)) {
    throw new Error("Numéro Orange Money invalide.");
  }
  return withPrefix;
}

function publicKey() {
  const key = process.env.NOTCHPAY_API_KEY?.trim();
  if (!key) {
    throw new Error("NOTCHPAY_API_KEY est absente.");
  }
  return key;
}

function privateKey() {
  const key = process.env.NOTCHPAY_PRIVATE_KEY?.trim();
  if (!key) {
    throw new Error("NOTCHPAY_PRIVATE_KEY est absente.");
  }
  return key;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

export function readNotchpayTransaction(payload: unknown): NotchpayTransaction | null {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const transaction =
    asRecord(root?.transaction) ?? asRecord(data?.transaction) ?? asRecord(data?.payment);
  if (!transaction) return null;
  const reference = readString(transaction.reference);
  if (!reference) return null;
  const amount = readAmount(transaction.amount);
  const total = readAmount(asRecord(transaction.amounts)?.total);
  noteAmountGap(reference, amount, total);
  return {
    reference,
    trxref: readString(transaction.trxref),
    amount,
    currency: readString(transaction.currency),
    status: readString(transaction.status),
    feeAmount: readFeeAmount(transaction.fees),
    raw: payload,
  };
}

const notedAmountGaps = new Set<string>();

export function noteAmountGap(reference: string, amount: number | null, total: number | null) {
  if (amount === null || total === null || amount === total) return;
  if (notedAmountGaps.has(reference)) return;
  notedAmountGaps.add(reference);
  console.error(
    "[notchpay] écart entre amount et amounts.total — feeAmount laissé NULL, à confirmer dans le tableau de bord",
    { reference, amount, amountsTotal: total },
  );
}

export function readFeeAmount(fees: unknown) {
  if (!Array.isArray(fees) || fees.length === 0) return null;
  let sum = 0;
  for (const fee of fees) {
    const amount = typeof fee === "number" ? readAmount(fee) : readAmount(asRecord(fee)?.amount);
    if (amount === null) {
      console.error("[notchpay] frais illisible");
      return null;
    }
    sum += amount;
  }
  return sum;
}

export function interpretNotchpayStatus(status: string | null): NotchpayOutcome {
  const value = status?.trim().toLowerCase() ?? "";
  if (value === "complete") return "success";
  if (value === "failed" || value === "canceled" || value === "expired") return "failed";
  if (!KNOWN_NOTCHPAY_STATUSES.has(value)) {
    console.error("[notchpay] statut inconnu", { status: value || null });
  }
  return "pending";
}

async function notchpayCall(call: NotchpayCall) {
  const headers = new Headers();
  headers.set("Authorization", publicKey());
  headers.set("Accept", "application/json");
  if (call.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (call.grant) {
    headers.set("X-Grant", privateKey());
  }

  const response = await fetch(`${NOTCHPAY_API_BASE}${call.path}`, {
    method: call.method,
    headers,
    body: call.body === undefined ? undefined : JSON.stringify(call.body),
  });
  const body = await response.text();
  return { httpStatus: response.status, body };
}

function parseJson(body: string) {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

function okStatus(httpStatus: number) {
  return httpStatus >= 200 && httpStatus < 300;
}

export function notchpayCustomerMessage(fallback: string, body: string) {
  const message = readString(asRecord(parseJson(body))?.message) ?? "";
  if (message.toLowerCase().includes("invalid test phone number")) {
    return "Notch Pay est en mode test. Pour simuler un paiement réussi, indiquez +237670000000.";
  }
  if (message && message.length <= 180 && !/key|secret|token/i.test(message)) return message;
  return fallback;
}

export async function initiatePayment(input: {
  reference: string;
  amount: number;
  description: string;
  customer: NotchpayCustomer;
  callback?: string;
}) {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("Montant Notch Pay invalide.");
  }
  const body = {
    amount: input.amount,
    currency: "XAF",
    customer: input.customer,
    description: input.description,
    reference: input.reference,
    ...(input.callback ? { callback: input.callback } : {}),
  };
  const response = await notchpayCall({ method: "POST", path: "/payments", body });
  const payload = parseJson(response.body);
  const transaction = readNotchpayTransaction(payload);
  if (response.httpStatus !== 201 || !transaction) {
    throw new NotchpayRequestError(
      "Initialisation Notch Pay refusée.",
      response.httpStatus,
      response.body,
    );
  }
  return { gatewayReference: transaction.reference, transaction };
}

export function orangeChargeRequest(gatewayReference: string, phone: string) {
  return {
    method: "POST" as const,
    path: `/payments/${encodeURIComponent(gatewayReference)}`,
    body: {
      channel: "cm.orange",
      data: { phone: normalizeOrangeWalletPhone(phone) },
    },
  };
}

export async function chargeOrange(gatewayReference: string, phone: string) {
  const request = orangeChargeRequest(gatewayReference, phone);
  const response = await notchpayCall(request);
  const payload = parseJson(response.body);
  const transaction = readNotchpayTransaction(payload);
  if (response.httpStatus !== 202 || !transaction) {
    throw new NotchpayRequestError(
      notchpayCustomerMessage("Charge Orange Money refusée.", response.body),
      response.httpStatus,
      response.body,
    );
  }
  return { transaction };
}

export async function getStatus(gatewayReference: string) {
  const response = await notchpayCall({
    method: "GET",
    path: `/payments/${encodeURIComponent(gatewayReference)}`,
  });
  const payload = parseJson(response.body);
  const transaction = readNotchpayTransaction(payload);
  if (!okStatus(response.httpStatus) || !transaction) {
    throw new NotchpayRequestError(
      "Lecture Notch Pay refusée.",
      response.httpStatus,
      response.body,
    );
  }
  return transaction;
}

export async function beginOrangeCharge(input: {
  paymentId: string;
  description: string;
  customer: NotchpayCustomer;
  walletPhone: string;
  callback?: string;
}) {
  const { db } = await import("@/lib/db");
  const payment = await db.payment.findUnique({ where: { id: input.paymentId } });
  if (!payment) {
    throw new Error("Paiement introuvable.");
  }
  if (payment.gateway && payment.gateway !== PaymentGateway.NOTCHPAY) {
    throw new Error("Ce paiement n'est pas un paiement Notch Pay.");
  }

  const walletPhone = normalizeOrangeWalletPhone(input.walletPhone);
  let gatewayReference = payment.gatewayReference;

  if (gatewayReference) {
    const remote = await getStatus(gatewayReference);
    if (remote.status && remote.status !== "pending") {
      return { gatewayReference, transaction: remote, alreadyCharged: true as const };
    }
  } else {
    const initiated = await initiatePayment({
      reference: payment.reference,
      amount: payment.amount,
      description: input.description,
      customer: input.customer,
      callback: input.callback,
    });
    gatewayReference = initiated.gatewayReference;
    await db.payment.update({
      where: { id: payment.id },
      data: {
        gateway: PaymentGateway.NOTCHPAY,
        gatewayReference,
        customerWalletPhone: walletPhone,
        feeAmount: initiated.transaction.feeAmount,
      },
    });
  }

  const charged = await chargeOrange(gatewayReference, walletPhone);
  await db.payment.update({
    where: { id: payment.id },
    data: {
      gateway: PaymentGateway.NOTCHPAY,
      gatewayReference,
      customerWalletPhone: walletPhone,
      feeAmount: charged.transaction.feeAmount,
      status: "processing",
    },
  });
  return { gatewayReference, transaction: charged.transaction, alreadyCharged: false as const };
}

const REFUND_DISABLED =
  "Les remboursements Notch Pay sont désactivés. Passez par la liste « Remboursements à effectuer ».";

export async function refund(input: { paymentReference: string; amount: number; reason?: string }) {
  if (!isNotchpayRefundsEnabled()) {
    return { ok: false as const, error: REFUND_DISABLED };
  }

  const { getSessionUser } = await import("@/lib/dal");
  const { db } = await import("@/lib/db");
  const admin = await getSessionUser();
  if (!admin || admin.role !== Role.ADMIN) {
    return { ok: false as const, error: "Seul un administrateur authentifié peut rembourser." };
  }
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return { ok: false as const, error: "Montant de remboursement invalide." };
  }

  const payment = await db.payment.findUnique({
    where: { reference: input.paymentReference },
  });
  if (!payment || payment.gateway !== PaymentGateway.NOTCHPAY) {
    return { ok: false as const, error: "Ce paiement n'est pas un paiement Notch Pay." };
  }
  if (payment.status !== "paid") {
    return { ok: false as const, error: "Seuls les paiements Notch Pay au statut complet peuvent être remboursés." };
  }
  if (payment.amount !== input.amount) {
    return { ok: false as const, error: "Le remboursement doit porter sur le montant exact du paiement." };
  }
  if (
    payment.refundStatus === RefundStatus.PENDING ||
    payment.refundStatus === RefundStatus.DONE
  ) {
    return { ok: false as const, error: "Ce paiement a déjà un remboursement en cours ou terminé." };
  }
  if (!payment.gatewayReference) {
    return { ok: false as const, error: "Référence Notch Pay manquante." };
  }

  const remote = await getStatus(payment.gatewayReference);
  if (remote.status !== "complete" || remote.currency !== "XAF" || remote.amount !== payment.amount) {
    return {
      ok: false as const,
      error: "Notch Pay ne confirme pas un paiement complet pour ce montant.",
    };
  }

  const claimed = await db.payment.updateMany({
    where: {
      id: payment.id,
      gateway: PaymentGateway.NOTCHPAY,
      status: "paid",
      amount: payment.amount,
      refundStatus: RefundStatus.NONE,
    },
    data: { refundStatus: RefundStatus.PENDING },
  });
  if (claimed.count !== 1) {
    return { ok: false as const, error: "Ce paiement a déjà un remboursement en cours ou terminé." };
  }

  let response: { httpStatus: number; body: string };
  try {
    response = await notchpayCall({
      method: "POST",
      path: "/refunds",
      grant: true,
      body: {
        payment: payment.gatewayReference,
        amount: payment.amount,
        ...(input.reason ? { reason: input.reason } : {}),
      },
    });
  } catch {
    await db.activityLog.create({
      data: {
        userId: admin.id,
        action: "notchpay.refund",
        entity: "Payment",
        entityId: payment.id,
        metadata: {
          reference: payment.reference,
          amount: payment.amount,
          outcome: "unreachable",
        },
      },
    });
    return {
      ok: false as const,
      error: "Le remboursement Notch Pay n'a pas abouti. Il reste en attente et ne peut pas être relancé.",
    };
  }

  const payload = parseJson(response.body);
  const refundRecord = asRecord(payload);
  const refundData = asRecord(refundRecord?.refund) ?? asRecord(asRecord(refundRecord?.data)?.refund);
  const refundStatus = readString(refundData?.status);

  await db.activityLog.create({
    data: {
      userId: admin.id,
      action: "notchpay.refund",
      entity: "Payment",
      entityId: payment.id,
      metadata: {
        reference: payment.reference,
        amount: payment.amount,
        httpStatus: response.httpStatus,
        refundStatus,
      },
    },
  });

  if (!okStatus(response.httpStatus) || refundStatus === "failed" || !refundStatus) {
    return {
      ok: false as const,
      error: "Le remboursement Notch Pay a échoué. Il reste en attente et ne peut pas être relancé.",
      httpStatus: response.httpStatus,
      body: response.body,
    };
  }

  if (refundStatus === "complete") {
    await db.payment.update({
      where: { id: payment.id },
      data: { refundStatus: RefundStatus.DONE },
    });
  }

  return { ok: true as const, refundStatus };
}
