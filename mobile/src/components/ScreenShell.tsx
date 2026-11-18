import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/theme';
import { BrandHeader, type NavLinkItem } from './BrandHeader';
import { EmergencyBanner } from './EmergencyBanner';

export interface ScreenShellProps {
  children: React.ReactNode;
  navItems?: NavLinkItem[];
  showLogout?: boolean;
  showEmergencyBanner?: boolean;
  wide?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ScreenShell({
  children,
  navItems,
  showLogout = true,
  showEmergencyBanner = false,
  wide = false,
  refreshing = false,
  onRefresh,
}: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        <View
          style={[
            styles.inner,
            { maxWidth: wide ? layout.webDashboardMaxWidth : 820 },
          ]}
        >
          <BrandHeader navItems={navItems} showLogout={showLogout} />
          {showEmergencyBanner ? (
            <EmergencyBanner style={styles.emergencySpacing} />
          ) : null}
          {children}
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
  inner: {
    width: '100%',
  },
  emergencySpacing: {
    marginBottom: spacing.lg,
  },
});
