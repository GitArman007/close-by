import { authApi, clinicApi, reportApi, staffApi, visitApi } from '@/api/endpoints';
import type { VisitDto, VisitStatus } from '@/types/api';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SimulationCallbacks {
  onStageChange: (status: VisitStatus, visit: VisitDto, note: string) => void;
  onRefreshNeeded: () => Promise<void>;
}

/**
 * Live presentation helper ("Simulate visit"):
 * Drives one real visit through Requested -> Assigned -> In progress -> Completed
 * using genuine JWT calls for Family, Clinic Admin (Lakeview), and Clinic Staff (Nurse Sunita)
 * without ever replacing the logged-in Family session or bypassing backend auth.
 */
export async function runLiveVisitSimulation(
  parentId: string,
  callbacks: SimulationCallbacks
): Promise<VisitDto> {
  const approvedClinics = await clinicApi.listApprovedClinics();
  const lakeview =
    approvedClinics.find((c) => c.name.toLowerCase().includes('lakeview')) ??
    approvedClinics[0];

  if (!lakeview) {
    throw new Error('No approved Bhopal clinic available for simulation.');
  }

  const today = new Date().toISOString().slice(0, 10);

  // Stage 1: Requested (using active Family session JWT)
  const created = await visitApi.createVisit({
    parentId,
    clinicId: lakeview.id,
    serviceType: 'HOME_VITALS_CHECK',
    scheduledDate: today,
    preferredTime: '09:30 AM - 11:00 AM',
    instructions: 'Live demo home vitals check — please record BP, temperature, and blood sugar.',
  });
  callbacks.onStageChange(
    'REQUESTED',
    created,
    'Visit requested remotely — waiting for Lakeview Homecare Clinic.'
  );
  await callbacks.onRefreshNeeded();
  await sleep(2200);

  // Stage 2: Assigned (real background Clinic Admin JWT)
  const clinicLogin = await authApi.login('clinic.lakeview@closeby.in', 'Demo@1234');
  const staffList = await staffApi.listOwnStaff(clinicLogin.accessToken);
  const sunita =
    staffList.find((s) => s.email === 'staff.sunita@closeby.in') ??
    staffList.find((s) => s.active);

  if (!sunita) {
    throw new Error('No active clinic staff found at Lakeview Homecare Clinic.');
  }

  const assigned = await visitApi.assignStaff(
    created.id,
    sunita.userId,
    clinicLogin.accessToken
  );
  callbacks.onStageChange(
    'ASSIGNED',
    assigned,
    `${sunita.fullName} (${sunita.verifiedBadge}) assigned to this visit.`
  );
  await callbacks.onRefreshNeeded();
  await sleep(2300);

  // Stage 3: In progress (real background Clinic Staff JWT)
  const staffLogin = await authApi.login(sunita.email, 'Demo@1234');
  const started = await visitApi.startVisit(created.id, staffLogin.accessToken);
  callbacks.onStageChange(
    'IN_PROGRESS',
    started,
    `${sunita.fullName} has arrived and is recording today’s readings.`
  );
  await callbacks.onRefreshNeeded();
  await sleep(2500);

  // Stage 4: Completed with realistic observation slip
  await reportApi.completeVisit(
    created.id,
    {
      bpSystolic: 124,
      bpDiastolic: 80,
      temperatureF: 98.4,
      bloodSugarMgDl: 102,
      bloodSugarContext: 'FASTING',
      observationNotes:
        'Live visit completed comfortably at home. Seated BP and fasting blood sugar recorded after 5 minutes of rest; morning medication schedule verified.',
      recommendation: 'NONE',
    },
    staffLogin.accessToken
  );

  const completedVisit = await visitApi.getVisit(created.id);
  callbacks.onStageChange(
    'COMPLETED',
    completedVisit,
    'Visit completed — observation slip is now ready to read and export as PDF.'
  );
  await callbacks.onRefreshNeeded();

  return completedVisit;
}
