"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role, TokenType, UserStatus } from "@prisma/client";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_HOME } from "@/lib/constants";
import {
  generateToken,
  hashPassword,
  sha256,
  verifyPassword,
} from "@/lib/crypto";
import {
  sendVerificationEmail,
  sendVerificationSms,
} from "@/lib/notify";
import { consumeToken, issueToken } from "@/lib/tokens";
import { verifyTotp } from "@/lib/two-factor";
import {
  loginSchema,
  registerCandidateSchema,
  registerCompanySchema,
  twoFactorSchema,
  verifySmsSchema,
} from "@/lib/validations/auth";
import { fieldErrorsFromZod, normalizeIdentifier, splitContactName } from "@/lib/users";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  debug?: {
    emailUrl?: string;
    smsCode?: string;
  };
};

const TWO_FACTOR_COOKIE = "rh_2fa_pending";
const TRUSTED_DEVICE_COOKIE = "rh_trusted_device";
const TWO_FACTOR_SETUP_COOKIE = "rh_2fa_setup";

function booleanFromForm(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

async function setDevVerificationHints(emailToken: string, smsCode: string) {
  if (process.env.NODE_ENV === "production") return;
  const jar = await cookies();
  jar.set("rh_debug_email", emailToken, { path: "/", maxAge: 60 * 60 });
  jar.set("rh_debug_sms", smsCode, { path: "/", maxAge: 10 * 60 });
}

async function createSession(userId: string, redirectTo?: string) {
  const ticket = await issueToken(userId, TokenType.LOGIN);
  await signIn("credentials", {
    ticket,
    redirectTo: redirectTo ?? "/login",
  });
}

async function setTrustedDevice(userId: string) {
  const raw = generateToken();
  await db.trustedDevice.create({
    data: {
      userId,
      tokenHash: sha256(raw),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  const jar = await cookies();
  jar.set(TRUSTED_DEVICE_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

async function hasTrustedDevice(userId: string) {
  const jar = await cookies();
  const raw = jar.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (!raw) return false;
  const device = await db.trustedDevice.findUnique({
    where: { tokenHash: sha256(raw) },
  });
  return Boolean(device && device.userId === userId && device.expiresAt > new Date());
}

async function setPendingTwoFactor(userId: string) {
  const exp = Date.now() + 5 * 60 * 1000;
  const payload = `${userId}.${exp}`;
  const jar = await cookies();
  jar.set(TWO_FACTOR_COOKIE, `${payload}.${sha256(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 5 * 60,
  });
}

async function readPendingTwoFactor() {
  const jar = await cookies();
  const raw = jar.get(TWO_FACTOR_COOKIE)?.value;
  if (!raw) return null;
  const [userId, exp, signature] = raw.split(".");
  if (!userId || !exp || !signature) return null;
  if (sha256(`${userId}.${exp}`) !== signature) return null;
  if (Number(exp) < Date.now()) return null;
  return userId;
}

export async function registerCandidate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerCandidateSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: booleanFromForm(formData.get("acceptTerms")),
  });

  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const data = parsed.data;
  const existing = await db.user.findFirst({
    where: { OR: [{ email: data.email.toLowerCase() }, { phone: data.phone }] },
  });
  if (existing) {
    return { message: "Un compte existe déjà avec cet e-mail ou ce téléphone." };
  }

  const user = await db.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash: await hashPassword(data.password),
      role: Role.CANDIDATE,
      status: UserStatus.PENDING,
      termsAcceptedAt: new Date(),
      candidate: { create: {} },
    },
  });

  const emailToken = await issueToken(user.id, TokenType.EMAIL);
  const smsCode = await issueToken(user.id, TokenType.SMS);
  await sendVerificationEmail(user.email, emailToken);
  await sendVerificationSms(data.phone, smsCode);
  await setDevVerificationHints(emailToken, smsCode);

  await createSession(user.id, "/verify");
  return { ok: true };
}

export async function registerCompany(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerCompanySchema.safeParse({
    companyName: formData.get("companyName"),
    sector: formData.get("sector"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    commerceRegister: formData.get("commerceRegister") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: booleanFromForm(formData.get("acceptTerms")),
  });

  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const data = parsed.data;
  const existing = await db.user.findFirst({
    where: { OR: [{ email: data.email.toLowerCase() }, { phone: data.phone }] },
  });
  if (existing) {
    return { message: "Un compte existe déjà avec cet e-mail ou ce téléphone." };
  }

  const { firstName, lastName } = splitContactName(data.contactName);

  const user = await db.user.create({
    data: {
      firstName,
      lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash: await hashPassword(data.password),
      role: Role.RECRUITER,
      status: UserStatus.PENDING,
      termsAcceptedAt: new Date(),
      company: {
        create: {
          name: data.companyName,
          sector: data.sector,
          commerceRegister: data.commerceRegister,
        },
      },
    },
  });

  const emailToken = await issueToken(user.id, TokenType.EMAIL);
  const smsCode = await issueToken(user.id, TokenType.SMS);
  await sendVerificationEmail(user.email, emailToken);
  await sendVerificationSms(data.phone, smsCode);
  await setDevVerificationHints(emailToken, smsCode);

  await createSession(user.id, "/pending-approval");
  return { ok: true };
}

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    rememberDevice: booleanFromForm(formData.get("rememberDevice")),
  });

  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const identifier = normalizeIdentifier(parsed.data.identifier);
  const user = await db.user.findFirst({
    where: identifier.email
      ? { email: identifier.email }
      : { phone: identifier.phone },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { message: "Identifiants incorrects." };
  }

  if (user.status === UserStatus.SUSPENDED) {
    return { message: "Ce compte a été suspendu." };
  }

  const trusted = await hasTrustedDevice(user.id);
  if (user.twoFactorSecret && !trusted) {
    await setPendingTwoFactor(user.id);
    if (parsed.data.rememberDevice) {
      const jar = await cookies();
      jar.set("rh_2fa_remember", "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 5 * 60,
      });
    }
    redirect("/login/2fa");
  }

  if (parsed.data.rememberDevice && user.twoFactorSecret) {
    await setTrustedDevice(user.id);
  }

  const destination =
    user.role === Role.CANDIDATE && !user.isVerified
      ? "/verify"
      : user.role === Role.RECRUITER && user.status === UserStatus.PENDING
        ? "/pending-approval"
        : ROLE_HOME[user.role];

  await createSession(user.id, destination);
  return { ok: true };
}

export async function verifyTwoFactor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = twoFactorSchema.safeParse({
    code: formData.get("code"),
    rememberDevice: booleanFromForm(formData.get("rememberDevice")),
  });
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const userId = await readPendingTwoFactor();
  if (!userId) {
    return { message: "Session de vérification expirée. Reconnectez-vous." };
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecret || !verifyTotp(user.twoFactorSecret, parsed.data.code)) {
    return { message: "Code de vérification invalide." };
  }

  const jar = await cookies();
  jar.delete(TWO_FACTOR_COOKIE);
  const remember = parsed.data.rememberDevice || jar.get("rh_2fa_remember")?.value === "1";
  jar.delete("rh_2fa_remember");
  if (remember) {
    await setTrustedDevice(user.id);
  }

  await createSession(user.id, ROLE_HOME[user.role]);
  return { ok: true };
}

export async function confirmEmail(token: string) {
  const userId = await consumeToken(token, TokenType.EMAIL);
  if (!userId) {
    return { ok: false as const, message: "Lien de vérification invalide ou expiré." };
  }

  await db.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });

  const activated = await maybeActivateCandidate(userId);
  if (activated?.role === Role.CANDIDATE && activated.status === UserStatus.ACTIVE) {
    await createSession(userId, ROLE_HOME.CANDIDATE);
  }
  return { ok: true as const, alreadyPhone: Boolean(activated?.phoneVerifiedAt) };
}

export async function confirmSms(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = verifySmsSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const userId = await consumeToken(parsed.data.code, TokenType.SMS);
  if (!userId) {
    return { message: "Code SMS invalide ou expiré." };
  }

  await db.user.update({
    where: { id: userId },
    data: { phoneVerifiedAt: new Date() },
  });
  const activated = await maybeActivateCandidate(userId);
  if (activated?.role === Role.CANDIDATE && activated.status === UserStatus.ACTIVE) {
    await createSession(userId, ROLE_HOME.CANDIDATE);
  }
  return { ok: true };
}

async function maybeActivateCandidate(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  if (user.role === Role.CANDIDATE && user.emailVerifiedAt && user.phoneVerifiedAt) {
    return db.user.update({
      where: { id: userId },
      data: { isVerified: true, status: UserStatus.ACTIVE },
    });
  }
  if (user.role === Role.RECRUITER && user.emailVerifiedAt) {
    return db.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  }
  return user;
}

export async function logout() {
  const jar = await cookies();
  jar.delete(TWO_FACTOR_COOKIE);
  await signOut({ redirectTo: "/" });
}

export async function startTwoFactorSetup(): Promise<ActionState & { qr?: string; secret?: string }> {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const { generateTotpSecret, totpQrDataUrl } = await import("@/lib/two-factor");
  const secret = generateTotpSecret();
  const qr = await totpQrDataUrl(session.user.email ?? session.user.id, secret);
  const jar = await cookies();
  jar.set(TWO_FACTOR_SETUP_COOKIE, `${session.user.id}.${secret}.${sha256(`${session.user.id}.${secret}`)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return { ok: true, qr, secret };
}

export async function confirmTwoFactorSetup(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = twoFactorSchema.pick({ code: true }).safeParse({
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const jar = await cookies();
  const raw = jar.get(TWO_FACTOR_SETUP_COOKIE)?.value;
  if (!raw) {
    return { message: "La configuration 2FA a expiré. Recommencez." };
  }
  const [userId, secret, signature] = raw.split(".");
  if (userId !== session.user.id || sha256(`${userId}.${secret}`) !== signature) {
    return { message: "Configuration 2FA invalide." };
  }
  if (!verifyTotp(secret, parsed.data.code)) {
    return { message: "Code invalide. Vérifiez l'application d'authentification." };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret },
  });
  jar.delete(TWO_FACTOR_SETUP_COOKIE);
  return { ok: true, message: "L'authentification à deux facteurs est activée." };
}

export async function disableTwoFactor(): Promise<ActionState> {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  await db.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: null },
  });
  return { ok: true, message: "Le 2FA a été désactivé." };
}
