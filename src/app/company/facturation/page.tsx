import { Role } from "@prisma/client";
import { requireRecruiter } from "@/lib/dal";
import { db } from "@/lib/db";
import { isRecruteurPro } from "@/lib/subscriptions";
import { formatFcfa } from "@/lib/shop";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ContactForm } from "@/components/content/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CompanyBillingPage() {
  const { companyId, company } = await requireRecruiter();
  const [pro, users] = await Promise.all([
    isRecruteurPro(companyId),
    db.user.findMany({ where: { companyId }, select: { id: true } }),
  ]);
  const userIds = users.map((item) => item.id);
  const payments = userIds.length
    ? await db.payment.findMany({
        where: { order: { userId: { in: userIds } } },
        include: { order: { include: { items: { include: { product: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    : [];
  const subscription = await db.subscription.findUnique({
    where: { companyId },
  });

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace entreprise">
      <h1 className="font-display text-3xl font-medium text-primary">Facturation</h1>
      <p className="mt-2 text-muted-foreground">{company.name}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abonnement Recruteur Pro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {pro && subscription ? (
              <p>
                Actif jusqu&apos;au {subscription.renewsAt.toLocaleDateString("fr-FR")}. Vos offres
                sont mises en avant sur le fil public.
              </p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Offres mises en avant, volume de candidatures et rapports avancés — sur devis.
                </p>
                <ContactForm subject="recruteur_pro" compact />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paiements récents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {payments.length === 0 ? (
              <p className="text-muted-foreground">Aucun paiement pour le moment.</p>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="rounded-xl border border-border p-3">
                  <p className="font-medium">
                    {formatFcfa(payment.amount)} · {payment.status}
                  </p>
                  <p className="text-muted-foreground">
                    {payment.order?.items.map((item) => item.product.title).join(", ")} ·{" "}
                    {payment.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
