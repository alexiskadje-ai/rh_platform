import { APP_NAME } from "@/lib/constants";
import { getMailer, mailFrom, supportEmail } from "@/lib/mail";

type MailPayload = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, text, html, replyTo }: MailPayload) {
  const smtp = getMailer();
  if (smtp) {
    try {
      await smtp.sendMail({
        from: mailFrom(),
        to,
        subject,
        text,
        html,
        replyTo: replyTo ?? supportEmail(),
      });
    } catch (error) {
      console.error("[email] SMTP error", error instanceof Error ? error.message : error);
    }
    return;
  }

  if (process.env.RESEND_API_KEY) {
    const from = process.env.EMAIL_FROM?.trim()
      ? `${APP_NAME} <${process.env.EMAIL_FROM.trim()}>`
      : `${APP_NAME} <noreply@rh-platform.local>`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html,
        reply_to: replyTo ?? supportEmail(),
      }),
    });
    if (!response.ok) {
      console.error("[email] Resend error", await response.text());
    }
    return;
  }

  console.info(`[email] to=${Array.isArray(to) ? to.join(",") : to} subject=${subject}\n${text}`);
}

export async function sendSms(to: string, message: string) {
  console.info(`[sms] to=${to}\n${message}`);
}

export async function sendVerificationEmail(email: string, token: string) {
  const origin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const url = `${origin}/verify?token=${token}`;
  const help = supportEmail();
  const text = `Bonjour,\n\nVotre code de vérification ${APP_NAME} est : ${token}\n\nVous pouvez aussi confirmer votre e-mail en ouvrant ce lien :\n${url}\n\nLe code et le lien expirent dans 24 heures.${help ? `\n\nBesoin d'aide ? ${help}` : ""}`;
  const html = `
    <p>Bonjour,</p>
    <p>Votre code de vérification <strong>${APP_NAME}</strong> est :</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:700">${token}</p>
    <p>Vous pouvez aussi confirmer votre e-mail en cliquant sur ce lien :</p>
    <p><a href="${url}">${url}</a></p>
    <p>Le code et le lien expirent dans 24 heures.</p>
    ${help ? `<p>Besoin d'aide ? <a href="mailto:${help}">${help}</a></p>` : ""}
  `;
  await sendEmail({
    to: email,
    subject: `Votre code de vérification ${APP_NAME}`,
    text,
    html,
  });
  return url;
}

export async function sendVerificationSms(phone: string, code: string) {
  await sendSms(
    phone,
    `${APP_NAME} : votre code de vérification est ${code}. Il expire dans 10 minutes.`,
  );
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const origin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const url = `${origin}/reset-password/${token}`;
  const help = supportEmail();
  const text = `Bonjour,\n\nVous avez demandé à réinitialiser votre mot de passe ${APP_NAME}.\nOuvrez ce lien (valable 1 heure) :\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.${help ? `\n\nBesoin d'aide ? ${help}` : ""}`;
  const html = `
    <p>Bonjour,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe <strong>${APP_NAME}</strong>.</p>
    <p><a href="${url}">Choisir un nouveau mot de passe</a></p>
    <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
    ${help ? `<p>Besoin d'aide ? <a href="mailto:${help}">${help}</a></p>` : ""}
  `;
  await sendEmail({
    to: email,
    subject: `Réinitialisation du mot de passe ${APP_NAME}`,
    text,
    html,
  });
}
