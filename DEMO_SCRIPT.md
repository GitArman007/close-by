# closeBy — 5-Minute Live Faculty Demo Script (LNCTS Bhopal)

> **Preparation (2 minutes before panel enters):**
> 1. Start PostgreSQL and Spring Boot with demo profile:
>    `cd backend && mvn spring-boot:run "-Dspring-boot.run.profiles=demo"`
> 2. Start Expo Web: `cd mobile && npm run web` (open `http://localhost:8081` in browser).
> 3. Keep a second tab ready on Swagger UI: `http://localhost:8080/swagger-ui.html`.
> 4. Start on the **Login screen** (`/(auth)/login`) — clean, calm, no clutter.

---

## Minute 0:00 – 0:45 · Problem, Clinical Safety & Platform Admin Governance

1. **Opening line (Login screen):**
   - Point out the warm paper editorial UI (*"designed like a printed health diary, not a SaaS template"*) and the terracotta **`In an emergency, call 108 or 112`** notice.
   - Explain: *"Families living away from Bhopal book verified home health visits for their parents. **The parent never needs the app.** And closeBy records factual observations only—it never diagnoses."*
2. **Trigger the hidden Demo Role Switcher:**
   - **Long-press (click and hold 500ms) the `closeBy` logo** in the top-left header.
   - Select **Platform Admin — Dr. Aarav Kulkarni** (`admin@closeby.in`). Note that this calls the real `/api/v1/auth/login` JWT endpoint.
3. **Show Platform Admin Dashboard (`/(admin)`):**
   - Point to the 4 editorial KPI stats (`40 Visits`, `Avg. Time to Assign`, `Repeat Bookings`, `5 Registered Clinics`) and the two direct-labeled charts (**Visits per Week** and **Clinics by Status**—no default legends).
   - Scroll to the Clinic Directory showing 5 fictional Bhopal clinics across Approved, Pending, and Suspended states.
   - **Click `Approve` on `Kolar Canopy Family Care` (Kolar Road).** Show the status flip live from `Pending review` to `Approved` and the chart bar update immediately.

---

## Minute 0:45 – 2:10 · Family Diary, Consent Timestamp, Sparklines & Live Visit Simulation

1. **Long-press `closeBy` logo** -> select **Family — Rohan Sharma** (`family.rohan@closeby.in`).
2. **Parent-First Family Home (`/(family)`):**
   - Highlight the editorial hierarchy: **Smt. Meera Sharma** in large `Fraunces` serif, her Arera Colony locality, and her **`Consent recorded · <date>`** pill (saved with a server UTC timestamp—adding a parent without consent is rejected with `400`).
   - Highlight the hero summary card: **`Last visit Tue: BP 128/82, sugar 104`**.
   - Scroll briefly to show the **Blood Pressure & Blood Sugar trend sparklines** built directly from her last 6 completed reports over 60 days.
3. **Run the Live Visit Simulation:**
   - Tap **`Simulate visit`** right on the Family Home screen!
   - Talk through each live stage as the vertical 4-stage **`TimelineStep`** updates automatically in front of the faculty:
     - **Stage 1 (`Requested`):** Real `POST /api/v1/visits` from Family JWT.
     - **Stage 2 (`Assigned`):** Background Clinic Admin JWT assigns **Nurse Sunita Verma** — the **`Verified by Lakeview Homecare Clinic`** stamp appears inline.
     - **Stage 3 (`In progress`):** Background Clinic Staff JWT starts the visit — notice the subtle marigold pulse on the active stage (strictly one accent on the screen).
     - **Stage 4 (`Completed`):** Staff submits factual observations (`124/80 mmHg`, `98.4 °F`, `102 mg/dL Fasting`) — visit completes and updates the parent's latest summary & sparkline live!

---

## Minute 2:10 – 3:15 · Printed Observation Slip, PDF Export & Live Report Access Audit

1. Tap **`Open printed report slip`** on the newly completed visit (`/(family)/report/[visitId]`).
2. **Show `ReportSlip`:**
   - Point out the printed clinic-slip layout: hairline outer frame, ruled lines, **`IBM Plex Mono`** tabular numerals for readings, **`Verified by Lakeview Homecare Clinic`** stamp, next-step note, explicit **"Observations only. Not a medical diagnosis or prescription."** disclaimer, and **`In an emergency, call 108 or 112`**.
   - Click **`Export slip as PDF`** to demonstrate clean print-to-PDF export (close the print dialog after showing the preview).
3. **Scroll directly below the slip to the Report Access Log:**
   - Point out that **Rohan Sharma (`Family`)** was just appended with the exact current timestamp simply by opening the slip!
   - Tap **`Access log`** in the top nav (`/(family)/access-logs`) to show the complete chronological privacy audit trail across all slips.

---

## Minute 3:15 – 4:15 · Clinic Operations Desk & Strict Multi-Tenant Data Isolation Proof

1. **Long-press `closeBy` logo** -> select **Clinic Admin — Lakeview Homecare** (`clinic.lakeview@closeby.in`).
   - Show Lakeview's Visit Queue, **`Verified staff`** tab (`Verified by Lakeview Homecare Clinic`), and **`Reports`** tab.
   - Open Smt. Meera Sharma's latest slip in **`Reports`** — point out that **Nikhil Srivastava (`Clinic admin`)** immediately appears in the Report Access Log right below!
2. **Prove Strict Clinic Isolation Live:**
   - **Long-press `closeBy` logo** -> select **Clinic Admin — Bada Talab Care** (`clinic.badatalab@closeby.in`, MP Nagar).
   - Show that Lakeview's visits, Lakeview's staff (Nurse Sunita), and Smt. Meera Sharma's slips & access logs are **completely invisible** to Bada Talab Care Collective.
   - Explain: *"Isolation is enforced inside the Spring Boot service layer using the verified JWT `clinicId`—never trusted from client parameters—and proven in `DataIsolationIntegrationTest`."*

---

## Minute 4:15 – 5:00 · Clinic Staff View, OpenAPI Docs & Technical Wrap-Up

1. **Long-press `closeBy` logo** -> select **Clinic Staff — Nurse Sunita Verma** (`staff.sunita@closeby.in`).
   - Show her assigned-only visit queue with the **`Verified by Lakeview Homecare Clinic`** pill and `108 or 112` notice. Tap any `In progress` visit to briefly show the structured observations-only entry form.
2. **Switch browser tab to Swagger UI (`http://localhost:8080/swagger-ui.html`):**
   - Show the clean REST API groups (`Authentication`, `Platform Admin`, `Clinics`, `Clinic Staff`, `Parents`, `Visits`, `Visit Reports`, `Report Access Logs`).
3. **Closing Summary (15 seconds):**
   - *"Spring Boot 3.4 with Java 21, PostgreSQL + Flyway, stateless JWT RBAC, service-layer multi-tenancy, server-side visit state machine, 5 passing integration test suites, and a single React Native Expo + Expo Web codebase styled as a calm printed health diary."*
   - Open for faculty questions!

---

## Faculty Viva Q&A Quick Reference

- **Why doesn't the parent need an account?** Many elderly parents in Bhopal don't use smartphones comfortably. The family manages booking and consent remotely, while clinic staff visit in person and publish factual slips back to the family.
- **How do you prevent a clinic or family from reading someone else's data by guessing a UUID?** Every service method (`StaffService`, `ParentService`, `VisitService`, `ReportService`, `ReportAccessLogService`) verifies `clinicId == principal.requireClinicId()` or `familyUserId == principal.userId()` from the signed JWT and throws `403 Forbidden`—verified directly in `DataIsolationIntegrationTest`.
- **How do you prevent skipping visit statuses (e.g., completing an unstarted visit)?** `VisitStatus.canTransitionTo(next)` encodes the exact state machine in the domain entity (`REQUESTED -> ASSIGNED -> IN_PROGRESS -> COMPLETED`, `REQUESTED|ASSIGNED -> CANCELLED`), rejecting illegal transitions with `409 Conflict`—proven in `VisitLifecycleAndReportAuditIntegrationTest`.
- **Does the Demo Role Switcher weaken security?** No—it is UI-only (gated by `EXPO_PUBLIC_DEMO_MODE`) and authenticates via the exact same BCrypt + JWT `POST /api/v1/auth/login` flow as normal users.
