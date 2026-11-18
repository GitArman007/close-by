import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2 } from 'lucide-react-native';
import { roleHomeRoute, useAuth } from '@/auth/AuthContext';
import { Button, InputField, ScreenShell } from '@/components';
import { borders, colors, radii, spacing, typography } from '@/theme';

export default function RegisterClinicScreen() {
  const router = useRouter();
  const { registerClinic } = useAuth();

  const [clinicName, setClinicName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [email, setEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (
      !clinicName.trim() ||
      !registrationNumber.trim() ||
      !locality.trim() ||
      !address.trim() ||
      !clinicPhone.trim() ||
      !adminFullName.trim() ||
      !email.trim() ||
      !adminPhone.trim() ||
      password.length < 8
    ) {
      setError('Complete all clinic and administrator fields (password min 8 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const user = await registerClinic({
        clinicName: clinicName.trim(),
        registrationNumber: registrationNumber.trim(),
        locality: locality.trim(),
        address: address.trim(),
        clinicPhone: clinicPhone.trim(),
        adminFullName: adminFullName.trim(),
        email: email.trim(),
        adminPhone: adminPhone.trim(),
        password,
      });
      router.replace(roleHomeRoute(user.role) as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register clinic.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell showLogout={false}>
      <View style={styles.container}>
        <Button
          label="Back to sign in"
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onPress={() => router.back()}
        />

        <View style={styles.header}>
          <Text style={typography.kicker}>Bhopal Clinic Onboarding</Text>
          <Text style={typography.displayHero}>Register your clinic</Text>
          <Text style={typography.bodyMuted}>
            New clinics begin in Pending status until reviewed and approved by a
            closeBy Platform Admin.
          </Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={[typography.label, styles.errorText]}>{error}</Text>
            </View>
          ) : null}

          <Text style={typography.kicker}>Clinic details</Text>
          <InputField
            label="Clinic name"
            value={clinicName}
            onChangeText={setClinicName}
            placeholder="Arera Homecare Clinic"
          />
          <InputField
            label="Registration number"
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="BPL-CLN-2026-099"
          />
          <InputField
            label="Bhopal locality"
            value={locality}
            onChangeText={setLocality}
            placeholder="Arera Colony, MP Nagar, Shahpura..."
          />
          <InputField
            label="Full street address"
            value={address}
            onChangeText={setAddress}
            multiline
            placeholder="E-4/45, Arera Colony, Bhopal, MP 462016"
          />
          <InputField
            label="Clinic desk phone"
            value={clinicPhone}
            onChangeText={setClinicPhone}
            placeholder="+91-755-2461100"
          />

          <View style={styles.divider} />
          <Text style={typography.kicker}>Clinic administrator account</Text>

          <InputField
            label="Administrator full name"
            value={adminFullName}
            onChangeText={setAdminFullName}
            placeholder="Nikhil Srivastava"
          />
          <InputField
            label="Administrator email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="admin@clinic.in"
          />
          <InputField
            label="Administrator phone"
            value={adminPhone}
            onChangeText={setAdminPhone}
            placeholder="+91-98260-11000"
          />
          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            hint="Minimum 8 characters"
            placeholder="Create a secure password"
          />

          <Button
            label={submitting ? 'Submitting application...' : 'Submit clinic registration'}
            variant="primary"
            icon={Building2}
            loading={submitting}
            fullWidth
            onPress={() => void handleSubmit()}
          />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 620,
    width: '100%',
    alignSelf: 'center',
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
  divider: {
    height: borders.hairline,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
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
