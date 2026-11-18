import React, { useState } from 'react';
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  FileDown,
  PhoneCall,
  Stethoscope,
} from 'lucide-react-native';
import {
  borders,
  colors,
  errorStates,
  icons,
  radii,
  safetyCopy,
  spacing,
  typography,
} from '@/theme';
import { Button } from './Button';
import { Pill } from './Pill';

export type RecommendationFlag = 'NONE' | 'FOLLOW_UP_VISIT' | 'DOCTOR_CONSULT';

export interface ReportSlipReading {
  label: string;
  value: string;
  unit?: string;
  context?: string;
}

export interface ReportSlipData {
  slipId: string;
  clinicName: string;
  clinicLocality: string;
  parentName: string;
  parentAge: number;
  serviceLabel: string;
  recordedAtLabel: string;
  staffName: string;
  staffDesignation: string;
  readings: ReportSlipReading[];
  notes: string;
  recommendation: RecommendationFlag;
}

export interface ReportSlipProps {
  report: ReportSlipData;
  /** Optional custom handler; defaults to built-in PDF print/export */
  onExportPdf?: (report: ReportSlipData) => Promise<void> | void;
  style?: StyleProp<ViewStyle>;
}

const recommendationCopy: Record<
  RecommendationFlag,
  { label: string; tone: 'primary' | 'accent' | 'alert'; detail: string }
> = {
  NONE: {
    label: 'Routine observation recorded',
    tone: 'primary',
    detail: 'No immediate follow-up or doctor consultation was flagged during this visit.',
  },
  FOLLOW_UP_VISIT: {
    label: 'Follow-up home visit recommended',
    tone: 'accent',
    detail: 'Staff suggested scheduling another home observation check within the coming week.',
  },
  DOCTOR_CONSULT: {
    label: 'Doctor consultation recommended',
    tone: 'alert',
    detail: 'Staff suggested sharing these measurements with a qualified doctor for clinical review.',
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportSlipHtml(report: ReportSlipData): string {
  const rec = recommendationCopy[report.recommendation];
  const readingRows = report.readings
    .map(
      (r) => `
      <tr>
        <td class="label">${escapeHtml(r.label)}${
          r.context ? `<span class="ctx"> · ${escapeHtml(r.context)}</span>` : ''
        }</td>
        <td class="val">${escapeHtml(r.value)}${
          r.unit ? ` <span class="unit">${escapeHtml(r.unit)}</span>` : ''
        }</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>closeBy Observation Slip — ${escapeHtml(report.slipId)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #F6F1E7;
      color: #14231F;
      padding: 28px;
      margin: 0;
    }
    .slip {
      max-width: 680px;
      margin: 0 auto;
      background: #FFFDF8;
      border: 1px solid rgba(20, 35, 31, 0.25);
      border-radius: 14px;
      padding: 28px;
    }
    .kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: rgba(20, 35, 31, 0.55);
      margin-bottom: 6px;
    }
    h1 {
      font-family: Georgia, serif;
      font-size: 24px;
      margin: 0 0 4px 0;
    }
    .meta {
      font-family: "Courier New", monospace;
      font-size: 12px;
      color: rgba(20, 35, 31, 0.7);
    }
    .rule {
      border: 0;
      border-top: 1px solid rgba(20, 35, 31, 0.14);
      margin: 16px 0;
    }
    .badge {
      display: inline-block;
      border: 1px solid rgba(31, 77, 69, 0.35);
      background: rgba(31, 77, 69, 0.08);
      color: #1F4D45;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      padding: 12px 0;
      border-bottom: 1px solid rgba(20, 35, 31, 0.12);
      font-size: 15px;
    }
    td.label {
      color: rgba(20, 35, 31, 0.8);
    }
    .ctx {
      color: rgba(20, 35, 31, 0.55);
      font-size: 13px;
    }
    td.val {
      text-align: right;
      font-family: "Courier New", monospace;
      font-size: 18px;
      font-weight: 600;
    }
    .unit {
      font-size: 13px;
      font-weight: 400;
      color: rgba(20, 35, 31, 0.65);
    }
    .notes {
      font-size: 15px;
      line-height: 1.55;
      margin: 6px 0 0 0;
    }
    .disclaimer {
      font-size: 13px;
      color: rgba(20, 35, 31, 0.65);
      margin-top: 16px;
    }
    .emergency {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      background: rgba(196, 69, 45, 0.09);
      border: 1px solid rgba(196, 69, 45, 0.25);
      color: #C4452D;
      font-size: 13px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="slip">
    <div class="kicker">closeBy · Home Visit Observation Slip</div>
    <h1>${escapeHtml(report.clinicName)}</h1>
    <div class="meta">${escapeHtml(report.clinicLocality)} · Slip ${escapeHtml(report.slipId)} · ${escapeHtml(report.recordedAtLabel)}</div>
    <hr class="rule" />
    <div><strong>${escapeHtml(report.parentName)}</strong> (${report.parentAge} yrs) · ${escapeHtml(report.serviceLabel)}</div>
    <div style="margin-top:6px;font-size:14px;color:rgba(20,35,31,0.75);">
      Recorded by ${escapeHtml(report.staffName)}, ${escapeHtml(report.staffDesignation)}
    </div>
    <div class="badge">${escapeHtml(safetyCopy.verifiedPrefix)} ${escapeHtml(report.clinicName)}</div>
    <hr class="rule" />
    <div class="kicker">Recorded Observations</div>
    <table>${readingRows}</table>
    <div style="margin-top:16px;">
      <div class="kicker">Observation Notes</div>
      <p class="notes">${escapeHtml(report.notes)}</p>
    </div>
    <hr class="rule" />
    <div class="kicker">Next-Step Note</div>
    <p class="notes"><strong>${escapeHtml(rec.label)}:</strong> ${escapeHtml(rec.detail)}</p>
    <p class="disclaimer">${escapeHtml(safetyCopy.observationsDisclaimer)}</p>
    <div class="emergency">${escapeHtml(safetyCopy.emergencyNotice)}</div>
  </div>
</body>
</html>`;
}

export async function exportReportSlipToPdf(report: ReportSlipData): Promise<void> {
  const html = buildReportSlipHtml(report);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `closeBy Visit Slip ${report.slipId}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}

export function ReportSlip({ report, onExportPdf, style }: ReportSlipProps) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const rec = recommendationCopy[report.recommendation];

  const handleExport = async () => {
    setExportError(null);
    setExporting(true);
    try {
      if (onExportPdf) {
        await onExportPdf(report);
      } else {
        await exportReportSlipToPdf(report);
      }
    } catch {
      setExportError(errorStates.pdfExport.body);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.slip, style]}>
      {/* Printed Slip Masthead */}
      <View style={styles.masthead}>
        <View style={styles.mastheadTop}>
          <Text style={typography.kicker}>Home Visit Observation Slip</Text>
          <Text style={typography.monoMeta}>{report.slipId}</Text>
        </View>
        <Text style={[typography.heading, styles.clinicName]}>
          {report.clinicName}
        </Text>
        <Text style={[typography.label, styles.clinicMeta]}>
          {report.clinicLocality} · {report.recordedAtLabel}
        </Text>
      </View>

      <View style={styles.doubleRule} />

      {/* Parent & Service Band */}
      <View style={styles.section}>
        <View style={styles.splitRow}>
          <View style={styles.splitBlock}>
            <Text style={typography.kicker}>Parent</Text>
            <Text style={[typography.subheading, styles.parentName]}>
              {report.parentName}
            </Text>
            <Text style={[typography.label, styles.mutedMeta]}>
              {report.parentAge} years
            </Text>
          </View>
          <View style={[styles.splitBlock, styles.splitRight]}>
            <Text style={typography.kicker}>Service</Text>
            <Text style={typography.bodyMedium}>{report.serviceLabel}</Text>
          </View>
        </View>

        <View style={styles.staffRow}>
          <View style={styles.staffLabelGroup}>
            <Text style={typography.kicker}>Recorded By</Text>
            <Text style={typography.bodyMedium}>
              {report.staffName}
              <Text style={styles.designationInline}>
                {' '}· {report.staffDesignation}
              </Text>
            </Text>
          </View>
          <Pill
            label={`${safetyCopy.verifiedPrefix} ${report.clinicName}`}
            tone="verified"
          />
        </View>
      </View>

      <View style={styles.rule} />

      {/* Ruled Observations Ledger */}
      <View style={styles.section}>
        <Text style={[typography.kicker, styles.sectionKicker]}>
          Measured Observations
        </Text>

        {report.readings.map((reading, idx) => (
          <View
            key={`${reading.label}-${idx}`}
            style={[
              styles.readingRow,
              idx === report.readings.length - 1 && styles.readingRowLast,
            ]}
          >
            <View style={styles.readingLeft}>
              <Text style={typography.bodyMedium}>{reading.label}</Text>
              {reading.context ? (
                <Text style={[typography.label, styles.mutedMeta]}>
                  {reading.context}
                </Text>
              ) : null}
            </View>
            <View style={styles.readingRight}>
              <Text style={typography.monoReading}>{reading.value}</Text>
              {reading.unit ? (
                <Text style={[typography.monoMeta, styles.unitText]}>
                  {reading.unit}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.rule} />

      {/* Staff Observation Notes */}
      <View style={styles.section}>
        <Text style={[typography.kicker, styles.sectionKicker]}>
          Staff Notes
        </Text>
        <Text style={typography.body}>{report.notes}</Text>
      </View>

      <View style={styles.rule} />

      {/* Next-Step Recommendation */}
      <View style={styles.section}>
        <View style={styles.recHeader}>
          <Text style={typography.kicker}>Next-Step Note</Text>
          <Pill label={rec.label} tone={rec.tone} icon={Stethoscope} />
        </View>
        <Text style={[typography.bodyMuted, styles.recDetail]}>
          {rec.detail}
        </Text>
      </View>

      <View style={styles.rule} />

      {/* Clinical Boundary Disclaimer + Emergency Strip + PDF Export */}
      <View style={styles.footer}>
        <Text style={[typography.label, styles.disclaimer]}>
          {safetyCopy.observationsDisclaimer}
        </Text>

        <View style={styles.emergencyStrip}>
          <PhoneCall
            size={icons.sm}
            color={colors.alert}
            strokeWidth={icons.strokeWidth}
          />
          <Text style={[typography.label, styles.emergencyText]}>
            {safetyCopy.emergencyNotice}
          </Text>
        </View>

        {exportError ? (
          <Text style={[typography.label, styles.exportErrorText]}>
            {exportError}
          </Text>
        ) : null}

        <View style={styles.exportRow}>
          <Button
            label={exporting ? 'Preparing PDF slip...' : 'Export slip as PDF'}
            variant="secondary"
            size="sm"
            icon={FileDown}
            loading={exporting}
            onPress={() => void handleExport()}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slip: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  masthead: {
    padding: spacing.lg,
    gap: 4,
  },
  mastheadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clinicName: {
    marginTop: 2,
  },
  clinicMeta: {
    color: colors.inkMuted,
  },
  doubleRule: {
    height: 3,
    borderTopWidth: borders.hairline,
    borderBottomWidth: borders.hairline,
    borderColor: colors.borderStrong,
  },
  rule: {
    height: borders.hairline,
    backgroundColor: colors.border,
  },
  section: {
    padding: spacing.lg,
  },
  sectionKicker: {
    marginBottom: spacing.sm,
  },
  splitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  splitBlock: {
    gap: 2,
  },
  splitRight: {
    alignItems: 'flex-start',
  },
  parentName: {
    marginTop: 2,
  },
  mutedMeta: {
    color: colors.inkMuted,
  },
  staffRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: borders.hairline,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  staffLabelGroup: {
    gap: 2,
  },
  designationInline: {
    color: colors.inkMuted,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  readingRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  readingLeft: {
    flex: 1,
    gap: 2,
  },
  readingRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  unitText: {
    color: colors.inkSubtle,
  },
  recHeader: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  recDetail: {
    marginTop: 2,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  disclaimer: {
    color: colors.inkMuted,
    lineHeight: 20,
  },
  emergencyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.alertSoft,
    borderWidth: borders.hairline,
    borderColor: 'rgba(196, 69, 45, 0.24)',
    borderRadius: radii.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emergencyText: {
    color: colors.alert,
    flex: 1,
  },
  exportErrorText: {
    color: colors.alert,
  },
  exportRow: {
    marginTop: spacing.xxs,
  },
});
