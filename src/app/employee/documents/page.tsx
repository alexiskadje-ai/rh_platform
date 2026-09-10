import { Role } from "@prisma/client";
import { requireEmployee } from "@/lib/dal";
import { createPresignedDownload } from "@/lib/storage";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function EmployeeDocumentsPage() {
  const { employee } = await requireEmployee();
  const docs = await Promise.all(
    employee.documents.map(async (doc) => ({
      ...doc,
      href: await createPresignedDownload(doc.fileUrl),
    })),
  );

  return (
    <DashboardShell role={Role.EMPLOYEE} title="Espace employé">
      <h1 className="text-2xl font-semibold">Mes documents</h1>
      <div className="mt-6 space-y-3">
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun document.</p>
        ) : (
          docs.map((doc) => (
            <a
              key={doc.id}
              href={doc.href}
              className="block rounded-xl border border-border p-3 text-sm"
              target="_blank"
            >
              {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] ?? doc.type} ·{" "}
              {doc.uploadedAt.toLocaleDateString("fr-FR")}
            </a>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
