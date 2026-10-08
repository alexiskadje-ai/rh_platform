"use client";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Écoute dès le chargement de l'espace, même si le bouton n'est pas encore affiché. */
export function listenForInstallPrompt() {
  if (typeof window === "undefined") return;
  const marker = window as Window & { __pesRhInstall?: boolean };
  if (marker.__pesRhInstall) return;
  marker.__pesRhInstall = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    emit();
  });
}

export function getInstallPrompt() {
  return deferred;
}

export function consumeInstallPrompt() {
  const current = deferred;
  deferred = null;
  emit();
  return current;
}

export function wasAppInstalled() {
  return installed;
}

export function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
