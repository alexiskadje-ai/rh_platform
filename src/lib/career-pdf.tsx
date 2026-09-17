import "server-only";

import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { BRAND, COMPANY_NAME } from "@/lib/company";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: BRAND.dark,
    lineHeight: 1.45,
  },
  brand: { fontSize: 9, color: BRAND.orange, letterSpacing: 1.2, marginBottom: 4 },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  title: { fontSize: 12, marginBottom: 18, color: "#5c645f" },
  body: { fontSize: 11, whiteSpace: "pre-wrap" },
});

export async function renderCareerDocPdf(input: {
  title: string;
  name: string;
  content: string;
}) {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>{COMPANY_NAME}</Text>
        <Text style={styles.name}>{input.name}</Text>
        <Text style={styles.title}>{input.title}</Text>
        <View>
          {input.content.split("\n").map((line, index) => (
            <Text key={index} style={{ marginBottom: 4 }}>
              {line || " "}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
