import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

/** Mot de passe temporaire lisible : majuscule, chiffre, au moins 8 caractères. */
export function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(8);
  let body = "";
  for (const byte of bytes) body += alphabet[byte % alphabet.length];
  return `Rh${body}7`;
}

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function sha256(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set.");
  }
  return secret;
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
