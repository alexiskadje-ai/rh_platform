"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import {
  consumeInstallPrompt,
  getInstallPrompt,
  listenForInstallPrompt,
  subscribeInstallPrompt,
  wasAppInstalled,
} from "@/components/pwa/install-prompt";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pes-rh-install-prompt";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

function isStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

function wasDismissedRecently() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // stockage indisponible : le bandeau peut réapparaître au prochain chargement
  }
}

function manualInstallHint() {
  const ua = window.navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) {
    return "Dans Safari, touchez Partager, puis « Sur l'écran d'accueil ».";
  }
  if (/safari/i.test(ua) && !/chrome|crios|android|edg/i.test(ua)) {
    return "Dans Safari, ouvrez le menu Fichier, puis « Ajouter au Dock ».";
  }
  return "Ouvrez le menu du navigateur, puis choisissez « Installer l'application ».";
}

export function InstallAppPrompt() {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    listenForInstallPrompt();
    if (isStandalone() || wasAppInstalled() || wasDismissedRecently()) return;

    const timer = window.setTimeout(() => setOpen(true), 1800);
    setCanPrompt(Boolean(getInstallPrompt()));
    const stop = subscribeInstallPrompt(() => {
      if (wasAppInstalled() || isStandalone()) {
        setOpen(false);
        return;
      }
      setCanPrompt(Boolean(getInstallPrompt()));
    });

    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, []);

  if (!open) return null;

  function dismiss() {
    rememberDismiss();
    setOpen(false);
    setHint(null);
  }

  async function install() {
    const event = consumeInstallPrompt();
    if (event) {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") {
        dismiss();
        return;
      }
      setCanPrompt(false);
      return;
    }
    setHint(manualInstallHint());
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center p-4 sm:bottom-6 sm:justify-end sm:p-6">
      <aside
        role="dialog"
        aria-labelledby="install-app-title"
        aria-describedby="install-app-desc"
        className="pointer-events-auto w-full max-w-sm rounded-3xl border border-primary/10 bg-card p-4 shadow-[0_18px_50px_rgba(4,41,99,0.18)]"
      >
        <div className="flex items-start gap-3">
          <Image
            src="/brand/pes-mark.png"
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-2xl shadow-[0_8px_20px_rgba(4,41,99,0.18)] ring-1 ring-primary/10"
            priority
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 id="install-app-title" className="font-display text-lg leading-tight text-primary">
                Installer {APP_NAME}
              </h2>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Fermer"
              >
                <X className="size-4" />
              </button>
            </div>
            <p id="install-app-desc" className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Ajoutez l&apos;icône sur votre téléphone pour ouvrir la plateforme directement, sans repasser
              par le moteur de recherche.
            </p>
          </div>
        </div>

        {hint ? (
          <p className="mt-3 flex gap-2 rounded-2xl bg-muted/70 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <Share className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {hint}
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button type="button" className={cn(buttonVariants({ variant: "ghost" }), "flex-1")} onClick={dismiss}>
            Plus tard
          </button>
          <button type="button" className={cn(buttonVariants(), "flex-1")} onClick={() => void install()}>
            <Download className="size-3.5" />
            {hint && !canPrompt ? "Réessayer" : "Installer"}
          </button>
        </div>
      </aside>
    </div>
  );
}
