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
import type { ReportTable } from "@/lib/reports/aggregations";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#14211c",
  },
  brand: { fontSize: 10, color: "#0f4c45", marginBottom: 2 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  meta: { fontSize: 9, color: "#5c645f", marginBottom: 12 },
  summary: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#f6f4ef",
    borderRadius: 4,
  },
  summaryLine: { marginBottom: 2 },
  header: {
    flexDirection: "row",
    backgroundColor: "#0f4c45",
    color: "#f4efe4",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d9d2c4",
  },
  cell: { padding: 5, flexGrow: 1, flexBasis: 0 },
  empty: { marginTop: 16, color: "#5c645f" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 8,
    color: "#5c645f",
  },
});

function ReportDocument({ report }: { report: ReportTable }) {
  return (
    <Document
      title={`${report.title} — ${report.companyName}`}
      author={APP_NAME}
      subject={report.title}
      language="fr"
    >
      <Page size="A4" style={styles.page} orientation="landscape">
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.meta}>
          {report.companyName} · {report.periodLabel}
        </Text>
        {report.summary.length > 0 ? (
          <View style={styles.summary}>
            {report.summary.map((line) => (
              <Text key={line} style={styles.summaryLine}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}
        {report.rows.length === 0 ? (
          <Text style={styles.empty}>{report.emptyMessage}</Text>
        ) : (
          <View>
            <View style={styles.header} wrap={false}>
              {report.columns.map((column) => (
                <Text key={column.key} style={styles.cell}>
                  {column.label}
                </Text>
              ))}
            </View>
            {report.rows.map((row, index) => (
              <View key={`${index}-${row.matricule ?? index}`} style={styles.row}>
                {report.columns.map((column) => (
                  <Text key={column.key} style={styles.cell}>
                    {row[column.key] ?? "—"}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) =>
          `${APP_NAME} · ${report.title} · page ${pageNumber}/${totalPages}`
        } fixed />
      </Page>
    </Document>
  );
}

export async function renderReportPdf(report: ReportTable) {
  return renderToBuffer(<ReportDocument report={report} />);
}
