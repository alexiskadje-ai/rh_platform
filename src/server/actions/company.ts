"use server";

import { Role, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/crypto";
import { fieldErrorsFromZod } from "@/lib/users";
import { inviteRecruiterSchema } from "@/lib/validations/platform";
import { sendEmail } from "@/lib/notify";
import { APP_NAME } from "@/lib/constants";

export type CompanyActionState = {
  ok?: boolean;
  message?: string;
  password?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function inviteCompanyUser(
  _prev: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const { companyId, company } = await requireRecruiter();
  const parsed = inviteRecruiterSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { message: "Cet e-mail est déjà utilisé." };

  const password = generateToken(8);
  await db.user.create({
    data: {
      email,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(password),
      role: Role.RECRUITER,
      status: UserStatus.ACTIVE,
      isVerified: true,
      emailVerifiedAt: new Date(),
      companyId,
    },
  });
  await sendEmail({
    to: email,
    subject: `Accès recruteur ${company.name} — ${APP_NAME}`,
    text: `Bonjour ${parsed.data.firstName},\n\nUn accès recruteur a été créé pour ${company.name}.\nE-mail : ${email}\nMot de passe temporaire : ${password}\n\nConnectez-vous puis changez ce mot de passe.`,
  });
  revalidatePath("/company/utilisateurs");
  return {
    ok: true,
    password,
    message: `Utilisateur créé. Mot de passe temporaire à communiquer une fois : ${password}`,
  };
}
