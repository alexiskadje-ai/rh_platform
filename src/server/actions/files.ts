"use server";

import { Role } from "@prisma/client";
import { requireUser } from "@/lib/dal";
import { createPresignedUpload, saveUpload } from "@/lib/storage";

export type FileActionState = {
  ok?: boolean;
  message?: string;
  uploadUrl?: string;
  fileUrl?: string;
  mode?: "s3" | "local";
};

const FOLDER_ROLES: Record<string, Role[]> = {
  "employees/documents": [Role.RECRUITER, Role.EMPLOYEE],
  leaves: [Role.EMPLOYEE, Role.RECRUITER],
  absences: [Role.EMPLOYEE, Role.RECRUITER],
  "courses/videos": [Role.ADMIN],
  "courses/documents": [Role.ADMIN],
  "shop/products": [Role.ADMIN],
};

function canUpload(role: Role, folder: string) {
  return FOLDER_ROLES[folder]?.includes(role) ?? false;
}

export async function presignPrivateFile(
  _prev: FileActionState,
  formData: FormData,
): Promise<FileActionState> {
  const user = await requireUser();
  const folder = String(formData.get("folder") ?? "");
  if (!canUpload(user.role, folder)) return { message: "Dossier invalide." };
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

export async function uploadLocalFile(formData: FormData): Promise<FileActionState> {
  const user = await requireUser();
  const folder = String(formData.get("folder") ?? "");
  if (!canUpload(user.role, folder)) return { message: "Dossier invalide." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Fichier manquant." };
  const fileUrl = await saveUpload(folder, file);
  return { ok: true, fileUrl };
}
