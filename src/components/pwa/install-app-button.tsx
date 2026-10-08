"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Share, X } from "lucide-react";
import {
  consumeInstallPrompt,
  listenForInstallPrompt,
  subscribeInstallPrompt,
  wasAppInstalled,
} from "@/components/pwa/install-prompt";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Appearance = "menu" | "header" | "card";

function manualInstallHint() {
  const ua = window.navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) {
    return "Dans Safari, touchez Partager, puis Sur l'écran d'accueil.";
  }
  if (/safari/i.test(ua) && !/chrome|crios|android|edg/i.test(ua)) {
    return "Dans Safari, ouvrez le menu Fichier, puis Ajouter au Dock.";
  }
  if (/firefox/i.test(ua)) {
    return "Ouvrez le menu du navigateur, puis choisissez Installer si la commande est proposée.";
  }
  return "Ouvrez le menu du navigateur, puis choisissez Installer l'application.";
}

function browserOffersPrompt() {
  const ua = window.navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return false;
  if (/firefox/i.test(ua)) return false;
  if (/safari/i.test(ua) && !/chrome|crios|android|edg/i.test(ua)) return false;
  return true;
}

export function InstallAppButton({
  appearance = "card",
  onBlue = false,
  onDialog,
}: {
  appearance?: Appearance;
  onBlue?: boolean;
  onDialog?: (open: boolean) => void;
}) {
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState<string | null>(null);

  useEffect(() => {
    listenForInstallPrompt();
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
    if (standalone || wasAppInstalled()) setInstalled(true);
    return subscribeInstallPrompt(() => {
      if (wasAppInstalled()) {
        setInstalled(true);
        setHelp(null);
        onDialog?.(false);
      }
    });
  }, [onDialog]);

  if (installed) return null;

  async function install() {
    const promptEvent = consumeInstallPrompt();
    if (promptEvent) {
      await promptEvent.prompt();
      return;
    }
    if (browserOffersPrompt()) {
      setHelp("Rechargez la page. Le navigateur proposera ensuite d'ouvrir l'ERP dans sa propre fenêtre.");
      onDialog?.(true);
      return;
    }
    const hint = manualInstallHint();
    setHelp(hint);
    onDialog?.(true);
  }

  function closeHelp() {
    setHelp(null);
    onDialog?.(false);
  }

  const label = "Installer l'ERP";

  return (
    <>
      {appearance === "menu" ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm text-primary hover:bg-primary/6"
          onClick={() => void install()}
        >
          <Download className="size-3.5" />
          {label}
        </button>
      ) : (
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: appearance === "header" && onBlue ? "outline" : "default", size: "sm" }),
            appearance === "header" && onBlue && "border-primary-foreground/40 text-primary-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground",
          )}
          onClick={() => void install()}
        >
          <Download className="size-3.5" />
          {label}
        </button>
      )}
      {help && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-primary/40 px-4" role="presentation">
              <div
                role="dialog"
                aria-labelledby="pwa-install-title"
                className="w-full max-w-sm rounded-3xl border border-primary/10 bg-card p-6 shadow-[0_16px_40px_rgba(4,41,99,0.16)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                    <Share className="size-4" />
                  </span>
                  <button type="button" className="rounded-full p-1 text-muted-foreground hover:bg-muted" onClick={closeHelp} aria-label="Fermer">
                    <X className="size-4" />
                  </button>
                </div>
                <h2 id="pwa-install-title" className="mt-4 font-display text-xl text-primary">
                  Installer l'ERP
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{help}</p>
                <button type="button" className={cn(buttonVariants(), "mt-5 w-full")} onClick={closeHelp}>
                  Compris
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
