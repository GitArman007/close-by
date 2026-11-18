/**
 * closeBy Editorial Microcopy
 * Real, calm, reassuring copy for every empty, loading, error, and safety state.
 * Hard ban: no generic placeholders, no "Welcome back", no emoji.
 */

export const safetyCopy = {
  emergencyNotice: 'In an emergency, call 108 or 112',
  emergencyDetail: 'closeBy arranges planned home visits only. For urgent symptoms, call 108 or 112 immediately.',
  observationsDisclaimer:
    'Observations only. This slip records measurements taken during a home visit and is not a medical diagnosis or prescription.',
  verifiedPrefix: 'Verified by',
} as const;

export const emptyStates = {
  noParents: {
    title: 'Add your parent’s details',
    body: 'Your parent does not need this app. Once you record their Bhopal address and confirm their consent, you can arrange home visits from anywhere.',
    actionLabel: 'Add parent profile',
  },
  noVisits: {
    title: 'No home visits recorded yet',
    body: 'When you book a vitals check, sample collection, or follow-up through an approved Bhopal clinic, each visit and report will stay organized here.',
    actionLabel: 'Request a home visit',
  },
  clinicQueueEmpty: {
    title: 'No incoming visit requests',
    body: 'New home visit requests from families in Bhopal will appear here as soon as they are booked.',
  },
  staffNoAssignments: {
    title: 'No visits assigned right now',
    body: 'When your clinic assigns a home visit to you, the parent’s address, time window, and instructions will show up here.',
  },
  adminNoPendingClinics: {
    title: 'All clinic applications reviewed',
    body: 'There are no Bhopal clinics waiting for approval right now. You can still review approved or suspended clinics from the tabs above.',
  },
  accessLogFirstView: {
    title: 'No previous views recorded',
    body: 'Every time you or the clinic opens this observation slip, the viewer and timestamp are logged here automatically.',
  },
} as const;

export const loadingStates = {
  diary: {
    title: 'Opening your care diary',
    body: 'Fetching the latest visit status and verified clinic observations.',
  },
  reportSlip: {
    title: 'Preparing the visit slip',
    body: 'Loading recorded readings and logging this view in the access record.',
  },
  clinicQueue: {
    title: 'Checking Bhopal visit requests',
    body: 'Loading today’s scheduled visits and assigned staff.',
  },
} as const;

export const errorStates = {
  network: {
    title: 'Could not reach closeBy right now',
    body: 'Your connection looks interrupted. Check your internet and try again—no visit details were lost.',
    actionLabel: 'Try again',
  },
  unauthorized: {
    title: 'This record is not available to your account',
    body: 'For family and clinic privacy, closeBy only opens records linked directly to your account.',
  },
  pdfExport: {
    title: 'Could not prepare the PDF slip',
    body: 'Please try exporting again. All recorded observations remain safely saved on this screen.',
    actionLabel: 'Retry PDF export',
  },
} as const;
