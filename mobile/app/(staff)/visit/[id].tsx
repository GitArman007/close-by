import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, MapPin, Play } from 'lucide-react-native';
import { reportApi, visitApi } from '@/api/endpoints';
import {
  Button,
  EmptyState,
  InputField,
  Pill,
  ReportSlip,
  ScreenShell,
} from '@/components';
import {
  borders,
  colors,
  errorStates,
  icons,
  loadingStates,
  radii,
  safetyCopy,
  spacing,
  triggerSelectionHaptic,
  typography,
} from '@/theme';
import type {
  BloodSugarContext,
  RecommendationType,
  VisitDto,
  VisitReportDto,
} from '@/types/api';
import {
  formatDayShort,
  reportDtoToSlipData,
  visitStatusMeta,
} from '@/utils/formatters';

const SUGAR_CONTEXTS: { key: BloodSugarContext; label: string }[] = [
  { key: 'FASTING', label: 'Fasting' },
  { key: 'POST_MEAL', label: 'Post-meal' },
  { key: 'RANDOM', label: 'Random' },
];

const RECOMMENDATIONS: { key: RecommendationType; label: string }[] = [
  { key: 'NONE', label: 'No immediate follow-up' },
  { key: 'FOLLOW_UP_VISIT', label: 'Follow-up home visit' },
  { key: 'DOCTOR_CONSULT', label: 'Doctor consultation' },
];

export default function StaffVisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [visit, setVisit] = useState<VisitDto | null>(null);
  const [report, setReport] = useState<VisitReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Observation form fields
  const [bpSystolic, setBpSystolic] = useState('128');
  const [bpDiastolic, setBpDiastolic] = useState('82');
  const [temperatureF, setTemperatureF] = useState('98.4');
  const [bloodSugar, setBloodSugar] = useState('108');
  const [sugarContext, setSugarContext] = useState<BloodSugarContext>('FASTING');
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState<RecommendationType>('NONE');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadVisit = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await visitApi.getVisit(id);
      setVisit(data);
      if (data.status === 'COMPLETED') {
        const rep = await reportApi.getReportForVisit(data.id);
        setReport(rep);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : errorStates.network.body);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadVisit();
  }, [loadVisit]);

  const handleStartVisit = async () => {
    if (!visit) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await visitApi.startVisit(visit.id);
      setVisit(updated);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not start visit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteVisit = async () => {
    if (!visit) return;
    setFormError(null);
    if (!notes.trim()) {
      setFormError('Record factual observation notes before completing the visit.');
      return;
    }

    const sys = bpSystolic.trim() ? parseInt(bpSystolic, 10) : null;
    const dia = bpDiastolic.trim() ? parseInt(bpDiastolic, 10) : null;
    const temp = temperatureF.trim() ? parseFloat(temperatureF) : null;
    const sugar = bloodSugar.trim() ? parseInt(bloodSugar, 10) : null;

    if ((sys !== null) !== (dia !== null)) {
      setFormError('Enter both systolic and diastolic blood pressure readings.');
      return;
    }

    setSubmitting(true);
    try {
      const createdReport = await reportApi.completeVisit(visit.id, {
        bpSystolic: sys,
        bpDiastolic: dia,
        temperatureF: temp,
        bloodSugarMgDl: sugar,
        bloodSugarContext: sugar !== null ? sugarContext : null,
        observationNotes: notes.trim(),
        recommendation,
      });
      setReport(createdReport);
      const updated = await visitApi.getVisit(visit.id);
      setVisit(updated);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit observations.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell showEmergencyBanner>
      <Button
        label="Back to assigned visits"
        variant="ghost"
        size="sm"
        icon={ArrowLeft}
        onPress={() => router.replace('/(staff)')}
        style={styles.backBtn}
      />

      {loading ? (
        <EmptyState
          mode="loading"
          title={loadingStates.clinicQueue.title}
          body={loadingStates.clinicQueue.body}
        />
      ) : error || !visit ? (
        <EmptyState
          mode="error"
          title={errorStates.unauthorized.title}
          body={error ?? errorStates.unauthorized.body}
          actionLabel="Return to queue"
          onAction={() => router.replace('/(staff)')}
        />
      ) : (
        <View style={styles.content}>
          {/* Visit Summary Card */}
          <View style={styles.sheet}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={typography.kicker}>{visit.serviceLabel}</Text>
                <Text style={typography.displayHero}>{visit.parentName}</Text>
                <Text style={typography.bodyMuted}>
                  {visit.parentAge} yrs · {formatDayShort(visit.scheduledDate)} ·{' '}
                  {visit.preferredTime}
                </Text>
              </View>
              <Pill
                label={visitStatusMeta(visit.status).label}
                tone={visitStatusMeta(visit.status).tone}
                showDot
              />
            </View>

            {visit.staffVerifiedBadge ? (
              <Pill label={visit.staffVerifiedBadge} tone="verified" />
            ) : null}

            <View style={styles.addressBox}>
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
              <Text style={typography.bodyMuted}>
                Family instructions: {visit.instructions}
              </Text>
            ) : null}

            {visit.status === 'ASSIGNED' ? (
              <Button
                label={submitting ? 'Starting visit...' : 'Start home visit'}
                variant="primary"
                icon={Play}
                loading={submitting}
                fullWidth
                onPress={() => void handleStartVisit()}
              />
            ) : null}
          </View>

          {/* Observation Entry Form (only when IN_PROGRESS) */}
          {visit.status === 'IN_PROGRESS' ? (
            <View style={styles.sheet}>
              <Text style={typography.kicker}>Record Observations Only</Text>
              <Text style={typography.heading}>Home visit observation slip</Text>
              <Text style={[typography.label, styles.disclaimerBox]}>
                {safetyCopy.observationsDisclaimer}
              </Text>

              {formError ? (
                <View style={styles.errorBox}>
                  <Text style={[typography.label, styles.errorText]}>
                    {formError}
                  </Text>
                </View>
              ) : null}

              <View style={styles.rowTwo}>
                <InputField
                  label="BP Systolic (mmHg)"
                  value={bpSystolic}
                  onChangeText={setBpSystolic}
                  keyboardType="number-pad"
                  placeholder="128"
                  containerStyle={styles.half}
                />
                <InputField
                  label="BP Diastolic (mmHg)"
                  value={bpDiastolic}
                  onChangeText={setBpDiastolic}
                  keyboardType="number-pad"
                  placeholder="82"
                  containerStyle={styles.half}
                />
              </View>

              <View style={styles.rowTwo}>
                <InputField
                  label="Temperature (°F)"
                  value={temperatureF}
                  onChangeText={setTemperatureF}
                  keyboardType="decimal-pad"
                  placeholder="98.4"
                  containerStyle={styles.half}
                />
                <InputField
                  label="Blood Sugar (mg/dL)"
                  value={bloodSugar}
                  onChangeText={setBloodSugar}
                  keyboardType="number-pad"
                  placeholder="108"
                  containerStyle={styles.half}
                />
              </View>

              <View style={styles.group}>
                <Text style={typography.label}>Blood sugar context</Text>
                <View style={styles.chipWrap}>
                  {SUGAR_CONTEXTS.map((ctx) => (
                    <Pressable
                      key={ctx.key}
                      onPress={() => {
                        void triggerSelectionHaptic();
                        setSugarContext(ctx.key);
                      }}
                      style={[
                        styles.chip,
                        sugarContext === ctx.key && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          typography.label,
                          sugarContext === ctx.key
                            ? styles.chipTextActive
                            : styles.chipText,
                        ]}
                      >
                        {ctx.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <InputField
                label="Factual observation notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Parent was comfortable and alert. Seated BP measured after 5 minutes of rest; morning tablets taken on schedule."
              />

              <View style={styles.group}>
                <Text style={typography.label}>Next-step recommendation</Text>
                <View style={styles.chipWrap}>
                  {RECOMMENDATIONS.map((rec) => (
                    <Pressable
                      key={rec.key}
                      onPress={() => {
                        void triggerSelectionHaptic();
                        setRecommendation(rec.key);
                      }}
                      style={[
                        styles.chip,
                        recommendation === rec.key && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          typography.label,
                          recommendation === rec.key
                            ? styles.chipTextActive
                            : styles.chipText,
                        ]}
                      >
                        {rec.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Button
                label={
                  submitting
                    ? 'Publishing observation slip...'
                    : 'Complete visit & publish slip'
                }
                variant="primary"
                icon={CheckCircle2}
                loading={submitting}
                fullWidth
                onPress={() => void handleCompleteVisit()}
              />
            </View>
          ) : null}

          {/* Published Report Slip when COMPLETED */}
          {visit.status === 'COMPLETED' && report ? (
            <ReportSlip report={reportDtoToSlipData(report)} />
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
    gap: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    padding: spacing.xl,
    gap: spacing.md,
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
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: borders.hairline,
    borderTopColor: colors.border,
  },
  flexText: {
    flex: 1,
  },
  disclaimerBox: {
    backgroundColor: colors.background,
    borderRadius: radii.input,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    padding: spacing.sm,
    color: colors.inkMuted,
  },
  rowTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  half: {
    flex: 1,
    minWidth: 160,
  },
  group: {
    gap: spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  errorBox: {
    backgroundColor: colors.alertSoft,
    borderWidth: borders.hairline,
    borderColor: 'rgba(196, 69, 45, 0.28)',
    borderRadius: radii.input,
    padding: spacing.sm,
  },
  errorText: {
    color: colors.alert,
  },
});
