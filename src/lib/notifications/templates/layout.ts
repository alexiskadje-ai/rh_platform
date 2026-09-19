import { APP_NAME } from "@/lib/constants";

export type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

export function wrapEmailHtml(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="fr">
  <body style="font-family:Georgia,serif;color:#14211c;line-height:1.5">
    <p style="letter-spacing:0.2em;text-transform:uppercase;font-size:12px">${APP_NAME}</p>
    <h1 style="font-size:22px;font-weight:500">${title}</h1>
    ${bodyHtml}
  </body>
</html>`;
}
