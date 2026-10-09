"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  closeJobOffer,
  deleteJobOffer,
  reopenJobOffer,
} from "@/server/actions/recruitment";

export function OfferStatusActions({
  offerId,
  status,
}: {
  offerId: string;
  status: "OPEN" | "CLOSED";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(action: (formData: FormData) => Promise<{ message?: string; ok?: boolean }>) {
    start(async () => {
      const formData = new FormData();
      formData.set("id", offerId);
      const result = await action(formData);
      if (result?.message && !result.ok) {
        window.alert(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "OPEN" ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (window.confirm("Clôturer cette offre ? Elle disparaîtra du site public.")) {
              run(closeJobOffer);
            }
          }}
        >
          Clôturer l&apos;offre
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => run(reopenJobOffer)}
        >
          Rouvrir l&apos;offre
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        className="border-destructive/40 text-destructive hover:bg-destructive/10"
        onClick={() => {
          if (
            window.confirm(
              "Supprimer définitivement cette offre ? Impossible s'il existe des candidatures.",
            )
          ) {
            run(deleteJobOffer);
          }
        }}
      >
        Supprimer
      </Button>
    </div>
  );
}
