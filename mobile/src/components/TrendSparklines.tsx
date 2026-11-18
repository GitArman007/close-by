import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { borders, colors, radii, spacing, typography } from '@/theme';
import type { VisitReportDto } from '@/types/api';

interface Point {
  label: string;
  value: number;
}

function buildPolylinePath(points: { x: number; y: number }[]): string {
  return points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

function formatShortMonthDay(iso: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function BpSparklineCard({ reports }: { reports: VisitReportDto[] }) {
  const valid = reports.filter((r) => r.bpSystolic != null && r.bpDiastolic != null);
  if (valid.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={typography.kicker}>Blood Pressure Trend</Text>
        <Text style={[typography.bodyMuted, styles.emptyHint]}>
          Recorded BP readings will trace here after the first completed visit.
        </Text>
      </View>
    );
  }

  const recent = valid.slice(-8);
  const sysValues = recent.map((r) => r.bpSystolic as number);
  const diaValues = recent.map((r) => r.bpDiastolic as number);
  const allVals = [...sysValues, ...diaValues];
  const minVal = Math.min(...allVals) - 8;
  const maxVal = Math.max(...allVals) + 8;
  const span = Math.max(1, maxVal - minVal);

  const width = 280;
  const height = 104;
  const padX = 24;
  const padTop = 22;
  const padBottom = 22;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const toCoords = (vals: number[]) =>
    vals.map((val, idx) => ({
      x: recent.length === 1 ? width / 2 : padX + (idx / (recent.length - 1)) * plotW,
      y: padTop + (1 - (val - minVal) / span) * plotH,
      val,
    }));

  const sysPts = toCoords(sysValues);
  const diaPts = toCoords(diaValues);
  const latest = recent[recent.length - 1];
  const first = recent[0];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={typography.kicker}>Blood Pressure Trend</Text>
          <Text style={[typography.monoReading, styles.latestValue]}>
            {latest.bpSystolic}/{latest.bpDiastolic}{' '}
            <Text style={typography.monoMeta}>mmHg</Text>
          </Text>
        </View>
        <Text style={typography.monoMeta}>{recent.length} readings</Text>
      </View>

      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={padX}
          y1={height - padBottom}
          x2={width - padX}
          y2={height - padBottom}
          stroke={colors.border}
          strokeWidth={1}
        />

        {sysPts.length > 1 && (
          <Path
            d={buildPolylinePath(sysPts)}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
          />
        )}
        {diaPts.length > 1 && (
          <Path
            d={buildPolylinePath(diaPts)}
            fill="none"
            stroke={colors.inkSubtle}
            strokeWidth={1.6}
            strokeDasharray="4 3"
          />
        )}

        {sysPts.map((pt, i) => (
          <Circle
            key={`sys-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={i === sysPts.length - 1 ? 4 : 2.5}
            fill={colors.primary}
          />
        ))}
        {diaPts.map((pt, i) => (
          <Circle
            key={`dia-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={i === diaPts.length - 1 ? 3.5 : 2.2}
            fill={colors.inkMuted}
          />
        ))}

        {/* Direct labels (no default legend) */}
        <SvgText
          x={sysPts[0].x}
          y={Math.max(12, sysPts[0].y - 8)}
          fontSize={10}
          fill={colors.primary}
          textAnchor="start"
        >
          {`Sys ${sysPts[0].val}`}
        </SvgText>
        {sysPts.length > 1 && (
          <SvgText
            x={sysPts[sysPts.length - 1].x}
            y={Math.max(12, sysPts[sysPts.length - 1].y - 8)}
            fontSize={10}
            fontWeight="600"
            fill={colors.primary}
            textAnchor="end"
          >
            {`${sysPts[sysPts.length - 1].val}`}
          </SvgText>
        )}
        <SvgText
          x={diaPts[diaPts.length - 1].x}
          y={Math.min(height - 6, diaPts[diaPts.length - 1].y + 13)}
          fontSize={10}
          fill={colors.inkMuted}
          textAnchor="end"
        >
          {`Dia ${diaPts[diaPts.length - 1].val}`}
        </SvgText>
      </Svg>

      <View style={styles.axisFooter}>
        <Text style={typography.monoMeta}>{formatShortMonthDay(first.recordedAt)}</Text>
        <Text style={typography.monoMeta}>{formatShortMonthDay(latest.recordedAt)}</Text>
      </View>
    </View>
  );
}

function SugarSparklineCard({ reports }: { reports: VisitReportDto[] }) {
  const valid = reports.filter((r) => r.bloodSugarMgDl != null);
  if (valid.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={typography.kicker}>Blood Sugar Trend</Text>
        <Text style={[typography.bodyMuted, styles.emptyHint]}>
          Blood sugar observations will appear here once recorded during a visit.
        </Text>
      </View>
    );
  }

  const recent = valid.slice(-8);
  const points: Point[] = recent.map((r) => ({
    label: formatShortMonthDay(r.recordedAt),
    value: r.bloodSugarMgDl as number,
  }));

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values) - 10;
  const maxVal = Math.max(...values) + 10;
  const span = Math.max(1, maxVal - minVal);

  const width = 280;
  const height = 104;
  const padX = 24;
  const padTop = 22;
  const padBottom = 22;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const coords = points.map((p, idx) => ({
    x: points.length === 1 ? width / 2 : padX + (idx / (points.length - 1)) * plotW,
    y: padTop + (1 - (p.value - minVal) / span) * plotH,
    val: p.value,
  }));

  const latest = recent[recent.length - 1];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={typography.kicker}>Blood Sugar Trend</Text>
          <Text style={[typography.monoReading, styles.latestValue]}>
            {latest.bloodSugarMgDl}{' '}
            <Text style={typography.monoMeta}>mg/dL</Text>
          </Text>
        </View>
        <Text style={typography.monoMeta}>
          {latest.bloodSugarContext ? latest.bloodSugarContext.replace('_', ' ') : `${recent.length} readings`}
        </Text>
      </View>

      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={padX}
          y1={height - padBottom}
          x2={width - padX}
          y2={height - padBottom}
          stroke={colors.border}
          strokeWidth={1}
        />

        {coords.length > 1 && (
          <Path
            d={buildPolylinePath(coords)}
            fill="none"
            stroke={colors.ink}
            strokeWidth={2}
          />
        )}

        {coords.map((pt, i) => (
          <Circle
            key={`sg-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={i === coords.length - 1 ? 4 : 2.5}
            fill={i === coords.length - 1 ? colors.primary : colors.ink}
          />
        ))}

        {/* Direct start and latest value labels */}
        <SvgText
          x={coords[0].x}
          y={Math.max(12, coords[0].y - 8)}
          fontSize={10}
          fill={colors.inkMuted}
          textAnchor="start"
        >
          {`${coords[0].val}`}
        </SvgText>
        {coords.length > 1 && (
          <SvgText
            x={coords[coords.length - 1].x}
            y={Math.max(12, coords[coords.length - 1].y - 8)}
            fontSize={10}
            fontWeight="600"
            fill={colors.primary}
            textAnchor="end"
          >
            {`${coords[coords.length - 1].val} mg/dL`}
          </SvgText>
        )}
      </Svg>

      <View style={styles.axisFooter}>
        <Text style={typography.monoMeta}>{points[0].label}</Text>
        <Text style={typography.monoMeta}>{points[points.length - 1].label}</Text>
      </View>
    </View>
  );
}

export function TrendSparklines({ reports }: { reports: VisitReportDto[] }) {
  return (
    <View style={styles.grid}>
      <BpSparklineCard reports={reports} />
      <SugarSparklineCard reports={reports} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    minWidth: 260,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  latestValue: {
    marginTop: 2,
  },
  emptyHint: {
    marginTop: spacing.xs,
  },
  axisFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
