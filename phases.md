# closeBy — Implementation Phases

This project is built in **4 incremental phases**. Each phase ends in a concrete, working, testable milestone suitable for incremental progress checks and final LNCTS Bhopal live demo evaluation.

---

## Phase 1: Foundation, Authentication & Clinic Governance

### Goal
Stand up the Spring Boot (Java 21) + PostgreSQL backend, Flyway database schema, JWT auth, Platform Admin clinic governance, Clinic Admin profile & verified staff management, and the Expo (Mobile + Web) app shell.

### Backend Deliverables — ✅ Complete (`mvn test`: 5 tests, 0 failures)
- [x] Initialize Spring Boot (Java 21) project with PostgreSQL, Flyway, Spring Security, JWT, and Bean Validation.
- [x] Create initial Flyway migration (`V1__init.sql`) covering `users`, `clinics`, `clinic_staff_profiles`, `parents`, `visits`, `visit_reports`, and `report_access_logs`.
- [x] Implement `/api/v1/auth/register/family`, `/api/v1/auth/register/clinic`, `/api/v1/auth/login`, and `/api/v1/auth/me`.
- [x] Implement Platform Admin endpoints: list clinics by status, `approve`, `reject`, `suspend`, plus `/api/v1/admin/analytics`.
- [x] Implement Clinic Admin endpoints: view/update own clinic profile, add/list/toggle verified clinic staff (`"Verified by <Clinic>"`), blocked if clinic is not `APPROVED`.
- [x] Add Swagger/OpenAPI docs (`/swagger-ui.html`, `/v3/api-docs`) and integration tests for auth, RBAC, and cross-clinic staff isolation.

### Frontend Deliverables (Expo + Expo Web)
- Initialize Expo (TypeScript) project configured for mobile and **Expo Web**.
- Build typed API client, JWT auth context (cross-platform storage), and role-based route guards.
- Build Auth screens: Login, Family Register, Clinic Register.
- Build **Platform Admin (Expo Web)** dashboard: clinic list with status filter tabs and Approve / Reject / Suspend actions.
- Build **Clinic Admin (Expo Web)** screens: clinic status banner (pending/approved/suspended), profile editor, and staff management list displaying **`Verified by <Clinic>`**.

### Testable Milestone (Exit Criteria)
- A clinic registers via UI -> appears as `PENDING` on Platform Admin Expo Web -> Platform Admin approves it -> Clinic Admin logs in and adds a staff member who displays `"Verified by <Clinic>"`.
- Automated backend tests pass (`mvn test`) confirming `FAMILY` or `CLINIC_ADMIN` cannot access `/api/v1/admin/**`, and Clinic A cannot see Clinic B's staff.
- Frontend TypeScript check passes (`npx tsc --noEmit`) and Expo Web renders cleanly.

---

## Phase 2: Family Flow, Parent Consent & Visit Lifecycle

### Goal
Deliver the complete visit booking and execution lifecycle across Family, Clinic Admin, and Clinic Staff with timestamped parent consent and strict data isolation.

### Backend Deliverables — ✅ Complete (`mvn test`: 5 tests, 0 failures)
- [x] Implement Parent CRUD (`/api/v1/parents`) enforcing `consentConfirmed == true` and persisting server-generated `consentConfirmedAt`.
- [x] Implement Approved Bhopal Clinics directory (`GET /api/v1/clinics`) excluding `PENDING`, `REJECTED`, and `SUSPENDED` clinics.
- [x] Implement Visit endpoints with strict service-layer isolation and server-side state machine:
  - Family creates visit (`REQUESTED`) with fixed 4-service enum (`HOME_VITALS_CHECK`, `SAMPLE_COLLECTION`, `FOLLOW_UP_VISIT`, `MEDICINE_ADHERENCE_CHECK`), date, preferred time, address, and instructions.
  - Clinic Admin views own clinic's incoming requests and assigns an active staff member from own clinic (`REQUESTED -> ASSIGNED`).
  - Clinic Staff views only visits assigned to them and starts visit (`ASSIGNED -> IN_PROGRESS`).
  - Family or Clinic Admin cancels visit from `REQUESTED` or `ASSIGNED` (`-> CANCELLED`).
- [x] Add comprehensive integration tests for parent consent validation, illegal status transitions, family data isolation, and clinic data isolation (HTTP + service layer).

### Frontend Deliverables
- **Family screens:** Parent list & Add Parent form (with explicit consent checkbox and visible saved consent timestamp), Approved Bhopal Clinics picker, Request Visit form (fixed 4 services), Visit list & Visit Detail progress tracker, Cancel Visit action.
- **Clinic Admin (Expo Web):** Incoming visit requests queue, status filter tabs, Assign Verified Staff modal/drawer, Cancel option.
- **Clinic Staff:** My Assigned Visits list, Visit Detail with parent address/instructions, Start Visit action (`In progress`).

### Testable Milestone (Exit Criteria)
- Family registers a parent (rejected without consent; succeeds with saved timestamp), books a visit with an approved Bhopal clinic, Clinic Admin assigns a verified staff member, and Staff starts the visit—status updates visibly across all 3 roles.
- Attempting to book with a `SUSPENDED` clinic or cancel an `IN_PROGRESS` visit is rejected cleanly.
- Automated tests verify Family A cannot view Family B's parent or visits, and Clinic B cannot view or assign Clinic A's visits.

---

## Phase 3: Observation Reports, Access Audit & Safety Baseline

### Goal
Complete the visit report workflow (observations only), append-only report access logging, and enforce the full safety and security baseline across all screens.

### Backend Deliverables — ✅ Complete (`mvn test`: 5 tests, 0 failures)
- [x] Implement `POST /api/v1/visits/{visitId}/complete`: atomically validates assigned staff + `IN_PROGRESS` status, persists `visit_reports` (BP, temperature, blood sugar + context, observation notes, `NONE`/`FOLLOW_UP_VISIT`/`DOCTOR_CONSULT` recommendation), and transitions visit to `COMPLETED`.
- [x] Implement `GET /api/v1/visits/{visitId}/report` with strict ownership/clinic scoping and **automatic append** to `report_access_logs` (`report_id`, `viewer_user_id`, `viewer_role`, `viewed_at`).
- [x] Implement `GET /api/v1/reports` (Clinic Admin's own reports), `GET /api/v1/parents/{parentId}/reports` (family parent trend reports), `GET /api/v1/reports/{reportId}/access-logs`, and `GET /api/v1/access-logs`.
- [x] Complete security integration test suite verifying report isolation, append-only access log increments on every read, and non-diagnostic schema constraints.

### Frontend Deliverables
- **Clinic Staff:** Complete Visit & Record Observations form (BP systolic/diastolic, temperature, blood sugar + context, factual notes, follow-up/doctor consult selector, observations-only reminder).
- **Family & Clinic Admin:** Structured Visit Report screen displaying date/time, staff member with `"Verified by <Clinic>"`, vitals observations, notes, next-step recommendation badge, non-diagnostic disclaimer, and **Report Access Log** timeline showing who viewed the report and when.
- **Safety UI Baseline:** Add visible **`"In an emergency, call 108 or 112"`** notice on all key screens (Family Home, Request Visit, Visit Detail, Visit Report, Staff Visit View).

### Testable Milestone (Exit Criteria)
- Assigned staff completes an `IN_PROGRESS` visit with observations -> visit becomes `COMPLETED` -> Family opens the report -> Report Access Log immediately records the Family user's name, role, and timestamp.
- Opening the report as Clinic Admin appends a second entry; a different clinic receives `403`/`404`.
- All key screens visibly display `"In an emergency, call 108 or 112"`, staff displays `"Verified by <Clinic>"`, and no diagnostic language exists anywhere in the app.

---

## Phase 4: Visual Design Polish, Bhopal Seed Data & Demo Readiness

### Goal
Apply the full visual design system from `design.md`, populate realistic Bhopal demo data, integrate the gated Demo Role Switcher, and rehearse the 5-minute LNCTS Bhopal faculty evaluation demo.

### Backend Deliverables — ✅ Complete (`mvn test`: 5 tests, 0 failures)
- [x] Build idempotent `BhopalDemoDataSeeder` (`demo` profile / `closeby.seed.enabled=true`) creating 5 fictional Bhopal clinics (3 Approved, 1 Pending, 1 Suspended), 6 verified staff, 6 families with 12 consented parents, 40 visits over the last 60 days across all 5 statuses with realistic vitals reports, and initial report access logs.
- [x] Configure CORS, environment-based secrets (`.env.example`), HTTPS reverse-proxy headers (`server.forward-headers-strategy`), Swagger/OpenAPI docs, and clean Flyway startup.

### Frontend Deliverables
- Apply full visual polish from `design.md` (color system, typography, spacing, empty/loading/error states, responsive Expo Web tables/dashboards for Platform Admin & Clinic Admin, memorable mobile polish for Family & Staff).
- Build the gated **Demo Role Switcher** (`EXPO_PUBLIC_DEMO_MODE=true`) allowing instant switching between seeded Platform Admin, Clinic Admin (Narmada & Bhojpal), Clinic Staff, and Family accounts via real `/api/v1/auth/login`.
- Polish report presentation and status timeline so the live demo looks cohesive and memorable on a projector.

### Testable Milestone (Exit Criteria)
- Clean boot with `--spring.profiles.active=demo` seeds all Bhopal data idempotently (restarting does not duplicate rows).
- Full **5-minute demo script** (from `PRD.md` Section 10.3) runs end-to-end without manual DB tweaks or console errors: clinic approval -> parent consent & booking -> staff assignment -> observation report completion -> access log check -> cross-clinic isolation check.
- All backend tests (`mvn test`) and frontend checks (`npx tsc --noEmit`) pass green.
