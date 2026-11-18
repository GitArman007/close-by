import { apiRequest } from './client';
import type {
  AuthResponse,
  BloodSugarContext,
  ClinicDto,
  ClinicStatus,
  ParentDto,
  PlatformAnalyticsDto,
  RecommendationType,
  ReportAccessLogDto,
  ServiceType,
  StaffDto,
  UserSummaryDto,
  VisitDto,
  VisitReportDto,
  VisitStatus,
} from '@/types/api';

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    }),

  registerFamily: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) =>
    apiRequest<AuthResponse>('/auth/register/family', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    }),

  registerClinic: (payload: {
    adminFullName: string;
    email: string;
    adminPhone: string;
    password: string;
    clinicName: string;
    registrationNumber: string;
    locality: string;
    address: string;
    clinicPhone: string;
  }) =>
    apiRequest<AuthResponse>('/auth/register/clinic', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    }),

  me: () => apiRequest<UserSummaryDto>('/auth/me'),
};

export const adminApi = {
  listClinics: (status?: ClinicStatus) =>
    apiRequest<ClinicDto[]>(status ? `/admin/clinics?status=${status}` : '/admin/clinics'),

  approveClinic: (clinicId: string) =>
    apiRequest<ClinicDto>(`/admin/clinics/${clinicId}/approve`, { method: 'PATCH' }),

  rejectClinic: (clinicId: string, reason?: string) =>
    apiRequest<ClinicDto>(`/admin/clinics/${clinicId}/reject`, {
      method: 'PATCH',
      body: reason ? { reason } : {},
    }),

  suspendClinic: (clinicId: string, reason?: string) =>
    apiRequest<ClinicDto>(`/admin/clinics/${clinicId}/suspend`, {
      method: 'PATCH',
      body: reason ? { reason } : {},
    }),

  getAnalytics: () => apiRequest<PlatformAnalyticsDto>('/admin/analytics'),
};

export const clinicApi = {
  listApprovedClinics: () => apiRequest<ClinicDto[]>('/clinics'),

  getOwnProfile: () => apiRequest<ClinicDto>('/clinic/profile'),

  updateOwnProfile: (payload: {
    name: string;
    locality: string;
    address: string;
    phone: string;
  }) =>
    apiRequest<ClinicDto>('/clinic/profile', {
      method: 'PUT',
      body: payload,
    }),
};

export const staffApi = {
  listOwnStaff: (tokenOverride?: string) =>
    apiRequest<StaffDto[]>('/clinic/staff', { tokenOverride }),

  createStaff: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    designation: string;
  }) =>
    apiRequest<StaffDto>('/clinic/staff', {
      method: 'POST',
      body: payload,
    }),

  updateStaffStatus: (staffUserId: string, active: boolean) =>
    apiRequest<StaffDto>(`/clinic/staff/${staffUserId}/status`, {
      method: 'PATCH',
      body: { active },
    }),
};

export const parentApi = {
  listOwnParents: () => apiRequest<ParentDto[]>('/parents'),

  getOwnParent: (parentId: string) => apiRequest<ParentDto>(`/parents/${parentId}`),

  createParent: (payload: {
    fullName: string;
    age: number;
    gender: string;
    phone?: string;
    locality: string;
    address: string;
    notes?: string;
    consentConfirmed: boolean;
  }) =>
    apiRequest<ParentDto>('/parents', {
      method: 'POST',
      body: payload,
    }),

  updateParent: (
    parentId: string,
    payload: {
      fullName: string;
      age: number;
      gender: string;
      phone?: string;
      locality: string;
      address: string;
      notes?: string;
    }
  ) =>
    apiRequest<ParentDto>(`/parents/${parentId}`, {
      method: 'PUT',
      body: payload,
    }),
};

export const visitApi = {
  createVisit: (payload: {
    parentId: string;
    clinicId: string;
    serviceType: ServiceType;
    scheduledDate: string;
    preferredTime: string;
    visitAddress?: string;
    instructions?: string;
  }) =>
    apiRequest<VisitDto>('/visits', {
      method: 'POST',
      body: payload,
    }),

  listVisits: (status?: VisitStatus) =>
    apiRequest<VisitDto[]>(status ? `/visits?status=${status}` : '/visits'),

  getVisit: (visitId: string) => apiRequest<VisitDto>(`/visits/${visitId}`),

  assignStaff: (visitId: string, staffUserId: string, tokenOverride?: string) =>
    apiRequest<VisitDto>(`/visits/${visitId}/assign`, {
      method: 'PATCH',
      body: { staffUserId },
      tokenOverride,
    }),

  startVisit: (visitId: string, tokenOverride?: string) =>
    apiRequest<VisitDto>(`/visits/${visitId}/start`, {
      method: 'PATCH',
      tokenOverride,
    }),

  cancelVisit: (visitId: string, reason?: string) =>
    apiRequest<VisitDto>(`/visits/${visitId}/cancel`, {
      method: 'PATCH',
      body: reason ? { reason } : {},
    }),
};

export const reportApi = {
  completeVisit: (
    visitId: string,
    payload: {
      bpSystolic?: number | null;
      bpDiastolic?: number | null;
      temperatureF?: number | null;
      bloodSugarMgDl?: number | null;
      bloodSugarContext?: BloodSugarContext | null;
      observationNotes: string;
      recommendation: RecommendationType;
    },
    tokenOverride?: string
  ) =>
    apiRequest<VisitReportDto>(`/visits/${visitId}/complete`, {
      method: 'POST',
      body: payload,
      tokenOverride,
    }),

  getReportForVisit: (visitId: string) =>
    apiRequest<VisitReportDto>(`/visits/${visitId}/report`),

  listOwnClinicReports: () => apiRequest<VisitReportDto[]>('/reports'),

  listParentReports: (parentId: string) =>
    apiRequest<VisitReportDto[]>(`/parents/${parentId}/reports`),
};

export const auditApi = {
  getLogsForReport: (reportId: string) =>
    apiRequest<ReportAccessLogDto[]>(`/reports/${reportId}/access-logs`),

  listScopedLogs: () => apiRequest<ReportAccessLogDto[]>('/access-logs'),
};
