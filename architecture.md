# closeBy — System Architecture

## 1. High-Level Architecture

**closeBy** follows a clean **two-tier client–API architecture** backed by a relational PostgreSQL database:

```text
┌──────────────────────────────────────────────────────────┐
│           Frontend: React Native (Expo, TypeScript)      │
│   ┌───────────────────────┐   ┌───────────────────────┐  │
│   │  Mobile (iOS/Android) │   │       Expo Web        │  │
│   │  Family & Clinic Staff│   │ Platform & Clinic Adm │  │
│   └───────────┬───────────┘   └───────────┬───────────┘  │
└───────────────┼───────────────────────────┼──────────────┘
                │       HTTPS / JSON + JWT  │
                ▼                           ▼
┌──────────────────────────────────────────────────────────┐
│      Backend: Spring Boot 3.x (Java 21) Modular REST     │
│  ┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌─────────┐  │
│  │  Auth  │ │ Clinic │ │ Staff │ │ Parent │ │  Visit  │  │
│  └───┬────┘ └───┬────┘ └───┬───┘ └───┬────┘ └────┬────┘  │
│      │          │          │         │           │       │
│  ┌───┴──────────┴──────────┴─────────┴───────────┴────┐  │
│  │  Spring Security (JWT + RBAC + Tenant Guards)      │  │
│  │  Report Service + Append-Only Report Access Audit  │  │
│  └─────────────────────────┬──────────────────────────┘  │
└────────────────────────────┼─────────────────────────────┘
                             │ JDBC / JPA + Flyway
                             ▼
┌──────────────────────────────────────────────────────────┐
│                 Database: PostgreSQL 16                  │
│  users | clinics | clinic_staff | parents | visits |     │
│  visit_reports | report_access_logs                      │
└──────────────────────────────────────────────────────────┘
```

### Architectural Style
- **Modular Monolith** on the backend (package-by-feature inside a single Spring Boot service): easy to run locally for a college live demo, clean separation of concerns, zero distributed-systems overhead.
- **Single Expo Codebase** on the frontend with responsive layouts so Platform Admin and Clinic Admin screens work seamlessly on **Expo Web** while Family and Clinic Staff work smoothly on both mobile and web.

---

## 2. Backend Modules

All Spring Boot code is organized by domain feature under `com.closeby`:

| Module (`com.closeby.*`) | Responsibility |
| :--- | :--- |
| `auth` | Registration, login, BCrypt password hashing, JWT issuance & verification, current-user context (`AuthPrincipal` containing `userId`, `role`, `clinicId`). |
| `clinic` | Clinic registration (`PENDING`), clinic profile updates, Platform Admin approval/rejection/suspension, public listing of `APPROVED` Bhopal clinics for families. |
| `staff` | Clinic Admin CRUD for clinic staff; links each staff user account to a `clinic_id` and generates the `"Verified by <Clinic Name>"` display attribution. |
| `parent` | Family CRUD for parent profiles; enforces mandatory consent confirmation with server-generated UTC timestamp (`consent_confirmed_at`). |
| `visit` | Visit booking (validating fixed service enum, approved clinic, owned parent), clinic queue, staff assignment, and strict status state machine (`REQUESTED` -> `ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED` / `CANCELLED`). |
| `report` | Observation-only visit report creation (atomic with visit completion) and report retrieval. |
| `audit` | Append-only `report_access_logs` service triggered on every report read, plus scoped query endpoints for viewing audit history. |
| `seed` | `@Profile("demo")` idempotent data seeder creating realistic Bhopal clinics, staff, families, parents, visits across all 5 states, reports, and sample access logs. |
| `common` | Global exception handler (`@RestControllerAdvice`), standardized API error DTO, base entity timestamps, health check. |

---

## 3. Data Model (PostgreSQL)

Managed via **Flyway** SQL migrations (`src/main/resources/db/migration/`). All primary keys use `UUID`. All timestamps use `TIMESTAMPTZ` (UTC).

### 3.1 `users`
Stores authentication credentials and role for all 4 user types.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `full_name` | `VARCHAR(120)` | `NOT NULL` | |
| `email` | `VARCHAR(180)` | `UNIQUE, NOT NULL` | Login identifier |
| `phone` | `VARCHAR(20)` | `NOT NULL` | Indian phone format |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | BCrypt hash |
| `role` | `VARCHAR(30)` | `NOT NULL` | `PLATFORM_ADMIN`, `CLINIC_ADMIN`, `CLINIC_STAFF`, `FAMILY` |
| `clinic_id` | `UUID` | `FK -> clinics.id, NULL` | Required for `CLINIC_ADMIN` & `CLINIC_STAFF`; `NULL` for others |
| `active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Soft deactivation |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | |

### 3.2 `clinics`
Represents Bhopal clinics onboarded to the platform.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `name` | `VARCHAR(150)` | `NOT NULL` | Used in `"Verified by <Clinic>"` |
| `registration_number` | `VARCHAR(80)` | `UNIQUE, NOT NULL` | Local clinic registration ref |
| `locality` | `VARCHAR(100)` | `NOT NULL` | Bhopal neighborhood (e.g., Arera Colony, MP Nagar) |
| `address` | `TEXT` | `NOT NULL` | Full Bhopal street address |
| `city` | `VARCHAR(50)` | `NOT NULL DEFAULT 'Bhopal'` | Fixed to Bhopal |
| `phone` | `VARCHAR(20)` | `NOT NULL` | Clinic desk phone |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'PENDING'` | `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED` |
| `status_reason` | `TEXT` | `NULL` | Optional reason for rejection/suspension |
| `reviewed_by` | `UUID` | `FK -> users.id, NULL` | Platform Admin who acted |
| `reviewed_at` | `TIMESTAMPTZ` | `NULL` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | |

### 3.3 `clinic_staff_profiles`
Extends a `CLINIC_STAFF` user with clinical role/designation and verification metadata.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `user_id` | `UUID` | `UNIQUE, FK -> users.id, NOT NULL` | Links to staff login |
| `clinic_id` | `UUID` | `FK -> clinics.id, NOT NULL` | Denormalized for fast tenant scoping |
| `designation` | `VARCHAR(80)` | `NOT NULL` | e.g., Registered Nurse, Lab Technician, Health Assistant |
| `verified_by_clinic` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Displayed as `"Verified by <Clinic>"` |
| `verified_at` | `TIMESTAMPTZ` | `NOT NULL` | Set on staff creation by Clinic Admin |
| `active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | |

### 3.4 `parents`
Parent profiles managed by a `FAMILY` user. Parents do not have login accounts.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `family_user_id` | `UUID` | `FK -> users.id, NOT NULL` | Owner family member |
| `full_name` | `VARCHAR(120)` | `NOT NULL` | |
| `age` | `INT` | `NOT NULL CHECK (age > 0 AND age < 130)` | |
| `gender` | `VARCHAR(20)` | `NOT NULL` | |
| `phone` | `VARCHAR(20)` | `NULL` | Optional landline/mobile for doorstep arrival |
| `locality` | `VARCHAR(100)` | `NOT NULL` | Bhopal locality |
| `address` | `TEXT` | `NOT NULL` | Default home visit address |
| `notes` | `TEXT` | `NULL` | Mobility/doorbell/general care notes |
| `consent_confirmed` | `BOOLEAN` | `NOT NULL CHECK (consent_confirmed = TRUE)` | Must be true to save |
| `consent_confirmed_at` | `TIMESTAMPTZ` | `NOT NULL` | Server-generated UTC timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | |

### 3.5 `visits`
Tracks every home health visit request through its lifecycle.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `family_user_id` | `UUID` | `FK -> users.id, NOT NULL` | Requesting family |
| `parent_id` | `UUID` | `FK -> parents.id, NOT NULL` | Must belong to `family_user_id` |
| `clinic_id` | `UUID` | `FK -> clinics.id, NOT NULL` | Must be `APPROVED` at booking time |
| `assigned_staff_id` | `UUID` | `FK -> users.id, NULL` | `CLINIC_STAFF` belonging to `clinic_id` |
| `service_type` | `VARCHAR(40)` | `NOT NULL` | `HOME_VITALS_CHECK`, `SAMPLE_COLLECTION`, `FOLLOW_UP_VISIT`, `MEDICINE_ADHERENCE_CHECK` |
| `scheduled_date` | `DATE` | `NOT NULL` | |
| `preferred_time` | `VARCHAR(40)` | `NOT NULL` | e.g., `09:00 AM - 11:00 AM` |
| `visit_address` | `TEXT` | `NOT NULL` | Snapshot of address for this visit |
| `instructions` | `TEXT` | `NULL` | Special instructions from family |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'REQUESTED'` | `REQUESTED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `cancellation_reason` | `TEXT` | `NULL` | Populated if `CANCELLED` |
| `started_at` | `TIMESTAMPTZ` | `NULL` | Set when moved to `IN_PROGRESS` |
| `completed_at` | `TIMESTAMPTZ` | `NULL` | Set when moved to `COMPLETED` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | |

### 3.6 `visit_reports`
One-to-one observation-only report attached to a `COMPLETED` visit.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `visit_id` | `UUID` | `UNIQUE, FK -> visits.id, NOT NULL` | 1:1 with visit |
| `clinic_id` | `UUID` | `FK -> clinics.id, NOT NULL` | Enforces clinic isolation |
| `recorded_by_staff_id` | `UUID` | `FK -> users.id, NOT NULL` | Assigned staff member |
| `bp_systolic` | `INT` | `NULL` | mmHg (e.g., 126) |
| `bp_diastolic` | `INT` | `NULL` | mmHg (e.g., 80) |
| `temperature_f` | `NUMERIC(4,1)` | `NULL` | °F (e.g., 98.4) |
| `blood_sugar_mg_dl` | `INT` | `NULL` | mg/dL (e.g., 112) |
| `blood_sugar_context` | `VARCHAR(30)` | `NULL` | `FASTING`, `POST_MEAL`, `RANDOM` |
| `observation_notes` | `TEXT` | `NOT NULL` | Factual observations only |
| `recommendation` | `VARCHAR(30)` | `NOT NULL DEFAULT 'NONE'` | `NONE`, `FOLLOW_UP_VISIT`, `DOCTOR_CONSULT` |
| `recorded_at` | `TIMESTAMPTZ` | `NOT NULL` | Server timestamp when submitted |

### 3.7 `report_access_logs`
Append-only audit trail recording every report view.

| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `report_id` | `UUID` | `FK -> visit_reports.id, NOT NULL` | Report viewed |
| `visit_id` | `UUID` | `FK -> visits.id, NOT NULL` | Convenience reference |
| `clinic_id` | `UUID` | `FK -> clinics.id, NOT NULL` | Scopes audit visibility to clinic |
| `viewer_user_id` | `UUID` | `FK -> users.id, NOT NULL` | Authenticated user who read report |
| `viewer_role` | `VARCHAR(30)` | `NOT NULL` | Role at time of access |
| `viewed_at` | `TIMESTAMPTZ` | `NOT NULL` | Server UTC timestamp |

### Recommended Indexes
- `idx_users_clinic_id` on `users(clinic_id)`
- `idx_parents_family_user_id` on `parents(family_user_id)`
- `idx_visits_clinic_status` on `visits(clinic_id, status)`
- `idx_visits_family_created` on `visits(family_user_id, created_at DESC)`
- `idx_visits_staff_status` on `visits(assigned_staff_id, status)`
- `idx_report_access_logs_report_viewed` on `report_access_logs(report_id, viewed_at DESC)`

---

## 4. REST API Specification

Base prefix: `/api/v1`. All protected endpoints require `Authorization: Bearer <jwt>`.

### 4.1 Auth & Current User
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register/family` | Public | Register a new `FAMILY` user. |
| `POST` | `/api/v1/auth/register/clinic` | Public | Register a new clinic (`PENDING`) + its primary `CLINIC_ADMIN` user. |
| `POST` | `/api/v1/auth/login` | Public | Authenticate with email/password; returns JWT + user/role/clinic summary. |
| `GET` | `/api/v1/auth/me` | Any authenticated | Returns authenticated user profile, role, and clinic details (if clinic user). |

### 4.2 Platform Admin — Clinic Governance
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/clinics` | `PLATFORM_ADMIN` | List all clinics (optional `?status=PENDING\|APPROVED\|REJECTED\|SUSPENDED`). |
| `PATCH` | `/api/v1/admin/clinics/{clinicId}/approve` | `PLATFORM_ADMIN` | Approve a pending or suspended clinic. |
| `PATCH` | `/api/v1/admin/clinics/{clinicId}/reject` | `PLATFORM_ADMIN` | Reject a pending clinic (optional reason). |
| `PATCH` | `/api/v1/admin/clinics/{clinicId}/suspend` | `PLATFORM_ADMIN` | Suspend an approved clinic (optional reason). |

### 4.3 Clinics & Staff
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/clinics` | `FAMILY`, `PLATFORM_ADMIN` | List `APPROVED` Bhopal clinics (for family booking directory). |
| `GET` | `/api/v1/clinic/profile` | `CLINIC_ADMIN`, `CLINIC_STAFF` | Get own clinic profile (derived strictly from JWT `clinicId`). |
| `PUT` | `/api/v1/clinic/profile` | `CLINIC_ADMIN` | Update own clinic profile (address, locality, phone). |
| `GET` | `/api/v1/clinic/staff` | `CLINIC_ADMIN` | List staff belonging to own clinic (includes `"Verified by <Clinic>"` badge text). |
| `POST` | `/api/v1/clinic/staff` | `CLINIC_ADMIN` | Create a verified `CLINIC_STAFF` account under own clinic (only when clinic is `APPROVED`). |
| `PATCH` | `/api/v1/clinic/staff/{staffId}/status` | `CLINIC_ADMIN` | Activate or deactivate a staff member belonging to own clinic. |

### 4.4 Parents (Family)
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/parents` | `FAMILY` | List own parent profiles. |
| `POST` | `/api/v1/parents` | `FAMILY` | Add a parent profile. Rejects with `400` if `consentConfirmed != true`; server saves `consentConfirmedAt`. |
| `PUT` | `/api/v1/parents/{parentId}` | `FAMILY` | Update own parent profile (cannot clear consent timestamp). |

### 4.5 Visits (Lifecycle)
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/visits` | `FAMILY` | Request a visit (service from fixed enum, approved clinic, owned parent). Creates `REQUESTED`. |
| `GET` | `/api/v1/visits` | `FAMILY`, `CLINIC_ADMIN`, `CLINIC_STAFF` | Scoped list: Family sees own visits; Clinic Admin sees own clinic's visits; Clinic Staff sees visits assigned to self. Optional `?status=...`. |
| `GET` | `/api/v1/visits/{visitId}` | `FAMILY`, `CLINIC_ADMIN`, `CLINIC_STAFF` | Visit details (strict ownership/clinic/assignment check). |
| `PATCH` | `/api/v1/visits/{visitId}/assign` | `CLINIC_ADMIN` | Assign an active staff member from own clinic (`REQUESTED` -> `ASSIGNED`). |
| `PATCH` | `/api/v1/visits/{visitId}/start` | `CLINIC_STAFF` | Assigned staff starts visit (`ASSIGNED` -> `IN_PROGRESS`). |
| `POST` | `/api/v1/visits/{visitId}/complete` | `CLINIC_STAFF` | Assigned staff submits observation report and atomically marks visit `COMPLETED` (`IN_PROGRESS` -> `COMPLETED`). |
| `PATCH` | `/api/v1/visits/{visitId}/cancel` | `FAMILY`, `CLINIC_ADMIN` | Cancel visit from `REQUESTED` or `ASSIGNED` with optional reason. |

### 4.6 Visit Reports & Access Log
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/visits/{visitId}/report` | `FAMILY`, `CLINIC_ADMIN`, `CLINIC_STAFF` | Fetch observation report (strictly scoped) **and append a row to `report_access_logs`**. |
| `GET` | `/api/v1/reports` | `CLINIC_ADMIN` | List completed reports for own clinic only. |
| `GET` | `/api/v1/reports/{reportId}/access-logs` | `FAMILY`, `CLINIC_ADMIN` | View append-only access log for a report the caller owns (or belongs to caller's clinic). |

---

## 5. Security & Data Isolation Design

1. **Stateless JWT Filter:** Extracts `userId`, `role`, and `clinicId` from a signed HS256/RS256 token and populates `SecurityContextHolder`.
2. **Server-Side Tenant Derivation:** Endpoints **never** accept `clinicId` or `familyUserId` from request payloads to determine scope. All queries filter by `principal.getClinicId()` or `principal.getUserId()`.
3. **Cross-Tenant Defense:** Requesting a `visitId`, `parentId`, or `reportId` owned by another clinic or family returns `403 Forbidden` (or `404 Not Found` to avoid leaking ID existence).
4. **Method & Route Authorization:** `@PreAuthorize` annotations guard every controller endpoint by role, backed by service-level ownership verification.
5. **Audit Logging:** `ReportService.getReportForVisit(...)` calls `ReportAccessLogService.recordView(...)` inside the read flow so no authorized report view can skip logging.

---

## 6. Repository Folder Structure

```text
closeBy/
├── PRD.md
├── architecture.md
├── rules.md
├── phases.md
├── design.md
├── memory.md
├── backend/                              # Spring Boot (Java 21, Maven)
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/closeby/
│   │   │   │   ├── CloseByApplication.java
│   │   │   │   ├── common/               # Error handling, DTOs, config
│   │   │   │   ├── auth/                 # JWT, SecurityConfig, login/register
│   │   │   │   ├── clinic/               # Clinic entity, onboarding, admin actions
│   │   │   │   ├── staff/                # Verified staff management
│   │   │   │   ├── parent/               # Parent profiles + consent timestamp
│   │   │   │   ├── visit/                # Visit booking & state machine
│   │   │   │   ├── report/               # Observation-only reports
│   │   │   │   ├── audit/                # Report access logs
│   │   │   │   └── seed/                 # @Profile("demo") Bhopal seed data
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-demo.yml
│   │   │       └── db/migration/         # Flyway SQL migrations (V1__init.sql, ...)
│   │   └── test/
│   │       └── java/com/closeby/         # Unit, RBAC, isolation & lifecycle tests
└── mobile/                               # React Native (Expo, TypeScript, Web-enabled)
    ├── package.json
    ├── app.json
    ├── tsconfig.json
    ├── app/                              # Expo Router screens
    │   ├── _layout.tsx
    │   ├── (auth)/                       # Login, Family Register, Clinic Register
    │   ├── (admin)/                      # Platform Admin (Expo Web-optimized)
    │   ├── (clinic)/                     # Clinic Admin (Expo Web-optimized)
    │   ├── (staff)/                      # Clinic Staff visits & report form
    │   └── (family)/                     # Family home, parents, booking, reports
    └── src/
        ├── api/                          # Typed API client & endpoint modules
        ├── auth/                         # Auth context, token storage, Demo Role Switcher
        ├── components/                   # EmergencyBanner, VerifiedBadge, StatusPill, etc.
        ├── theme/                        # Design tokens (from design.md)
        └── types/                        # Shared TypeScript interfaces & enums
```
