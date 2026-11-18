import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, KeyRound, Palette, X } from 'lucide-react-native';
import { roleHomeRoute, useAuth } from '@/auth/AuthContext';
import { DEMO_ACCOUNTS, type DemoAccountKey } from '@/auth/demoAccounts';
import {
  borders,
  colors,
  icons,
  radii,
  spacing,
  triggerLightHaptic,
  typography,
} from '@/theme';
import { Pill } from './Pill';

export function DemoSwitcherModal() {
  const router = useRouter();
  const {
    user,
    demoSwitcherVisible,
    setDemoSwitcherVisible,
    switchDemoAccount,
  } = useAuth();
  const [switchingKey, setSwitchingKey] = useState<DemoAccountKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (key: DemoAccountKey) => {
    setError(null);
    setSwitchingKey(key);
    void triggerLightHaptic();
    try {
      const signedInUser = await switchDemoAccount(key);
      setDemoSwitcherVisible(false);
      router.replace(roleHomeRoute(signedInUser.role) as never);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not switch role. Ensure the Spring Boot demo server is running.'
      );
    } finally {
      setSwitchingKey(null);
    }
  };

  return (
    <Modal
      visible={demoSwitcherVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setDemoSwitcherVisible(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={typography.kicker}>LNCTS Bhopal · Live Demo Mode</Text>
              <Text style={typography.heading}>Switch demo role</Text>
            </View>
            <Pressable
              onPress={() => setDemoSwitcherVisible(false)}
              style={styles.closeBtn}
              accessibilityLabel="Close demo switcher"
            >
              <X size={icons.md} color={colors.ink} strokeWidth={icons.strokeWidth} />
            </Pressable>
          </View>

          <Text style={[typography.bodyMuted, styles.description]}>
            Every role signs in through the real /api/v1/auth/login JWT endpoint
            using seeded Bhopal accounts.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={[typography.label, styles.errorText]}>{error}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {DEMO_ACCOUNTS.map((account) => {
              const isCurrent = user?.email === account.email;
              const isBusy = switchingKey === account.key;
              return (
                <Pressable
                  key={account.key}
                  disabled={switchingKey !== null}
                  onPress={() => void handleSelect(account.key)}
                  style={[
                    styles.accountRow,
                    isCurrent && styles.accountRowActive,
                  ]}
                >
                  <View style={styles.accountBody}>
                    <View style={styles.accountTop}>
                      <Text style={typography.bodyMedium}>{account.label}</Text>
                      {isCurrent ? <Pill label="Active" tone="primary" /> : null}
                    </View>
                    <Text style={[typography.label, styles.muted]}>
                      {account.subtitle}
                    </Text>
                    <Text style={typography.monoMeta}>{account.email}</Text>
                  </View>
                  <ArrowRight
                    size={icons.md}
                    color={isBusy ? colors.primary : colors.inkSubtle}
                    strokeWidth={icons.strokeWidth}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerHint}>
              <KeyRound
                size={14}
                color={colors.inkSubtle}
                strokeWidth={icons.strokeWidth}
              />
              <Text style={[typography.monoMeta, styles.hintMono]}>
                Password: Demo@1234
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setDemoSwitcherVisible(false);
                router.push('/design-preview');
              }}
              style={styles.previewLink}
            >
              <Palette
                size={15}
                color={colors.primary}
                strokeWidth={icons.strokeWidth}
              />
              <Text style={[typography.label, styles.previewText]}>
                Design specimen
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 35, 31, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    padding: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    gap: 2,
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  description: {
    marginTop: -4,
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
  list: {
    maxHeight: 360,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  accountRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  accountBody: {
    flex: 1,
    gap: 3,
  },
  accountTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  muted: {
    color: colors.inkMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: borders.hairline,
    borderTopColor: colors.border,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintMono: {
    fontSize: 12,
  },
  previewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewText: {
    color: colors.primary,
  },
});
