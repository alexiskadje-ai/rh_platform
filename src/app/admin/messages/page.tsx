import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { activateRecruteurPro } from "@/server/actions/admin";
import { publishTestimonial, rejectTestimonial } from "@/server/actions/content";
import { Button } from "@/components/ui/button";

export default async function AdminMessagesPage() {
  await requireAdmin();
  const [messages, companies, pendingAvis] = await Promise.all([
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.company.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.testimonial.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="font-display text-3xl font-medium text-primary">Messages et devis</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Avis à relire</h2>
        <div className="mt-4 space-y-3">
          {pendingAvis.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun avis en attente.</p>
          ) : (
            pendingAvis.map((item) => (
              <article key={item.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
                <p className="font-medium">
                  {item.name}
                  {item.role ? ` · ${item.role}` : ""} · {item.email}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">“{item.quote}”</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await publishTestimonial(item.id);
                    }}
                  >
                    <Button type="submit" size="sm">
                      Publier
                    </Button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await rejectTestimonial(item.id);
                    }}
                  >
                    <Button type="submit" variant="outline" size="sm">
                      Rejeter
                    </Button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="mt-10 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun message.</p>
        ) : (
          messages.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">
                {item.name} · {item.email}
                {item.subject === "recruteur_pro" ? " · Recruteur Pro" : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{item.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {item.createdAt.toLocaleString("fr-FR")}
              </p>
            </article>
          ))
        )}
      </div>
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Activer Recruteur Pro</h2>
        <form action={async (formData) => {
          "use server";
          await activateRecruteurPro({}, formData);
        }} className="mt-4 flex flex-wrap items-end gap-3">
          <select
            name="companyId"
            required
            className="h-11 rounded-xl border border-input bg-card px-3 text-sm"
          >
            <option value="">Entreprise…</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <input
            name="months"
            type="number"
            min={1}
            max={24}
            defaultValue={12}
            className="h-11 w-24 rounded-xl border border-input bg-card px-3 text-sm"
          />
          <Button type="submit">Activer</Button>
        </form>
      </section>
    </DashboardShell>
  );
}
