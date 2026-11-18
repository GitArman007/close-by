import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Eye } from 'lucide-react-native';
import { borders, colors, emptyStates, icons, radii, spacing, typography } from '@/theme';
import type { ReportAccessLogDto, UserRole } from '@/types/api';
import { formatDateTime } from '@/utils/formatters';
import { EmptyState } from './EmptyState';
import { Pill } from './Pill';

const ROLE_LABELS: Record<UserRole, string> = {
  FAMILY: 'Family',
  CLINIC_ADMIN: 'Clinic admin',
  CLINIC_STAFF: 'Clinic staff',
  PLATFORM_ADMIN: 'Platform admin',
};

export function AccessLogLedger({
  logs,
  showParentAndClinic = true,
}: {
  logs: ReportAccessLogDto[];
  showParentAndClinic?: boolean;
}) {
  if (logs.length === 0) {
    return (
      <EmptyState
        mode="empty"
        title={emptyStates.accessLogFirstView.title}
        body={emptyStates.accessLogFirstView.body}
        icon={Eye}
      />
    );
  }

  return (
    <View style={styles.ledger}>
      {logs.map((entry, idx) => (
        <View
          key={entry.id}
          style={[styles.row, idx === logs.length - 1 && styles.rowLast]}
        >
          <View style={styles.left}>
            <View style={styles.viewerLine}>
              <Text style={typography.bodyMedium}>{entry.viewerName}</Text>
              <Pill
                label={ROLE_LABELS[entry.viewerRole] ?? entry.viewerRole}
                tone={entry.viewerRole === 'FAMILY' ? 'primary' : 'neutral'}
              />
            </View>
            {showParentAndClinic ? (
              <Text style={[typography.label, styles.contextText]}>
                Slip for {entry.parentName} · {entry.clinicName}
              </Text>
            ) : null}
            <Text style={typography.monoMeta}>
              Report CB-{entry.reportId.slice(0, 8).toUpperCase()}
            </Text>
          </View>

          <View style={styles.right}>
            <Eye
              size={14}
              color={colors.inkSubtle}
              strokeWidth={icons.strokeWidth}
            />
            <Text style={typography.monoMeta}>{formatDateTime(entry.viewedAt)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ledger: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  left: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  viewerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  contextText: {
    color: colors.inkMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
