import { Button } from "@/components/ui/button";
import { ERP_HIRE_RETRY_MESSAGE, type HireSync } from "@/lib/erp/access";
import { sendApplicationToErp } from "@/server/actions/erp";

export function ErpHireActions({
  applicationId,
  accepted,
  sync,
  linked,
}: {
  applicationId: string;
  accepted: boolean;
  sync: HireSync;
  linked: boolean;
}) {
  if (!linked || !accepted) return null;
  if (sync === "SENT") {
    return (
      <Button type="button" size="sm" disabled>
        Envoyé vers l'ERP
      </Button>
    );
  }
  if (sync === "PENDING") {
    return <p className="text-sm text-muted-foreground">Envoi vers l'ERP en cours.</p>;
  }
  return (
    <div className="flex flex-col items-start gap-2">
      {sync === "FAILED" ? <p className="text-sm text-destructive">{ERP_HIRE_RETRY_MESSAGE}</p> : null}
      <form action={sendApplicationToErp}>
        <input type="hidden" name="applicationId" value={applicationId} />
        <Button type="submit" size="sm">
          {sync === "FAILED" ? "Réessayer" : "Envoyer vers l'ERP"}
        </Button>
      </form>
    </div>
  );
}
