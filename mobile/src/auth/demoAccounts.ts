import type { UserRole } from '@/types/api';

export type DemoAccountKey =
  | 'admin'
  | 'clinic_lakeview'
  | 'clinic_badatalab'
  | 'staff_sunita'
  | 'family_rohan';

export interface DemoAccount {
  key: DemoAccountKey;
  label: string;
  subtitle: string;
  role: UserRole;
  email: string;
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: 'family_rohan',
    label: 'Family — Rohan Sharma',
    subtitle: 'Parents in Arera Colony · 6+ completed reports',
    role: 'FAMILY',
    email: 'family.rohan@closeby.in',
    password: 'Demo@1234',
  },
  {
    key: 'clinic_lakeview',
    label: 'Clinic Admin — Lakeview Homecare',
    subtitle: 'Arera Colony · Approved · Verified nursing staff',
    role: 'CLINIC_ADMIN',
    email: 'clinic.lakeview@closeby.in',
    password: 'Demo@1234',
  },
  {
    key: 'staff_sunita',
    label: 'Clinic Staff — Nurse Sunita Verma',
    subtitle: 'Verified by Lakeview Homecare Clinic',
    role: 'CLINIC_STAFF',
    email: 'staff.sunita@closeby.in',
    password: 'Demo@1234',
  },
  {
    key: 'admin',
    label: 'Platform Admin — Dr. Aarav Kulkarni',
    subtitle: 'Bhopal clinic governance & live analytics',
    role: 'PLATFORM_ADMIN',
    email: 'admin@closeby.in',
    password: 'Demo@1234',
  },
  {
    key: 'clinic_badatalab',
    label: 'Clinic Admin — Bada Talab Care',
    subtitle: 'MP Nagar · Switch here to prove clinic isolation',
    role: 'CLINIC_ADMIN',
    email: 'clinic.badatalab@closeby.in',
    password: 'Demo@1234',
  },
];

export const IS_DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';
