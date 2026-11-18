import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { borders, colors, radii, spacing, typography } from '@/theme';
import type { PlatformAnalyticsDto } from '@/types/api';

const CLINIC_STATUS_META: Record<string, { label: string; color: string }> = {
  APPROVED: { label: 'Approved clinics', color: colors.primary },
  PENDING: { label: 'Pending review', color: colors.accent },
  SUSPENDED: { label: 'Suspended', color: colors.alert },
  REJECTED: { label: 'Rejected', color: colors.inkSubtle },
};

/**
 * Editorial charts using strictly closeBy's approved palette with direct value labels
 * printed directly on every bar/row — zero default chart legends.
 */
export function AdminAnalyticsCharts({ analytics }: { analytics: PlatformAnalyticsDto }) {
  const buckets = analytics.visitsPerWeek;
  const maxWeekly = Math.max(1, ...buckets.map((b) => b.visitCount));

  const chartWidth = 520;
  const chartHeight = 190;
  const padTop = 26;
  const padBottom = 34;
  const padX = 16;
  const plotHeight = chartHeight - padTop - padBottom;
  const slotWidth = (chartWidth - padX * 2) / Math.max(1, buckets.length);
  const barWidth = Math.min(34, slotWidth * 0.56);

  const totalClinics = Math.max(
    1,
    analytics.clinicsByStatus.reduce((sum, s) => sum + s.count, 0)
  );

  return (
    <View style={styles.grid}>
      {/* Chart 1: Visits Per Week (Direct labels above each bar) */}
      <View style={styles.chartCard}>
        <Text style={typography.kicker}>Visits per week · Last 8 weeks</Text>
        <Text style={[typography.subheading, styles.chartTitle]}>
          Weekly Bhopal visit volume
        </Text>

        <Svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          <Line
            x1={padX}
            y1={chartHeight - padBottom}
            x2={chartWidth - padX}
            y2={chartHeight - padBottom}
            stroke={colors.borderStrong}
            strokeWidth={1}
          />

          {buckets.map((bucket, idx) => {
            const barH = Math.max(4, (bucket.visitCount / maxWeekly) * plotHeight);
            const x = padX + idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = chartHeight - padBottom - barH;
            const isLatest = idx === buckets.length - 1;

            return (
              <React.Fragment key={bucket.weekStart}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={6}
                  fill={isLatest ? colors.primary : 'rgba(31, 77, 69, 0.55)'}
                />
                {/* Direct count label above each bar */}
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 7}
                  fontSize={12}
                  fontWeight="600"
                  fill={colors.ink}
                  textAnchor="middle"
                >
                  {String(bucket.visitCount)}
                </SvgText>
                {/* Direct week label beneath each bar */}
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - 12}
                  fontSize={11}
                  fill={colors.inkMuted}
                  textAnchor="middle"
                >
                  {bucket.weekLabel}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Chart 2: Clinics by Status (Horizontal proportional bars with direct labels) */}
      <View style={styles.chartCard}>
        <Text style={typography.kicker}>Governance ledger</Text>
        <Text style={[typography.subheading, styles.chartTitle]}>
          Clinics by status
        </Text>

        <View style={styles.statusBars}>
          {analytics.clinicsByStatus.map((item) => {
            const meta = CLINIC_STATUS_META[item.status] ?? {
              label: item.status,
              color: colors.inkMuted,
            };
            const widthPct = Math.max(
              item.count > 0 ? 12 : 3,
              Math.round((item.count / totalClinics) * 100)
            );
            return (
              <View key={item.status} style={styles.statusRow}>
                <View style={styles.statusLabelRow}>
                  <Text style={typography.bodyMedium}>{meta.label}</Text>
                  <Text style={typography.monoReading}>{item.count}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${widthPct}%`,
                        backgroundColor: meta.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chartCard: {
    flex: 1,
    minWidth: 300,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  chartTitle: {
    marginBottom: spacing.xs,
  },
  statusBars: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  statusRow: {
    gap: 6,
  },
  statusLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  barTrack: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSubtle,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
