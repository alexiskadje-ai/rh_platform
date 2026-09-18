export type BankTransferDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  swift: string | null;
};

export function getBankTransferDetails(): BankTransferDetails {
  const bankName = process.env.BANK_NAME?.trim() || "Afriland First Bank";
  const accountName = process.env.BANK_ACCOUNT_NAME?.trim() || "PES-RH";
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER?.trim() || "";
  const swift = process.env.BANK_SWIFT?.trim() || null;
  return { bankName, accountName, accountNumber, swift };
}
