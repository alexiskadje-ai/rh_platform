import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export async function saveUpload(folder: string, file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}-${safeName(file.name || `file${ext}`)}`;
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${folder}/${filename}`;
}
