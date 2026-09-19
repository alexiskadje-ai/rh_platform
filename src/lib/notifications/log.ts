const SECRET_PATTERN =
  /(password|passwd|secret|token|authorization|api[_-]?key|EMAIL_PASSWORD)[=:\s]+\S+/gi;

export function notificationErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : "erreur inconnue";
  return raw.replace(SECRET_PATTERN, "$1=***");
}

export function logNotificationError(stage: string, error: unknown, extra?: string) {
  const detail = extra ? ` ${extra}` : "";
  console.error(`[notifications] ${stage}:${detail} ${notificationErrorMessage(error)}`);
}
