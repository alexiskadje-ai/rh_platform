"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { NavLink } from "@/lib/nav";
import { cn } from "@/lib/utils";

function canHover() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function SpaceMenu({
  label,
  items,
  placement,
  tone = "primary",
  onNavigate,
}: {
  label: string;
  items: readonly NavLink[];
  placement: "overlay" | "inline";
  tone?: "primary" | "accent";
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function focusFirstItem() {
    queueMicrotask(() => {
      rootRef.current?.querySelector<HTMLAnchorElement>('[role="menuitem"]')?.focus();
    });
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative", placement === "inline" && "w-full")}
      onMouseEnter={() => {
        if (canHover()) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!canHover()) return;
        const active = document.activeElement;
        if (rootRef.current?.contains(active)) return;
        setOpen(false);
      }}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          buttonVariants({ variant: tone === "accent" ? "accent" : "default", size: "sm" }),
          "justify-between gap-2",
          placement === "inline" && "w-full",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            buttonRef.current?.focus();
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            focusFirstItem();
          }
        }}
      >
        {label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            "z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-lg",
            placement === "overlay" ? "absolute right-0 w-64" : "relative w-full",
          )}
        >
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              className="block px-4 py-2.5 text-sm hover:bg-accent/15 hover:text-accent focus:bg-accent/15 focus:outline-none"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                  buttonRef.current?.focus();
                }
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
