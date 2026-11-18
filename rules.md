# closeBy — Engineering, Security & AI Rules

These rules govern every commit, pull request, and AI-assisted edit in the **closeBy** repository.

---

## 1. Coding Conventions

### Backend (Spring Boot / Java 21)
- **Java 21 Idioms:** Use Java `record`s for all request/response DTOs. Use enums for fixed domains (`UserRole`, `ClinicStatus`, `ServiceType`, `VisitStatus`, `RecommendationType`, `BloodSugarContext`).
- **Layering:** Strict `Controller -> Service -> Repository` separation. Controllers handle HTTP mapping, `@Valid` validation, and `@PreAuthorize` checks only—never place business logic or repository calls in controllers.
- **Dependency Injection:** Constructor injection only (`private final` fields). No field `@Autowired`.
- **Database Migrations:** All schema changes MUST go through versioned **Flyway** migrations (`V1__...sql`, `V2__...sql`). Never use `ddl-auto: update` in production or demo profiles (`validate` only).
- **Error Handling:** Centralize exception mapping in `GlobalExceptionHandler` (`@RestControllerAdvice`) returning a consistent JSON shape (`timestamp`, `status`, `error`, `message`, `fieldErrors`). Never leak stack traces or SQL errors in API responses.
- **Timestamps:** Store and return all timestamps in UTC (`Instant` / `OffsetDateTime` serialized as ISO-8601).

### Frontend (React Native / Expo / TypeScript)
- **Strict TypeScript:** `"strict": true` in `tsconfig.json`. No `any` types for API payloads or navigation params; mirror backend DTOs in `src/types/`.
- **Expo Web Compatibility:** All **Platform Admin** and **Clinic Admin** screens must render cleanly on desktop web viewports (`>= 1024px`) as well as smaller screens. Avoid mobile-only native modules without web fallbacks (e.g., use platform-safe storage wrapper for JWT tokens across SecureStore/web storage).
- **Centralized API Layer:** All HTTP requests go through `src/api/client.ts` (automatically attaching the JWT Bearer header and handling `401` session expiration). Never scatter raw `fetch` URLs inside screen components.
- **Design System Discipline:** Once `design.md` is finalized, pull all colors, spacing, radii, and typography from `src/theme/` rather than hardcoding hex values inside screens.

---

## 2. Security & Clinical Safety Rules (Non-Negotiable)

1. **Strict Tenant & Ownership Isolation:**
   - **Never** trust `clinicId`, `familyUserId`, or `staffId` from the client to decide access scope. Always derive the caller's identity and `clinicId` from the verified JWT principal.
   - Clinic queries must always scope by `clinicId = principal.clinicId`.
   - Family queries must always scope by `familyUserId = principal.userId`.
   - Staff visit mutations (`start`, `complete`) must verify `visit.assignedStaffId == principal.userId`.
2. **RBAC Everywhere:** Every endpoint except `/api/v1/auth/**` and `/actuator/health` must require authentication and explicit role authorization. Deny by default.
3. **Credential Hygiene:**
   - Hash passwords with BCrypt (strength `>= 10`).
   - Never log passwords, JWTs, or `password_hash` fields.
   - Never serialize `passwordHash` in any DTO.
   - Keep JWT secrets and database credentials in environment variables (never committed to git; provide `.env.example` with dummy placeholders only).
4. **HTTPS Baseline:** Deployed environments must serve the API and web client over HTTPS; configure CORS explicitly for allowed Expo/web origins rather than wildcard credentials.
5. **Immutable Parent Consent Timestamp:**
   - Creating a parent fails (`400 Bad Request`) unless `consentConfirmed == true`.
   - `consentConfirmedAt` is set by the server (`Instant.now()`), never accepted from the client, and cannot be cleared on update.
6. **Mandatory Report Access Audit:**
   - Every successful read of `GET /api/v1/visits/{visitId}/report` MUST insert a row into `report_access_logs` (`report_id`, `viewer_user_id`, `viewer_role`, `viewed_at`).
   - `report_access_logs` is append-only (no `UPDATE` or `DELETE` endpoints).
7. **Observations-Only Clinical Boundary:**
   - Never add diagnosis fields, disease labels, severity scoring, prescriptions, or automated medical advice anywhere in the schema, API, or UI.
   - Always render the observations-only disclaimer on the visit report screen.
8. **Mandatory Emergency Notice:**
   - Display **`"In an emergency, call 108 or 112"`** visibly on key screens: Family Home, Request Visit, Visit Detail, Visit Report, and Clinic Staff Visit View.
9. **Verified Staff Attribution:**
   - Always display **`"Verified by <Clinic Name>"`** alongside staff names in clinic staff lists, assigned visit cards, and visit reports.
10. **Demo Role Switcher Guard:**
    - The Demo Role Switcher UI must be gated behind `EXPO_PUBLIC_DEMO_MODE=true`.
    - It must authenticate via the real `/api/v1/auth/login` endpoint—never introduce a backend auth-bypass endpoint.

---

## 3. Testing & Quality Rules

- Every phase must include automated tests covering:
  - **RBAC negative tests** (wrong role receives `403`).
  - **Isolation tests** (Clinic A cannot read/mutate Clinic B's staff, visits, or reports; Family A cannot read Family B's parents, visits, or reports).
  - **Lifecycle transition tests** (invalid transitions such as `REQUESTED -> COMPLETED` or `COMPLETED -> CANCELLED` are rejected with `400`/`409`).
  - **Audit log verification** (reading a report increments `report_access_logs`).
  - **Consent validation** (adding a parent without `consentConfirmed = true` returns `400`).
- Verify `mvn test` (backend) and `npx tsc --noEmit` (frontend) pass before marking a phase complete.

---

## 4. How the AI Should Behave in This Repository

1. **Read Context First:** Before writing or modifying code, inspect `memory.md`, `rules.md`, `architecture.md`, `phases.md`, and `design.md`.
2. **Respect Project Scope:** Do not add out-of-scope features (payments, notifications, file uploads, video consults, non-Bhopal cities, Hindi localization, or commercial billing/app-store boilerplate) unless explicitly instructed by the user.
3. **Follow Phase Boundaries:** Work one phase at a time as defined in `phases.md`. Do not jump ahead and build later-phase features prematurely.
4. **Wait for Design Direction:** Before styling final UI polish, follow the design tokens and visual rules defined in `design.md`.
5. **No Silent Security Shortcuts:** Never weaken JWT verification, tenant checks, or consent validation "temporarily for demo." Use the demo seeder and real login flow instead.
6. **Keep `memory.md` Current:** Whenever a phase finishes or an architectural/scope decision changes, update `memory.md` with a concise entry.
7. **Be Transparent About Verification:** Always run builds/tests after code changes and report exact outcomes rather than assuming they pass.
