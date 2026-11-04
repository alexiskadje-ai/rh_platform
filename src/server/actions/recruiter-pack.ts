"use server";

import { PaymentProvider, SubscriptionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  BILLING_CYCLE_LABELS,
  RECRUITER_ONBOARDING_CONFIRM_PATH,
  recruiterPackPath,
  RECRUITER_PACK_LABELS,
  resolvePackPrice,
} from "@/lib/config/recruiter-packs";
import { db } from "@/lib/db";
import { requireOnboardingRecruiter } from "@/lib/recruiter-onboarding";
import { PAYMENT_STATUS, markPaymentFailed } from "@/lib/payments/confirm";
import { beginMobileMoneyCharge, resolveMobileMoneyProvider } from "@/lib/payments/notchpay";
import { createCheckoutSession, isStripeConfigured } from "@/lib/payments/stripe";
import { applyMomoStatus, applyNotchpayStatus, applyStripeStatus } from "@/lib/payments/sync";
import {
  buildRecruiterPackReference,
  newRecruiterPackUnique,
  parseRecruiterPackReference,
} from "@/lib/recruiter-pack-reference";
import { fieldErrorsFromZod } from "@/lib/users";
import { phoneSchema } from "@/lib/validations/auth";
import { recruiterPackCheckoutSchema } from "@/lib/validations/recruiter-pack";

export type RecruiterPackPaymentState = {
  ok?: boolean;
  message?: string;
  status?: string;
  checkoutUrl?: string;
  reference?: string;
  errors?: Record<string, string[] | undefined>;
};

function appOrigin() {
  return (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export async function startRecruiterPackPayment(
  _prev: RecruiterPackPaymentState,
  formData: FormData,
): Promise<RecruiterPackPaymentState> {
  const user = await requireOnboardingRecruiter();
  const company = user.company;
  const subscription = company.recruiterSubscription;
  if (
    subscription &&
    subscription.status !== SubscriptionStatus.REJECTED &&
    subscription.status !== SubscriptionStatus.CANCELLED
  ) {
    return { ok: true, status: PAYMENT_STATUS.paid, message: "Votre demande est déjà enregistrée." };
  }

  const parsed = recruiterPackCheckoutSchema.safeParse({
    tier: formData.get("tier"),
    cycle: formData.get("cycle"),
    provider: formData.get("provider"),
    phone: formData.get("phone") || undefined,
    acceptTerms: formData.get("acceptTerms"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const { tier, cycle } = parsed.data;
  let phone: string | undefined;
  let provider: "MTN_MOMO" | "ORANGE_MONEY" | "CARD" = "CARD";
  if (parsed.data.provider === "MOBILE_MONEY") {
    const phoneParsed = phoneSchema.safeParse(parsed.data.phone ?? "");
    if (!phoneParsed.success) {
      return { errors: { phone: phoneParsed.error.issues.map((issue) => issue.message) } };
    }
    try {
      provider = resolveMobileMoneyProvider(phoneParsed.data);
    } catch (error) {
      return {
        message:
          error instanceof Error
            ? error.message
            : "Ce numéro n'est ni MTN MoMo (67) ni Orange Money (69).",
      };
    }
    phone = phoneParsed.data;
  }

  if (provider === "CARD" && !isStripeConfigured()) {
    return { message: "Stripe n'est pas configuré. Renseignez STRIPE_SECRET_KEY." };
  }

  const amount = resolvePackPrice(tier, cycle);
  const reference = buildRecruiterPackReference({
    tier,
    cycle,
    companyId: company.id,
    unique: newRecruiterPackUnique(),
  });
  const payment = await db.payment.create({
    data: {
      provider:
        provider === "MTN_MOMO"
          ? PaymentProvider.MTN_MOMO
          : provider === "ORANGE_MONEY"
            ? PaymentProvider.ORANGE_MONEY
            : PaymentProvider.CARD,
      amount,
      status: PAYMENT_STATUS.pending,
      reference,
      phone,
    },
  });

  try {
    if (provider === "MTN_MOMO" || provider === "ORANGE_MONEY") {
      await beginMobileMoneyCharge({
        provider,
        paymentId: payment.id,
        description: `Pack ${RECRUITER_PACK_LABELS[tier]} · ${BILLING_CYCLE_LABELS[cycle]}`,
        customer: {
          name: `${user.firstName} ${user.lastName}`.trim() || company.name,
          email: user.email,
          phone: phone ?? "",
        },
        walletPhone: phone ?? "",
      });
      revalidatePath(RECRUITER_ONBOARDING_CONFIRM_PATH);
      revalidatePath(recruiterPackPath(tier));
      return {
        ok: true,
        status: PAYMENT_STATUS.pending,
        reference,
        message: "Validez la demande de paiement sur votre téléphone.",
      };
    }

    if (provider === "CARD") {
      const base = `${appOrigin()}${recruiterPackPath(tier)}?cycle=${cycle}`;
      const session = await createCheckoutSession({
        orderId: reference,
        reference,
        amount,
        customerEmail: user.email,
        description: `Pack ${RECRUITER_PACK_LABELS[tier]} · ${BILLING_CYCLE_LABELS[cycle]}`,
        successUrl: `${base}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${base}&paiement=echec`,
      });
      if (!session.url) {
        await markPaymentFailed(payment.id, "Stripe n'a pas renvoyé d'URL de paiement.");
        return { message: "Stripe n'a pas renvoyé d'URL de paiement.", status: PAYMENT_STATUS.failed };
      }
      await db.payment.update({
        where: { id: payment.id },
        data: { providerRef: session.id },
      });
      return {
        ok: true,
        status: PAYMENT_STATUS.pending,
        checkoutUrl: session.url,
        reference,
        message: "Redirection vers Stripe Checkout…",
      };
    }

    return { message: "Moyen de paiement inconnu." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d'initier le paiement.";
    await markPaymentFailed(payment.id, message);
    return { message, status: PAYMENT_STATUS.failed };
  }
}

export async function refreshRecruiterPackPayment(
  reference: string,
): Promise<RecruiterPackPaymentState> {
  const user = await requireOnboardingRecruiter();
  const intent = parseRecruiterPackReference(reference);
  if (!intent || intent.companyId !== user.company.id) {
    return { message: "Paiement introuvable." };
  }
  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment) return { message: "Paiement introuvable." };

  try {
    const updated =
      payment.gateway === "NOTCHPAY"
        ? await applyNotchpayStatus(payment.id)
        : payment.provider === PaymentProvider.CARD && payment.providerRef
          ? await applyStripeStatus(payment.providerRef)
          : payment.provider === PaymentProvider.MTN_MOMO && payment.providerRef
            ? await applyMomoStatus(payment.providerRef)
            : payment;
    return {
      ok: true,
      status: updated?.status ?? payment.status,
      reference: payment.reference,
    };
  } catch (error) {
    return {
      status: payment.status,
      reference: payment.reference,
      message: error instanceof Error ? error.message : "Statut de paiement indisponible.",
    };
  }
}
