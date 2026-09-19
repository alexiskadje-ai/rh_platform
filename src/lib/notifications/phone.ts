export function toInternationalDigits(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = `237${digits}`;
  return digits;
}

export function toE164(phone: string) {
  return `+${toInternationalDigits(phone)}`;
}
