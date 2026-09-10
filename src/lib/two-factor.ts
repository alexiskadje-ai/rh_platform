import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { APP_NAME } from "@/lib/constants";

export function generateTotpSecret() {
  return generateSecret();
}

export function totpKeyUri(email: string, secret: string) {
  return generateURI({
    issuer: APP_NAME,
    label: email,
    secret,
  });
}

export async function totpQrDataUrl(email: string, secret: string) {
  return QRCode.toDataURL(totpKeyUri(email, secret));
}

export function verifyTotp(secret: string, token: string) {
  const result = verifySync({
    secret,
    token: token.replace(/\s/g, ""),
    epochTolerance: 30,
  });
  return result.valid;
}
