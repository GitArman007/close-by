import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, UserPlus } from 'lucide-react-native';
import { parentApi } from '@/api/endpoints';
import { Button, InputField, ScreenShell } from '@/components';
import {
  borders,
  colors,
  icons,
  radii,
  spacing,
  triggerSelectionHaptic,
  typography,
} from '@/theme';

const GENDERS = ['Female', 'Male', 'Other'] as const;

export default function AddParentScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<string>('Female');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const parsedAge = parseInt(age, 10);
    if (!fullName.trim() || Number.isNaN(parsedAge) || parsedAge < 1 || parsedAge > 125) {
      setError('Enter your parent’s full name and a valid age.');
      return;
    }
    if (!locality.trim() || !address.trim()) {
      setError('Enter your parent’s Bhopal locality and full home address.');
      return;
    }
    if (!consentConfirmed) {
      setError(
        'Please confirm that your parent has given permission to arrange home visits and share observation slips with you.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await parentApi.createParent({
        fullName: fullName.trim(),
        age: parsedAge,
        gender,
        phone: phone.trim() || undefined,
        locality: locality.trim(),
        address: address.trim(),
        notes: notes.trim() || undefined,
        consentConfirmed: true,
      });
      router.replace('/(family)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save parent profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const navItems = [
    { label: 'Parent diary', href: '/(family)' },
    { label: 'Request visit', href: '/(family)/request-visit' },
    { label: 'Add parent', href: '/(family)/add-parent', active: true },
    { label: 'Access log', href: '/(family)/access-logs' },
  ];

  return (
    <ScreenShell navItems={navItems} showEmergencyBanner>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={typography.kicker}>Parent Profile · Bhopal</Text>
          <Text style={typography.displayHero}>Add your parent’s details</Text>
          <Text style={typography.bodyMuted}>
            Your parent does not need this app. Their consent confirmation is
            recorded permanently with a server timestamp.
          </Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={[typography.label, styles.errorText]}>{error}</Text>
            </View>
          ) : null}

          <InputField
            label="Parent’s full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Smt. Meera Sharma"
          />

          <View style={styles.rowTwo}>
            <InputField
              label="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="68"
              containerStyle={styles.half}
            />
            <View style={styles.half}>
              <Text style={typography.label}>Gender</Text>
              <View style={styles.choiceRow}>
                {GENDERS.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => {
                      void triggerSelectionHaptic();
                      setGender(g);
                    }}
                    style={[styles.choicePill, gender === g && styles.choicePillActive]}
                  >
                    <Text
                      style={[
                        typography.label,
                        gender === g ? styles.choiceTextActive : styles.choiceText,
                      ]}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <InputField
            label="Landline or phone (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91-755-2463101"
            hint="Used by verified clinic staff upon doorstep arrival."
          />

          <InputField
            label="Bhopal locality"
            value={locality}
            onChangeText={setLocality}
            placeholder="Arera Colony, Shahpura, TT Nagar..."
          />

          <InputField
            label="Home address"
            value={address}
            onChangeText={setAddress}
            multiline
            placeholder="E-4/72, Arera Colony, Bhopal, MP 462016"
          />

          <InputField
            label="Doorstep & comfort notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Prefers morning visits before 10:30 AM. Gate bell on left pillar."
          />

          {/* Explicit Parent Consent Confirmation */}
          <Pressable
            onPress={() => {
              void triggerSelectionHaptic();
              setConsentConfirmed((prev) => !prev);
            }}
            style={[
              styles.consentBox,
              consentConfirmed && styles.consentBoxChecked,
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consentConfirmed }}
          >
            <View
              style={[
                styles.checkbox,
                consentConfirmed && styles.checkboxChecked,
              ]}
            >
              {consentConfirmed ? (
                <Check
                  size={14}
                  color={colors.onPrimary}
                  strokeWidth={icons.strokeWidth}
                />
              ) : null}
            </View>
            <View style={styles.consentCopy}>
              <Text style={typography.bodyMedium}>
                I confirm my parent has consented
              </Text>
              <Text style={[typography.label, styles.muted]}>
                My parent agrees to home visits arranged via closeBy clinics and
                for me to read their observation slips. The exact UTC timestamp
                will be saved on submission.
              </Text>
            </View>
          </Pressable>

          <Button
            label={submitting ? 'Saving parent profile...' : 'Save parent & consent'}
            variant="primary"
            icon={UserPlus}
            loading={submitting}
            fullWidth
            onPress={() => void handleSave()}
          />
        </View>
      </View>
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
    gap: spacing.md,
  },
  rowTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  half: {
    flex: 1,
    minWidth: 200,
    gap: 6,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: 4,
  },
  choicePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  choicePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceText: {
    color: colors.ink,
  },
  choiceTextActive: {
    color: colors.onPrimary,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  consentBoxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  consentCopy: {
    flex: 1,
    gap: 4,
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
