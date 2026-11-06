import { isErpIntegrationEnabled } from "@/lib/erp/access";
import { hireRequest, signHireBody } from "@/lib/erp/hire-signature";

export type ErpInvoiceLine = {
  title: string;
  quantity: number;
  unitPrice: number;
};

export type ErpInvoiceInput = {
  number: string;
  platformPaymentRef: string;
  platformCompanyId: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  provider: string;
  total: number;
  issuedAt: Date;
  lines: ErpInvoiceLine[];
};

export function erpInvoiceBody(input: ErpInvoiceInput) {
  const payload: Record<string, unknown> = {
    number: input.number,
    platformPaymentRef: input.platformPaymentRef,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    provider: input.provider,
    currency: "XAF",
    total: input.total,
    issuedAt: input.issuedAt.toISOString().slice(0, 10),
    lines: input.lines.map((line) => ({
      title: line.title,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
  };
  if (input.buyerPhone) payload.buyerPhone = input.buyerPhone;
  if (input.platformCompanyId) payload.platformCompanyId = input.platformCompanyId;
  return JSON.stringify(payload);
}

export function erpInvoiceEndpoint(audience: string) {
  const base = audience.endsWith("/") ? audience.slice(0, -1) : audience;
  return `${base}/api/integration/invoices`;
}

/**
 * Ancien pont facture → ERP : désactivé.
 * La facture PDF reste sur PES-RH (téléchargement local).
 * Réactiver seulement quand le nouvel ERP sera branché.
 */
export async function pushErpInvoice(_input: ErpInvoiceInput) {
  return "disabled" as const;
}

/** Conservé pour les tests / branchement futur du nouvel ERP. */
export async function pushErpInvoiceWhenEnabled(input: ErpInvoiceInput) {
  if (!isErpIntegrationEnabled()) return "disabled" as const;
  const secret = process.env.PLATFORM_INTEGRATION_SECRET ?? "";
  const audience = process.env.ERP_SSO_AUDIENCE ?? "";
  if (!secret || !audience) return "disabled" as const;

  const body = erpInvoiceBody(input);
  const signed = signHireBody(secret, Math.floor(Date.now() / 1000), body);
  const request = hireRequest(signed);
  if (request.body !== body) throw new Error("erp-invoice-body-mismatch");

  try {
    const response = await fetch(erpInvoiceEndpoint(audience), {
      method: "POST",
      headers: request.headers,
      body: request.body,
    });
    if (!response.ok) {
      console.error("[erp] facture non enregistrée", {
        reference: input.platformPaymentRef,
        status: response.status,
      });
      return "failed" as const;
    }
    return "sent" as const;
  } catch {
    console.error("[erp] facture non enregistrée", { reference: input.platformPaymentRef });
    return "failed" as const;
  }
}
