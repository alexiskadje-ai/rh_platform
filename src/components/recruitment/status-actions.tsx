"use client";

import { updateApplicationStatus } from "@/server/actions/recruitment";
import { Button } from "@/components/ui/button";

async function changeStatus(formData: FormData) {
  await updateApplicationStatus({}, formData);
}

export function StatusActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === "RECEIVED" ? (
        <form action={changeStatus}>
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="status" value="SHORTLISTED" />
          <Button type="submit" size="sm">
            Présélectionner
          </Button>
        </form>
      ) : null}
      {status === "INTERVIEW" ? (
        <form action={changeStatus}>
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="status" value="ACCEPTED" />
          <Button type="submit" size="sm">
            Accepter
          </Button>
        </form>
      ) : null}
      {status !== "ACCEPTED" && status !== "REJECTED" ? (
        <form action={changeStatus}>
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="status" value="REJECTED" />
          <Button type="submit" size="sm" variant="destructive">
            Refuser
          </Button>
        </form>
      ) : null}
    </div>
  );
}
