export const RECAPTCHA_REQUIRED_MESSAGE =
  "Cochez « Je ne suis pas un robot » avant d'envoyer.";

export async function verifyRecaptcha(token: string | null | undefined) {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) return false;
  const value = token?.trim() ?? "";
  if (!value) return false;

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: value }),
  });
  if (!response.ok) return false;
  const payload = (await response.json()) as { success?: boolean };
  return payload.success === true;
}

export async function recaptchaFailed(formData: FormData) {
  return !(await verifyRecaptcha(String(formData.get("g-recaptcha-response") ?? "")));
}
