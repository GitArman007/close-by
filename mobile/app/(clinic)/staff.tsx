import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { clinicApi, staffApi } from '@/api/endpoints';
import {
  Button,
  EmptyState,
  InputField,
  Pill,
  ScreenShell,
} from '@/components';
import {
  borders,
  colors,
  errorStates,
  loadingStates,
  radii,
  spacing,
  typography,
} from '@/theme';
import type { ClinicDto, StaffDto } from '@/types/api';
import { formatShortDate } from '@/utils/formatters';

export default function ClinicStaffScreen() {
  const [clinic, setClinic] = useState<ClinicDto | null>(null);
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Registered Nurse');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profile, staffRows] = await Promise.all([
        clinicApi.getOwnProfile(),
        staffApi.listOwnStaff(),
      ]);
      setClinic(profile);
      setStaff(staffRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorStates.network.body);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAddStaff = async () => {
    setFormMsg(null);
    if (!fullName.trim() || !email.trim() || !phone.trim() || !designation.trim() || password.length < 8) {
      setFormMsg('Fill all fields (password must be at least 8 characters).');
      return;
    }

    setCreating(true);
    try {
      const created = await staffApi.createStaff({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        designation: designation.trim(),
        password,
      });
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setFormMsg(`Added ${created.fullName} with badge "${created.verifiedBadge}".`);
      await loadData();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : 'Could not add staff member.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (member: StaffDto) => {
    try {
      await staffApi.updateStaffStatus(member.userId, !member.active);
      await loadData();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : 'Could not update staff status.');
    }
  };

  const navItems = [
    { label: 'Visit queue', href: '/(clinic)' },
    { label: 'Verified staff', href: '/(clinic)/staff', active: true },
    { label: 'Reports', href: '/(clinic)/reports' },
    { label: 'Access log', href: '/(clinic)/access-logs' },
    { label: 'Clinic profile', href: '/(clinic)/profile' },
  ];

  return (
    <ScreenShell navItems={navItems} wide>
      {loading ? (
        <EmptyState
          mode="loading"
          title={loadingStates.clinicQueue.title}
          body={loadingStates.clinicQueue.body}
        />
      ) : error || !clinic ? (
        <EmptyState
          mode="error"
          title={errorStates.network.title}
          body={error ?? errorStates.network.body}
          actionLabel={errorStates.network.actionLabel}
          onAction={() => void loadData()}
        />
      ) : (
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={typography.kicker}>{clinic.name} · Staff Roster</Text>
            <Text style={typography.displayHero}>Verified clinic staff</Text>
            <Text style={typography.bodyMuted}>
              Every staff member added here displays the “Verified by{' '}
              {clinic.name}” mark on family trackers and printed observation slips.
            </Text>
          </View>

          <View style={styles.columns}>
            {/* Existing Roster */}
            <View style={styles.rosterCol}>
              <Text style={typography.kicker}>Active & Inactive Staff ({staff.length})</Text>
              <View style={styles.ledger}>
                {staff.map((member, idx) => (
                  <View
                    key={member.userId}
                    style={[
                      styles.staffRow,
                      idx === staff.length - 1 && styles.rowLast,
                    ]}
                  >
                    <View style={styles.staffInfo}>
                      <View style={styles.nameLine}>
                        <Text style={typography.subheading}>{member.fullName}</Text>
                        <Pill
                          label={member.active ? 'Active' : 'Inactive'}
                          tone={member.active ? 'primary' : 'neutral'}
                        />
                      </View>
                      <Text style={[typography.label, styles.muted]}>
                        {member.designation} · {member.email} · {member.phone}
                      </Text>
                      <View style={styles.badgeRow}>
                        <Pill label={member.verifiedBadge} tone="verified" />
                        <Text style={typography.monoMeta}>
                          Since {formatShortDate(member.verifiedAt)}
                        </Text>
                      </View>
                    </View>
                    <Button
                      label={member.active ? 'Deactivate' : 'Reactivate'}
                      variant="secondary"
                      size="sm"
                      onPress={() => void handleToggleStatus(member)}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Add Staff Form */}
            <View style={styles.formCol}>
              <Text style={typography.kicker}>Add Verified Staff</Text>
              <View style={styles.formCard}>
                {clinic.status !== 'APPROVED' ? (
                  <Text style={typography.bodyMuted}>
                    Staff creation unlocks once a Platform Admin approves {clinic.name}.
                  </Text>
                ) : (
                  <>
                    {formMsg ? (
                      <View style={styles.msgBox}>
                        <Text style={[typography.label, styles.msgText]}>
                          {formMsg}
                        </Text>
                      </View>
                    ) : null}

                    <InputField
                      label="Full name"
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Nurse Anjali Tiwari"
                    />
                    <InputField
                      label="Designation"
                      value={designation}
                      onChangeText={setDesignation}
                      placeholder="Registered Nurse / Lab Technician"
                    />
                    <InputField
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="anjali@closeby.in"
                    />
                    <InputField
                      label="Phone"
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+91-98261-55001"
                    />
                    <InputField
                      label="Temporary password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      hint="Minimum 8 characters"
                      placeholder="Create staff password"
                    />
                    <Button
                      label={creating ? 'Verifying & adding...' : 'Add verified staff'}
                      variant="primary"
                      icon={UserPlus}
                      loading={creating}
                      fullWidth
                      onPress={() => void handleAddStaff()}
                    />
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      )}
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
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    alignItems: 'flex-start',
  },
  rosterCol: {
    flex: 1.4,
    minWidth: 300,
    gap: spacing.sm,
  },
  formCol: {
    flex: 1,
    minWidth: 280,
    gap: spacing.sm,
  },
  ledger: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  staffRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  staffInfo: {
    flex: 1,
    minWidth: 220,
    gap: 5,
  },
  nameLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  muted: {
    color: colors.inkMuted,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.md,
  },
  msgBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.input,
    padding: spacing.sm,
  },
  msgText: {
    color: colors.primary,
  },
});
