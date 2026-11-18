import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, UserPlus } from 'lucide-react-native';
import { roleHomeRoute, useAuth } from '@/auth/AuthContext';
import { Button, InputField, ScreenShell } from '@/components';
import { borders, colors, radii, spacing, typography } from '@/theme';

export default function RegisterFamilyScreen() {
  const router = useRouter();
  const { registerFamily } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!fullName.trim() || !email.trim() || !phone.trim() || password.length < 8) {
      setError('Complete all fields with a password of at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await registerFamily({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      router.replace(roleHomeRoute(user.role) as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create family account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell showLogout={false} showEmergencyBanner>
      <View style={styles.container}>
        <Button
          label="Back to sign in"
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onPress={() => router.back()}
        />

        <View style={styles.header}>
          <Text style={typography.kicker}>Family Registration</Text>
          <Text style={typography.displayHero}>Create your family account</Text>
          <Text style={typography.bodyMuted}>
            After signing up, you will add your parent’s Bhopal address and
            record their consent before requesting a home visit.
          </Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={[typography.label, styles.errorText]}>{error}</Text>
            </View>
          ) : null}

          <InputField
            label="Your full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Rohan Sharma"
          />
          <InputField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="rohan.sharma@example.com"
          />
          <InputField
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91-98450-12345"
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
            label={submitting ? 'Creating account...' : 'Create family account'}
            variant="primary"
            icon={UserPlus}
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
    maxWidth: 560,
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
