/**
 * Orange Money — flux actuel : paiement marchand manuel (USSD / app).
 * Quand les clés de production arriveront (`ORANGE_MONEY_API_KEY` + merchant),
 * brancher ici l'API Web Payment sans changer le tunnel UI (même provider ORANGE_MONEY).
 * En attendant, l'admin confirme manuellement dans /admin/paiements.
 */

export function getOrangeMerchantKey() {
  return process.env.ORANGE_MONEY_MERCHANT_KEY?.trim() || "";
}

export function getOrangeApiKey() {
  return process.env.ORANGE_MONEY_API_KEY?.trim() || "";
}

/** Vrai lorsque les secrets prod sont présents (API à brancher). */
export function isOrangeApiConfigured() {
  return Boolean(getOrangeApiKey() && getOrangeMerchantKey());
}

export function orangePayHint() {
  const merchant = getOrangeMerchantKey();
  if (isOrangeApiConfigured()) {
    return merchant
      ? `Orange Money (clés API détectées — confirmation auto à activer). En attendant : #150# marchand ${merchant}.`
      : "Orange Money (clés API détectées — confirmation auto à activer).";
  }
  if (merchant) {
    return `Composez #150# puis Paiement marchand, code ${merchant}. Conservez la référence PES-RH. Après paiement, un admin confirmera la transaction.`;
  }
  return "Composez #150# (ou l’application Orange Money) et payez le marchand PES-RH en indiquant la référence. Un admin confirmera ensuite le paiement.";
}
