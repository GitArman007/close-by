import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  CalendarPlus,
  Clock,
  FileCheck,
  FileText,
  MapPin,
  Play,
  UserPlus,
} from 'lucide-react-native';
import { parentApi, reportApi, visitApi } from '@/api/endpoints';
import { IS_DEMO_MODE } from '@/auth/demoAccounts';
import { runLiveVisitSimulation } from '@/auth/visitSimulator';
import {
  Button,
  EmptyState,
  Pill,
  ScreenShell,
  TimelineStep,
  TrendSparklines,
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
import type { ParentDto, VisitDto, VisitReportDto, VisitStatus } from '@/types/api';
import {
  buildLastVisitHeroSummary,
  formatDayShort,
  formatShortDate,
  formatTimeShort,
  sortVisitsRecentFirst,
  visitStatusMeta,
} from '@/utils/formatters';

export default function FamilyHomeScreen() {
  const router = useRouter();
  const [parents, setParents] = useState<ParentDto[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [visits, setVisits] = useState<VisitDto[]>([]);
  const [parentReports, setParentReports] = useState<VisitReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live visit simulator state
  const [simulating, setSimulating] = useState(false);
  const [simStatusNote, setSimStatusNote] = useState<string | null>(null);
  const [simVisitId, setSimVisitId] = useState<string | null>(null);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const [parentList, visitList] = await Promise.all([
          parentApi.listOwnParents(),
          visitApi.listVisits(),
        ]);
        setParents(parentList);
        setVisits(sortVisitsRecentFirst(visitList));

        const nextParentId =
          selectedParentId && parentList.some((p) => p.id === selectedParentId)
            ? selectedParentId
            : (parentList[0]?.id ?? null);
        setSelectedParentId(nextParentId);

        if (nextParentId) {
          const reports = await reportApi.listParentReports(nextParentId);
          setParentReports(reports);
        } else {
          setParentReports([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : errorStates.network.body);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedParentId]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSelectParent = async (parentId: string) => {
    setSelectedParentId(parentId);
    try {
      const reports = await reportApi.listParentReports(parentId);
      setParentReports(reports);
    } catch {
      setParentReports([]);
    }
  };

  const selectedParent = useMemo(
    () => parents.find((p) => p.id === selectedParentId) ?? parents[0] ?? null,
    [parents, selectedParentId]
  );

  const selectedParentVisits = useMemo(() => {
    if (!selectedParent) return [];
    return visits.filter((v) => v.parentId === selectedParent.id);
  }, [visits, selectedParent]);

  const latestReport =
    parentReports.length > 0 ? parentReports[parentReports.length - 1] : undefined;
  const heroSummary = buildLastVisitHeroSummary(latestReport);

  const featuredVisit = useMemo(() => {
    if (simVisitId) {
      const match = selectedParentVisits.find((v) => v.id === simVisitId);
      if (match) return match;
    }
    return (
      selectedParentVisits.find((v) =>
        ['IN_PROGRESS', 'ASSIGNED', 'REQUESTED'].includes(v.status)
      ) ?? null
    );
  }, [selectedParentVisits, simVisitId]);

  const handleSimulateVisit = async () => {
    if (!selectedParent || simulating) return;
    setSimulating(true);
    setSimStatusNote('Requesting home vitals check at Lakeview Homecare Clinic...');
    try {
      const completed = await runLiveVisitSimulation(selectedParent.id, {
        onStageChange: (_status: VisitStatus, visit: VisitDto, note: string) => {
          setSimVisitId(visit.id);
          setSimStatusNote(note);
        },
        onRefreshNeeded: async () => {
          const [visitList, reports] = await Promise.all([
            visitApi.listVisits(),
            reportApi.listParentReports(selectedParent.id),
          ]);
          setVisits(sortVisitsRecentFirst(visitList));
          setParentReports(reports);
        },
      });
      setSimVisitId(completed.id);
    } catch (err) {
      setSimStatusNote(
        err instanceof Error
          ? err.message
          : 'Simulation could not complete. Ensure demo data is seeded.'
      );
    } finally {
      setSimulating(false);
    }
  };

  const navItems = [
    { label: 'Parent diary', href: '/(family)', active: true },
    { label: 'Request visit', href: '/(family)/request-visit' },
    { label: 'Add parent', href: '/(family)/add-parent' },
    { label: 'Access log', href: '/(family)/access-logs' },
  ];

  return (
    <ScreenShell
      navItems={navItems}
      showEmergencyBanner
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void loadData(true);
      }}
    >
      {loading ? (
        <EmptyState
          mode="loading"
          title={loadingStates.diary.title}
          body={loadingStates.diary.body}
        />
      ) : error ? (
        <EmptyState
          mode="error"
          title={errorStates.network.title}
          body={error}
          actionLabel={errorStates.network.actionLabel}
          onAction={() => void loadData()}
        />
      ) : !selectedParent ? (
        <EmptyState
          mode="empty"
          title={emptyStates.noParents.title}
          body={emptyStates.noParents.body}
          icon={UserPlus}
          actionLabel={emptyStates.noParents.actionLabel}
          onAction={() => router.push('/(family)/add-parent')}
        />
      ) : (
        <View style={styles.content}>
          {/* Parent Selector Strip */}
          {parents.length > 1 ? (
            <View style={styles.parentTabs}>
              {parents.map((p) => {
                const active = p.id === selectedParent.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => void handleSelectParent(p.id)}
                    style={[styles.parentTab, active && styles.parentTabActive]}
                  >
                    <Text
                      style={[
                        typography.label,
                        active ? styles.parentTabTextActive : styles.parentTabText,
                      ]}
                    >
                      {p.fullName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Parent-First Editorial Hero */}
          <View style={styles.heroBlock}>
            <Text style={typography.kicker}>Parent Care Diary · Bhopal</Text>
            <Text style={[typography.displayHero, styles.parentName]}>
              {selectedParent.fullName}
            </Text>

            <View style={styles.parentMetaLine}>
              <View style={styles.localityRow}>
                <MapPin
                  size={15}
                  color={colors.inkSubtle}
                  strokeWidth={icons.strokeWidth}
                />
                <Text style={[typography.label, styles.muted]}>
                  {selectedParent.age} yrs · {selectedParent.locality}, Bhopal
                </Text>
              </View>
              <Pill
                label={`Consent recorded · ${formatShortDate(selectedParent.consentConfirmedAt)}`}
                tone="neutral"
                icon={FileCheck}
              />
            </View>

            {/* Last Visit Summary as the Hero */}
            {heroSummary && latestReport ? (
              <Pressable
                onPress={() =>
                  router.push(`/(family)/report/${latestReport.visitId}` as never)
                }
                style={styles.heroSummarySheet}
              >
                <View style={styles.heroSummaryTop}>
                  <Text style={typography.kicker}>Latest Observation Summary</Text>
                  <View style={styles.openSlipCue}>
                    <FileText
                      size={15}
                      color={colors.primary}
                      strokeWidth={icons.strokeWidth}
                    />
                    <Text style={[typography.label, styles.primaryText]}>
                      Open slip
                    </Text>
                  </View>
                </View>

                <Text style={[typography.heading, styles.heroSummaryText]}>
                  {heroSummary}
                </Text>

                <Text style={[typography.label, styles.muted]}>
                  Recorded by {latestReport.staffName} ·{' '}
                  {latestReport.staffVerifiedBadge}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.heroSummarySheet}>
                <Text style={typography.kicker}>Latest Observation Summary</Text>
                <Text style={typography.bodyMuted}>
                  No completed visit readings yet for {selectedParent.fullName}.
                </Text>
              </View>
            )}

            {/* Primary Actions + Live Visit Simulator */}
            <View style={styles.heroActions}>
              <Button
                label="Request home visit"
                variant="primary"
                icon={CalendarPlus}
                onPress={() =>
                  router.push(
                    `/(family)/request-visit?parentId=${selectedParent.id}` as never
                  )
                }
              />
              {IS_DEMO_MODE ? (
                <Button
                  label={simulating ? 'Simulating live visit...' : 'Simulate visit'}
                  variant="secondary"
                  icon={Play}
                  loading={simulating}
                  onPress={() => void handleSimulateVisit()}
                />
              ) : null}
            </View>

            {simStatusNote ? (
              <View style={styles.simBanner}>
                <Text style={[typography.label, styles.simBannerText]}>
                  Live visit demo: {simStatusNote}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Active / Next Visit Live Vertical Tracker */}
          {featuredVisit ? (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={typography.kicker}>Live Visit Progress</Text>
                  <Text style={typography.heading}>
                    {featuredVisit.serviceLabel}
                  </Text>
                </View>
                <Pill
                  label={visitStatusMeta(featuredVisit.status).label}
                  tone={visitStatusMeta(featuredVisit.status).tone}
                  showDot
                />
              </View>

              <View style={styles.trackerSheet}>
                <View style={styles.trackerMetaRow}>
                  <Clock
                    size={icons.sm}
                    color={colors.primary}
                    strokeWidth={icons.strokeWidth}
                  />
                  <Text style={typography.bodyMedium}>
                    {formatDayShort(featuredVisit.scheduledDate)} ·{' '}
                    {featuredVisit.preferredTime} · {featuredVisit.clinicName}
                  </Text>
                </View>

                <View style={styles.trackerSteps}>
                  <TimelineStep
                    title="Requested"
                    subtitle={`Home visit booked with ${featuredVisit.clinicName}.`}
                    timestamp={formatTimeShort(featuredVisit.createdAt)}
                    state={
                      featuredVisit.status === 'REQUESTED'
                        ? 'current'
                        : 'completed'
                    }
                    accentCurrent={featuredVisit.status === 'REQUESTED'}
                  />
                  <TimelineStep
                    title="Assigned"
                    subtitle={
                      featuredVisit.assignedStaffName
                        ? `${featuredVisit.clinicName} assigned verified staff.`
                        : 'Waiting for clinic to assign verified staff.'
                    }
                    timestamp={formatTimeShort(featuredVisit.assignedAt)}
                    state={
                      featuredVisit.status === 'REQUESTED'
                        ? 'upcoming'
                        : featuredVisit.status === 'ASSIGNED'
                          ? 'current'
                          : 'completed'
                    }
                    accentCurrent={featuredVisit.status === 'ASSIGNED'}
                    staff={
                      featuredVisit.assignedStaffName
                        ? {
                            name: featuredVisit.assignedStaffName,
                            designation:
                              featuredVisit.assignedStaffDesignation ?? undefined,
                            clinicName: featuredVisit.clinicName,
                          }
                        : undefined
                    }
                  />
                  <TimelineStep
                    title="In progress"
                    subtitle="Clinic staff member is at your parent’s home recording observations."
                    timestamp={formatTimeShort(featuredVisit.startedAt)}
                    state={
                      featuredVisit.status === 'REQUESTED' ||
                      featuredVisit.status === 'ASSIGNED'
                        ? 'upcoming'
                        : featuredVisit.status === 'IN_PROGRESS'
                          ? 'current'
                          : 'completed'
                    }
                    accentCurrent={featuredVisit.status === 'IN_PROGRESS'}
                  />
                  <TimelineStep
                    title="Completed"
                    subtitle="Printed observation slip published and ready to read."
                    timestamp={formatTimeShort(featuredVisit.completedAt)}
                    state={
                      featuredVisit.status === 'COMPLETED'
                        ? 'completed'
                        : 'upcoming'
                    }
                    isLast
                  />
                </View>

                <View style={styles.trackerFooter}>
                  <Button
                    label={
                      featuredVisit.status === 'COMPLETED'
                        ? 'Open printed report slip'
                        : 'Open visit details'
                    }
                    variant={
                      featuredVisit.status === 'COMPLETED'
                        ? 'primary'
                        : 'secondary'
                    }
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                    onPress={() =>
                      router.push(
                        (featuredVisit.status === 'COMPLETED'
                          ? `/(family)/report/${featuredVisit.id}`
                          : `/(family)/visit/${featuredVisit.id}`) as never
                      )
                    }
                  />
                </View>
              </View>
            </View>
          ) : null}

          {/* BP & Blood Sugar Trend Sparklines */}
          <View style={styles.section}>
            <Text style={typography.kicker}>Observation History</Text>
            <Text style={[typography.heading, styles.sectionTitle]}>
              BP & blood sugar trends
            </Text>
            <TrendSparklines reports={parentReports} />
          </View>

          {/* Recent Diary Entries (Hairline-ruled editorial list) */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={typography.kicker}>Visit Ledger</Text>
                <Text style={typography.heading}>
                  Diary for {selectedParent.fullName}
                </Text>
              </View>
              <Text style={typography.monoMeta}>
                {selectedParentVisits.length} visits
              </Text>
            </View>

            {selectedParentVisits.length === 0 ? (
              <EmptyState
                mode="empty"
                title={emptyStates.noVisits.title}
                body={emptyStates.noVisits.body}
                actionLabel={emptyStates.noVisits.actionLabel}
                onAction={() =>
                  router.push(
                    `/(family)/request-visit?parentId=${selectedParent.id}` as never
                  )
                }
              />
            ) : (
              <View style={styles.ledger}>
                {selectedParentVisits.map((visit, idx) => {
                  const statusMeta = visitStatusMeta(visit.status);
                  return (
                    <Pressable
                      key={visit.id}
                      onPress={() =>
                        router.push(
                          (visit.status === 'COMPLETED'
                            ? `/(family)/report/${visit.id}`
                            : `/(family)/visit/${visit.id}`) as never
                        )
                      }
                      style={[
                        styles.ledgerRow,
                        idx === selectedParentVisits.length - 1 && styles.rowLast,
                      ]}
                    >
                      <View style={styles.ledgerLeft}>
                        <Text style={typography.bodyMedium}>
                          {visit.serviceLabel}
                        </Text>
                        <Text style={[typography.label, styles.muted]}>
                          {formatDayShort(visit.scheduledDate)} · {visit.clinicName}
                        </Text>
                        {visit.staffVerifiedBadge ? (
                          <Text style={[typography.label, styles.primaryText]}>
                            {visit.assignedStaffName} · {visit.staffVerifiedBadge}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.ledgerRight}>
                        <Pill
                          label={statusMeta.label}
                          tone={statusMeta.tone}
                          showDot
                        />
                        <ArrowRight
                          size={icons.sm}
                          color={colors.inkSubtle}
                          strokeWidth={icons.strokeWidth}
                        />
                      </View>
                    </Pressable>
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
    gap: spacing.xxl,
  },
  parentTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  parentTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  parentTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  parentTabText: {
    color: colors.ink,
  },
  parentTabTextActive: {
    color: colors.onPrimary,
  },
  heroBlock: {
    gap: spacing.sm,
  },
  parentName: {
    marginTop: 2,
  },
  parentMetaLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  muted: {
    color: colors.inkMuted,
  },
  primaryText: {
    color: colors.primary,
  },
  heroSummarySheet: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: 6,
  },
  heroSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  openSlipCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroSummaryText: {
    color: colors.primary,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  simBanner: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.input,
    borderWidth: borders.hairline,
    borderColor: 'rgba(31, 77, 69, 0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  simBannerText: {
    color: colors.primary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.xxs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  trackerSheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  trackerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
  },
  trackerSteps: {
    paddingTop: spacing.xxs,
  },
  trackerFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: borders.hairline,
    borderTopColor: colors.border,
  },
  ledger: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  ledgerLeft: {
    flex: 1,
    gap: 3,
  },
  ledgerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
