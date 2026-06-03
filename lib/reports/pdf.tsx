import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReportData } from './generate';

const styles = StyleSheet.create({
  page:    { padding: 40, fontFamily: 'Helvetica' },
  title:   { fontSize: 22, marginBottom: 20, fontWeight: 'bold' },
  section: { marginBottom: 16 },
  heading: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label:   { fontSize: 11 },
  value:   { fontSize: 11, fontWeight: 'bold' },
});

interface Props {
  orgName:     string;
  periodStart: string;
  periodEnd:   string;
  data:        ReportData;
}

export function MonthlyReportPDF({ orgName, periodStart, periodEnd, data }: Props) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Monthly AI Usage Report</Text>
        <Text style={{ fontSize: 12, marginBottom: 20 }}>
          {orgName} · {periodStart} → {periodEnd}
        </Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Spend</Text>
            <Text style={styles.value}>${data.totalSpend.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Spend by Category</Text>
          {Object.entries(data.byCategory).map(([cat, spend]) => (
            <View key={cat} style={styles.row}>
              <Text style={styles.label}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
              <Text style={styles.value}>${spend.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Tool Breakdown</Text>
          {data.tools.map(t => (
            <View key={t.toolId} style={styles.row}>
              <Text style={styles.label}>{t.toolName} ({t.category})</Text>
              <Text style={styles.value}>
                ${t.spend.toFixed(2)}{t.usagePercent !== null ? ` · ${t.usagePercent}% used` : ''}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
