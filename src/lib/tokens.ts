import { TokenType } from "@prisma/client";
import { db } from "@/lib/db";
import { generateOtp, generateToken, sha256 } from "@/lib/crypto";

const EMAIL_TTL_MS = 24 * 60 * 60 * 1000;
const SMS_TTL_MS = 10 * 60 * 1000;
const LOGIN_TTL_MS = 2 * 60 * 1000;

export async function issueToken(userId: string, type: TokenType, rawToken?: string) {
  const token = rawToken ?? (type === TokenType.SMS ? generateOtp() : generateToken());
  const ttl =
    type === TokenType.EMAIL
      ? EMAIL_TTL_MS
      : type === TokenType.SMS
        ? SMS_TTL_MS
        : LOGIN_TTL_MS;

  await db.verificationToken.deleteMany({ where: { userId, type } });
  await db.verificationToken.create({
    data: {
      userId,
      type,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + ttl),
    },
  });

  return token;
}

export async function consumeToken(token: string, type: TokenType) {
  const record = await db.verificationToken.findUnique({
    where: { tokenHash: sha256(token) },
  });

  if (!record || record.type !== type || record.expiresAt < new Date()) {
    return null;
  }

  await db.verificationToken.delete({ where: { id: record.id } });
  return record.userId;
}
