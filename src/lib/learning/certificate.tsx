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

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    color: "#14211c",
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    borderWidth: 3,
    borderColor: "#0f4c45",
    padding: 36,
    width: "100%",
    minHeight: 480,
    alignItems: "center",
  },
  brand: { fontSize: 12, color: "#c9842a", letterSpacing: 2, marginBottom: 16 },
  kicker: { fontSize: 11, color: "#5c645f", marginBottom: 8 },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#0f4c45",
    textAlign: "center",
    marginBottom: 20,
  },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 12, textAlign: "center" },
  body: { fontSize: 12, textAlign: "center", lineHeight: 1.5, marginBottom: 8 },
  course: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "center", marginVertical: 10 },
  meta: { fontSize: 10, color: "#5c645f", marginTop: 24, textAlign: "center" },
});

export async function renderCertificatePdf(input: {
  learnerName: string;
  courseTitle: string;
  score: number;
  dateLabel: string;
}) {
  const doc = (
    <Document title={`Certificat — ${input.courseTitle}`} author={APP_NAME} language="fr">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <Text style={styles.brand}>{APP_NAME.toUpperCase()}</Text>
          <Text style={styles.kicker}>CERTIFICAT DE RÉUSSITE</Text>
          <Text style={styles.title}>Attestation de formation</Text>
          <Text style={styles.body}>Est décerné à</Text>
          <Text style={styles.name}>{input.learnerName}</Text>
          <Text style={styles.body}>pour avoir suivi avec succès la formation</Text>
          <Text style={styles.course}>{input.courseTitle}</Text>
          <Text style={styles.body}>Score obtenu : {input.score} %</Text>
          <Text style={styles.meta}>
            Délivré le {input.dateLabel} · {APP_NAME}
          </Text>
        </View>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
