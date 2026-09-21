"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { recaptchaFailed, RECAPTCHA_REQUIRED_MESSAGE } from "@/lib/recaptcha";
import { saveBuffer } from "@/lib/storage";
import { assertSafeCvUpload } from "@/lib/upload-guard";
import { fieldErrorsFromZod } from "@/lib/users";
import {
  freeCvSchema,
  GUEST_CV_DUPLICATE_MESSAGE,
} from "@/lib/validations/free-cv";

export type FreeCvState = {
  ok?: boolean;
  message?: string;
  duplicate?: boolean;
  errors?: Record<string, string[] | undefined>;
};

export async function submitFreeCv(
  _prev: FreeCvState,
  formData: FormData,
): Promise<FreeCvState> {
  if (await recaptchaFailed(formData)) {
    return { message: RECAPTCHA_REQUIRED_MESSAGE };
  }
  if (String(formData.get("website") ?? "").trim()) {
    return { message: "Soumission invalide." };
  }

  const parsed = freeCvSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    trade: formData.get("trade"),
    skills: formData.getAll("skills").map(String).filter((skill) => skill.trim()),
    yearsOfExperience: formData.get("yearsOfExperience") || undefined,
    lastHiredAt: formData.get("lastHiredAt"),
    city: formData.get("city"),
    maritalStatus: formData.get("maritalStatus"),
    age: formData.get("age") || undefined,
    gender: formData.get("gender"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const file = formData.get("cv");
  if (!(file instanceof File) || file.size === 0) {
    return { errors: { cv: ["Le CV (PDF) est obligatoire."] } };
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const unsafe = assertSafeCvUpload(file, bytes);
  if (unsafe) return { errors: { cv: [unsafe] } };

  const email = parsed.data.email.toLowerCase();
  const phone = parsed.data.phone;

  const existing = await db.candidate.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { id: true },
  });
  if (existing) {
    return { duplicate: true, message: GUEST_CV_DUPLICATE_MESSAGE };
  }

  const cvUrl = await saveBuffer("cv", file.name, bytes, "application/pdf");

  try {
    await db.candidate.create({
      data: {
        email,
        phone,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        headline: parsed.data.trade,
        skills: parsed.data.skills,
        yearsOfExperience: parsed.data.yearsOfExperience,
        lastHiredAt: new Date(`${parsed.data.lastHiredAt}T00:00:00`),
        city: parsed.data.city,
        maritalStatus: parsed.data.maritalStatus,
        age: parsed.data.age,
        gender: parsed.data.gender,
        cvUrl,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { duplicate: true, message: GUEST_CV_DUPLICATE_MESSAGE };
    }
    throw error;
  }

  redirect("/candidat/depot-libre?ok=1");
}
