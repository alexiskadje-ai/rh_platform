"use client";

import { useState } from "react";
import { checkIn, checkOut } from "@/server/actions/attendance";
import { Button } from "@/components/ui/button";

export function AttendanceButtons({
  hasCheckIn,
  hasCheckOut,
}: {
  hasCheckIn: boolean;
  hasCheckOut: boolean;
}) {
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={hasCheckIn}
          onClick={async () => {
            const result = await checkIn();
            setMessage(result.message ?? "");
          }}
        >
          Pointer l&apos;entrée
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!hasCheckIn || hasCheckOut}
          onClick={async () => {
            const result = await checkOut();
            setMessage(result.message ?? "");
          }}
        >
          Pointer la sortie
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
