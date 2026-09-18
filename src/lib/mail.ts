import nodemailer from "nodemailer";
import { APP_NAME } from "@/lib/constants";

let transporter: nodemailer.Transporter | null | undefined;

function envFlag(value: string | undefined, fallback: boolean) {
  if (value == null || value === "") return fallback;
  return value === "true" || value === "1";
}

export function getMailer() {
  if (transporter !== undefined) return transporter;
  const host = process.env.EMAIL_HOST?.trim();
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASSWORD;
  if (!host || !user || !pass) {
    transporter = null;
    return transporter;
  }
  const port = Number(process.env.EMAIL_PORT ?? 465);
  const useSsl = envFlag(process.env.EMAIL_USE_SSL, port === 465);
  const useTls = envFlag(process.env.EMAIL_USE_TLS, port === 587);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: useSsl && !useTls,
    auth: { user, pass },
    tls: {
      servername: process.env.EMAIL_TLS_SERVERNAME?.trim() || undefined,
      rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  });
  return transporter;
}

export function mailFrom() {
  const address = process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim();
  return address ? `${APP_NAME} <${address}>` : `${APP_NAME} <no-reply@localhost>`;
}

export function supportEmail() {
  return process.env.SUPPORT_EMAIL?.trim() || undefined;
}
