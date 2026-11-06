import { PaymentProvider, Role } from "@prisma/client";
import { FileText } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatFcfa,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  paymentMethodLabel,
} from "@/lib/shop";
import { createPresignedDownload } from "@/lib/storage";
import { confirmManualPayment } from "@/server/actions/payments";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const payments = await db.payment.findMany({
    include: {
      order: {
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const rows = await Promise.all(
    payments.map(async (payment) => ({
      payment,
      invoiceHref: payment.invoiceUrl
        ? await createPresignedDownload(payment.invoiceUrl)
        : null,
    })),
  );

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="text-2xl font-semibold">Paiements</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        MoMo, Stripe et Orange Money (Notch Pay) se confirment automatiquement. Les factures PDF se
        téléchargent ici, sur PES-RH.
      </p>
      <div className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun paiement pour le moment.</p>
        ) : (
          rows.map(({ payment, invoiceHref }) => {
            const canConfirm =
              payment.status === "pending" &&
              payment.gateway !== "NOTCHPAY" &&
              (payment.provider === PaymentProvider.ORANGE_MONEY ||
                payment.provider === PaymentProvider.BANK_TRANSFER);
            return (
              <Card key={payment.id} className="hover:translate-y-0">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {payment.order
                        ? `${payment.order.user.firstName} ${payment.order.user.lastName}`
                        : "Paiement"}{" "}
                      · {formatFcfa(payment.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {paymentMethodLabel(payment.provider)} · {payment.reference}
                      {payment.phone ? ` · ${payment.phone}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.createdAt.toLocaleString("fr-FR")}
                      {payment.order
                        ? ` · commande ${ORDER_STATUS_LABELS[payment.order.status] ?? payment.order.status}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium">
                      {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                    </p>
                    {invoiceHref ? (
                      <a
                        href={invoiceHref}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                      >
                        <FileText className="size-4" />
                        Facture PDF
                      </a>
                    ) : null}
                    {canConfirm ? (
                      <form action={confirmManualPayment}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <Button type="submit" size="sm">
                          Marquer payé
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
