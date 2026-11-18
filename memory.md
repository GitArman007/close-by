# closeBy — Project Memory & Decisions Log

## 1. Project Identity & Purpose

- **Project Name:** closeBy
- **Purpose:** Final-year major project at **LNCTS Bhopal** (college evaluation, demo-ready, evaluated live by faculty).
- **Product Summary:** Remote parent-care coordination platform for Bhopal. Families living away book home health visits through approved Bhopal clinics and read observation-only visit reports afterwards. The parent does not need the app.
- **Design Direction:** Finalized in [design.md](design.md) — calm, warm, editorial ("printed health diary"); tokens, typography (`Fraunces`, `DM Sans`, `IBM Plex Mono`), and 6 core primitives implemented in `mobile/src/theme/` and `mobile/src/components/` and previewed at `/design-preview`.

---

## 2. Tech Stack (Unchanged)

- **Backend:** Spring Boot (Java 21) REST API, Spring Security, JWT auth, Flyway migrations
- **Database:** PostgreSQL
- **Frontend:** React Native (Expo SDK 58, TypeScript) with **Expo Web** support for Platform Admin & Clinic Admin screens

---

## 3. Current Phase

- **Active Stage:** Backend Complete & Verified (`mvn test`: 5 tests, 0 failures). Full Spring Boot (Java 21) REST API implemented in `backend/` with Flyway migration (`V1__init.sql`), JWT auth across all 4 roles, clinic governance, verified staff (`"Verified by <Clinic>"`), parent profiles with server-timestamped consent, visit lifecycle state machine, observation-only reports, append-only `report_access_logs`, service-layer + HTTP data isolation, Swagger/OpenAPI docs, Platform Admin analytics, and idempotent Bhopal demo seeder (5 fictional clinics, 12 parents, 40 visits over 60 days). Design system & 6 primitives already verified at `/design-preview`.
- **Next Step:** Build all Expo (mobile + Expo Web) app screens connected to the backend, demo mode switcher, visit simulation, analytics charts, sparklines, access log screen, and college submission docs (`README.md`, Mermaid diagrams, `DEMO_SCRIPT.md`).

---

## 4. Decisions Log

| Date | ID | Decision | Rationale |
| :--- | :--- | :--- | :--- |
| 2026-11-18 | `DEC-001` | **College Major Project Scope (LNCTS Bhopal)** | Refocused purely for college evaluation and live faculty demo. Removed commercial/client concerns (pricing, payments, maintenance fees, change requests, App Store/Play Store submission). |
| 2026-11-18 | `DEC-002` | **Modular Monolith Backend (Spring Boot Java 21 + PostgreSQL)** | Clean domain packaging (`auth`, `clinic`, `staff`, `parent`, `visit`, `report`, `audit`, `seed`) without microservice complexity—reliable for live demo and straightforward to defend in faculty viva. |
| 2026-11-18 | `DEC-003` | **Single Expo (TypeScript) Frontend with Expo Web** | Enables mobile experience for Family & Clinic Staff and clean desktop web dashboards for Platform Admin & Clinic Admin from one codebase. |
| 2026-11-18 | `DEC-004` | **Strict Observations-Only Clinical Boundary** | Visit reports capture vitals (BP, temperature, blood sugar), factual notes, and a follow-up/doctor consult recommendation flag only. No diagnoses or medical advice anywhere in the system. |
| 2026-11-18 | `DEC-005` | **Four Fixed Services & Five Visit Statuses** | Fixed services (`HOME_VITALS_CHECK`, `SAMPLE_COLLECTION`, `FOLLOW_UP_VISIT`, `MEDICINE_ADHERENCE_CHECK`) and strict lifecycle (`Requested -> Assigned -> In progress -> Completed / Cancelled`) keep scope tight and testable. |
| 2026-11-18 | `DEC-006` | **Server-Enforced Safety Baseline** | Multi-tenant clinic isolation and family ownership derived exclusively from JWT claims; parent consent persisted with server UTC timestamp; append-only `report_access_logs` on every report read; `"Verified by <Clinic>"` staff badge; `"In an emergency, call 108 or 112"` on key screens. |
| 2026-11-18 | `DEC-007` | **Demo Readiness Built-In Without Auth Bypass** | Idempotent `@Profile("demo")` Bhopal seed dataset + env-gated Demo Role Switcher (`EXPO_PUBLIC_DEMO_MODE=true`) that still calls the real `/api/v1/auth/login` JWT endpoint, paired with a 5-minute live demo script. |
| 2026-11-18 | `DEC-008` | **Explicit Out-of-Scope Boundaries** | Excluded: payments, notifications, file uploads, video consults, non-Bhopal cities, and Hindi localization. |
| 2026-11-18 | `DEC-009` | **Editorial "Printed Health Diary" Art Direction & PDF Slip Export** | Locked palette (`#F6F1E7`, `#FFFDF8`, `#14231F`, `#1F4D45`, max-1 `#E8A317`, `#C4452D`), `Fraunces` + `DM Sans` (min 16px body) + `IBM Plex Mono`, `lucide-react-native` (1.75 stroke), `1px` hairlines, Reanimated 200-300ms motion, light haptics, and client-side PDF print/export for `ReportSlip` via `expo-print` / `expo-sharing`. |
| 2026-11-18 | `DEC-010` | **Backend Verified & Fictional Bhopal Seed Locked** | Completed Spring Boot 3.4 / Java 21 backend with ANSI `TIMESTAMP WITH TIME ZONE` Flyway schema (PostgreSQL + H2 test compatibility), service-layer clinic/family isolation, server-side visit transition enforcement, automatic report access logging, Swagger/OpenAPI (`/swagger-ui.html`), and idempotent seeder (5 fictional Bhopal clinics, 12 parents, 40 visits across 60 days). Verified via `mvn test` (5 tests, 0 failures). |
