"use server";

import { ContractType, Role, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireEmployee, requireRecruiter, requireUser } from "@/lib/dal";
import { ROLE_HOME } from "@/lib/constants";
import { db } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/crypto";
import { fieldErrorsFromZod } from "@/lib/users";
import { createPresignedUpload } from "@/lib/storage";
import {
  DEFAULT_WORK_DAYS,
  DEFAULT_WORK_END,
  DEFAULT_WORK_START,
} from "@/lib/constants";
import {
  employeeCreateSchema,
  employeeSelfUpdateSchema,
  workHoursSchema,
} from "@/lib/validations/employees";

export type ActionState = {
  ok?: boolean;
  message?: string;
  password?: string;
  matricule?: string;
  uploadUrl?: string;
  fileUrl?: string;
  mode?: "s3" | "local";
  errors?: Record<string, string[] | undefined>;
};

async function nextMatricule() {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;
  const last = await db.employee.findFirst({
    where: { matricule: { startsWith: prefix } },
    orderBy: { matricule: "desc" },
  });
  const next = last ? Number(last.matricule.slice(-4)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createEmployee(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { companyId } = await requireRecruiter();
  const parsed = employeeCreateSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    birthDate: formData.get("birthDate"),
    address: formData.get("address"),
    emergencyName: formData.get("emergencyName"),
    emergencyPhone: formData.get("emergencyPhone"),
    position: formData.get("position"),
    department: formData.get("department"),
    contractType: formData.get("contractType"),
    hireDate: formData.get("hireDate"),
    managerId: formData.get("managerId") || undefined,
    expectedStartTime: formData.get("expectedStartTime") || DEFAULT_WORK_START,
    expectedEndTime: formData.get("expectedEndTime") || DEFAULT_WORK_END,
    workDays: formData.getAll("workDays").length
      ? formData.getAll("workDays")
      : [...DEFAULT_WORK_DAYS],
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { message: "Cet e-mail est déjà utilisé." };

  if (parsed.data.managerId) {
    const manager = await db.employee.findFirst({
      where: { id: parsed.data.managerId, companyId },
    });
    if (!manager) return { message: "Supérieur introuvable." };
  }

  const password = generateToken(6);
  const matricule = await nextMatricule();
  await db.user.create({
    data: {
      email,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(password),
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      isVerified: true,
      emailVerifiedAt: new Date(),
      companyId,
      employee: {
        create: {
          companyId,
          matricule,
          position: parsed.data.position,
          department: parsed.data.department,
          contractType: parsed.data.contractType as ContractType,
          hireDate: new Date(parsed.data.hireDate),
          birthDate: new Date(parsed.data.birthDate),
          address: parsed.data.address,
          emergencyName: parsed.data.emergencyName,
          emergencyPhone: parsed.data.emergencyPhone,
          expectedStartTime: parsed.data.expectedStartTime,
          expectedEndTime: parsed.data.expectedEndTime,
          workDays: parsed.data.workDays,
          managerId: parsed.data.managerId,
        },
      },
    },
  });

  revalidatePath("/company/employes");
  return {
    ok: true,
    matricule,
    password,
    message: `Employé ${matricule} créé. Mot de passe temporaire à communiquer une fois.`,
  };
}

export async function updateWorkHours(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { companyId } = await requireRecruiter();
  const parsed = workHoursSchema.safeParse({
    employeeId: formData.get("employeeId"),
    expectedStartTime: formData.get("expectedStartTime"),
    expectedEndTime: formData.get("expectedEndTime"),
    workDays: formData.getAll("workDays"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  const employee = await db.employee.findFirst({
    where: { id: parsed.data.employeeId, companyId },
  });
  if (!employee) return { message: "Employé introuvable." };
  await db.employee.update({
    where: { id: employee.id },
    data: {
      expectedStartTime: parsed.data.expectedStartTime,
      expectedEndTime: parsed.data.expectedEndTime,
      workDays: parsed.data.workDays,
    },
  });
  revalidatePath(`/company/employes/${employee.id}`);
  return { ok: true, message: "Horaires enregistrés." };
}

export async function updateOwnContact(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, employee } = await requireEmployee();
  const parsed = employeeSelfUpdateSchema.safeParse({
    address: formData.get("address"),
    phone: formData.get("phone"),
    emergencyName: formData.get("emergencyName"),
    emergencyPhone: formData.get("emergencyPhone"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  await db.$transaction([
    db.employee.update({
      where: { id: employee.id },
      data: {
        address: parsed.data.address,
        emergencyName: parsed.data.emergencyName,
        emergencyPhone: parsed.data.emergencyPhone,
      },
    }),
    db.user.update({
      where: { id: user.id },
      data: { phone: parsed.data.phone },
    }),
  ]);
  revalidatePath("/employee/dossier");
  return { ok: true, message: "Coordonnées mises à jour." };
}

async function requireCompanyStaff() {
  const user = await requireUser();
  if (user.role !== Role.RECRUITER && user.role !== Role.EMPLOYEE) {
    redirect(ROLE_HOME[user.role]);
  }
  return user;
}

export async function presignPrivateFile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireCompanyStaff();
  const folder = String(formData.get("folder") ?? "employees/documents");
  const allowed = ["employees/documents", "leaves", "absences"];
  if (!allowed.includes(folder)) return { message: "Dossier invalide." };
  const filename = String(formData.get("filename") ?? "document");
  const contentType = String(formData.get("contentType") ?? "application/octet-stream");
  const signed = await createPresignedUpload({ folder, filename, contentType });
  return {
    ok: true,
    mode: signed.mode,
    uploadUrl: signed.uploadUrl,
    fileUrl: signed.fileUrl,
  };
}

export async function uploadLocalFile(formData: FormData): Promise<ActionState> {
  await requireCompanyStaff();
  const folder = String(formData.get("folder") ?? "employees/documents");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Fichier manquant." };
  const { saveUpload } = await import("@/lib/storage");
  const fileUrl = await saveUpload(folder, file);
  return { ok: true, fileUrl };
}

export async function attachEmployeeDocument(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { companyId } = await requireRecruiter();
  const employeeId = String(formData.get("employeeId") ?? "");
  const type = String(formData.get("type") ?? "autre");
  const fileUrl = String(formData.get("fileUrl") ?? "");
  if (!employeeId || !fileUrl) return { message: "Document incomplet." };
  const employee = await db.employee.findFirst({
    where: { id: employeeId, companyId },
  });
  if (!employee) return { message: "Employé introuvable." };
  await db.document.create({
    data: { employeeId, type, fileUrl },
  });
  revalidatePath(`/company/employes/${employeeId}`);
  return { ok: true, message: "Document enregistré." };
}
