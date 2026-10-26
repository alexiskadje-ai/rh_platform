/** iss et aud du jeton SSO. La chaîne d'environnement est reprise telle quelle. */
export function ssoClaims(env: {
  ERP_SSO_ISSUER?: string;
  ERP_SSO_AUDIENCE?: string;
  AUTH_URL?: string;
}) {
  return {
    iss: env.ERP_SSO_ISSUER ?? "",
    aud: env.ERP_SSO_AUDIENCE ?? "",
  };
}
