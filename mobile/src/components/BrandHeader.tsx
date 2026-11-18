import React, { useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useAuth } from '@/auth/AuthContext';
import { IS_DEMO_MODE } from '@/auth/demoAccounts';
import {
  borders,
  colors,
  icons,
  radii,
  spacing,
  triggerLightHaptic,
  typography,
} from '@/theme';

export interface NavLinkItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface BrandHeaderProps {
  navItems?: NavLinkItem[];
  showLogout?: boolean;
}

/**
 * Editorial top masthead bar.
 * Hidden Demo Switcher: long-press the "closeBy" logo (500ms hold on mobile or web)
 * to switch instantly between Platform Admin, Clinic Admin, Staff, and Family accounts.
 */
export function BrandHeader({ navItems = [], showLogout = true }: BrandHeaderProps) {
  const router = useRouter();
  const { user, logout, setDemoSwitcherVisible } = useAuth();
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDemoSwitcher = () => {
    if (!IS_DEMO_MODE) return;
    void triggerLightHaptic();
    setDemoSwitcherVisible(true);
  };

  const handlePressIn = () => {
    if (Platform.OS === 'web' && IS_DEMO_MODE) {
      holdTimerRef.current = setTimeout(() => {
        openDemoSwitcher();
      }, 500);
    }
  };

  const clearWebHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  return (
    <View style={styles.bar}>
      <View style={styles.topRow}>
        <Pressable
          onLongPress={openDemoSwitcher}
          delayLongPress={500}
          onPressIn={handlePressIn}
          onPressOut={clearWebHold}
          accessibilityRole="button"
          accessibilityLabel="closeBy logo"
          accessibilityHint="Long-press to open demo role switcher"
          style={styles.logoPress}
        >
          <View style={styles.logoMark} />
          <Text style={[typography.subheading, styles.wordmark]}>closeBy</Text>
          <Text style={[typography.monoMeta, styles.cityTag]}>BHOPAL</Text>
        </Pressable>

        {showLogout && user ? (
          <View style={styles.rightControls}>
            <Text style={[typography.label, styles.userLabel]} numberOfLines={1}>
              {user.fullName}
            </Text>
            <Pressable
              onPress={() => {
                logout();
                router.replace('/(auth)/login');
              }}
              style={styles.logoutBtn}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <LogOut
                size={icons.sm}
                color={colors.inkMuted}
                strokeWidth={icons.strokeWidth}
              />
              <Text style={[typography.label, styles.logoutText]}>Sign out</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {navItems.length > 0 ? (
        <View style={styles.navRow}>
          {navItems.map((item) => (
            <Pressable
              key={item.href}
              onPress={() => router.replace(item.href as never)}
              style={[styles.navPill, item.active && styles.navPillActive]}
            >
              <Text
                style={[
                  typography.label,
                  styles.navPillText,
                  item.active && styles.navPillTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: borders.hairline,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  logoPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  logoMark: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  wordmark: {
    color: colors.ink,
    letterSpacing: -0.4,
  },
  cityTag: {
    color: colors.inkSubtle,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 2,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userLabel: {
    color: colors.inkMuted,
    maxWidth: 180,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  logoutText: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  navRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  navPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  navPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  navPillText: {
    color: colors.inkMuted,
    fontSize: 14,
  },
  navPillTextActive: {
    color: colors.onPrimary,
  },
});
