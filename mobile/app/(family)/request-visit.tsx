import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarPlus, Check, MapPin } from 'lucide-react-native';
import { clinicApi, parentApi, visitApi } from '@/api/endpoints';
import { Button, EmptyState, InputField, ScreenShell } from '@/components';
import {
  borders,
  colors,
  emptyStates,
  errorStates,
  icons,
  loadingStates,
  radii,
  spacing,
  triggerSelectionHaptic,
  typography,
} from '@/theme';
import {
  PREFERRED_TIME_SLOTS,
  SERVICE_OPTIONS,
  type ClinicDto,
  type ParentDto,
  type ServiceType,
} from '@/types/api';

export default function RequestVisitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ parentId?: string }>();

  const [parents, setParents] = useState<ParentDto[]>([]);
  const [clinics, setClinics] = useState<ClinicDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [parentId, setParentId] = useState<string>('');
  const [clinicId, setClinicId] = useState<string>('');
  const [serviceType, setServiceType] = useState<ServiceType>('HOME_VITALS_CHECK');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [preferredTime, setPreferredTime] = useState<string>(PREFERRED_TIME_SLOTS[1]);
  const [visitAddress, setVisitAddress] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [pList, cList] = await Promise.all([
          parentApi.listOwnParents(),
          clinicApi.listApprovedClinics(),
        ]);
        if (!mounted) return;
        setParents(pList);
        setClinics(cList);
        const initialParent =
          pList.find((p) => p.id === params.parentId) ?? pList[0];
        if (initialParent) {
          setParentId(initialParent.id);
          setVisitAddress(initialParent.address);
        }
        if (cList[0]) {
          setClinicId(cList[0].id);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : errorStates.network.body);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [params.parentId]);

  const handleParentChange = (nextId: string) => {
    void triggerSelectionHaptic();
    setParentId(nextId);
    const chosen = parents.find((p) => p.id === nextId);
    if (chosen) {
      setVisitAddress(chosen.address);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!parentId || !clinicId || !scheduledDate.trim()) {
      setError('Select your parent, an approved Bhopal clinic, and a visit date.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await visitApi.createVisit({
        parentId,
        clinicId,
        serviceType,
        scheduledDate: scheduledDate.trim(),
        preferredTime,
        visitAddress: visitAddress.trim() || undefined,
        instructions: instructions.trim() || undefined,
      });
      router.replace(`/(family)/visit/${created.id}` as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request visit.');
    } finally {
      setSubmitting(false);
    }
  };

  const navItems = [
    { label: 'Parent diary', href: '/(family)' },
    { label: 'Request visit', href: '/(family)/request-visit', active: true },
    { label: 'Add parent', href: '/(family)/add-parent' },
    { label: 'Access log', href: '/(family)/access-logs' },
  ];

  return (
    <ScreenShell navItems={navItems} showEmergencyBanner>
      {loading ? (
        <EmptyState
          mode="loading"
          title={loadingStates.diary.title}
          body={loadingStates.diary.body}
        />
      ) : parents.length === 0 ? (
        <EmptyState
          mode="empty"
          title={emptyStates.noParents.title}
          body={emptyStates.noParents.body}
          actionLabel={emptyStates.noParents.actionLabel}
          onAction={() => router.replace('/(family)/add-parent')}
        />
      ) : (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={typography.kicker}>Book Home Health Visit</Text>
            <Text style={typography.displayHero}>Request a Bhopal visit</Text>
            <Text style={typography.bodyMuted}>
              Only Platform Admin–approved clinics appear below. Once booked, the
              clinic assigns a verified staff member.
            </Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={[typography.label, styles.errorText]}>{error}</Text>
              </View>
            ) : null}

            {/* Step 1: Parent */}
            <View style={styles.fieldGroup}>
              <Text style={typography.kicker}>1 · Parent</Text>
              <View style={styles.chipWrap}>
                {parents.map((p) => {
                  const selected = p.id === parentId;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => handleParentChange(p.id)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text
                        style={[
                          typography.label,
                          selected ? styles.chipTextSelected : styles.chipText,
                        ]}
                      >
                        {p.fullName} · {p.locality}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Step 2: Fixed 4 Services */}
            <View style={styles.fieldGroup}>
              <Text style={typography.kicker}>2 · Home visit service</Text>
              <View style={styles.optionList}>
                {SERVICE_OPTIONS.map((opt) => {
                  const selected = opt.value === serviceType;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        void triggerSelectionHaptic();
                        setServiceType(opt.value);
                      }}
                      style={[
                        styles.optionRow,
                        selected && styles.optionRowSelected,
                      ]}
                    >
                      <View style={styles.optionBody}>
                        <Text style={typography.bodyMedium}>{opt.label}</Text>
                        <Text style={[typography.label, styles.muted]}>
                          {opt.description}
                        </Text>
                      </View>
                      {selected ? (
                        <Check
                          size={icons.md}
                          color={colors.primary}
                          strokeWidth={icons.strokeWidth}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Step 3: Approved Bhopal Clinic */}
            <View style={styles.fieldGroup}>
              <Text style={typography.kicker}>3 · Approved Bhopal clinic</Text>
              <View style={styles.optionList}>
                {clinics.map((c) => {
                  const selected = c.id === clinicId;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        void triggerSelectionHaptic();
                        setClinicId(c.id);
                      }}
                      style={[
                        styles.optionRow,
                        selected && styles.optionRowSelected,
                      ]}
                    >
                      <View style={styles.optionBody}>
                        <Text style={typography.bodyMedium}>{c.name}</Text>
                        <View style={styles.localityInline}>
                          <MapPin
                            size={13}
                            color={colors.inkSubtle}
                            strokeWidth={icons.strokeWidth}
                          />
                          <Text style={[typography.label, styles.muted]}>
                            {c.locality}, Bhopal · {c.phone}
                          </Text>
                        </View>
                      </View>
                      {selected ? (
                        <Check
                          size={icons.md}
                          color={colors.primary}
                          strokeWidth={icons.strokeWidth}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Step 4: Date, Preferred Time, Address & Instructions */}
            <InputField
              label="Preferred date (YYYY-MM-DD)"
              value={scheduledDate}
              onChangeText={setScheduledDate}
              placeholder="2026-11-19"
            />

            <View style={styles.fieldGroup}>
              <Text style={typography.label}>Preferred time window</Text>
              <View style={styles.chipWrap}>
                {PREFERRED_TIME_SLOTS.map((slot) => {
                  const selected = slot === preferredTime;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => {
                        void triggerSelectionHaptic();
                        setPreferredTime(slot);
                      }}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text
                        style={[
                          typography.label,
                          selected ? styles.chipTextSelected : styles.chipText,
                        ]}
                      >
                        {slot}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <InputField
              label="Visit address in Bhopal"
              value={visitAddress}
              onChangeText={setVisitAddress}
              multiline
            />

            <InputField
              label="Special instructions for staff (optional)"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              placeholder="Ring twice; please take blood pressure after 5 minutes of seated rest."
            />

            <Button
              label={submitting ? 'Submitting visit request...' : 'Confirm visit request'}
              variant="primary"
              icon={CalendarPlus}
              loading={submitting}
              fullWidth
              onPress={() => void handleSubmit()}
            />
          </View>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.ink,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  optionList: {
    gap: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionBody: {
    flex: 1,
    gap: 3,
  },
  localityInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  muted: {
    color: colors.inkMuted,
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
