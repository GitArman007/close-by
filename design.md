# closeBy — Visual & UI Design Direction

## 1. Art Direction & Brand Philosophy

**Direction:** Calm, warm, editorial.  
**Reference feeling:** A well-designed printed health diary—not a SaaS template, not a neon wellness app, not a sterile hospital portal.

**Who is holding the phone:** A worried son or daughter living in Bengaluru, Pune, or Mumbai checking on an aging parent in Bhopal. Every typographic choice, surface tone, spacing decision, and line of copy must feel **reassuring, grounded, unhurried, and deeply human**.

### Core Principles
1. **Paper over plastic:** Warm paper canvas (`#F6F1E7`), elevated ivory sheets (`#FFFDF8`), deep forest-ink typography (`#14231F`), and crisp `1px` hairline rules (`ink @ 10%`) instead of heavy drop shadows or frosted cards.
2. **Typography carries hierarchy:** Let large serif names and figures (`Fraunces`) paired with generous whitespace and hairline rules organize the screen—never repetitive grids of identical boxed cards.
3. **One accent at a time:** Deep forest teal (`#1F4D45`) anchors primary actions and trust. Marigold (`#E8A317`) is reserved for **at most one focal accent per screen** (e.g., an active in-progress stage indicator or a single spotlight tag).
4. **Honest medical boundaries:** Observation reports look like authentic printed clinical slips—factual, structured, and clearly marked *"Observations only. Not a diagnosis or medical advice."*
5. **Restrained, meaningful motion:** Transitions last `200–300ms` via `react-native-reanimated` and exist solely to explain state changes (current timeline stage pulsing gently, list-to-detail continuity, quiet skeleton loading).

---

## 2. Design Tokens

All tokens live in `mobile/src/theme/tokens.ts` and must be imported rather than hardcoded in screens or components.

### 2.1 Color Palette

| Token | Hex / Value | Role & Usage |
| :--- | :--- | :--- |
| `colors.background` | `#F6F1E7` | Warm paper page canvas across mobile & Expo Web |
| `colors.surface` | `#FFFDF8` | Editorial sheets, printed report slip, modal/form surfaces |
| `colors.surfaceSubtle` | `#EFE8DA` | Soft recessed bands, skeleton fill, secondary paper wells |
| `colors.ink` | `#14231F` | Primary headings, body text, strong numerals |
| `colors.inkMuted` | `rgba(20, 35, 31, 0.70)` | Secondary descriptions, metadata, timestamps |
| `colors.inkSubtle` | `rgba(20, 35, 31, 0.50)` | Section kickers, uppercase micro-labels, placeholders |
| `colors.border` | `rgba(20, 35, 31, 0.10)` | **Default `1px` hairline border** on cards, inputs, slip rules |
| `colors.borderStrong` | `rgba(20, 35, 31, 0.22)` | Focused inputs, active table dividers, slip outer frame |
| `colors.primary` | `#1F4D45` | Deep forest teal — primary buttons, active tabs, verified marks |
| `colors.primarySoft` | `rgba(31, 77, 69, 0.10)` | Soft tint for verified badges & completed status pills |
| `colors.onPrimary` | `#FFFDF8` | Text and icons placed on `primary` |
| `colors.accent` | `#E8A317` | Marigold — **maximum one accent per screen** (e.g., current visit stage pulse or highlight) |
| `colors.accentSoft` | `rgba(232, 163, 23, 0.16)` | Soft marigold wash for `In progress` / `Follow-up` pill backgrounds |
| `colors.alert` | `#C4452D` | Terracotta — emergency `108 / 112` notice, errors, destructive actions, `Doctor consult` flag |
| `colors.alertSoft` | `rgba(196, 69, 45, 0.10)` | Soft terracotta wash for error banners and emergency strips |

> **Marigold Discipline:** Never use `#E8A317` on multiple competing widgets on the same screen. If a screen has an active pulsing timeline step in marigold, buttons and secondary tags on that screen stay in deep forest teal (`#1F4D45`) and ink hairline neutrals.

### 2.2 Typography

Loaded via `expo-font` (`@expo-google-fonts/fraunces`, `@expo-google-fonts/dm-sans`, `@expo-google-fonts/ibm-plex-mono`) so rendering is identical across iOS, Android, and Expo Web.

| Role | Font Family | Weight(s) | Size / Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | `Fraunces` | 600 SemiBold | `34px / 40px` | Parent's name on Family Home, screen display titles |
| **Display Stat** | `Fraunces` | 500–600 | `32px / 38px` | Hero figures and editorial summary metrics |
| **Section Heading** | `Fraunces` | 600 SemiBold | `24px / 30px` | Section titles, report slip header, empty state title |
| **Subheading** | `Fraunces` | 500 Medium | `20px / 26px` | Card/visit headings, clinic names |
| **Body Large** | `DM Sans` | 400 / 500 | `18px / 26px` | Hero summary line (*"Last visit Tue: BP 128/82, sugar 104"*) |
| **Body (Minimum)** | `DM Sans` | 400 / 500 | **`16px / 24px`** | All body copy, form labels, buttons, observation notes (**never below 16px for body text**) |
| **Meta / Label** | `DM Sans` | 500 / 600 | `13px–14px / 18px` | Uppercase hairline kickers, pills, timestamps, legal disclaimers (labels only—never paragraphs) |
| **Slip Numerals** | `IBM Plex Mono` | 400 / 500 | `18px–22px / 26px` | Tabular monospace vitals on the printed `ReportSlip` (`128/82`, `98.4`, `104`) and reference IDs |

### 2.3 Radii, Borders & Spacing

- **Card / Surface Radius:** `14px` (`radii.card = 14`)
- **Input / Button Radius:** `12px`–`14px` (editorial rectangular buttons use `14px`; compact pill buttons use `999px`)
- **Pill / Badge Radius:** `999px` (`radii.pill = 999`)
- **Border Width:** `1px` hairline (`borders.hairline = 1`, color `rgba(20, 35, 31, 0.10)`)
- **Elevation:** **Flat by default.** Use `1px` hairline borders and warm paper/surface contrast (`#F6F1E7` vs `#FFFDF8`) instead of heavy shadows.
- **Spacing Scale (4pt base):** `4, 8, 12, 16, 20, 24, 32, 40, 48`. Generous screen horizontal padding: `20px` on mobile, centered editorial max-width (`960px`–`1120px`) on Expo Web.

### 2.4 Iconography

- **One icon set only:** `lucide-react-native`
- **Stroke width:** **`1.75`** globally (`icons.strokeWidth = 1.75`)
- **Sizes:** `16px` inside pills/stamps, `18px–20px` inside buttons/rows, `24px–28px` inside empty states.

---

## 3. Hard Bans (Strictly Forbidden)

Every screen, component, and PR must pass these checks:

1. **No purple, blue, or pink gradients** — ever. No colorful mesh backgrounds.
2. **No glassmorphism** — no frosted blur cards, no translucent neon overlays.
3. **No emoji as icons** — never render 🏥, ❤️, ✅, ⚠️, 📋, or similar emoji anywhere in UI chrome or copy. Use `lucide-react-native` (`strokeWidth={1.75}`).
4. **No stacks of identical rounded cards with a big icon and a title** — vary editorial rhythm with open typographic headers, ruled lists, hairline dividers, and structured slips.
5. **No "Welcome back" screens** — open directly into the parent's care status, clinic queue, or assigned visits.
6. **No generic placeholder copy** — never use *"Lorem ipsum"*, *"No data found"*, *"Something went wrong"*, or *"Loading..."*. Every state uses calm, specific human microcopy.
7. **No heavy drop shadows** — rely on `1px` ink-at-10% hairline borders and paper-vs-surface tonal contrast.

---

## 4. Signature Elements

### 4.1 Parent-First Family Home
The Family Home screen never opens with a greeting banner or marketing cards. Instead:
1. **Top utility line:** Subtle `"In an emergency, call 108 or 112"` terracotta hairline strip + parent switcher (if multiple parents).
2. **Hero Header (open on warm paper `#F6F1E7`):**
   - Parent's name in large `Fraunces` (`34px`): e.g. **Smt. Meera Sharma**
   - Locality + verified consent cue: `Arera Colony, Bhopal · Consent recorded 12 Oct 2026`
   - **Hero Summary Line** in warm editorial prominence: **`Last visit Tue: BP 128/82, sugar 104`** (tapping opens the printed `ReportSlip`).
3. **Next Visit Band:** Hairline-bordered `#FFFDF8` sheet showing the upcoming or active visit (service, clinic, date/time, assigned staff with `"Verified by <Clinic>"` stamp, and current stage pill) OR a calm prompt to book the next home visit.
4. **Recent Diary Entries:** Hairline-ruled chronological list of past visits—no grid of icon boxes.

### 4.2 Vertical 4-Stage Visit Tracker (`TimelineStep`)
Visits progress vertically down four clear stages:
1. **Requested** — Request received by clinic
2. **Assigned** — Verified staff assigned
3. **In progress** — Staff member at parent's home
4. **Completed** — Observation slip published

*(If a visit is `Cancelled`, the cancelled step terminates cleanly with terracotta styling and the cancellation reason.)*

- **Visual rules:**
  - Vertical `1px` hairline rail connecting circular stage nodes.
  - Completed stages use deep forest teal (`#1F4D45`) with a crisp check icon (`1.75` stroke).
  - **Current stage pulses subtly** using `react-native-reanimated` (gentle halo breathing on a calm cadence; state transition `240ms`).
  - Once assigned, the staff member appears inline beneath the stage with an official **`Verified by <Clinic Name>`** stamp (`ShieldCheck`, stroke `1.75`).

### 4.3 Printed Medical Slip (`ReportSlip`) + PDF Export
Visit reports are laid out like a **printed Indian clinic slip / health diary page**:
- Warm ivory sheet (`#FFFDF8`) framed by a `1px` hairline border (`borderStrong` outer rule, `border` internal horizontal ruled lines).
- **Slip Header:** Clinic name, Bhopal locality, Visit Date & Time, Slip Reference ID (mono), and **`Verified by <Clinic Name>`** stamp with staff member's name and designation.
- **Patient Line:** Parent's full name, age, and service performed (e.g., *Home vitals check*).
- **Ruled Observations Table:** Each observation sits on a crisp horizontal rule with **`IBM Plex Mono`** tabular numerals:
  - Blood Pressure (`128/82 mmHg`)
  - Temperature (`98.4 °F`)
  - Blood Sugar (`104 mg/dL · Fasting`)
- **Staff Notes:** Plain, factual editorial paragraph (`16px` DM Sans, generous line height).
- **Follow-up / Doctor Consult Line:** Clearly highlighted status (`No follow-up flagged` / `Follow-up visit recommended` / `Doctor consultation recommended`).
- **Clinical Boundary Footer:** Ruled footer reading: *"Observations only. This slip records measurements taken during a home visit and is not a medical diagnosis or prescription."* + **`"In an emergency, call 108 or 112."`**
- **Export as PDF:** Action button in the slip footer generating a clean print-ready PDF matching the printed slip layout (`expo-print` on iOS/Android, browser print-to-PDF stylesheet on Expo Web).

### 4.4 Motion, Skeletons & Haptics
- **Timing:** `200ms–300ms` (`motion.fast = 200`, `motion.base = 240`, `motion.slow = 300`) with smooth easing (`Easing.out(Easing.cubic)`).
- **Engine:** `react-native-reanimated` for button press feedback, current timeline stage pulse, skeleton shimmer/breathing, and shared transitions between visit list rows and visit detail headers.
- **Skeleton Loaders:** Soft paper-tone (`#EFE8DA`) hairline-framed placeholders matching exact text/slip geometry—never spinning modal overlays.
- **Light Haptics:** `expo-haptics` (`ImpactFeedbackStyle.Light`) on key state-changing actions (booking visit, assigning staff, starting/completing visit, exporting PDF, primary button press), safely no-oped on web.
- **Zero decorative motion:** Never add floating blobs, confetti, or bounce animations that do not communicate state.

---

## 5. Trust, Safety & Expo Web Patterns

- **Emergency Notice:** A calm, unmissable terracotta hairline strip (`AlertTriangle` or `PhoneCall`, stroke `1.75`): **`"In an emergency, call 108 or 112"`**. Present on Family Home, Request Visit, Visit Detail, Visit Report, and Staff Visit View.
- **Verified Staff Stamp:** Pill with `ShieldCheck` (`1.75` stroke), deep forest teal ink on `primarySoft` tint, hairline border: **`Verified by Narmada Care Clinic`**.
- **Parent Consent Pill:** Subtle hairline pill showing `FileCheck` (`1.75` stroke) + `Consent confirmed · 12 Oct 2026, 10:15 AM`.
- **Report Access Log:** Hairline-ruled ledger below the `ReportSlip` showing viewer name, role pill, and exact timestamp—visually reinforcing audit accountability.
- **Expo Web (Platform Admin & Clinic Admin):** Centered editorial layout (`maxWidth: 1120px`) on `#F6F1E7` paper with clean hairline-ruled ledger tables (never cramped mobile cards stretched to 1440px), generous cell padding, and sticky top navigation bar.
- **Demo Role Switcher (`EXPO_PUBLIC_DEMO_MODE=true`):** Discreet bottom-right or top-bar hairline pill labeled `Demo role` opening a warm paper sheet to switch between seeded Bhopal accounts without disrupting the editorial layout.

---

## 6. Real Microcopy Library (Zero Generic Placeholders)

Every empty, loading, and error state uses calm, specific language from `mobile/src/theme/microcopy.ts`:

| Context | State | Title | Body Copy |
| :--- | :--- | :--- | :--- |
| **Family — No parents yet** | Empty | *Add your parent's details* | *Your parent does not need this app. Once you record their Bhopal address and confirm their consent, you can arrange home visits from anywhere.* |
| **Family — No visits yet** | Empty | *No home visits recorded yet* | *When you book a vitals check, sample collection, or follow-up through an approved Bhopal clinic, each visit and report will stay organized here.* |
| **Clinic Admin — Empty queue** | Empty | *No incoming visit requests* | *New home visit requests from families in Bhopal will appear here as soon as they are booked.* |
| **Clinic Staff — No assigned visits** | Empty | *No visits assigned right now* | *When your clinic assigns a home visit to you, the parent's address, time window, and instructions will show up here.* |
| **Platform Admin — No pending clinics** | Empty | *All clinic applications reviewed* | *There are no Bhopal clinics waiting for approval right now. You can still review approved or suspended clinics from the tabs above.* |
| **Report Access Log — First view** | Empty | *No previous views recorded* | *Every time you or the clinic opens this observation slip, the viewer and timestamp are logged here automatically.* |
| **Loading — Visit diary** | Loading | *Opening your care diary* | *Fetching the latest visit status and verified clinic observations.* |
| **Loading — Observation slip** | Loading | *Preparing the visit slip* | *Loading recorded readings and recording this view in the access log.* |
| **Error — Network unreachable** | Error | *Could not reach closeBy right now* | *Your connection looks interrupted. Check your internet and try again—no visit details were lost.* |
| **Error — Permission / Isolation** | Error | *This record is not available to your account* | *For family and clinic privacy, closeBy only opens records linked directly to your account.* |
| **Error — Report export failed** | Error | *Could not prepare the PDF slip* | *Please try exporting again. All recorded observations remain safely saved on this screen.* |

---

## 7. Core UI Primitives (Built & Previewed at `/design-preview`)

1. **`Button`** — Primary (deep forest teal), Secondary (warm paper hairline), Ghost (quiet text), Alert (terracotta), Accent (marigold, strictly max 1 per screen). Supports `lucide-react-native` icons (`1.75` stroke), loading indicator, 220ms Reanimated press feedback, and light haptics.
2. **`Pill`** — `999px` radius status pills (`Requested`, `Assigned`, `In progress`, `Completed`, `Cancelled`), `Verified by <Clinic>` stamp, and neutral/consent hairline tags.
3. **`Stat`** — Editorial metric block pairing a crisp uppercase label, large `Fraunces` serif or tabular mono reading, optional unit, and calm contextual note.
4. **`TimelineStep`** — Vertical 4-stage visit tracker node with hairline rail, Reanimated subtle pulse on the active stage, timestamp, and inline `"Verified by <Clinic>"` staff stamp.
5. **`ReportSlip`** — Printed medical observation slip with `1px` outer border, ruled internal lines, `IBM Plex Mono` tabular readings, factual notes, follow-up/doctor consult indicator, observations-only disclaimer, `108 / 112` emergency strip, and PDF export action.
6. **`EmptyState`** — Calm editorial empty, loading (with Reanimated skeleton bars), and error state component using real human microcopy and `1.75`-stroke `lucide-react-native` icons.
