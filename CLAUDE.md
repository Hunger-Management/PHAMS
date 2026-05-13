# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PHAMS** (Pateros Hunger Assistance Management System) is a full-stack government food assistance management web app for the Municipality of Pateros. It manages household beneficiary registration, priority scoring, nutritional status tracking, and food distribution records across 10 barangays.

## Commands

### Frontend (root)
```bash
npm run dev       # Vite dev server at http://localhost:5173 (mock API by default)
npm run build     # Production build to /dist
npm run preview   # Preview production build locally
npx eslint .      # Lint all files
```

### Backend (`backend/`)
```bash
cd backend && npm start   # Express server at http://localhost:3000
```

### Database
```bash
# Docker (recommended for team dev):
cd backend && docker compose up -d

# Manual: run backend/schema.sql then backend/seed.sql in MySQL Workbench
```

### Environment
- Frontend dev uses mock API by default (`VITE_USE_MOCK_API=true` in `.env`)
- Set `VITE_USE_MOCK_API=false` + configure `VITE_API_URL=http://localhost:3000` to use the real backend
- Backend DB config goes in `backend/.env` (see `backend/.env.example`)

## Architecture

### Stack
- **Frontend:** React 19, React Router 7, Vite, Tailwind CSS 4
- **Backend:** Express.js 5, MySQL 2 (connection pool, raw SQL — no ORM)
- **Auth:** JWT (Bearer token in localStorage `phams-token`), bcryptjs
- **Deployment:** Vercel (frontend SPA), Railway (backend + MySQL)

### Source Layout (`src/`)
```
admin/pages/        # Admin-only pages (dashboard, families, barangays, transparency, accounts)
admin/components/   # AdminSidebar, BarangayManagementSection
pages/              # Public pages (Home, About, Barangays, Contact, Donation, Transparency)
pages/staff/        # StaffLoginPage, StaffDashboardPage
pages/barangays/    # Individual barangay detail pages (one file per barangay)
components/auth/    # AdminProtectedRoute, StaffProtectedRoute
context/            # AdminAuthContext, StaffAuthContext, BarangayContext
api/                # apiFetch() wrapper, mockApiFetch(), mockApi.js (in-memory DB)
hooks/              # useDarkMode
```

### Auth & Route Protection
Two separate auth contexts exist — `AdminAuthContext` and `StaffAuthContext` — each storing JWT and user info. `AdminProtectedRoute` and `StaffProtectedRoute` wrap the respective dashboards and redirect to `/staff/login` on failure.

Admin has a demo fallback (`admin@pateros.gov.ph` / `admin123`). Staff accounts are managed through the real backend.

### API Calls
All API requests go through `apiFetch()` (`src/api/`), which:
- Prepends `VITE_API_URL` (defaults to Railway production URL)
- Attaches the JWT Bearer token automatically
- Times out at 8 seconds
- Auto-redirects to `/staff/login` on 401

When `VITE_USE_MOCK_API=true`, `mockApiFetch()` is used instead — it operates on an in-memory store backed by `localStorage`, enabling full frontend development without a running backend.

### Data Models
Key domain concepts (mirrored in `backend/schema.sql` and `src/api/mockApi.js`):
- **Families** — `household_id` (e.g., `AGU-2026-0001`), `priority_score` (0–100), `food_assistance_status` (MySQL SET — multiple programs simultaneously), soft delete via `is_active`
- **Family Members** — per-member `nutritional_status` derived from BMI with age-appropriate thresholds
- **Users** — role-based (`Admin` / `Staff`), scoped to a barangay
- **Barangays** — 10 fixed barangays; profiles (residents, households, captains) are hardcoded in `BarangayContext`
- **Distributions / Donations** — food assistance delivery and donation records

### Styling
Tailwind CSS 4 with custom design tokens defined in `tailwind.config.js`:
- `phams-blue` (#243f63), `phams-dark` (#0f0f10), `phams-header`, etc.
- Dark mode via `useDarkMode` hook
- Fonts: IBM Plex Sans (body), Space Grotesk (display) via Google Fonts
- Icons: Lucide React throughout
