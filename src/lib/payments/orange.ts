export function getOrangeMerchantKey() {
  return process.env.ORANGE_MONEY_MERCHANT_KEY?.trim() || "";
}

export function orangePayHint() {
  const merchant = getOrangeMerchantKey();
  if (merchant) {
    return `Composez #150# puis Paiement marchand, code ${merchant}. Conservez la référence PES-RH.`;
  }
  return "Composez #150# (ou l’application Orange Money) et payez le marchand PES-RH en indiquant la référence.";
}
