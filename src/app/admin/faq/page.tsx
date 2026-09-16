import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { rejectFaqQuestion } from "@/server/actions/content";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminFaqAnswerForm } from "@/components/admin/faq-answer-form";
import { Button } from "@/components/ui/button";
import { NEWSLETTER_ALERTS } from "@/lib/validations/content";

export default async function AdminFaqPage() {
  await requireAdmin();
  const [pending, published, subscribers] = await Promise.all([
    db.faqItem.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    db.faqItem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { answeredAt: "desc" },
      take: 20,
    }),
    db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="text-2xl font-semibold">FAQ et newsletter</h1>

      <section className="mt-8">
        <h2 className="font-display text-xl text-primary">Questions en attente</h2>
        <div className="mt-4 space-y-4">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune question en attente.</p>
          ) : (
            pending.map((item) => (
              <article key={item.id} className="rounded-2xl border border-border bg-card p-5">
                <p className="font-medium">{item.question}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.name} · {item.email}
                </p>
                <AdminFaqAnswerForm id={item.id} question={item.question} />
                <form
                  action={async () => {
                    "use server";
                    await rejectFaqQuestion(item.id);
                  }}
                  className="mt-3"
                >
                  <Button type="submit" variant="outline" size="sm">
                    Rejeter
                  </Button>
                </form>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-primary">FAQ publiées</h2>
        <div className="mt-4 space-y-3">
          {published.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-medium">{item.question}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-primary">Abonnés newsletter</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subscribers.length} dernier(s) inscrit(s)</p>
        <div className="mt-4 space-y-2">
          {subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun abonné pour le moment.</p>
          ) : (
            subscribers.map((item) => (
              <p key={item.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                {item.email}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {item.alerts
                    .map((alert) => NEWSLETTER_ALERTS.find((entry) => entry.id === alert)?.label ?? alert)
                    .join(" · ")}
                </span>
              </p>
            ))
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
