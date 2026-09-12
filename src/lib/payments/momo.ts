import axios, { AxiosError } from "axios";
import { randomUUID } from "node:crypto";

export type MomoRequestInput = {
  amount: number;
  externalId: string;
  payerMsisdn: string;
  payerMessage: string;
  payeeNote: string;
};

export type MomoRequestResult = {
  referenceId: string;
  status: "PENDING";
};

export type MomoPaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

export type MomoStatusResult = {
  referenceId: string;
  status: MomoPaymentStatus;
  financialTransactionId?: string;
  reason?: string;
};

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function momoEnv() {
  const environment = (process.env.MOMO_ENV ?? "sandbox").trim() || "sandbox";
  const subscriptionKey = process.env.MOMO_SUBSCRIPTION_KEY?.trim();
  const apiUser = process.env.MOMO_API_USER?.trim();
  const apiKey = process.env.MOMO_API_KEY?.trim();
  const currency =
    process.env.MOMO_CURRENCY?.trim() || (environment === "sandbox" ? "EUR" : "XAF");
  const baseUrl =
    process.env.MOMO_BASE_URL?.trim() ||
    (environment === "sandbox"
      ? "https://sandbox.momodeveloper.mtn.com"
      : "https://proxy.momoapi.mtn.com");
  return { environment, subscriptionKey, apiUser, apiKey, currency, baseUrl };
}

export function isMomoConfigured() {
  const { subscriptionKey, apiUser, apiKey } = momoEnv();
  return Boolean(subscriptionKey && apiUser && apiKey);
}

export function momoCallbackUrl() {
  const origin = (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${origin}/api/webhooks/momo`;
}

export function toMomoMsisdn(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("237") && digits.length === 12) return digits;
  if (digits.length === 9 && digits.startsWith("6")) return `237${digits}`;
  return digits;
}

function collectionHeaders(accessToken?: string) {
  const { subscriptionKey, environment } = momoEnv();
  return {
    "Ocp-Apim-Subscription-Key": subscriptionKey!,
    "X-Target-Environment": environment,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function momoError(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const detail =
      typeof error.response?.data === "string"
        ? error.response.data
        : JSON.stringify(error.response?.data ?? error.message);
    return new Error(`${fallback} (${error.response?.status ?? "réseau"}): ${detail}`);
  }
  return error instanceof Error ? error : new Error(fallback);
}

async function getCollectionToken() {
  if (!isMomoConfigured()) {
    throw new Error(
      "MTN MoMo n'est pas configuré. Renseignez MOMO_API_USER, MOMO_API_KEY et MOMO_SUBSCRIPTION_KEY.",
    );
  }
  if (tokenCache && tokenCache.expiresAt > Date.now() + 15_000) {
    return tokenCache.accessToken;
  }

  const { baseUrl, apiUser, apiKey } = momoEnv();
  const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
  try {
    const { data } = await axios.post<{ access_token: string; expires_in: number }>(
      `${baseUrl}/collection/token/`,
      null,
      {
        headers: {
          ...collectionHeaders(),
          Authorization: `Basic ${credentials}`,
        },
        timeout: 15_000,
      },
    );
    tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + Math.max(30, (data.expires_in ?? 3600) - 30) * 1000,
    };
    return tokenCache.accessToken;
  } catch (error) {
    tokenCache = null;
    throw momoError(error, "Impossible d'obtenir le jeton MoMo Collection");
  }
}

export async function requestToPayment(input: MomoRequestInput): Promise<MomoRequestResult> {
  const { baseUrl, currency } = momoEnv();
  const accessToken = await getCollectionToken();
  const referenceId = randomUUID();
  const msisdn = toMomoMsisdn(input.payerMsisdn);

  try {
    await axios.post(
      `${baseUrl}/collection/v1_0/requesttopay`,
      {
        amount: String(input.amount),
        currency,
        externalId: input.externalId,
        payer: {
          partyIdType: "MSISDN",
          partyId: msisdn,
        },
        payerMessage: input.payerMessage.slice(0, 160),
        payeeNote: input.payeeNote.slice(0, 160),
      },
      {
        headers: {
          ...collectionHeaders(accessToken),
          "X-Reference-Id": referenceId,
          "X-Callback-Url": momoCallbackUrl(),
          "Content-Type": "application/json",
        },
        timeout: 20_000,
      },
    );
    return { referenceId, status: "PENDING" };
  } catch (error) {
    throw momoError(error, "La demande de paiement MoMo a échoué");
  }
}

export async function checkPaymentStatus(referenceId: string): Promise<MomoStatusResult> {
  const { baseUrl } = momoEnv();
  const accessToken = await getCollectionToken();

  try {
    const { data } = await axios.get<{
      status?: string;
      financialTransactionId?: string;
      reason?: string;
    }>(`${baseUrl}/collection/v1_0/requesttopay/${referenceId}`, {
      headers: collectionHeaders(accessToken),
      timeout: 15_000,
    });

    const raw = (data.status ?? "PENDING").toUpperCase();
    const status: MomoPaymentStatus =
      raw === "SUCCESSFUL" || raw === "FAILED" ? raw : "PENDING";

    return {
      referenceId,
      status,
      financialTransactionId: data.financialTransactionId,
      reason: data.reason,
    };
  } catch (error) {
    throw momoError(error, "Impossible de vérifier le statut MoMo");
  }
}
