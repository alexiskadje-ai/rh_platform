import { APP_NAME } from "@/lib/constants";

type MailPayload = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: MailPayload) {
  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${APP_NAME} <noreply@rh-platform.local>`,
        to,
        subject,
        text,
      }),
    });
    if (!response.ok) {
      console.error("[email] Resend error", await response.text());
    }
    return;
  }

  console.info(`[email] to=${to} subject=${subject}\n${text}`);
}

export async function sendSms(to: string, message: string) {
  console.info(`[sms] to=${to}\n${message}`);
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/verify?token=${token}`;
  await sendEmail({
    to: email,
    subject: `Vérifiez votre compte ${APP_NAME}`,
    text: `Bonjour,\n\nConfirmez votre adresse e-mail en ouvrant ce lien :\n${url}\n\nLe lien expire dans 24 heures.`,
  });
  return url;
}

export async function sendVerificationSms(phone: string, code: string) {
  await sendSms(
    phone,
    `${APP_NAME} : votre code de vérification est ${code}. Il expire dans 10 minutes.`,
  );
}
