# closeBy — Product Requirements Document (PRD)

## 1. Project Overview & Purpose

**closeBy** is a final-year major project at **LNCTS Bhopal** (Lakshmi Narain College of Technology & Science, Bhopal). It is a **college major project, demo-ready, evaluated live** by faculty, designed to be both technically solid and visually memorable.

### Problem Statement
Working adults and students frequently live away from their aging parents in Bhopal. When a parent needs routine home health monitoring—such as checking blood pressure, blood sugar, temperature, or medication adherence—families have no structured, trustworthy way to book a verified local clinic visit remotely, track whether the visit happened, and review structured observations afterwards. Meanwhile, many elderly parents are not comfortable using smartphones or mobile apps.

### Solution
**closeBy** is a remote parent-care coordination platform focused on Bhopal:
- **Families living away** register their parent's details (with confirmed consent), book a home health visit through an approved Bhopal clinic, track the visit status in real time, and read the structured observation report afterwards.
- **The parent does not need the app** (or even a smartphone). All digital coordination happens between the family, the clinic, and the platform.
- **Local clinics** manage their verified healthcare staff, accept incoming visit requests, assign staff, and submit observation-only visit reports.
- **Platform administration** vets and governs clinics (approve, reject, suspend) to maintain trust.

### Clinical Boundary (Non-Diagnostic Guarantee)
> **closeBy records observations only. It never diagnoses medical conditions and never provides medical advice or treatment plans.**

Every visit report strictly captures factual measurements, staff notes, and a simple flag indicating whether a follow-up visit or an in-person doctor consultation is recommended.

---

## 2. Target Platforms & Tech Stack

| Layer | Technology | Usage |
| :--- | :--- | :--- |
| **Backend API** | Spring Boot (Java 21), Spring Security, JWT | REST API, business rules, RBAC, data isolation, audit logging |
| **Database** | PostgreSQL | Relational storage for clinics, staff, parents, visits, reports, and access logs |
| **Mobile & Web Frontend** | React Native (Expo, TypeScript) | Mobile app for Family & Clinic Staff; **Expo Web** support for Platform Admin & Clinic Admin dashboards (and usable across all roles during live demo) |

---

## 3. User Roles & Capabilities

closeBy has **four distinct roles**, enforced via role-based access control (RBAC):

| Role | Code | Primary Interface | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `PLATFORM_ADMIN` | Expo Web | Review pending clinic registrations; **approve**, **reject**, or **suspend** clinics; view platform-wide clinic directory and status counts. |
| **Clinic Admin** | `CLINIC_ADMIN` | Expo Web | Register clinic (starts as `PENDING`); manage clinic profile; add/deactivate clinic staff (automatically carrying the `"Verified by <Clinic>"` badge); view incoming visit requests for own clinic; assign verified staff to requests; view completed visit reports and report access logs for own clinic. |
| **Clinic Staff** | `CLINIC_STAFF` | Expo Mobile / Web | View visits assigned specifically to them; start an assigned visit (`In progress`); record visit observations (vitals, notes, recommendation flag); complete the visit (`Completed`); view reports they authored. |
| **Family** | `FAMILY` | Expo Mobile / Web | Register account; add parent profile(s) with confirmed parent consent (saved with timestamp); browse approved Bhopal clinics; request a home visit; track visit lifecycle status; cancel an unstarted visit if needed; read completed visit reports. |

---

## 4. End-to-End Core Flow

1. **Clinic Registration:** A clinic submits its registration details (name, Bhopal locality/address, phone, registration info). Its initial status is `PENDING`.
2. **Admin Approval:** A Platform Admin reviews pending clinics and marks the clinic `APPROVED` (or `REJECTED`). Approved clinics can later be `SUSPENDED` if needed. Only `APPROVED` clinics appear to families and can accept bookings.
3. **Staff Verification:** The approved Clinic Admin adds staff members (e.g., nurses, lab technicians, health assistants). Every staff profile displays the trust mark **`Verified by <Clinic Name>`** across assignment and report views.
4. **Family Onboarding & Parent Consent:** A family member registers, adds their parent's details (name, age, Bhopal address, emergency contact, general care notes), and checks an explicit consent confirmation stating they have their parent's permission to arrange home visits and view reports. The backend saves this consent with an immutable UTC timestamp (`consent_confirmed_at`).
5. **Visit Request:** The family selects an approved Bhopal clinic and books a visit by specifying:
   - **Service** (from the fixed list of 4 services)
   - **Preferred date**
   - **Preferred time**
   - **Visit address** (defaults to parent's Bhopal address, editable per visit)
   - **Special instructions** (optional—e.g., gate instructions, best contact person)
   - Visit is created in status **`Requested`**.
6. **Staff Assignment:** The Clinic Admin sees the incoming `Requested` visit in their clinic queue and assigns one of their active, verified staff members. Status transitions to **`Assigned`**.
7. **Visit Execution & Observation Report:** The assigned Clinic Staff opens the visit, marks it **`In progress`** when starting, records the observation report (vitals, notes, follow-up/doctor consult recommendation), and submits to mark the visit **`Completed`**.
8. **Report Viewing & Access Audit:** The family receives visibility of the completed status and opens the visit report. Every time any authorized user views a report, the backend records an entry in the **Report Access Log** (who viewed which report and when).

---

## 5. Visit Lifecycle & Status Rules

Every visit moves through a strict state machine:

```text
Requested ──► Assigned ──► In progress ──► Completed
    │             │
    └──► Cancelled ◄┘
```

| Status | Code | Triggered By | Rules |
| :--- | :--- | :--- | :--- |
| **Requested** | `REQUESTED` | Family | Initial state on booking. Requires approved clinic and consented parent. |
| **Assigned** | `ASSIGNED` | Clinic Admin | Staff member must belong to the same clinic and be active. |
| **In progress** | `IN_PROGRESS` | Assigned Clinic Staff | Only the assigned staff member can start the visit. |
| **Completed** | `COMPLETED` | Assigned Clinic Staff | Requires submitting a valid observation report (atomic completion). Terminal state. |
| **Cancelled** | `CANCELLED` | Family or Clinic Admin | Allowed only from `Requested` or `Assigned` (not once `In progress` or `Completed`). Optional cancellation reason recorded. Terminal state. |

---

## 6. Fixed Service Catalog

Families choose from exactly **four** standardized home visit services:

1. **Home vitals check** (`HOME_VITALS_CHECK`) — Routine blood pressure, temperature, and blood sugar observation at home.
2. **Sample collection** (`SAMPLE_COLLECTION`) — Home collection of routine diagnostic samples by clinic staff.
3. **Follow-up visit** (`FOLLOW_UP_VISIT`) — Scheduled post-consultation or routine wellness check-in at home.
4. **Medicine adherence check** (`MEDICINE_ADHERENCE_CHECK`) — Reviewing whether the parent is taking prescribed medications on schedule and noting any practical difficulties.

---

## 7. Visit Report Specification

Each `Completed` visit has exactly one immutable Visit Report containing:
- **Visit Date & Time:** Actual completion timestamp (`recorded_at`) plus scheduled date/time.
- **Staff Member:** Name, role/designation, and **`Verified by <Clinic Name>`** badge.
- **Structured Observations:**
  - **Blood Pressure (BP):** Systolic / Diastolic mmHg (e.g., `128/82 mmHg`)
  - **Temperature:** °F (e.g., `98.4 °F`)
  - **Blood Sugar:** mg/dL with context (e.g., Fasting / Random / Post-meal, optional if not measured for that service)
- **Observation Notes:** Factual notes from the staff member (e.g., parent's general comfort, hydration, medication organizer check).
- **Next-Step Recommendation Flag:**
  - `NONE` — Routine observations recorded; no immediate follow-up flagged.
  - `FOLLOW_UP_VISIT` — Another routine home follow-up visit is recommended.
  - `DOCTOR_CONSULT` — An in-person/qualified doctor consultation is recommended.
- **Mandatory Disclaimer & Emergency Banner:**
  - *"Observations only. This report is not a medical diagnosis or prescription."*
  - *"In an emergency, call 108 or 112."*

---

## 8. Safety, Security & Privacy Baseline

| Requirement | Implementation Standard |
| :--- | :--- |
| **Clinic Data Isolation** | Every clinic sees **only** its own staff, incoming visit requests, assigned visits, reports, and report access logs. Cross-clinic access is blocked server-side using the authenticated user's `clinic_id`. |
| **Family Data Isolation** | Every family sees **only** their own parent profiles, visits, and reports. |
| **Role-Based Access Control (RBAC)** | Every REST endpoint explicitly authorizes allowed roles and resource ownership. |
| **Parent Consent Timestamp** | Adding a parent requires explicit consent confirmation; the server persists `consent_confirmed = true` and `consent_confirmed_at` (UTC timestamp). |
| **Authentication & Transport** | Passwords hashed with BCrypt; stateless JWT authentication; HTTPS enforced for deployed/demo hosting. |
| **Report Access Log** | Every `GET` request to read a visit report writes an append-only audit row (`report_id`, `viewer_user_id`, `viewer_role`, `viewed_at`). Viewable by the Clinic Admin (for their clinic's reports) and Family (for their parent's reports) to demonstrate transparency. |
| **Verified Staff Mark** | All staff displayed to families or admins carry the explicit `"Verified by <Clinic Name>"` badge derived from their clinic affiliation. |
| **Emergency Notice** | A clear, non-dismissible **`"In an emergency, call 108 or 112"`** notice appears on all key screens (Family Home, Request Visit, Visit Detail, Visit Report, Staff Visit View). |

---

## 9. Out of Scope

To keep the project focused, testable, and demo-ready for college evaluation, the following are explicitly **excluded**:
- Payments, billing, pricing tables, or invoicing
- Push notifications, SMS, WhatsApp, or email delivery
- File or image uploads (PDF lab reports, prescriptions, ID photos)
- Video or audio teleconsultations
- Cities outside Bhopal
- Hindi or multi-language localization (English only)
- App Store / Google Play Store submission or commercial deployment workflows

---

## 10. Demo Readiness (LNCTS Bhopal Live Evaluation)

Because **closeBy** is evaluated live by faculty, the project ships with built-in demo ergonomics that never compromise production security patterns.

### 10.1 Seeded Realistic Bhopal Data
An idempotent database seeder (`demo` Spring profile) pre-populates realistic, culturally grounded Bhopal data on startup:
- **Platform Admin:** `admin@closeby.in` (Platform Administrator)
- **Clinics (4 total across Bhopal):**
  1. **Narmada Care Clinic** (`APPROVED`) — E-4/45 Arera Colony, Bhopal
  2. **Bhojpal Health & Diagnostics** (`APPROVED`) — Zone-II, MP Nagar, Bhopal
  3. **Kolar Family Care Center** (`PENDING`) — Near Bima Kunj, Kolar Road, Bhopal *(ready to be approved live during the demo)*
  4. **Shahpura Wellness Point** (`SUSPENDED`) — Sector B, Shahpura, Bhopal *(demonstrates suspended clinic exclusion from family booking)*
- **Verified Clinic Staff (4 total):**
  - Nurse Sunita Verma & Lab Tech Rajesh Patidar — `Verified by Narmada Care Clinic`
  - Nurse Kavita Dubey & Health Assistant Amit Tiwari — `Verified by Bhojpal Health & Diagnostics`
- **Families & Parents (3 families, 4 parents across Bhopal localities):**
  - **Rohan Sharma** (living in Bengaluru) → Parent: **Smt. Meera Sharma** (68, Arera Colony, consent timestamped)
  - **Ananya Joshi** (living in Pune) → Parent: **Shri Arvind Joshi** (72, TT Nagar, consent timestamped)
  - **Vikram Saxena** (living in Mumbai) → Parent: **Smt. Rekha Saxena** (65, Habibganj / Rani Kamlapati area, consent timestamped)
- **Pre-Seeded Visits Across All 5 Lifecycle States:**
  - `Completed` visit for Smt. Meera Sharma (Home vitals check at Narmada Care Clinic) with a full observation report (BP `126/80`, Temp `98.4 °F`, Blood Sugar `112 mg/dL Fasting`, recommendation: `NONE`) and 2 existing entries in the Report Access Log.
  - `In progress` visit for Shri Arvind Joshi (Medicine adherence check at Bhojpal Health & Diagnostics).
  - `Assigned` visit for Smt. Rekha Saxena (Sample collection at Narmada Care Clinic).
  - `Requested` visit awaiting assignment at Narmada Care Clinic.
  - `Cancelled` visit demonstrating cancellation history.

### 10.2 Demo Role Switcher
- A subtle, clearly labeled **Demo Role Switcher** drawer/pill is available **only when `EXPO_PUBLIC_DEMO_MODE=true`** (disabled in non-demo builds).
- Allows the presenter to switch in one tap/click between pre-configured seeded accounts:
  1. `Platform Admin` (LNCTS Demo Admin)
  2. `Clinic Admin` (Narmada Care Clinic, Arera Colony)
  3. `Clinic Staff` (Nurse Sunita Verma — Verified by Narmada Care Clinic)
  4. `Family` (Rohan Sharma — parent in Arera Colony)
  5. `Second Clinic Admin` (Bhojpal Health & Diagnostics — optional button to prove clinic data isolation live)
- Under the hood, the switcher still authenticates against the real `/api/auth/login` JWT endpoint—no authentication bypass exists on the backend.

### 10.3 5-Minute Live Demo Script

| Time | Segment | Actor & Screen | What to Show Faculty |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:45** | **Problem & Governance** | **Platform Admin** (Expo Web) | Explain remote parent care in Bhopal (parent needs no app). Show the clinic directory with Approved, Pending, and Suspended clinics. **Approve `Kolar Family Care Center` live** and show it move from Pending to Approved. |
| **0:45 – 1:45** | **Family Onboarding & Booking** | **Family** — Rohan Sharma (Mobile / Web) | Show the **108 / 112 emergency banner**. Open parent profile for Smt. Meera Sharma, highlighting the **saved parent consent timestamp**. Book a new **Home vitals check** with **Narmada Care Clinic** (Arera Colony), choosing date, preferred time, and instructions. Confirm it lands in **`Requested`** status. |
| **1:45 – 2:35** | **Clinic Queue & Staff Assignment** | **Clinic Admin** — Narmada Care Clinic (Expo Web) | Switch via Demo Switcher. Show the newly requested visit in the clinic's incoming queue. Point out that staff carry the **`Verified by Narmada Care Clinic`** mark. Assign **Nurse Sunita Verma** → status becomes **`Assigned`**. |
| **2:35 – 3:40** | **Home Visit & Observation Report** | **Clinic Staff** — Nurse Sunita Verma (Mobile / Web) | Switch to Nurse Sunita. Open the assigned visit, tap **Start Visit** (`In progress`), enter observations (BP `132/84`, Temp `98.6 °F`, Blood Sugar `118 mg/dL`, factual note, recommendation: `FOLLOW_UP_VISIT`), and tap **Complete Visit** (`Completed`). Emphasize the **observations-only / no diagnosis** boundary. |
| **3:40 – 4:30** | **Family Report & Access Audit** | **Family** → **Clinic Admin** | Switch back to Rohan Sharma. Open the newly completed report (showing `Verified by Narmada Care Clinic`, vitals, recommendation, and 108/112 notice). Switch to Clinic Admin (or open Access Log view) to show the **newly recorded Report Access Log entry** with Rohan's identity and exact timestamp. |
| **4:30 – 5:00** | **Security & Isolation Proof** | **Clinic Admin (Bhojpal)** + Architecture Wrap-up | Switch to **Bhojpal Health & Diagnostics** and confirm Narmada Care Clinic's visits and reports are completely invisible (strict tenant isolation). Summarize Java 21 + Spring Boot + PostgreSQL + JWT + Expo stack and open for Q&A. |
