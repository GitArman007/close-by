import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ban, CheckCircle2, MapPin, ShieldAlert, XCircle } from 'lucide-react-native';
import { adminApi } from '@/api/endpoints';
import {
  AdminAnalyticsCharts,
  Button,
  EmptyState,
  Pill,
  ScreenShell,
  Stat,
} from '@/components';
import {
  borders,
  colors,
  emptyStates,
  errorStates,
  icons,
  loadingStates,
  radii,
  spacing,
  typography,
} from '@/theme';
import type { ClinicDto, ClinicStatus, PlatformAnalyticsDto } from '@/types/api';
import { clinicStatusMeta, formatShortDate } from '@/utils/formatters';

const CLINIC_FILTERS: { key: 'ALL' | ClinicStatus; label: string }[] = [
  { key: 'ALL', label: 'All clinics' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function PlatformAdminDashboardScreen() {
  const [analytics, setAnalytics] = useState<PlatformAnalyticsDto | null>(null);
  const [clinics, setClinics] = useState<ClinicDto[]>([]);
  const [filter, setFilter] = useState<'ALL' | ClinicStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyClinicId, setBusyClinicId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [stats, clinicRows] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.listClinics(),
      ]);
      setAnalytics(stats);
      setClinics(clinicRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorStates.network.body);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredClinics = useMemo(() => {
    if (filter === 'ALL') return clinics;
    return clinics.filter((c) => c.status === filter);
  }, [clinics, filter]);

  const handleAction = async (
    clinic: ClinicDto,
    action: 'approve' | 'reject' | 'suspend'
  ) => {
    setBusyClinicId(clinic.id);
    setFeedback(null);
    try {
      if (action === 'approve') {
        await adminApi.approveClinic(clinic.id);
        setFeedback(`${clinic.name} is now Approved and open for Bhopal families.`);
      } else if (action === 'reject') {
        await adminApi.rejectClinic(
          clinic.id,
          'Application did not pass verification checklist.'
        );
        setFeedback(`${clinic.name} marked Rejected.`);
      } else {
        await adminApi.suspendClinic(
          clinic.id,
          'Temporarily suspended pending compliance review.'
        );
        setFeedback(`${clinic.name} suspended from accepting new bookings.`);
      }
      await loadData(true);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Governance update failed.');
    } finally {
      setBusyClinicId(null);
    }
  };

  return (
    <ScreenShell
      wide
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void loadData(true);
      }}
    >
      {loading ? (
        <EmptyState
          mode="loading"
          title={loadingStates.clinicQueue.title}
          body={loadingStates.clinicQueue.body}
        />
      ) : error || !analytics ? (
        <EmptyState
          mode="error"
          title={errorStates.network.title}
          body={error ?? errorStates.network.body}
          actionLabel={errorStates.network.actionLabel}
          onAction={() => void loadData()}
        />
      ) : (
        <View style={styles.content}>
          {/* Editorial Header */}
          <View style={styles.header}>
            <Text style={typography.kicker}>Platform Administration · Bhopal</Text>
            <Text style={typography.displayHero}>
              Clinic governance & operations
            </Text>
            <Text style={typography.bodyMuted}>
              Aggregated Bhopal visit activity and clinic vetting. Individual
              parent observation details remain strictly private to families and
              their chosen clinics.
            </Text>
          </View>

          {/* Top Editorial Metrics */}
          <View style={styles.statGrid}>
            <Stat
              label="Visits (60 days)"
              value={String(analytics.totalVisits)}
              caption="Across approved Bhopal clinics"
              emphasis="primary"
              framed
              style={styles.statBox}
            />
            <Stat
              label="Avg. Time to Assign"
              value={`${analytics.averageMinutesToAssign}`}
              unit="min"
              caption="From request to verified staff"
              mono
              framed
              style={styles.statBox}
            />
            <Stat
              label="Repeat Bookings"
              value={`${analytics.repeatBookingRatePercent}%`}
              caption={`${analytics.repeatBookingParentsCount} parents with 2+ visits`}
              framed
              style={styles.statBox}
            />
            <Stat
              label="Registered Clinics"
              value={String(clinics.length)}
              caption={`${clinics.filter((c) => c.status === 'PENDING').length} awaiting review`}
              framed
              style={styles.statBox}
            />
          </View>

          {/* Direct-Label Palette Charts */}
          <AdminAnalyticsCharts analytics={analytics} />

          {/* Clinic Governance Ledger */}
          <View style={styles.governanceSection}>
            <View style={styles.govHeader}>
              <View>
                <Text style={typography.kicker}>Bhopal Clinic Directory</Text>
                <Text style={typography.heading}>
                  Approve, reject, or suspend clinics
                </Text>
              </View>
            </View>

            {feedback ? (
              <View style={styles.feedbackBar}>
                <Text style={[typography.label, styles.feedbackText]}>
                  {feedback}
                </Text>
              </View>
            ) : null}

            <View style={styles.filterRow}>
              {CLINIC_FILTERS.map((item) => {
                const selected = item.key === filter;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setFilter(item.key)}
                    style={[
                      styles.filterPill,
                      selected && styles.filterPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        typography.label,
                        selected ? styles.filterTextActive : styles.filterText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {filteredClinics.length === 0 ? (
              <EmptyState
                mode="empty"
                title={emptyStates.adminNoPendingClinics.title}
                body={emptyStates.adminNoPendingClinics.body}
              />
            ) : (
              <View style={styles.ledger}>
                {filteredClinics.map((clinic, idx) => {
                  const statusMeta = clinicStatusMeta(clinic.status);
                  const isBusy = busyClinicId === clinic.id;
                  return (
                    <View
                      key={clinic.id}
                      style={[
                        styles.clinicRow,
                        idx === filteredClinics.length - 1 && styles.rowLast,
                      ]}
                    >
                      <View style={styles.clinicInfo}>
                        <View style={styles.clinicTop}>
                          <Text style={typography.subheading}>{clinic.name}</Text>
                          <Pill
                            label={statusMeta.label}
                            tone={statusMeta.tone}
                            showDot
                          />
                        </View>
                        <View style={styles.localityRow}>
                          <MapPin
                            size={14}
                            color={colors.inkSubtle}
                            strokeWidth={icons.strokeWidth}
                          />
                          <Text style={[typography.label, styles.muted]}>
                            {clinic.locality}, {clinic.city} · {clinic.address}
                          </Text>
                        </View>
                        <Text style={typography.monoMeta}>
                          Reg {clinic.registrationNumber} · {clinic.phone} · Registered{' '}
                          {formatShortDate(clinic.createdAt)}
                        </Text>
                        {clinic.statusReason ? (
                          <View style={styles.reasonLine}>
                            <ShieldAlert
                              size={14}
                              color={colors.alert}
                              strokeWidth={icons.strokeWidth}
                            />
                            <Text style={[typography.label, styles.reasonText]}>
                              {clinic.statusReason}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.clinicActions}>
                        {clinic.status === 'PENDING' ||
                        clinic.status === 'SUSPENDED' ||
                        clinic.status === 'REJECTED' ? (
                          <Button
                            label="Approve"
                            variant="primary"
                            size="sm"
                            icon={CheckCircle2}
                            loading={isBusy}
                            onPress={() => void handleAction(clinic, 'approve')}
                          />
                        ) : null}

                        {clinic.status === 'PENDING' ? (
                          <Button
                            label="Reject"
                            variant="secondary"
                            size="sm"
                            icon={XCircle}
                            disabled={isBusy}
                            onPress={() => void handleAction(clinic, 'reject')}
                          />
                        ) : null}

                        {clinic.status === 'APPROVED' ? (
                          <Button
                            label="Suspend"
                            variant="alert"
                            size="sm"
                            icon={Ban}
                            disabled={isBusy}
                            onPress={() => void handleAction(clinic, 'suspend')}
                          />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}
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
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: 195,
  },
  governanceSection: {
    gap: spacing.md,
  },
  govHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  feedbackBar: {
    backgroundColor: colors.primarySoft,
    borderWidth: borders.hairline,
    borderColor: 'rgba(31, 77, 69, 0.25)',
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  feedbackText: {
    color: colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.ink,
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  ledger: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  clinicRow: {
    paddingVertical: spacing.lg,
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  clinicInfo: {
    flex: 1,
    minWidth: 260,
    gap: 5,
  },
  clinicTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  muted: {
    color: colors.inkMuted,
    flex: 1,
  },
  reasonLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  reasonText: {
    color: colors.alert,
  },
  clinicActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
