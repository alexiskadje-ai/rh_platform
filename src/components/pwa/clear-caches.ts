/** Vide les caches du service worker. Aucune donnée RH n'y est stockée ; on les efface quand même à la déconnexion. */
export function clearPwaCaches() {
  if (typeof navigator === "undefined") return;
  navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_CACHES" });
  void caches?.keys?.().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
}
