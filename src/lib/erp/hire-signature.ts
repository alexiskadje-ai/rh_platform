import { createHmac } from "node:crypto";

export type HireSignature = {
  /** Corps UTF-8 exact, déjà sérialisé. C'est aussi le corps HTTP. */
  body: string;
  timestamp: string;
  signature: string;
};

/** Signe `timestamp + "." + body`. `body` n'est pas relu ni resérialisé. */
export function signHireBody(secret: string, timestamp: number, body: string): HireSignature {
  const stamp = String(timestamp);
  const signature = createHmac("sha256", secret).update(`${stamp}.${body}`, "utf8").digest("hex");
  return { body, timestamp: stamp, signature };
}

/** La requête envoie la même chaîne que celle qui a été signée. */
export function hireRequest(signed: HireSignature) {
  return {
    body: signed.body,
    headers: {
      "Content-Type": "application/json",
      "X-Integration-Timestamp": signed.timestamp,
      "X-Integration-Signature": signed.signature,
    },
  };
}
