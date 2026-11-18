export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'CLINIC_ADMIN'
  | 'CLINIC_STAFF'
  | 'FAMILY';

export type ClinicStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type ServiceType =
  | 'HOME_VITALS_CHECK'
  | 'SAMPLE_COLLECTION'
  | 'FOLLOW_UP_VISIT'
  | 'MEDICINE_ADHERENCE_CHECK';

export type VisitStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type RecommendationType = 'NONE' | 'FOLLOW_UP_VISIT' | 'DOCTOR_CONSULT';

export type BloodSugarContext = 'FASTING' | 'POST_MEAL' | 'RANDOM';

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export interface UserSummaryDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  clinicId: string | null;
  clinicName: string | null;
  clinicStatus: ClinicStatus | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserSummaryDto;
}

export interface ClinicDto {
  id: string;
  name: string;
  registrationNumber: string;
  locality: string;
  address: string;
  city: string;
  phone: string;
  status: ClinicStatus;
  statusReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface StaffDto {
  userId: string;
  profileId: string;
  clinicId: string;
  clinicName: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  verifiedByClinic: boolean;
  verifiedBadge: string;
  verifiedAt: string;
  active: boolean;
}

export interface ParentDto {
  id: string;
  familyUserId: string;
  fullName: string;
  age: number;
  gender: string;
  phone: string | null;
  locality: string;
  address: string;
  notes: string | null;
  consentConfirmed: boolean;
  consentConfirmedAt: string;
  createdAt: string;
}

export interface VisitDto {
  id: string;
  familyUserId: string;
  parentId: string;
  parentName: string;
  parentAge: number;
  parentLocality: string;
  clinicId: string;
  clinicName: string;
  clinicLocality: string;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  assignedStaffDesignation: string | null;
  staffVerifiedBadge: string | null;
  serviceType: ServiceType;
  serviceLabel: string;
  scheduledDate: string;
  preferredTime: string;
  visitAddress: string;
  instructions: string | null;
  status: VisitStatus;
  cancellationReason: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface VisitReportDto {
  id: string;
  visitId: string;
  clinicId: string;
  clinicName: string;
  clinicLocality: string;
  parentId: string;
  parentName: string;
  parentAge: number;
  serviceType: ServiceType;
  serviceLabel: string;
  scheduledDate: string;
  recordedByStaffId: string;
  staffName: string;
  staffDesignation: string;
  staffVerifiedBadge: string;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  temperatureF: number | null;
  bloodSugarMgDl: number | null;
  bloodSugarContext: BloodSugarContext | null;
  observationNotes: string;
  recommendation: RecommendationType;
  recordedAt: string;
  observationsDisclaimer: string;
  emergencyNotice: string;
}

export interface ReportAccessLogDto {
  id: string;
  reportId: string;
  visitId: string;
  clinicId: string;
  parentName: string;
  clinicName: string;
  viewerUserId: string;
  viewerName: string;
  viewerRole: UserRole;
  viewedAt: string;
}

export interface WeeklyVisitBucket {
  weekLabel: string;
  weekStart: string;
  visitCount: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface PlatformAnalyticsDto {
  totalVisits: number;
  averageMinutesToAssign: number;
  repeatBookingParentsCount: number;
  repeatBookingRatePercent: number;
  visitsPerWeek: WeeklyVisitBucket[];
  clinicsByStatus: StatusCount[];
  visitsByStatus: StatusCount[];
}

export const SERVICE_OPTIONS: {
  value: ServiceType;
  label: string;
  description: string;
}[] = [
  {
    value: 'HOME_VITALS_CHECK',
    label: 'Home vitals check',
    description: 'Blood pressure, temperature, and blood sugar recorded at home.',
  },
  {
    value: 'SAMPLE_COLLECTION',
    label: 'Sample collection',
    description: 'Routine diagnostic sample collected gently at your parent’s doorstep.',
  },
  {
    value: 'FOLLOW_UP_VISIT',
    label: 'Follow-up visit',
    description: 'Scheduled wellness check-in after a recent consultation or visit.',
  },
  {
    value: 'MEDICINE_ADHERENCE_CHECK',
    label: 'Medicine adherence check',
    description: 'Reviewing daily pill schedules and noting any practical difficulties.',
  },
];

export const PREFERRED_TIME_SLOTS = [
  '08:00 AM - 09:30 AM',
  '09:30 AM - 11:00 AM',
  '11:00 AM - 12:30 PM',
  '04:30 PM - 06:00 PM',
] as const;
