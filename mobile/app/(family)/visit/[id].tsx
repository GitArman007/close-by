import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FileText, MapPin, XCircle } from 'lucide-react-native';
import { visitApi } from '@/api/endpoints';
import {
  Button,
  EmptyState,
  InputField,
  Pill,
  ScreenShell,
  TimelineStep,
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
import type { VisitDto } from '@/types/api';
import {
  formatDayShort,
  formatTimeShort,
  visitStatusMeta,
} from '@/utils/formatters';

export default function FamilyVisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [visit, setVisit] = useState<VisitDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadVisit = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await visitApi.getVisit(id);
      setVisit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorStates.network.body);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadVisit();
  }, [loadVisit]);

  const handleCancel = async () => {
    if (!visit) return;
    setCancelling(true);
    try {
      const updated = await visitApi.cancelVisit(
        visit.id,
        cancelReason.trim() || 'Cancelled by family'
      );
      setVisit(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel visit.');
    } finally {
      setCancelling(false);
    }
  };

  const navItems = [
    { label: 'Parent diary', href: '/(family)', active: true },
    { label: 'Request visit', href: '/(family)/request-visit' },
    { label: 'Access log', href: '/(family)/access-logs' },
  ];

  return (
    <ScreenShell navItems={navItems} showEmergencyBanner>
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
          title={loadingStates.diary.title}
          body={loadingStates.diary.body}
        />
      ) : error || !visit ? (
        <EmptyState
          mode="error"
          title={errorStates.unauthorized.title}
          body={error ?? errorStates.unauthorized.body}
          actionLabel="Return to diary"
          onAction={() => router.replace('/(family)')}
        />
      ) : (
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={typography.kicker}>{visit.clinicName}</Text>
              <Text style={typography.displayHero}>{visit.serviceLabel}</Text>
              <Text style={typography.bodyMuted}>
                For {visit.parentName} ({visit.parentAge} yrs) ·{' '}
                {formatDayShort(visit.scheduledDate)} · {visit.preferredTime}
              </Text>
            </View>
            <Pill
              label={visitStatusMeta(visit.status).label}
              tone={visitStatusMeta(visit.status).tone}
              showDot
            />
          </View>

          {/* 4-Stage Vertical Visit Tracker */}
          <View style={styles.sheet}>
            <Text style={[typography.kicker, styles.kickerGap]}>
              Visit Lifecycle
            </Text>

            <TimelineStep
              title="Requested"
              subtitle={`Request received by ${visit.clinicName}.`}
              timestamp={formatTimeShort(visit.createdAt)}
              state={visit.status === 'REQUESTED' ? 'current' : 'completed'}
              accentCurrent={visit.status === 'REQUESTED'}
            />

            {visit.status === 'CANCELLED' ? (
              <TimelineStep
                title="Cancelled"
                subtitle={
                  visit.cancellationReason ||
                  'This home visit was cancelled before staff arrived.'
                }
                state="cancelled"
                isLast
              />
            ) : (
              <>
                <TimelineStep
                  title="Assigned"
                  subtitle={
                    visit.assignedStaffName
                      ? 'Verified staff assigned for your preferred window.'
                      : 'Clinic will assign a verified staff member shortly.'
                  }
                  timestamp={formatTimeShort(visit.assignedAt)}
                  state={
                    visit.status === 'REQUESTED'
                      ? 'upcoming'
                      : visit.status === 'ASSIGNED'
                        ? 'current'
                        : 'completed'
                  }
                  accentCurrent={visit.status === 'ASSIGNED'}
                  staff={
                    visit.assignedStaffName
                      ? {
                          name: visit.assignedStaffName,
                          designation: visit.assignedStaffDesignation ?? undefined,
                          clinicName: visit.clinicName,
                        }
                      : undefined
                  }
                />
                <TimelineStep
                  title="In progress"
                  subtitle="Staff member is at your parent’s home recording observations."
                  timestamp={formatTimeShort(visit.startedAt)}
                  state={
                    visit.status === 'REQUESTED' || visit.status === 'ASSIGNED'
                      ? 'upcoming'
                      : visit.status === 'IN_PROGRESS'
                        ? 'current'
                        : 'completed'
                  }
                  accentCurrent={visit.status === 'IN_PROGRESS'}
                />
                <TimelineStep
                  title="Completed"
                  subtitle="Printed observation slip published and logged."
                  timestamp={formatTimeShort(visit.completedAt)}
                  state={visit.status === 'COMPLETED' ? 'completed' : 'upcoming'}
                  isLast
                />
              </>
            )}
          </View>

          {/* Address & Instructions */}
          <View style={styles.sheet}>
            <Text style={typography.kicker}>Visit Address & Notes</Text>
            <View style={styles.addressLine}>
              <MapPin
                size={icons.sm}
                color={colors.primary}
                strokeWidth={icons.strokeWidth}
              />
              <Text style={[typography.body, styles.flexText]}>
                {visit.visitAddress}
              </Text>
            </View>
            {visit.instructions ? (
              <Text style={typography.bodyMuted}>{visit.instructions}</Text>
            ) : null}
          </View>

          {visit.status === 'COMPLETED' ? (
            <Button
              label="Read printed observation slip"
              variant="primary"
              icon={FileText}
              fullWidth
              onPress={() =>
                router.push(`/(family)/report/${visit.id}` as never)
              }
            />
          ) : null}

          {visit.status === 'REQUESTED' || visit.status === 'ASSIGNED' ? (
            <View style={styles.sheet}>
              <Text style={typography.kicker}>Need to reschedule?</Text>
              <InputField
                label="Cancellation reason (optional)"
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Parent is visiting relatives this afternoon"
              />
              <Button
                label={cancelling ? 'Cancelling visit...' : 'Cancel this visit'}
                variant="alert"
                icon={XCircle}
                loading={cancelling}
                onPress={() => void handleCancel()}
              />
            </View>
          ) : null}
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
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  kickerGap: {
    marginBottom: spacing.xs,
  },
  addressLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  flexText: {
    flex: 1,
  },
});
