import { APP_NAME } from "@/lib/constants";
import { absoluteUrl } from "@/lib/site";

export type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

export function wrapEmailHtml(title: string, bodyHtml: string) {
  const logo = absoluteUrl("/brand/pes-mark-192.png");
  return `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#eef3f9;font-family:Georgia,'Times New Roman',serif;color:#14211c;line-height:1.55">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f9;padding:28px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid rgba(4,41,99,0.08)">
            <tr>
              <td style="background:#042963;padding:22px 28px;text-align:center">
                <img src="${logo}" width="56" height="56" alt="${APP_NAME}" style="display:inline-block;border-radius:14px;border:0" />
                <p style="margin:12px 0 0;letter-spacing:0.22em;text-transform:uppercase;font-size:11px;color:#f4f7fb;font-family:Arial,Helvetica,sans-serif">${APP_NAME}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px">
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:500;color:#042963">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
