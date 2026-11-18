import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Building2, UserPlus } from 'lucide-react-native';
import { roleHomeRoute, useAuth } from '@/auth/AuthContext';
import { Button, InputField, ScreenShell } from '@/components';
import { borders, colors, radii, spacing, typography } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your registered email and password to open your diary.');
      return;
    }

    setSubmitting(true);
    try {
      const signedInUser = await login(email.trim(), password);
      router.replace(roleHomeRoute(signedInUser.role) as never);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not verify your credentials. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell showLogout={false} showEmergencyBanner>
      <View style={styles.container}>
        <View style={styles.intro}>
          <Text style={typography.kicker}>Remote Parent Care · Bhopal</Text>
          <Text style={[typography.displayHero, styles.title]}>
            Home health visits for your parents in Bhopal
          </Text>
          <Text style={typography.bodyMuted}>
            Arrange verified local clinic visits from any city and read factual
            observation slips afterwards. Your parent does not need this app.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={typography.heading}>Sign in to closeBy</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={[typography.label, styles.errorText]}>{error}</Text>
            </View>
          ) : null}

          <InputField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="family.rohan@closeby.in"
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter password"
          />

          <Button
            label={submitting ? 'Signing in...' : 'Sign in'}
            variant="primary"
            icon={ArrowRight}
            iconPosition="right"
            loading={submitting}
            fullWidth
            onPress={() => void handleLogin()}
          />
        </View>

        <View style={styles.registerBand}>
          <Text style={typography.kicker}>New to closeBy?</Text>
          <View style={styles.registerButtons}>
            <Button
              label="Create family account"
              variant="secondary"
              icon={UserPlus}
              onPress={() => router.push('/(auth)/register-family')}
            />
            <Button
              label="Register a Bhopal clinic"
              variant="ghost"
              icon={Building2}
              onPress={() => router.push('/(auth)/register-clinic')}
            />
          </View>
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
    gap: spacing.xl,
  },
  intro: {
    gap: spacing.xs,
  },
  title: {
    marginTop: 2,
  },
  formCard: {
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
  registerBand: {
    borderTopWidth: borders.hairline,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  registerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
