# PHAMS Frontend — feature/manage-families

## What this branch adds

This branch implements the **Manage Families** feature for the admin dashboard,
connected to the real backend API via JWT authentication. It also upgrades the
admin auth system from a hardcoded demo to real backend login.

### New files
- `src/api/api.js` — Central API fetch wrapper. All API calls must use
  `apiFetch()` from this file. Never write raw `fetch()` calls in components.
  Automatically attaches the JWT token from localStorage to every request.
  Auto-redirects to login on 401 (expired token).
- `src/components/admin/AdminSidebar.jsx` — Shared sidebar component used by
  all admin pages. Highlights the active route using `useLocation()`. All nav
  items are clickable and route-aware.
- `src/pages/admin/FamilyListPage.jsx` — View and manage all registered
  families at `/admin/families`
- `src/pages/admin/AddFamilyPage.jsx` — Register new families at
  `/admin/families/add`

### Modified files
- `src/context/AdminAuthContext.jsx` — Replaced hardcoded demo credentials
  with real JWT login via `POST /api/auth/login`
- `src/pages/staff/StaffLoginPage.jsx` — Admin login form changed from
  username to email field to match backend
- `src/pages/admin/AdminDashboardPage.jsx` — Uses shared `AdminSidebar`,
  Quick Action buttons navigate to real routes
- `src/App.jsx` — Added `/admin/families` and `/admin/families/add` routes

---

Note: Several features were deliberately added or changed based on real-world
requirements for a government hunger management system.

### 1. Household ID (e.g., AGU-2026-0001)

The prototype had no unique identifier for households beyond family name and
address. This is insufficient in practice — multiple families in the same
barangay can share a surname, and two families on the same street with the
same surname would be indistinguishable.

The system now generates a structured household ID on registration:
`[BARANGAY_CODE]-[YEAR]-[SEQUENCE]`. This follows the pattern used by DSWD's
Listahanan national household targeting system, where household IDs are the
primary reference for all assistance records.

### 2. Priority Score

The prototype had no mechanism for determining which families should receive
food assistance first. Without prioritization, distribution is arbitrary —
whoever registers first or whoever staff happen to visit.

The system computes a 0–100 priority score for each family based on five
weighted factors: monthly income relative to the NCR poverty line (35%),
malnourished members (30%), presence of vulnerable individuals such as
children under 5, seniors, and PWDs (20%), per-capita dependency burden (10%),
and days since last distribution (5%). Higher score = more urgent need.

This is the core SDG 2 contribution of the system: food goes to those who
need it most, determined by objective criteria, not administrative convenience.

### 3. BMI-Based Nutritional Status with Age Bands

The prototype used a manual dropdown for nutritional status with no objective
basis. A staff member guessing "Normal" or "Underweight" introduces error and
inconsistency across barangays.

The system now captures height (cm) and weight (kg) per family member and
computes BMI automatically. Nutritional status is auto-set using
age-appropriate Philippine DOH/NNC classifications:
- Under 5: simplified pediatric thresholds
- 5–17: WHO BMI-for-age simplified ranges
- 18+: Filipino/Asian cutoffs (overweight threshold 23.0, not 25.0)

Staff can override the auto-set value if measurement data is unavailable.
This produces consistent, objective nutritional data across all barangays —
which is what SDG 2 actually measures.

### 4. Multi-Select Food Assistance Program Enrollment

In reality, a family can be simultaneously enrolled in
multiple government programs (e.g., both 4Ps and Solo Parent benefits).

The field uses MySQL's SET type to store multiple values. The form uses
checkboxes to reflect this correctly.

### 5. Distinction: Family-Level Programs vs. Individual-Level Status

The prototype did not distinguish between these two different types of
information. The system now tracks them separately:

- **Food Assistance Program Enrollment** (family level): Which government
  programs is this household officially registered for? Tracks administrative
  program enrollment — 4Ps, Solo Parent, PWD Program, Senior Citizen Program,
  Pregnant/Lactating Program.

- **Individual flags per member**: What is the actual health and disability
  status of each person? Tracks `is_pwd` (has a disability) and
  `nutritional_status` (measured health outcome). These feed directly into
  the priority score.

A family can have a PWD member without being enrolled in the PWD assistance
program (e.g., recently acquired disability, not yet registered). Both facts
matter and they are different facts.

### 6. Single Head of Family Enforcement

The prototype had no validation preventing multiple members from being marked
as "Head." The system enforces exactly one Head per family — selecting Head
on one member automatically demotes the previous Head to "Other." The Head's
name auto-populates the family-level Head of Family field.

### 7. Soft Delete Instead of Hard Delete

The prototype's delete function permanently removed records. The system uses
soft delete (`is_active = 0`) so that distribution history, audit logs, and
beneficiary records are preserved. This is standard practice for government
systems where records are legally accountable.

### 8. Separate Pages Instead of Single Scrollable Page

The prototype used one long scrollable page where sidebar navigation scrolled
to sections. This was rejected because:
- Each section cannot be linked to directly from other parts of the system
- The browser back button does not work between sections
- Two developers cannot work on different sections without merge conflicts
- Role-based access control works at the route level, not scroll-section level

The system uses separate routes per feature, consistent with how all
production management systems are structured.

---

## Known limitations

- Pediatric nutritional classification uses simplified thresholds, not full
  WHO Anthro z-score tables. Future improvement.
- NPA families with the same surname in the same barangay cannot be
  distinguished by name + address alone. A future improvement is a
  barangay-issued NPA reference number as secondary identifier.
- Food assistance status in the form maps to a single MySQL SET field.
  If a family's enrollment changes, the entire field is overwritten. An
  enrollment history table would be a future improvement.
- Dashboard statistics are currently hardcoded. They will be connected to
  the backend API in a future integration sprint.
- Minors < 18 shouldn't be flagged as the 'Head'