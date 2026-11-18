import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, MapPin, UserCheck, XCircle } from 'lucide-react-native';
import { clinicApi, staffApi, visitApi } from '@/api/endpoints';
import {
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
import type { ClinicDto, StaffDto, VisitDto, VisitStatus } from '@/types/api';
import {
  clinicStatusMeta,
  formatDayShort,
  sortVisitsRecentFirst,
  visitStatusMeta,
} from '@/utils/formatters';

const STATUS_FILTERS: { key: 'ALL' | VisitStatus; label: string }[] = [
  { key: 'ALL', label: 'All visits' },
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function ClinicDashboardScreen() {
  const router = useRouter();
  const [clinic, setClinic] = useState<ClinicDto | null>(null);
  const [visits, setVisits] = useState<VisitDto[]>([]);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);
  const [filter, setFilter] = useState<'ALL' | VisitStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyVisitId, setBusyVisitId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [profile, visitRows, staffRows] = await Promise.all([
        clinicApi.getOwnProfile(),
        visitApi.listVisits(),
        staffApi.listOwnStaff(),
      ]);
      setClinic(profile);
      setVisits(sortVisitsRecentFirst(visitRows));
      setStaffList(staffRows);
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

  const activeStaff = useMemo(
    () => staffList.filter((s) => s.active),
    [staffList]
  );

  const filteredVisits = useMemo(() => {
    if (filter === 'ALL') return visits;
    return visits.filter((v) => v.status === filter);
  }, [visits, filter]);

  const handleAssign = async (visitId: string, staffUserId: string, staffName: string) => {
    setBusyVisitId(visitId);
    setActionFeedback(null);
    try {
      await visitApi.assignStaff(visitId, staffUserId);
      setActionFeedback(`Assigned ${staffName} (${clinic ? `Verified by ${clinic.name}` : 'Verified staff'}).`);
      await loadData(true);
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Could not assign staff.');
    } finally {
      setBusyVisitId(null);
    }
  };

  const handleCancel = async (visitId: string) => {
    setBusyVisitId(visitId);
    setActionFeedback(null);
    try {
      await visitApi.cancelVisit(visitId, 'Cancelled by clinic desk');
      setActionFeedback('Visit cancelled.');
      await loadData(true);
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Could not cancel visit.');
    } finally {
      setBusyVisitId(null);
    }
  };

  const navItems = [
    { label: 'Visit queue', href: '/(clinic)', active: true },
    { label: 'Verified staff', href: '/(clinic)/staff' },
    { label: 'Reports', href: '/(clinic)/reports' },
    { label: 'Access log', href: '/(clinic)/access-logs' },
    { label: 'Clinic profile', href: '/(clinic)/profile' },
  ];

  const requestedCount = visits.filter((v) => v.status === 'REQUESTED').length;
  const activeCount = visits.filter(
    (v) => v.status === 'ASSIGNED' || v.status === 'IN_PROGRESS'
  ).length;
  const completedCount = visits.filter((v) => v.status === 'COMPLETED').length;

  return (
    <ScreenShell
      navItems={navItems}
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
      ) : error || !clinic ? (
        <EmptyState
          mode="error"
          title={errorStates.network.title}
          body={error ?? errorStates.network.body}
          actionLabel={errorStates.network.actionLabel}
          onAction={() => void loadData()}
        />
      ) : (
        <View style={styles.content}>
          {/* Clinic Masthead */}
          <View style={styles.masthead}>
            <View style={styles.mastheadLeft}>
              <Text style={typography.kicker}>Clinic Operations Desk · Isolated Scope</Text>
              <Text style={typography.displayHero}>{clinic.name}</Text>
              <View style={styles.localityLine}>
                <MapPin
                  size={15}
                  color={colors.inkSubtle}
                  strokeWidth={icons.strokeWidth}
                />
                <Text style={[typography.label, styles.muted]}>
                  {clinic.locality}, Bhopal · Reg {clinic.registrationNumber}
                </Text>
              </View>
            </View>
            <Pill
              label={clinicStatusMeta(clinic.status).label}
              tone={clinicStatusMeta(clinic.status).tone}
              showDot
            />
          </View>

          {clinic.status !== 'APPROVED' ? (
            <View style={styles.noticeBand}>
              <Text style={typography.bodyMedium}>
                Clinic status: {clinic.status}
              </Text>
              <Text style={typography.bodyMuted}>
                {clinic.status === 'PENDING'
                  ? 'Your clinic application is awaiting Platform Admin approval. Once approved, families in Bhopal can book visits and you can add verified staff.'
                  : clinic.statusReason ||
                    'This clinic is currently not accepting new bookings.'}
              </Text>
            </View>
          ) : null}

          {/* Editorial Metrics Row */}
          <View style={styles.statGrid}>
            <Stat
              label="Incoming Requests"
              value={String(requestedCount)}
              caption="Waiting for staff assignment"
              emphasis={requestedCount > 0 ? 'accent' : 'default'}
              framed
              style={styles.statBox}
            />
            <Stat
              label="Active Visits"
              value={String(activeCount)}
              caption="Assigned or in progress"
              emphasis="primary"
              framed
              style={styles.statBox}
            />
            <Stat
              label="Completed Slips"
              value={String(completedCount)}
              caption="Own clinic reports only"
              framed
              style={styles.statBox}
            />
            <Stat
              label="Verified Staff"
              value={String(activeStaff.length)}
              caption={`Verified by ${clinic.name}`}
              framed
              style={styles.statBox}
            />
          </View>

          {actionFeedback ? (
            <View style={styles.feedbackBar}>
              <Text style={[typography.label, styles.feedbackText]}>
                {actionFeedback}
              </Text>
            </View>
          ) : null}

          {/* Status Filter Strip */}
          <View style={styles.filterRow}>
            {STATUS_FILTERS.map((item) => {
              const selected = item.key === filter;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[styles.filterPill, selected && styles.filterPillActive]}
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

          {/* Visit Queue Ledger */}
          {filteredVisits.length === 0 ? (
            <EmptyState
              mode="empty"
              title={emptyStates.clinicQueueEmpty.title}
              body={emptyStates.clinicQueueEmpty.body}
            />
          ) : (
            <View style={styles.ledger}>
              {filteredVisits.map((visit, idx) => {
                const statusMeta = visitStatusMeta(visit.status);
                const isBusy = busyVisitId === visit.id;
                return (
                  <View
                    key={visit.id}
                    style={[
                      styles.visitRow,
                      idx === filteredVisits.length - 1 && styles.rowLast,
                    ]}
                  >
                    <View style={styles.visitTop}>
                      <View style={styles.visitTitleGroup}>
                        <Text style={typography.subheading}>
                          {visit.parentName}{' '}
                          <Text style={[typography.label, styles.muted]}>
                            ({visit.parentAge} yrs · {visit.parentLocality})
                          </Text>
                        </Text>
                        <Text style={typography.bodyMedium}>
                          {visit.serviceLabel} · {formatDayShort(visit.scheduledDate)} ·{' '}
                          {visit.preferredTime}
                        </Text>
                        <Text style={[typography.label, styles.muted]}>
                          Address: {visit.visitAddress}
                        </Text>
                        {visit.instructions ? (
                          <Text style={[typography.label, styles.muted]}>
                            Instructions: {visit.instructions}
                          </Text>
                        ) : null}
                      </View>
                      <Pill
                        label={statusMeta.label}
                        tone={statusMeta.tone}
                        showDot
                      />
                    </View>

                    {visit.assignedStaffName ? (
                      <View style={styles.assignedRow}>
                        <Text style={typography.label}>
                          Assigned: {visit.assignedStaffName}
                        </Text>
                        {visit.staffVerifiedBadge ? (
                          <Pill label={visit.staffVerifiedBadge} tone="verified" />
                        ) : null}
                      </View>
                    ) : null}

                    {/* Inline Actions */}
                    <View style={styles.actionsRow}>
                      {visit.status === 'REQUESTED' ? (
                        activeStaff.length > 0 ? (
                          activeStaff.map((staff) => (
                            <Button
                              key={staff.userId}
                              label={`Assign ${staff.fullName}`}
                              variant="primary"
                              size="sm"
                              icon={UserCheck}
                              loading={isBusy}
                              onPress={() =>
                                void handleAssign(
                                  visit.id,
                                  staff.userId,
                                  staff.fullName
                                )
                              }
                            />
                          ))
                        ) : (
                          <Button
                            label="Add verified staff first"
                            variant="secondary"
                            size="sm"
                            onPress={() => router.push('/(clinic)/staff')}
                          />
                        )
                      ) : null}

                      {visit.status === 'COMPLETED' ? (
                        <Button
                          label="Open observation slip"
                          variant="secondary"
                          size="sm"
                          icon={FileText}
                          onPress={() =>
                            router.push(
                              `/(clinic)/reports?visitId=${visit.id}` as never
                            )
                          }
                        />
                      ) : null}

                      {visit.status === 'REQUESTED' ||
                      visit.status === 'ASSIGNED' ? (
                        <Button
                          label="Cancel"
                          variant="ghost"
                          size="sm"
                          icon={XCircle}
                          disabled={isBusy}
                          onPress={() => void handleCancel(visit.id)}
                        />
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  masthead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mastheadLeft: {
    flex: 1,
    minWidth: 240,
    gap: 4,
  },
  localityLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muted: {
    color: colors.inkMuted,
  },
  noticeBand: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: 'rgba(232, 163, 23, 0.42)',
    padding: spacing.lg,
    gap: 4,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: 190,
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
  visitRow: {
    paddingVertical: spacing.lg,
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  visitTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  visitTitleGroup: {
    flex: 1,
    minWidth: 240,
    gap: 4,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
});
