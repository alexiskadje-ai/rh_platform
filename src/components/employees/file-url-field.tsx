"use client";

import { useState } from "react";
import {
  presignPrivateFile,
  uploadLocalFile,
} from "@/server/actions/employees";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FileUrlField({
  name,
  folder,
  label,
}: {
  name: string;
  folder: string;
  label: string;
}) {
  const [fileUrl, setFileUrl] = useState("");
  const [status, setStatus] = useState("");

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
      setFileUrl(signed.fileUrl);
    } else {
      const local = new FormData();
      local.set("folder", folder);
      local.set("file", file);
      const uploaded = await uploadLocalFile(local);
      if (!uploaded.fileUrl) {
        setStatus(uploaded.message ?? "Échec de l'envoi local.");
        return;
      }
      setFileUrl(uploaded.fileUrl);
    }
    setStatus("Fichier prêt.");
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="file" onChange={onChange} />
      <input type="hidden" name={name} value={fileUrl} />
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}
