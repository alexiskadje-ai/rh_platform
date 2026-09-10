"use server";

import {
  ApplicationStatus,
  JobStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCandidate, requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { closeExpiredOffers } from "@/lib/jobs";
import { computeMatchScore, formatLocation } from "@/lib/matching";
import { profileCompletion } from "@/lib/profile";
import { saveUpload } from "@/lib/storage";
import { fieldErrorsFromZod } from "@/lib/users";
import {
  applySchema,
  availabilitySchema,
  educationItemSchema,
  experienceItemSchema,
  identitySchema,
  interviewSchema,
  jobOfferSchema,
  preferencesSchema,
  skillsSchema,
  statusSchema,
} from "@/lib/validations/recruitment";
import { refreshCandidateEmbedding, refreshJobOfferEmbedding } from "@/lib/ai/embeddings";
import { computeMatchScoresForOffer } from "@/server/actions/ai-matching";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

function booleanFromForm(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function optionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  RECEIVED: [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
  SHORTLISTED: [ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED],
  INTERVIEW: [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED],
  ACCEPTED: [],
  REJECTED: [],
};

async function recordStatus(
  applicationId: string,
  status: ApplicationStatus,
) {
  await db.$transaction([
    db.application.update({
      where: { id: applicationId },
      data: { status, statusChangedAt: new Date() },
    }),
    db.applicationStatusEvent.create({
      data: { applicationId, status },
    }),
  ]);
  // TODO(notifications): notifier le candidat du changement de statut (Phase 8).
}

export async function saveIdentitySection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = identitySchema.safeParse({
    headline: formData.get("headline") || undefined,
    bio: formData.get("bio") || undefined,
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  const { user, candidate } = await requireCandidate();
  await db.candidate.update({
    where: { id: candidate.id },
    data: parsed.data,
  });
  revalidatePath("/candidate/profil");
  void refreshCandidateEmbedding(candidate.id, user.id);
  return { ok: true, message: "Profil enregistré." };
}

export async function saveSkillsSection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const parsed = skillsSchema.safeParse({ skills });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  const { user, candidate } = await requireCandidate();
  await db.candidate.update({
    where: { id: candidate.id },
    data: { skills: parsed.data.skills },
  });
  revalidatePath("/candidate/profil");
  void refreshCandidateEmbedding(candidate.id, user.id);
  return { ok: true, message: "Compétences enregistrées." };
}

export async function saveAvailabilitySection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = availabilitySchema.safeParse({
    availability: formData.get("availability") || undefined,
    availableFrom: formData.get("availableFrom") || undefined,
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  const { candidate } = await requireCandidate();
  await db.candidate.update({
    where: { id: candidate.id },
    data: {
      availability: parsed.data.availability,
      availableFrom:
        parsed.data.availability === "DATE" && parsed.data.availableFrom
          ? new Date(parsed.data.availableFrom)
          : null,
    },
  });
  revalidatePath("/candidate/profil");
  return { ok: true, message: "Disponibilité enregistrée." };
}

export async function saveExperiencesSection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = String(formData.get("payload") ?? "[]");
  let items: unknown;
  try {
    items = JSON.parse(raw);
  } catch {
    return { message: "Données d'expérience invalides." };
  }
  const parsed = z.array(experienceItemSchema).safeParse(
    (items as unknown[]).filter((item) => {
      if (!item || typeof item !== "object") return false;
      const row = item as { title?: string; company?: string };
      return Boolean(row.title?.trim() && row.company?.trim());
    }),
  );
  if (!parsed.success) return { message: "Vérifiez les expériences." };
  const { user, candidate } = await requireCandidate();
  const chronological = [...parsed.data].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  await db.$transaction([
    db.experience.deleteMany({ where: { candidateId: candidate.id } }),
    ...chronological.map((item) =>
      db.experience.create({
        data: {
          candidateId: candidate.id,
          title: item.title,
          company: item.company,
          startDate: new Date(item.startDate),
          endDate: item.endDate ? new Date(item.endDate) : null,
        },
      }),
    ),
  ]);
  revalidatePath("/candidate/profil");
  void refreshCandidateEmbedding(candidate.id, user.id);
  return { ok: true, message: "Expériences enregistrées." };
}

export async function savePreferencesSection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = preferencesSchema.safeParse({
    city: formData.get("city") || undefined,
    region: formData.get("region") || undefined,
    desiredContractTypes: formData.getAll("desiredContractTypes").map(String),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  const { candidate } = await requireCandidate();
  await db.candidate.update({
    where: { id: candidate.id },
    data: parsed.data,
  });
  revalidatePath("/candidate/profil");
  return { ok: true, message: "Préférences enregistrées." };
}

export async function saveEducationsSection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = String(formData.get("payload") ?? "[]");
  let items: unknown;
  try {
    items = JSON.parse(raw);
  } catch {
    return { message: "Données de diplômes invalides." };
  }
  const parsed = z.array(educationItemSchema).safeParse(
    (items as unknown[]).filter((item) => {
      if (!item || typeof item !== "object") return false;
      const row = item as { degree?: string; institution?: string };
      return Boolean(row.degree?.trim() && row.institution?.trim());
    }),
  );
  if (!parsed.success) return { message: "Vérifiez les diplômes." };
  const { candidate } = await requireCandidate();
  await db.$transaction([
    db.education.deleteMany({ where: { candidateId: candidate.id } }),
    ...parsed.data.map((item) =>
      db.education.create({
        data: {
          candidateId: candidate.id,
          degree: item.degree,
          institution: item.institution,
          year: item.year,
        },
      }),
    ),
  ]);
  revalidatePath("/candidate/profil");
  return { ok: true, message: "Diplômes enregistrés." };
}

export async function saveCertificationsSection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { candidate } = await requireCandidate();
  const names = formData.getAll("name").map(String);
  const issuers = formData.getAll("issuer").map(String);
  const years = formData.getAll("year").map(String);
  const existingUrls = formData.getAll("existingFileUrl").map(String);
  const files = formData.getAll("file");

  const rows = [];
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index]?.trim();
    if (!name) continue;
    const file = files[index];
    let fileUrl: string | undefined = existingUrls[index]?.trim() || undefined;
    if (file instanceof File && file.size > 0) {
      fileUrl = await saveUpload("certifications", file);
    }
    rows.push({
      name,
      issuer: issuers[index]?.trim() || undefined,
      year: years[index] ? Number(years[index]) : undefined,
      fileUrl,
    });
  }

  await db.$transaction([
    db.certification.deleteMany({ where: { candidateId: candidate.id } }),
    ...rows.map((row) =>
      db.certification.create({
        data: { candidateId: candidate.id, ...row },
      }),
    ),
  ]);
  revalidatePath("/candidate/profil");
  return { ok: true, message: "Certifications enregistrées." };
}

export async function savePhoto(formData: FormData): Promise<ActionState> {
  const { candidate } = await requireCandidate();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choisissez une image." };
  }
  if (!file.type.startsWith("image/")) {
    return { message: "La photo doit être une image (carré recommandé)." };
  }
  const photoUrl = await saveUpload("photos", file);
  await db.candidate.update({
    where: { id: candidate.id },
    data: { photoUrl },
  });
  revalidatePath("/candidate/profil");
  return { ok: true, message: "Photo enregistrée." };
}

export async function saveCvFile(formData: FormData): Promise<ActionState> {
  const { candidate } = await requireCandidate();
  const file = formData.get("cv");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choisissez un PDF." };
  }
  if (file.type !== "application/pdf") {
    return { message: "Le CV doit être un fichier PDF." };
  }
  const cvUrl = await saveUpload("cv", file);
  await db.candidate.update({
    where: { id: candidate.id },
    data: { cvUrl },
  });
  revalidatePath("/candidate/profil");
  return { ok: true, message: "CV enregistré." };
}

export async function createJobOffer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return upsertJobOffer(null, formData);
}

export async function updateJobOffer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { message: "Offre introuvable." };
  return upsertJobOffer(id, formData);
}

async function upsertJobOffer(id: string | null, formData: FormData): Promise<ActionState> {
  const { companyId, user } = await requireRecruiter();
  const parsed = jobOfferSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    city: formData.get("city"),
    region: formData.get("region"),
    contractType: formData.get("contractType"),
    salaryMin: optionalNumber(formData.get("salaryMin")),
    salaryMax: optionalNumber(formData.get("salaryMax")),
    salaryNegotiable: booleanFromForm(formData.get("salaryNegotiable")),
    hideSalary: booleanFromForm(formData.get("hideSalary")),
    coverLetterRequired: booleanFromForm(formData.get("coverLetterRequired")),
    deadline: formData.get("deadline"),
    positionsCount: formData.get("positionsCount") || 1,
    visibility: formData.get("visibility") || "PUBLIC",
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const data = {
    ...parsed.data,
    location: formatLocation(parsed.data.city, parsed.data.region),
    salary: parsed.data.salaryMax ?? parsed.data.salaryMin ?? null,
    deadline: new Date(parsed.data.deadline),
    companyId,
  };

  if (id) {
    const existing = await db.jobOffer.findFirst({
      where: { id, companyId },
    });
    if (!existing) return { message: "Offre introuvable." };
    await db.jobOffer.update({ where: { id }, data });
    await refreshJobOfferEmbedding(id, user.id);
    void computeMatchScoresForOffer(id);
    revalidatePath("/company/offres");
    revalidatePath(`/company/offres/${id}`);
    revalidatePath("/offres");
    return { ok: true, message: "Offre mise à jour." };
  }

  const created = await db.jobOffer.create({ data });
  await refreshJobOfferEmbedding(created.id, user.id);
  void computeMatchScoresForOffer(created.id);
  revalidatePath("/company/offres");
  revalidatePath("/offres");
  redirect(`/company/offres/${created.id}`);
}

export async function applyToJob(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { candidate } = await requireCandidate();
  const parsed = applySchema.safeParse({
    jobOfferId: formData.get("jobOfferId"),
    coverLetter: formData.get("coverLetter") || undefined,
    salaryExpectation: optionalNumber(formData.get("salaryExpectation")),
    availabilityDate: formData.get("availabilityDate") || undefined,
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const completion = profileCompletion(candidate);
  if (!completion.canApply) {
    return {
      message:
        "Complétez votre profil (CV + au moins 3 compétences) avant de postuler.",
    };
  }

  await closeExpiredOffers();
  const offer = await db.jobOffer.findUnique({
    where: { id: parsed.data.jobOfferId },
    include: { company: true },
  });
  if (!offer || offer.status !== JobStatus.OPEN || offer.deadline < new Date()) {
    return { message: "Cette offre n'est plus ouverte." };
  }
  let coverLetterUrl: string | undefined;
  const coverLetterFile = formData.get("coverLetterFile");
  if (coverLetterFile instanceof File && coverLetterFile.size > 0) {
    coverLetterUrl = await saveUpload("cover-letters", coverLetterFile);
  }
  if (offer.coverLetterRequired && !parsed.data.coverLetter && !coverLetterUrl) {
    return { errors: { coverLetter: ["La lettre de motivation est obligatoire (texte ou fichier)."] } };
  }

  let cvUrl = candidate.cvUrl;
  const uploaded = formData.get("cv");
  if (uploaded instanceof File && uploaded.size > 0) {
    if (uploaded.type !== "application/pdf") {
      return { message: "Le CV doit être un PDF." };
    }
    cvUrl = await saveUpload("cv", uploaded);
  }
  if (!cvUrl) {
    return { message: "Un CV est obligatoire." };
  }

  const matchScore = computeMatchScore(
    candidate.skills,
    `${offer.title} ${offer.description} ${offer.requirements}`,
  );

  try {
    await db.application.create({
      data: {
        candidateId: candidate.id,
        jobOfferId: offer.id,
        cvUrl,
        coverLetter: parsed.data.coverLetter,
        coverLetterUrl,
        salaryExpectation: parsed.data.salaryExpectation,
        availabilityDate: parsed.data.availabilityDate
          ? new Date(parsed.data.availabilityDate)
          : null,
        matchScore,
        status: ApplicationStatus.RECEIVED,
        history: {
          create: { status: ApplicationStatus.RECEIVED },
        },
      },
    });
    // TODO(notifications): nouvelle candidature → recruteur (email + in-app, Phase 8).
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { message: "Vous avez déjà postulé à cette offre." };
    }
    throw error;
  }

  void computeMatchScoresForOffer(offer.id);
  revalidatePath("/candidate/candidatures");
  revalidatePath(`/offres/${offer.id}`);
  redirect("/candidate/candidatures");
}

export async function updateApplicationStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { companyId } = await requireRecruiter();
  const parsed = statusSchema.safeParse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const application = await db.application.findFirst({
    where: { id: parsed.data.applicationId, jobOffer: { companyId } },
  });
  if (!application) return { message: "Candidature introuvable." };

  const next = parsed.data.status as ApplicationStatus;
  if (!STATUS_TRANSITIONS[application.status].includes(next)) {
    return { message: "Ce changement de statut n'est pas autorisé." };
  }

  await recordStatus(application.id, next);
  revalidatePath(`/company/offres/${application.jobOfferId}`);
  revalidatePath(`/company/candidatures/${application.id}`);
  return { ok: true, message: "Statut mis à jour." };
}

export async function inviteToInterview(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { companyId } = await requireRecruiter();
  const parsed = interviewSchema.safeParse({
    applicationId: formData.get("applicationId"),
    scheduledAt: formData.get("scheduledAt"),
    format: formData.get("format"),
    locationOrLink: formData.get("locationOrLink") || undefined,
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const application = await db.application.findFirst({
    where: { id: parsed.data.applicationId, jobOffer: { companyId } },
  });
  if (!application) return { message: "Candidature introuvable." };
  if (
    application.status !== ApplicationStatus.SHORTLISTED &&
    application.status !== ApplicationStatus.INTERVIEW
  ) {
    return { message: "Présélectionnez d'abord le candidat." };
  }

  await db.interview.upsert({
    where: { applicationId: application.id },
    update: {
      scheduledAt: new Date(parsed.data.scheduledAt),
      format: parsed.data.format,
      locationOrLink: parsed.data.locationOrLink,
      message: parsed.data.message,
    },
    create: {
      applicationId: application.id,
      scheduledAt: new Date(parsed.data.scheduledAt),
      format: parsed.data.format,
      locationOrLink: parsed.data.locationOrLink,
      message: parsed.data.message,
    },
  });

  if (application.status !== ApplicationStatus.INTERVIEW) {
    await recordStatus(application.id, ApplicationStatus.INTERVIEW);
  }

  // TODO(notifications): convocation entretien → candidat (email + SMS + WhatsApp, Phase 8).

  revalidatePath(`/company/candidatures/${application.id}`);
  revalidatePath("/candidate/candidatures");
  return { ok: true, message: "Convocation enregistrée." };
}
