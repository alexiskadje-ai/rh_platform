"use server";

import { requireRecruiter } from "@/lib/dal";
import { fieldErrorsFromZod } from "@/lib/users";
import { REPORT_TYPE_LABELS } from "@/lib/constants";
import { reportRequestSchema } from "@/lib/validations/reports";
import { buildReportTable } from "@/lib/reports/aggregations";
import { renderReportPdf } from "@/lib/reports/pdf";

export type ReportActionState = {
  ok?: boolean;
  message?: string;
  filename?: string;
  base64?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function generateReportPdf(
  formData: FormData,
): Promise<ReportActionState> {
  const { company } = await requireRecruiter();
  const parsed = reportRequestSchema.safeParse({
    type: formData.get("type"),
    from: formData.get("from"),
    to: formData.get("to"),
  });
  if (!parsed.success) {
    return {
      message: "Période ou type de rapport invalide.",
      errors: fieldErrorsFromZod(parsed.error),
    };
  }

  const report = await buildReportTable({
    companyId: company.id,
    companyName: company.name,
    type: parsed.data.type,
    from: parsed.data.from,
    to: parsed.data.to,
  });
  const buffer = await renderReportPdf(report);
  const slug = REPORT_TYPE_LABELS[parsed.data.type]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

  return {
    ok: true,
    filename: `${slug}_${parsed.data.from}_${parsed.data.to}.pdf`,
    base64: buffer.toString("base64"),
  };
}
