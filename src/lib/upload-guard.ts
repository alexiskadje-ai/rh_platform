const PDF_MAGIC = Buffer.from("%PDF");
const EXE_MAGIC = Buffer.from([0x4d, 0x5a]);
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export const CV_MAX_BYTES = 5 * 1024 * 1024;
const DANGEROUS_NAME = /\.(exe|js|mjs|html?|php|sh|bat|cmd|dll|com|msi|svg|jar|wsf|vbs)$/i;

export function assertSafeCvUpload(file: File, bytes: Buffer): string | null {
  if (file.size > CV_MAX_BYTES || bytes.byteLength > CV_MAX_BYTES) {
    return "Le CV ne doit pas dépasser 5 Mo.";
  }
  const name = file.name.trim().toLowerCase();
  if (!name.endsWith(".pdf") || DANGEROUS_NAME.test(name)) {
    return "Le CV doit être un fichier PDF.";
  }
  const mime = (file.type || "").toLowerCase();
  if (mime && mime !== "application/pdf" && mime !== "application/x-pdf") {
    return "Type MIME non autorisé. Seuls les PDF sont acceptés.";
  }
  if (bytes.byteLength < 5) {
    return "Fichier invalide.";
  }
  if (bytes.subarray(0, 2).equals(EXE_MAGIC)) {
    return "Fichier exécutable refusé.";
  }
  if (bytes.subarray(0, 4).equals(ZIP_MAGIC)) {
    return "Archive compressée refusée.";
  }
  if (!bytes.subarray(0, 4).equals(PDF_MAGIC)) {
    return "Le fichier n'est pas un PDF valide.";
  }
  const head = bytes.subarray(0, Math.min(bytes.byteLength, 512 * 1024)).toString("latin1");
  if (/\/JavaScript|\/JS[\s\/\[<]|\/Launch\b|\/EmbeddedFile\b/i.test(head)) {
    return "Le PDF contient du contenu à risque et a été refusé.";
  }
  return null;
}
