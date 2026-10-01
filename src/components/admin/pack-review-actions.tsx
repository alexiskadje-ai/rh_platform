"use client";

import { useActionState } from "react";
import { approveRecruiterPack, rejectRecruiterPack, type AdminActionState } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";

const empty: AdminActionState = {};

export function PackReviewActions({ companyId }: { companyId: string }) {
  const [approved, approve] = useActionState(approveRecruiterPack, empty);
  const [rejected, reject] = useActionState(rejectRecruiterPack, empty);
  const message = approved.message ?? rejected.message;
  const ok = approved.ok || rejected.ok;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <form action={approve}>
          <input type="hidden" name="companyId" value={companyId} />
          <Button type="submit" size="sm">
            Valider
          </Button>
        </form>
        <form action={reject}>
          <input type="hidden" name="companyId" value={companyId} />
          <Button type="submit" size="sm" variant="outline">
            Refuser
          </Button>
        </form>
      </div>
      {message ? (
        <p className={`max-w-xs text-xs ${ok ? "text-primary" : "text-destructive"}`}>{message}</p>
      ) : null}
    </div>
  );
}
