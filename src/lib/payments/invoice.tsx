import "server-only";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import { APP_NAME } from "@/lib/constants";
import { BRAND, COMPANY_EMAIL, COMPANY_NAME, COMPANY_OFFICES } from "@/lib/company";
import { formatFcfa, paymentMethodLabel, productTypeLabel } from "@/lib/shop";
import type { PaymentProvider } from "@prisma/client";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: BRAND.dark,
  },
  top: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  brand: { fontSize: 11, color: BRAND.orange, letterSpacing: 1.4, marginBottom: 4 },
  company: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  meta: { fontSize: 9, color: "#5c645f", textAlign: "right" },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 16 },
  box: {
    backgroundColor: "#f4f7fb",
    padding: 12,
    borderRadius: 4,
    marginBottom: 18,
  },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  header: { backgroundColor: BRAND.dark, color: "#f4f7fb" },
  cell: { padding: 7, flexGrow: 1, flexBasis: 0 },
  qty: { width: 50, padding: 7 },
  amount: { width: 110, padding: 7, textAlign: "right" },
  total: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: 220,
    backgroundColor: BRAND.dark,
    color: "#f4f7fb",
    padding: 12,
  },
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 8, color: "#5c645f" },
});

export type InvoicePayload = {
  number: string;
  issuedAt: Date;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
  reference: string;
  provider: PaymentProvider;
  items: { title: string; type: string; quantity: number; unitPrice: number }[];
  total: number;
};

function InvoiceDocument({ invoice }: { invoice: InvoicePayload }) {
  const office = COMPANY_OFFICES[0];
  const dateLabel = invoice.issuedAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document title={`Facture ${invoice.number}`} author={APP_NAME} language="fr">
      <Page size="A4" style={styles.page}>
        <View style={styles.top}>
          <View>
            <Text style={styles.brand}>{APP_NAME}</Text>
            <Text style={styles.company}>{COMPANY_NAME}</Text>
            <Text style={styles.meta}>{office.address}</Text>
            <Text style={styles.meta}>{COMPANY_EMAIL}</Text>
          </View>
          <View>
            <Text style={styles.meta}>Facture {invoice.number}</Text>
            <Text style={styles.meta}>{dateLabel}</Text>
            <Text style={styles.meta}>Réf. {invoice.reference}</Text>
          </View>
        </View>
        <Text style={styles.title}>Facture acquittée</Text>
        <View style={styles.box}>
          <Text>Client : {invoice.buyerName}</Text>
          <Text>{invoice.buyerEmail}</Text>
          {invoice.buyerPhone ? <Text>{invoice.buyerPhone}</Text> : null}
          <Text>Règlement : {paymentMethodLabel(invoice.provider)}</Text>
        </View>
        <View>
          <View style={[styles.row, styles.header]} wrap={false}>
            <Text style={styles.cell}>Désignation</Text>
            <Text style={styles.qty}>Qté</Text>
            <Text style={styles.amount}>Montant</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={`${item.title}-${item.quantity}`} style={styles.row} wrap={false}>
              <Text style={styles.cell}>
                {item.title} ({productTypeLabel(item.type)})
              </Text>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Text style={styles.amount}>{formatFcfa(item.unitPrice * item.quantity)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.total}>
          <Text>Total TTC : {formatFcfa(invoice.total)}</Text>
          <Text>Payé — {paymentMethodLabel(invoice.provider)}</Text>
        </View>
        <Text style={styles.footer}>
          {COMPANY_NAME} · {invoice.number} · paiement confirmé · {APP_NAME}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoicePayload) {
  return renderToBuffer(<InvoiceDocument invoice={invoice} />);
}
