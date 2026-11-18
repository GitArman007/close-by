import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { auditApi, reportApi } from '@/api/endpoints';
import {
  AccessLogLedger,
  Button,
  EmptyState,
  ReportSlip,
  ScreenShell,
} from '@/components';
import { errorStates, loadingStates, spacing, typography } from '@/theme';
import type { ReportAccessLogDto, VisitReportDto } from '@/types/api';
import { reportDtoToSlipData } from '@/utils/formatters';

export default function FamilyReportScreen() {
  const router = useRouter();
  const { visitId } = useLocalSearchParams<{ visitId: string }>();

  const [report, setReport] = useState<VisitReportDto | null>(null);
  const [logs, setLogs] = useState<ReportAccessLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!visitId) return;
    setLoading(true);
    setError(null);
    try {
      // Reading the report automatically writes a new entry to report_access_logs server-side
      const data = await reportApi.getReportForVisit(visitId);
      setReport(data);
      const accessLogs = await auditApi.getLogsForReport(data.id);
      setLogs(accessLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorStates.network.body);
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const navItems = [
    { label: 'Parent diary', href: '/(family)', active: true },
    { label: 'Request visit', href: '/(family)/request-visit' },
    { label: 'Access log', href: '/(family)/access-logs' },
  ];

  return (
    <ScreenShell navItems={navItems}>
      <Button
        label="Back to parent diary"
        variant="ghost"
        size="sm"
        icon={ArrowLeft}
        onPress={() => router.replace('/(family)')}
        style={styles.backBtn}
      />

      {loading ? (
        <EmptyState
          mode="loading"
          title={loadingStates.reportSlip.title}
          body={loadingStates.reportSlip.body}
        />
      ) : error || !report ? (
        <EmptyState
          mode="error"
          title={errorStates.unauthorized.title}
          body={error ?? errorStates.unauthorized.body}
          actionLabel="Try again"
          onAction={() => void loadReport()}
        />
      ) : (
        <View style={styles.content}>
          <ReportSlip report={reportDtoToSlipData(report)} />

          <View style={styles.auditSection}>
            <Text style={typography.kicker}>Transparency & Privacy Audit</Text>
            <Text style={typography.heading}>Report access log</Text>
            <Text style={typography.bodyMuted}>
              Every view of this slip is recorded automatically. Your current
              view has just been appended below.
            </Text>
            <AccessLogLedger logs={logs} showParentAndClinic={false} />
          </View>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    marginBottom: spacing.md,
  },
  content: {
    gap: spacing.xxl,
  },
  auditSection: {
    gap: spacing.xs,
  },
});
