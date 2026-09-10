"use client";

import { useState } from "react";
import {
  presignPrivateFile,
  uploadLocalFile,
} from "@/server/actions/files";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FileUrlField({
  name,
  folder,
  label,
  accept,
  defaultUrl = "",
  onUploaded,
}: {
  name: string;
  folder: string;
  label: string;
  accept?: string;
  defaultUrl?: string;
  onUploaded?: (url: string) => void;
}) {
  const [fileUrl, setFileUrl] = useState(defaultUrl);
  const [status, setStatus] = useState("");

  function ready(url: string) {
    setFileUrl(url);
    onUploaded?.(url);
    setStatus("Fichier prêt.");
  }

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("Envoi…");
    const meta = new FormData();
    meta.set("folder", folder);
    meta.set("filename", file.name);
    meta.set("contentType", file.type || "application/octet-stream");
    const signed = await presignPrivateFile({}, meta);
    if (!signed.ok || !signed.fileUrl) {
      setStatus(signed.message ?? "Échec de l'envoi.");
      return;
    }
    if (signed.mode === "s3" && signed.uploadUrl) {
      const put = await fetch(signed.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!put.ok) {
        setStatus("Échec du transfert S3.");
        return;
      }
      ready(signed.fileUrl);
      return;
    } else {
      const local = new FormData();
      local.set("folder", folder);
      local.set("file", file);
      const uploaded = await uploadLocalFile(local);
      if (!uploaded.fileUrl) {
        setStatus(uploaded.message ?? "Échec de l'envoi local.");
        return;
      }
      ready(uploaded.fileUrl);
      return;
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="file" accept={accept} onChange={onChange} />
      <input type="hidden" name={name} value={fileUrl} />
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
      {fileUrl && !status ? (
        <p className="text-xs text-muted-foreground">Fichier déjà joint.</p>
      ) : null}
    </div>
  );
}
