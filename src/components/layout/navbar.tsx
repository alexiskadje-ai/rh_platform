"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/lib/nav";

export function Navbar({
  items,
  pathname,
  overlay,
  onNavigate,
  layout,
}: {
  items: readonly NavLink[];
  pathname: string;
  overlay: boolean;
  onNavigate?: () => void;
  layout: "row" | "stack";
}) {
  return (
    <nav
      className={cn(
        layout === "row" ? "hidden items-center gap-6 text-[13px] lg:flex" : "flex flex-col gap-1",
      )}
      aria-label="Navigation principale"
    >
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        if (layout === "stack") {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "rounded-xl px-3 py-3 text-sm transition-colors",
                overlay
                  ? "text-primary-foreground/85 hover:bg-white/10 hover:text-highlight"
                  : "hover:bg-accent/15 hover:text-accent",
                active && (overlay ? "bg-white/10 text-highlight" : "text-primary"),
              )}
            >
              {item.label}
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative transition-colors",
              overlay ? "hover:text-highlight" : "text-muted-foreground hover:text-accent",
              active && (overlay ? "text-highlight" : "text-primary"),
            )}
          >
            {item.label}
            {active ? (
              <span
                className={cn(
                  "absolute -bottom-1 left-0 h-px w-full",
                  overlay ? "bg-highlight" : "bg-accent",
                )}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
