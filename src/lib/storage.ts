import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

function s3Config() {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY?.trim();
  const secretAccessKey = process.env.S3_SECRET_KEY?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const region = process.env.S3_REGION?.trim() || "auto";
  return { endpoint, accessKeyId, secretAccessKey, bucket, region };
}

export function isS3Enabled() {
  const { endpoint, accessKeyId, secretAccessKey, bucket } = s3Config();
  return Boolean(endpoint && accessKeyId && secretAccessKey && bucket);
}

export function assertStorageConfig() {
  if (process.env.NODE_ENV === "production" && !isS3Enabled()) {
    throw new Error(
      "Stockage S3/R2 obligatoire en production (S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET).",
    );
  }
}

let client: S3Client | null = null;

function getS3() {
  if (!isS3Enabled()) {
    throw new Error("S3 n'est pas configuré.");
  }
  if (!client) {
    const { endpoint, accessKeyId, secretAccessKey, region } = s3Config();
    client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      forcePathStyle: true,
    });
  }
  return client;
}

export function buildObjectKey(folder: string, originalName: string) {
  const ext = path.extname(originalName) || "";
  return `${folder}/${Date.now()}-${randomBytes(4).toString("hex")}-${safeName(originalName || `file${ext}`)}`;
}

function storedUrlFromKey(key: string) {
  if (isS3Enabled()) return `s3://${s3Config().bucket}/${key}`;
  return `/uploads/${key}`;
}

export function isS3Stored(fileUrl: string) {
  return fileUrl.startsWith("s3://");
}

export async function saveUpload(folder: string, file: File) {
  const key = buildObjectKey(folder, file.name);
    const bytes = Buffer.from(await file.arrayBuffer());
  if (isS3Enabled()) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: s3Config().bucket,
        Key: key,
        Body: bytes,
        ContentType: file.type || "application/octet-stream",
      }),
    );
    return storedUrlFromKey(key);
  }
  const absolute = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
  return storedUrlFromKey(key);
}

export async function createPresignedUpload(input: {
  folder: string;
  filename: string;
  contentType: string;
}) {
  const key = buildObjectKey(input.folder, input.filename);
  if (!isS3Enabled()) {
    return {
      mode: "local" as const,
      key,
      fileUrl: storedUrlFromKey(key),
      uploadUrl: "",
    };
  }
  const uploadUrl = await getSignedUrl(
    getS3(),
    new PutObjectCommand({
      Bucket: s3Config().bucket,
      Key: key,
      ContentType: input.contentType,
    }),
    { expiresIn: 60 * 10 },
  );
  return {
    mode: "s3" as const,
    key,
    fileUrl: storedUrlFromKey(key),
    uploadUrl,
  };
}

export async function createPresignedDownload(fileUrl: string) {
  if (!isS3Stored(fileUrl)) return fileUrl;
  const key = fileUrl.replace(/^s3:\/\/[^/]+\//, "");
  return getSignedUrl(
    getS3(),
    new GetObjectCommand({ Bucket: s3Config().bucket, Key: key }),
    { expiresIn: 60 * 10 },
  );
}

export function resolveUploadPath(fileUrl: string) {
  if (!fileUrl.startsWith("/uploads/")) {
    throw new Error("Fichier introuvable.");
  }
  const root = path.join(UPLOAD_ROOT);
  const absolute = path.resolve(process.cwd(), "public", fileUrl.replace(/^\/+/, ""));
  if (!absolute.startsWith(root)) {
    throw new Error("Fichier introuvable.");
  }
  return absolute;
}

export async function readUploadBuffer(fileUrl: string) {
  if (isS3Stored(fileUrl)) {
    const key = fileUrl.replace(/^s3:\/\/[^/]+\//, "");
    const response = await getS3().send(
      new GetObjectCommand({ Bucket: s3Config().bucket, Key: key }),
    );
    return Buffer.from(await response.Body!.transformToByteArray());
  }
  return readFile(resolveUploadPath(fileUrl));
}
