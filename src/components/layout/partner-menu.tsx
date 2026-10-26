"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { collapseMotion } from "@/lib/animations";
import type { NavLink } from "@/lib/nav";
import { cn } from "@/lib/utils";

function canHover() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function menuItems(root: HTMLElement | null) {
  return root ? [...root.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]')] : [];
}

export function PartnerMenu({
  items,
  placement,
  onNavigate,
}: {
  items: readonly NavLink[];
  placement: "overlay" | "inline";
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<number | null>(null);
  const menuId = `menu-partenaire-${placement}`;

  function focusItem(index: number) {
    const links = menuItems(rootRef.current);
    if (links.length === 0) {
      pendingFocus.current = index;
      return;
    }
    const next = ((index % links.length) + links.length) % links.length;
    links[next]?.focus();
  }

  useEffect(() => {
    if (!open || pendingFocus.current === null) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    const links = menuItems(rootRef.current);
    if (links.length === 0) return;
    const next = ((index % links.length) + links.length) % links.length;
    links[next]?.focus();
  }, [open]);

  function closeAndFocusButton() {
    setOpen(false);
    buttonRef.current?.focus();
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
          buttonVariants({ variant: "default", size: "sm" }),
          "justify-between gap-2",
          placement === "inline" && "w-full",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeAndFocusButton();
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            focusItem(0);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            focusItem(-1);
          }
        }}
      >
        Partenaire
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="menu"
            aria-label="Partenaire"
            {...collapseMotion}
            className={cn(
              "z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-lg",
              placement === "overlay" ? "absolute right-0 w-64" : "relative w-full",
            )}
          >
            {items.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                rel="noopener"
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent/15 hover:text-accent focus:bg-accent/15 focus:outline-none"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeAndFocusButton();
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    focusItem(index + 1);
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    focusItem(index - 1);
                  }
                }}
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
