/** Brouillon d'onglet (sessionStorage). Jamais de mot de passe. */

export function readSessionDraft<T extends Record<string, unknown>>(key: string): Partial<T> | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Partial<T>;
  } catch {
    return null;
  }
}

export function writeSessionDraft(key: string, value: Record<string, unknown>) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function clearSessionDraft(key: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(key);
}
