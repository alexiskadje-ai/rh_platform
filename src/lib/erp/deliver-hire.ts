import { hireRequest, signHireBody } from "@/lib/erp/hire-signature";
import { hireBody, hireEndpoint, type HireFields } from "@/lib/erp/hire-payload";

export type HireDelivery = HireFields & {
  erpSyncStatus: "NONE" | "PENDING" | "SENT" | "FAILED";
  accepted: boolean;
  erpLinked: boolean;
};

export async function deliverHire(input: {
  hire: HireDelivery;
  secret: string;
  audience: string;
  timestamp: number;
  fetchImpl: typeof fetch;
  save: (status: "SENT" | "FAILED", syncedAt: Date | null) => Promise<void>;
}) {
  if (input.hire.erpSyncStatus === "SENT") return "unique" as const;
  if (!input.hire.erpLinked || !input.hire.accepted) return "refused" as const;

  const body = hireBody(input.hire);
  const signed = signHireBody(input.secret, input.timestamp, body);
  const request = hireRequest(signed);
  if (request.body !== body) {
    throw new Error("erp-hire-body-mismatch");
  }

  let response: Response;
  try {
    response = await input.fetchImpl(hireEndpoint(input.audience), {
      method: "POST",
      headers: request.headers,
      body: request.body,
    });
  } catch {
    await input.save("FAILED", null);
    throw new Error("erp-hire-failed");
  }
  if (!response.ok) {
    await input.save("FAILED", null);
    throw new Error("erp-hire-failed");
  }
  await input.save("SENT", new Date(input.timestamp * 1000));
  return "sent" as const;
}
