import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarPlus,
  Clock,
  FileCheck,
  FileText,
  MapPin,
  PhoneCall,
  RefreshCw,
  Stethoscope,
  XCircle,
} from 'lucide-react-native';
import {
  Button,
  EmptyState,
  Pill,
  ReportSlip,
  Stat,
  TimelineStep,
  type EmptyStateMode,
  type RecommendationFlag,
  type ReportSlipData,
} from '@/components';
import {
  borders,
  colors,
  emptyStates,
  errorStates,
  icons,
  layout,
  loadingStates,
  radii,
  safetyCopy,
  spacing,
  typography,
} from '@/theme';

type DemoStage = 'assigned' | 'in_progress' | 'completed' | 'cancelled';

const SWATCHES = [
  { name: 'Warm Paper', role: 'Background', hex: colors.background },
  { name: 'Ivory Sheet', role: 'Surface', hex: colors.surface },
  { name: 'Forest Ink', role: 'Typography', hex: colors.ink },
  { name: 'Deep Forest Teal', role: 'Primary', hex: colors.primary },
  { name: 'Marigold', role: 'Accent (max 1/screen)', hex: colors.accent },
  { name: 'Terracotta', role: 'Alert / 108·112', hex: colors.alert },
] as const;

const SAMPLE_REPORT: ReportSlipData = {
  slipId: 'CB-BPL-2026-0418',
  clinicName: 'Narmada Care Clinic',
  clinicLocality: 'E-4/45 Arera Colony, Bhopal',
  parentName: 'Smt. Meera Sharma',
  parentAge: 68,
  serviceLabel: 'Home vitals check',
  recordedAtLabel: 'Tue, 18 Nov 2026 · 10:28 AM',
  staffName: 'Nurse Sunita Verma',
  staffDesignation: 'Registered Nurse',
  readings: [
    {
      label: 'Blood Pressure',
      value: '128/82',
      unit: 'mmHg',
      context: 'Seated, left arm after 5 min rest',
    },
    {
      label: 'Temperature',
      value: '98.4',
      unit: '°F',
      context: 'Oral digital reading',
    },
    {
      label: 'Blood Sugar',
      value: '104',
      unit: 'mg/dL',
      context: 'Fasting (before morning tea)',
    },
  ],
  notes:
    'Smt. Meera Sharma was comfortable and alert during the morning check. Morning blood pressure tablet was taken on time at 8:00 AM. Pill organizer for the next three days was verified intact.',
  recommendation: 'NONE',
};

function SectionHeader({
  index,
  title,
  note,
}: {
  index: string;
  title: string;
  note?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={typography.kicker}>{index}</Text>
      <Text style={[typography.heading, styles.sectionTitle]}>{title}</Text>
      {note ? <Text style={typography.bodyMuted}>{note}</Text> : null}
    </View>
  );
}

export default function DesignPreviewScreen() {
  const [buttonFeedback, setButtonFeedback] = useState<string>(
    'Tap any button to test 200ms press response and light haptics.'
  );
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [demoStage, setDemoStage] = useState<DemoStage>('in_progress');
  const [recommendation, setRecommendation] =
    useState<RecommendationFlag>('NONE');
  const [emptyMode, setEmptyMode] = useState<EmptyStateMode>('empty');

  const handleSimulatedLoading = () => {
    setConfirmLoading(true);
    setButtonFeedback('Assigning Nurse Sunita Verma to this home visit...');
    setTimeout(() => {
      setConfirmLoading(false);
      setButtonFeedback('Assignment confirmed with light haptic feedback.');
    }, 1100);
  };

  const reportForPreview: ReportSlipData = {
    ...SAMPLE_REPORT,
    recommendation,
  };

  const staffMember = {
    name: 'Nurse Sunita Verma',
    designation: 'Registered Nurse',
    clinicName: 'Narmada Care Clinic',
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageContainer}>
          {/* Mandatory Emergency Strip */}
          <View style={styles.emergencyBanner}>
            <PhoneCall
              size={icons.sm}
              color={colors.alert}
              strokeWidth={icons.strokeWidth}
            />
            <Text style={[typography.label, styles.emergencyText]}>
              {safetyCopy.emergencyNotice}
            </Text>
          </View>

          {/* Editorial Masthead */}
          <View style={styles.masthead}>
            <Text style={typography.kicker}>
              closeBy · Design Preview Specimen
            </Text>
            <Text style={[typography.displayHero, styles.mastheadTitle]}>
              A calm printed health diary
            </Text>
            <Text style={typography.bodyMuted}>
              Warm paper surfaces, 1px hairline rules, Fraunces headings, DM
              Sans body copy (16px minimum), IBM Plex Mono readings, and
              lucide-react-native icons at 1.75 stroke.
            </Text>
          </View>

          <View style={styles.sectionRule} />

          {/* 01 · Color Tokens */}
          <SectionHeader
            index="01 · Tokens"
            title="Palette & Hairline Borders"
            note="Paper tones replace heavy shadows. Marigold is restricted to at most one focal accent per screen."
          />

          <View style={styles.swatchList}>
            {SWATCHES.map((swatch, idx) => (
              <View
                key={swatch.name}
                style={[
                  styles.swatchRow,
                  idx === SWATCHES.length - 1 && styles.rowLast,
                ]}
              >
                <View style={styles.swatchLeft}>
                  <View
                    style={[
                      styles.swatchChip,
                      { backgroundColor: swatch.hex },
                    ]}
                  />
                  <View>
                    <Text style={typography.bodyMedium}>{swatch.name}</Text>
                    <Text style={[typography.label, styles.mutedText]}>
                      {swatch.role}
                    </Text>
                  </View>
                </View>
                <Text style={typography.monoMeta}>{swatch.hex}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionRule} />

          {/* 02 · Typography & Parent-First Editorial Composition */}
          <SectionHeader
            index="02 · Typography & Parent-First Rhythm"
            title="Fraunces, DM Sans & Mono Numerals"
            note="Family Home opens directly on the parent’s name and last visit readings — never a generic greeting."
          />

          <View style={styles.parentHeroSpecimen}>
            <Text style={typography.kicker}>Parent Diary · Bhopal</Text>
            <Text style={[typography.displayHero, styles.parentHeroName]}>
              Smt. Meera Sharma
            </Text>
            <View style={styles.parentMetaRow}>
              <MapPin
                size={15}
                color={colors.inkSubtle}
                strokeWidth={icons.strokeWidth}
              />
              <Text style={[typography.label, styles.mutedText]}>
                Arera Colony, Bhopal · Consent confirmed 12 Oct 2026
              </Text>
            </View>

            <View style={styles.heroReadingBand}>
              <Text style={typography.kicker}>Last Recorded Visit</Text>
              <Text style={[typography.bodyLarge, styles.heroSummaryLine]}>
                Last visit Tue: BP 128/82, sugar 104
              </Text>
              <Text style={[typography.label, styles.mutedText]}>
                Recorded by Nurse Sunita Verma · Narmada Care Clinic
              </Text>
            </View>

            <View style={styles.nextVisitRow}>
              <Clock
                size={icons.sm}
                color={colors.primary}
                strokeWidth={icons.strokeWidth}
              />
              <Text style={[typography.body, styles.nextVisitText]}>
                Next visit Thu, 10:00 AM · Medicine adherence check
              </Text>
            </View>
          </View>

          <View style={styles.sectionRule} />

          {/* 03 · Component 1: Button */}
          <SectionHeader
            index="03 · Component 1 / 6"
            title="Button"
            note={buttonFeedback}
          />

          <View style={styles.buttonGroup}>
            <Button
              label="Request home visit"
              variant="primary"
              icon={CalendarPlus}
              onPress={() =>
                setButtonFeedback('Primary action pressed (deep forest teal).')
              }
            />
            <Button
              label="Open observation slip"
              variant="secondary"
              icon={FileText}
              onPress={() =>
                setButtonFeedback('Secondary hairline button pressed.')
              }
            />
            <Button
              label={confirmLoading ? 'Assigning staff...' : 'Confirm assignment'}
              variant="primary"
              loading={confirmLoading}
              onPress={handleSimulatedLoading}
            />
            <Button
              label="Cancel request"
              variant="alert"
              icon={XCircle}
              onPress={() =>
                setButtonFeedback('Terracotta alert action pressed.')
              }
            />
            <Button
              label="View clinic profile"
              variant="ghost"
              onPress={() => setButtonFeedback('Quiet ghost action pressed.')}
            />
            <Button
              label="Unavailable while suspended"
              variant="secondary"
              disabled
            />
          </View>

          <View style={styles.sectionRule} />

          {/* 04 · Component 2: Pill */}
          <SectionHeader
            index="04 · Component 2 / 6"
            title="Pill"
            note="999px radius with 1px hairline borders for visit lifecycle statuses, verified clinic stamps, and consent records."
          />

          <View style={styles.pillWrap}>
            <Pill label="Requested" tone="requested" showDot />
            <Pill label="Assigned" tone="assigned" showDot />
            <Pill label="In progress" tone="in_progress" showDot />
            <Pill label="Completed" tone="completed" showDot />
            <Pill label="Cancelled" tone="cancelled" showDot />
          </View>

          <View style={[styles.pillWrap, styles.pillWrapSecond]}>
            <Pill label="Verified by Narmada Care Clinic" tone="verified" />
            <Pill
              label="Consent confirmed · 12 Oct 2026"
              tone="neutral"
              icon={FileCheck}
            />
          </View>

          <View style={styles.sectionRule} />

          {/* 05 · Component 3: Stat */}
          <SectionHeader
            index="05 · Component 3 / 6"
            title="Stat"
            note="Editorial figures using Fraunces for diary counts and IBM Plex Mono for clinical readings."
          />

          <View style={styles.statGrid}>
            <Stat
              label="Blood Pressure"
              value="128/82"
              unit="mmHg"
              caption="Seated reading · Tue morning"
              mono
              framed
              style={styles.statItem}
            />
            <Stat
              label="Blood Sugar"
              value="104"
              unit="mg/dL"
              caption="Fasting before breakfast"
              mono
              framed
              style={styles.statItem}
            />
            <Stat
              label="Completed Visits"
              value="06"
              caption="All logged with verified Bhopal staff"
              emphasis="primary"
              style={styles.statItemOpen}
            />
          </View>

          <View style={styles.sectionRule} />

          {/* 06 · Component 4: TimelineStep */}
          <SectionHeader
            index="06 · Component 4 / 6"
            title="TimelineStep"
            note="Vertical 4-stage visit tracker. The current stage holds this screen’s single marigold pulse and shows the verified staff stamp."
          />

          <View style={styles.inlineControls}>
            {(
              [
                ['assigned', 'Assigned'],
                ['in_progress', 'In progress'],
                ['completed', 'Completed'],
                ['cancelled', 'Cancelled'],
              ] as const
            ).map(([stageKey, stageLabel]) => (
              <Button
                key={stageKey}
                label={stageLabel}
                size="sm"
                variant={demoStage === stageKey ? 'primary' : 'secondary'}
                onPress={() => setDemoStage(stageKey)}
              />
            ))}
          </View>

          <View style={styles.timelineSheet}>
            <TimelineStep
              title="Requested"
              subtitle="Home vitals check booked for Smt. Meera Sharma at Arera Colony."
              timestamp="Tue · 08:15 AM"
              state="completed"
            />
            <TimelineStep
              title="Assigned"
              subtitle="Narmada Care Clinic assigned a verified nurse for the 10:00 AM window."
              timestamp="Tue · 08:40 AM"
              state={demoStage === 'assigned' ? 'current' : 'completed'}
              accentCurrent={demoStage === 'assigned'}
              staff={staffMember}
            />
            {demoStage === 'cancelled' ? (
              <TimelineStep
                title="Cancelled"
                subtitle="Family rescheduled because Smt. Meera Sharma is visiting relatives in Shahpura."
                timestamp="Tue · 09:10 AM"
                state="cancelled"
                isLast
              />
            ) : (
              <>
                <TimelineStep
                  title="In progress"
                  subtitle="Nurse Sunita Verma has arrived and is recording blood pressure, temperature, and blood sugar."
                  timestamp={
                    demoStage === 'in_progress' || demoStage === 'completed'
                      ? 'Tue · 10:05 AM'
                      : undefined
                  }
                  state={
                    demoStage === 'assigned'
                      ? 'upcoming'
                      : demoStage === 'in_progress'
                        ? 'current'
                        : 'completed'
                  }
                  accentCurrent={demoStage === 'in_progress'}
                />
                <TimelineStep
                  title="Completed"
                  subtitle="Printed observation slip published and logged for family review."
                  timestamp={
                    demoStage === 'completed' ? 'Tue · 10:28 AM' : undefined
                  }
                  state={demoStage === 'completed' ? 'completed' : 'upcoming'}
                  isLast
                />
              </>
            )}
          </View>

          <View style={styles.sectionRule} />

          {/* 07 · Component 5: ReportSlip */}
          <SectionHeader
            index="07 · Component 5 / 6"
            title="ReportSlip"
            note="Laid out like a printed clinical slip with ruled lines, mono numerals, observations-only boundary, and PDF export."
          />

          <View style={styles.inlineControls}>
            {(
              [
                ['NONE', 'Routine'],
                ['FOLLOW_UP_VISIT', 'Follow-up'],
                ['DOCTOR_CONSULT', 'Doctor consult'],
              ] as const
            ).map(([flag, label]) => (
              <Button
                key={flag}
                label={label}
                size="sm"
                variant={recommendation === flag ? 'primary' : 'secondary'}
                icon={flag === 'DOCTOR_CONSULT' ? Stethoscope : undefined}
                onPress={() => setRecommendation(flag)}
              />
            ))}
          </View>

          <ReportSlip report={reportForPreview} />

          <View style={styles.sectionRule} />

          {/* 08 · Component 6: EmptyState */}
          <SectionHeader
            index="08 · Component 6 / 6"
            title="EmptyState"
            note="Real, reassuring microcopy for empty, Reanimated skeleton loading, and error states — zero generic placeholders."
          />

          <View style={styles.inlineControls}>
            {(
              [
                ['empty', 'Empty'],
                ['loading', 'Loading skeleton'],
                ['error', 'Error'],
              ] as const
            ).map(([modeKey, modeLabel]) => (
              <Button
                key={modeKey}
                label={modeLabel}
                size="sm"
                variant={emptyMode === modeKey ? 'primary' : 'secondary'}
                onPress={() => setEmptyMode(modeKey)}
              />
            ))}
          </View>

          {emptyMode === 'empty' && (
            <EmptyState
              mode="empty"
              title={emptyStates.noVisits.title}
              body={emptyStates.noVisits.body}
              actionLabel={emptyStates.noVisits.actionLabel}
              onAction={() =>
                setButtonFeedback(
                  'Empty state primary CTA tapped (ready to wire in Phase 2).'
                )
              }
            />
          )}

          {emptyMode === 'loading' && (
            <EmptyState
              mode="loading"
              title={loadingStates.diary.title}
              body={loadingStates.diary.body}
            />
          )}

          {emptyMode === 'error' && (
            <EmptyState
              mode="error"
              title={errorStates.network.title}
              body={errorStates.network.body}
              icon={RefreshCw}
              actionLabel={errorStates.network.actionLabel}
              onAction={() => setEmptyMode('loading')}
            />
          )}

          {/* Editorial Footer Note */}
          <View style={styles.specimenFooter}>
            <Text style={typography.monoMeta}>
              closeBy · LNCTS Bhopal · Theme & Primitives Review
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.section,
    alignItems: 'center',
  },
  pageContainer: {
    width: '100%',
    maxWidth: 760,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.alertSoft,
    borderWidth: borders.hairline,
    borderColor: 'rgba(196, 69, 45, 0.24)',
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  emergencyText: {
    color: colors.alert,
  },
  masthead: {
    gap: spacing.xs,
  },
  mastheadTitle: {
    marginTop: 2,
  },
  sectionRule: {
    height: borders.hairline,
    backgroundColor: colors.border,
    marginVertical: spacing.xxl,
  },
  sectionHeader: {
    gap: 4,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginTop: 2,
  },
  mutedText: {
    color: colors.inkMuted,
  },
  swatchList: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  swatchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatchChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
  },
  parentHeroSpecimen: {
    gap: spacing.xs,
  },
  parentHeroName: {
    marginTop: 2,
  },
  parentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroReadingBand: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: 4,
  },
  heroSummaryLine: {
    marginTop: 2,
    color: colors.primary,
  },
  nextVisitRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: borders.hairline,
    borderBottomWidth: borders.hairline,
    borderColor: colors.border,
  },
  nextVisitText: {
    flex: 1,
    color: colors.ink,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pillWrapSecond: {
    marginTop: spacing.sm,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    flexGrow: 1,
    minWidth: Platform.OS === 'web' ? 220 : 155,
  },
  statItemOpen: {
    flexBasis: '100%',
    paddingTop: spacing.sm,
    borderTopWidth: borders.hairline,
    borderTopColor: colors.border,
  },
  inlineControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  timelineSheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  specimenFooter: {
    marginTop: spacing.xxl,
    paddingTop: spacing.md,
    borderTopWidth: borders.hairline,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
});
