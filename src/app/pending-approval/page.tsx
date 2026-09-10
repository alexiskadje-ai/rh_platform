import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PendingApprovalPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Compte en attente de validation</CardTitle>
          <CardDescription>
            Un administrateur vérifie votre entreprise. Vous serez notifié dès que
            le compte sera activé. Reconnectez-vous ensuite pour accéder à l&apos;espace recruteur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Le registre de commerce / N° contribuable pourra être exigé avant validation.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
