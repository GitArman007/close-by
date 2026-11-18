import type { PillTone, ReportSlipData, ReportSlipReading } from '@/components';
import type { ClinicStatus, VisitDto, VisitReportDto, VisitStatus } from '@/types/api';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatShortDate(isoOrDate: string): string {
  const date = new Date(isoOrDate.length === 10 ? `${isoOrDate}T00:00:00` : isoOrDate);
  if (Number.isNaN(date.getTime())) return isoOrDate;
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDayShort(isoOrDate: string): string {
  const date = new Date(isoOrDate.length === 10 ? `${isoOrDate}T00:00:00` : isoOrDate);
  if (Number.isNaN(date.getTime())) return isoOrDate;
  return `${SHORT_DAYS[date.getDay()]}, ${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${SHORT_DAYS[date.getDay()]}, ${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} · ${h12}:${minutes} ${ampm}`;
}

export function formatTimeShort(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${SHORT_DAYS[date.getDay()]} · ${h12}:${minutes} ${ampm}`;
}

export function visitStatusMeta(status: VisitStatus): { label: string; tone: PillTone } {
  switch (status) {
    case 'REQUESTED':
      return { label: 'Requested', tone: 'requested' };
    case 'ASSIGNED':
      return { label: 'Assigned', tone: 'assigned' };
    case 'IN_PROGRESS':
      return { label: 'In progress', tone: 'in_progress' };
    case 'COMPLETED':
      return { label: 'Completed', tone: 'completed' };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'cancelled' };
  }
}

export function clinicStatusMeta(status: ClinicStatus): { label: string; tone: PillTone } {
  switch (status) {
    case 'APPROVED':
      return { label: 'Approved', tone: 'primary' };
    case 'PENDING':
      return { label: 'Pending review', tone: 'accent' };
    case 'SUSPENDED':
      return { label: 'Suspended', tone: 'alert' };
    case 'REJECTED':
      return { label: 'Rejected', tone: 'neutral' };
  }
}

export function buildLastVisitHeroSummary(report: VisitReportDto | undefined): string | null {
  if (!report) return null;
  const date = new Date(report.recordedAt);
  const day = Number.isNaN(date.getTime()) ? 'Recent' : SHORT_DAYS[date.getDay()];
  const parts: string[] = [];
  if (report.bpSystolic != null && report.bpDiastolic != null) {
    parts.push(`BP ${report.bpSystolic}/${report.bpDiastolic}`);
  }
  if (report.bloodSugarMgDl != null) {
    parts.push(`sugar ${report.bloodSugarMgDl}`);
  }
  if (parts.length === 0 && report.temperatureF != null) {
    parts.push(`temp ${report.temperatureF}°F`);
  }
  if (parts.length === 0) {
    return `Last visit ${day}: ${report.serviceLabel} completed`;
  }
  return `Last visit ${day}: ${parts.join(', ')}`;
}

export function reportDtoToSlipData(report: VisitReportDto): ReportSlipData {
  const readings: ReportSlipReading[] = [];
  if (report.bpSystolic != null && report.bpDiastolic != null) {
    readings.push({
      label: 'Blood Pressure',
      value: `${report.bpSystolic}/${report.bpDiastolic}`,
      unit: 'mmHg',
      context: 'Seated home reading',
    });
  }
  if (report.temperatureF != null) {
    readings.push({
      label: 'Temperature',
      value: String(report.temperatureF),
      unit: '°F',
      context: 'Digital thermometer',
    });
  }
  if (report.bloodSugarMgDl != null) {
    const ctxMap = {
      FASTING: 'Fasting',
      POST_MEAL: 'Post-meal',
      RANDOM: 'Random check',
    } as const;
    readings.push({
      label: 'Blood Sugar',
      value: String(report.bloodSugarMgDl),
      unit: 'mg/dL',
      context: report.bloodSugarContext ? ctxMap[report.bloodSugarContext] : undefined,
    });
  }
  if (readings.length === 0) {
    readings.push({
      label: 'Observation Check',
      value: 'Recorded',
      context: report.serviceLabel,
    });
  }

  return {
    slipId: `CB-${report.id.slice(0, 8).toUpperCase()}`,
    clinicName: report.clinicName,
    clinicLocality: `${report.clinicLocality}, Bhopal`,
    parentName: report.parentName,
    parentAge: report.parentAge,
    serviceLabel: report.serviceLabel,
    recordedAtLabel: formatDateTime(report.recordedAt),
    staffName: report.staffName,
    staffDesignation: report.staffDesignation,
    readings,
    notes: report.observationNotes,
    recommendation: report.recommendation,
  };
}

export function sortVisitsRecentFirst(visits: VisitDto[]): VisitDto[] {
  return [...visits].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
