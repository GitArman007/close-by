import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Save } from 'lucide-react-native';
import { clinicApi } from '@/api/endpoints';
import { Button, EmptyState, InputField, Pill, ScreenShell } from '@/components';
import {
  borders,
  colors,
  errorStates,
  loadingStates,
  radii,
  spacing,
  typography,
} from '@/theme';
import type { ClinicDto } from '@/types/api';
import { clinicStatusMeta } from '@/utils/formatters';

export default function ClinicProfileScreen() {
  const [clinic, setClinic] = useState<ClinicDto | null>(null);
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await clinicApi.getOwnProfile();
        if (!mounted) return;
        setClinic(data);
        setName(data.name);
        setLocality(data.locality);
        setAddress(data.address);
        setPhone(data.phone);
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
  }, []);

  const handleSave = async () => {
    setStatusMsg(null);
    setSaving(true);
    try {
      const updated = await clinicApi.updateOwnProfile({
        name: name.trim(),
        locality: locality.trim(),
        address: address.trim(),
        phone: phone.trim(),
      });
      setClinic(updated);
      setStatusMsg('Clinic profile saved.');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { label: 'Visit queue', href: '/(clinic)' },
    { label: 'Verified staff', href: '/(clinic)/staff' },
    { label: 'Reports', href: '/(clinic)/reports' },
    { label: 'Access log', href: '/(clinic)/access-logs' },
    { label: 'Clinic profile', href: '/(clinic)/profile', active: true },
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
        />
      ) : (
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={typography.kicker}>Clinic Profile · Bhopal</Text>
              <Text style={typography.displayHero}>{clinic.name}</Text>
              <Text style={typography.monoMeta}>
                Registration {clinic.registrationNumber}
              </Text>
            </View>
            <Pill
              label={clinicStatusMeta(clinic.status).label}
              tone={clinicStatusMeta(clinic.status).tone}
              showDot
            />
          </View>

          <View style={styles.card}>
            {statusMsg ? (
              <View style={styles.msgBox}>
                <Text style={[typography.label, styles.msgText]}>{statusMsg}</Text>
              </View>
            ) : null}

            <InputField label="Clinic name" value={name} onChangeText={setName} />
            <InputField
              label="Bhopal locality"
              value={locality}
              onChangeText={setLocality}
            />
            <InputField
              label="Full address"
              value={address}
              onChangeText={setAddress}
              multiline
            />
            <InputField label="Desk phone" value={phone} onChangeText={setPhone} />

            <Button
              label={saving ? 'Saving changes...' : 'Save clinic profile'}
              variant="primary"
              icon={Save}
              loading={saving}
              onPress={() => void handleSave()}
            />
          </View>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 680,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    padding: spacing.xl,
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
