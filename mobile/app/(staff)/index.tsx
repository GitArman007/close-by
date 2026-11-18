import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Clock, MapPin } from 'lucide-react-native';
import { visitApi } from '@/api/endpoints';
import { useAuth } from '@/auth/AuthContext';
import { EmptyState, Pill, ScreenShell } from '@/components';
import {
  borders,
  colors,
  emptyStates,
  errorStates,
  icons,
  loadingStates,
  radii,
  safetyCopy,
  spacing,
  typography,
} from '@/theme';
import type { VisitDto } from '@/types/api';
import { formatDayShort, visitStatusMeta } from '@/utils/formatters';

export default function StaffHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [visits, setVisits] = useState<VisitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVisits = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const rows = await visitApi.listVisits();
      // Active visits first (IN_PROGRESS, ASSIGNED), then COMPLETED
      const order: Record<string, number> = {
        IN_PROGRESS: 0,
        ASSIGNED: 1,
        COMPLETED: 2,
        CANCELLED: 3,
      };
      setVisits(
        [...rows].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : errorStates.network.body);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadVisits();
  }, [loadVisits]);

  return (
    <ScreenShell
      showEmergencyBanner
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void loadVisits(true);
      }}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={typography.kicker}>Clinic Field Visit Queue</Text>
          <Text style={typography.displayHero}>My assigned visits</Text>
          {user?.clinicName ? (
            <Pill
              label={`${safetyCopy.verifiedPrefix} ${user.clinicName}`}
              tone="verified"
            />
          ) : null}
        </View>

        {loading ? (
          <EmptyState
            mode="loading"
            title={loadingStates.clinicQueue.title}
            body={loadingStates.clinicQueue.body}
          />
        ) : error ? (
          <EmptyState
            mode="error"
            title={errorStates.network.title}
            body={error}
            actionLabel={errorStates.network.actionLabel}
            onAction={() => void loadVisits()}
          />
        ) : visits.length === 0 ? (
          <EmptyState
            mode="empty"
            title={emptyStates.staffNoAssignments.title}
            body={emptyStates.staffNoAssignments.body}
          />
        ) : (
          <View style={styles.ledger}>
            {visits.map((visit, idx) => {
              const statusMeta = visitStatusMeta(visit.status);
              return (
                <Pressable
                  key={visit.id}
                  onPress={() => router.push(`/(staff)/visit/${visit.id}` as never)}
                  style={[
                    styles.visitRow,
                    idx === visits.length - 1 && styles.rowLast,
                  ]}
                >
                  <View style={styles.left}>
                    <View style={styles.topLine}>
                      <Text style={typography.subheading}>
                        {visit.parentName}
                      </Text>
                      <Pill
                        label={statusMeta.label}
                        tone={statusMeta.tone}
                        showDot
                      />
                    </View>
                    <Text style={typography.bodyMedium}>
                      {visit.serviceLabel}
                    </Text>
                    <View style={styles.metaLine}>
                      <Clock
                        size={14}
                        color={colors.inkSubtle}
                        strokeWidth={icons.strokeWidth}
                      />
                      <Text style={[typography.label, styles.muted]}>
                        {formatDayShort(visit.scheduledDate)} · {visit.preferredTime}
                      </Text>
                    </View>
                    <View style={styles.metaLine}>
                      <MapPin
                        size={14}
                        color={colors.inkSubtle}
                        strokeWidth={icons.strokeWidth}
                      />
                      <Text style={[typography.label, styles.muted]}>
                        {visit.visitAddress}
                      </Text>
                    </View>
                  </View>

                  <ArrowRight
                    size={icons.md}
                    color={colors.primary}
                    strokeWidth={icons.strokeWidth}
                  />
                </Pressable>
              );
            })}
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
  ledger: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  left: {
    flex: 1,
    gap: 5,
  },
  topLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muted: {
    color: colors.inkMuted,
    flex: 1,
  },
});
