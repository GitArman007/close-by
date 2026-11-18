import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { auditApi } from '@/api/endpoints';
import { AccessLogLedger, EmptyState, ScreenShell } from '@/components';
import { errorStates, loadingStates, spacing, typography } from '@/theme';
import type { ReportAccessLogDto } from '@/types/api';

export default function ClinicAccessLogScreen() {
  const [logs, setLogs] = useState<ReportAccessLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await auditApi.listScopedLogs();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorStates.network.body);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const navItems = [
    { label: 'Visit queue', href: '/(clinic)' },
    { label: 'Verified staff', href: '/(clinic)/staff' },
    { label: 'Reports', href: '/(clinic)/reports' },
    { label: 'Access log', href: '/(clinic)/access-logs', active: true },
    { label: 'Clinic profile', href: '/(clinic)/profile' },
  ];

  return (
    <ScreenShell
      navItems={navItems}
      wide
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void loadLogs(true);
      }}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={typography.kicker}>Clinic Audit Trail · Own Clinic Only</Text>
          <Text style={typography.displayHero}>Report access log</Text>
          <Text style={typography.bodyMuted}>
            Every family or clinic view of your clinic’s observation slips is
            recorded permanently below.
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
            onAction={() => void loadLogs()}
          />
        ) : (
          <AccessLogLedger logs={logs} />
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
});
