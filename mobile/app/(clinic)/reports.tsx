import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { auditApi, reportApi } from '@/api/endpoints';
import {
  AccessLogLedger,
  EmptyState,
  Pill,
  ReportSlip,
  ScreenShell,
} from '@/components';
import {
  borders,
  colors,
  errorStates,
  icons,
  loadingStates,
  radii,
  spacing,
  typography,
} from '@/theme';
import type { ReportAccessLogDto, VisitReportDto } from '@/types/api';
import { formatDateTime, reportDtoToSlipData } from '@/utils/formatters';

export default function ClinicReportsScreen() {
  const params = useLocalSearchParams<{ visitId?: string }>();
  const [reports, setReports] = useState<VisitReportDto[]>([]);
  const [selectedReport, setSelectedReport] = useState<VisitReportDto | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<ReportAccessLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlip, setLoadingSlip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openReportWithAudit = useCallback(async (visitId: string) => {
    setLoadingSlip(true);
    try {
      // Triggers server-side append to report_access_logs for this Clinic Admin view
      const full = await reportApi.getReportForVisit(visitId);
      setSelectedReport(full);
      const logs = await auditApi.getLogsForReport(full.id);
      setSelectedLogs(logs);
    } catch {
      // Keep list visible
    } finally {
      setLoadingSlip(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await reportApi.listOwnClinicReports();
      setReports(list);
      const initialVisitId = params.visitId || list[0]?.visitId;
      if (initialVisitId) {
        await openReportWithAudit(initialVisitId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : errorStates.network.body);
    } finally {
      setLoading(false);
    }
  }, [openReportWithAudit, params.visitId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const navItems = [
    { label: 'Visit queue', href: '/(clinic)' },
    { label: 'Verified staff', href: '/(clinic)/staff' },
    { label: 'Reports', href: '/(clinic)/reports', active: true },
    { label: 'Access log', href: '/(clinic)/access-logs' },
    { label: 'Clinic profile', href: '/(clinic)/profile' },
  ];

  return (
    <ScreenShell navItems={navItems} wide>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={typography.kicker}>Clinic Records · Strictly Own Clinic</Text>
          <Text style={typography.displayHero}>Published observation slips</Text>
          <Text style={typography.bodyMuted}>
            Opening any slip logs your view automatically in the report access audit.
          </Text>
        </View>

        {loading ? (
          <EmptyState
            mode="loading"
            title={loadingStates.reportSlip.title}
            body={loadingStates.reportSlip.body}
          />
        ) : error ? (
          <EmptyState
            mode="error"
            title={errorStates.network.title}
            body={error}
            actionLabel={errorStates.network.actionLabel}
            onAction={() => void loadList()}
          />
        ) : reports.length === 0 ? (
          <EmptyState
            mode="empty"
            title="No completed visit slips yet"
            body="Once your verified staff complete a home visit, the printed observation slip will appear here."
          />
        ) : (
          <View style={styles.split}>
            <View style={styles.listCol}>
              <Text style={typography.kicker}>Slips ({reports.length})</Text>
              <View style={styles.ledger}>
                {reports.map((item, idx) => {
                  const active = selectedReport?.id === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => void openReportWithAudit(item.visitId)}
                      style={[
                        styles.reportRow,
                        active && styles.reportRowActive,
                        idx === reports.length - 1 && styles.rowLast,
                      ]}
                    >
                      <FileText
                        size={icons.sm}
                        color={active ? colors.primary : colors.inkSubtle}
                        strokeWidth={icons.strokeWidth}
                      />
                      <View style={styles.reportMeta}>
                        <Text style={typography.bodyMedium}>{item.parentName}</Text>
                        <Text style={[typography.label, styles.muted]}>
                          {item.serviceLabel} · {item.staffName}
                        </Text>
                        <Text style={typography.monoMeta}>
                          {formatDateTime(item.recordedAt)}
                        </Text>
                      </View>
                      {item.recommendation !== 'NONE' ? (
                        <Pill
                          label={
                            item.recommendation === 'DOCTOR_CONSULT'
                              ? 'Consult'
                              : 'Follow-up'
                          }
                          tone={
                            item.recommendation === 'DOCTOR_CONSULT'
                              ? 'alert'
                              : 'accent'
                          }
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.detailCol}>
              {loadingSlip ? (
                <EmptyState
                  mode="loading"
                  title={loadingStates.reportSlip.title}
                  body={loadingStates.reportSlip.body}
                />
              ) : selectedReport ? (
                <View style={styles.slipStack}>
                  <ReportSlip report={reportDtoToSlipData(selectedReport)} />
                  <Text style={typography.kicker}>
                    Access Log for Slip CB-{selectedReport.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <AccessLogLedger logs={selectedLogs} showParentAndClinic={false} />
                </View>
              ) : null}
            </View>
          </View>
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  split: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    alignItems: 'flex-start',
  },
  listCol: {
    flex: 1,
    minWidth: 280,
    gap: spacing.sm,
  },
  detailCol: {
    flex: 1.4,
    minWidth: 320,
  },
  ledger: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
  },
  reportRowActive: {
    backgroundColor: colors.primarySoft,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  reportMeta: {
    flex: 1,
    gap: 2,
  },
  muted: {
    color: colors.inkMuted,
  },
  slipStack: {
    gap: spacing.md,
  },
});
