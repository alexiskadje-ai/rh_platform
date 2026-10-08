"use client";

import { useEffect } from "react";
import { listenForInstallPrompt } from "@/components/pwa/install-prompt";

export function PwaRegister({ scope }: { scope: "/company/" | "/employee/" }) {
  listenForInstallPrompt();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope }).catch(() => {
      // L'installation reste disponible au prochain chargement.
    });
  }, [scope]);

  return null;
}
