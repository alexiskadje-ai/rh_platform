import {
  PAYMENT_METHOD_LABELS,
  PRODUCT_TYPE_LABELS,
  type ProductType,
} from "@/lib/constants";

export function formatFcfa(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export function productTypeLabel(type: string) {
  return PRODUCT_TYPE_LABELS[type as ProductType] ?? type;
}

export function paymentMethodLabel(provider: keyof typeof PAYMENT_METHOD_LABELS) {
  return PAYMENT_METHOD_LABELS[provider];
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  failed: "Échouée",
};
