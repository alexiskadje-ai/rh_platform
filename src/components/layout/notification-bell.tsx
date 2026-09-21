"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { markNotificationRead } from "@/server/actions/notifications";
import type { InboxPreview } from "@/lib/notifications/inbox";
import { cn } from "@/lib/utils";

export function NotificationBell({
  inbox,
  light = false,
}: {
  inbox: InboxPreview;
  light?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative inline-flex size-10 items-center justify-center rounded-full transition-colors",
          light
            ? "text-primary-foreground hover:bg-accent hover:text-accent-foreground"
            : "text-foreground hover:bg-accent/15 hover:text-accent",
        )}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="size-4" />
        {inbox.unreadCount > 0 ? (
          <span className="absolute right-1 top-1 min-w-4 rounded-full bg-accent px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
            {inbox.unreadCount > 9 ? "9+" : inbox.unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/80 bg-background text-foreground shadow-[0_16px_50px_rgba(20,33,28,0.12)]">
          <p className="border-b border-border/60 px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Notifications
          </p>
          {inbox.items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Aucune notification.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {inbox.items.map((item) => (
                <li key={item.id} className={cn("border-b border-border/40 px-4 py-3", !item.read && "bg-muted/50")}>
                  <p className="text-sm leading-snug">{item.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("fr-FR")}
                  </p>
                  {!item.read ? (
                    <form action={markNotificationRead} className="mt-2">
                      <input type="hidden" name="notificationId" value={item.id} />
                      <button type="submit" className="text-xs text-primary underline-offset-2 hover:text-accent hover:underline">
                        Marquer comme lue
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
