# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Branching Rules

**Branch structure:** `feature/*` → `dev` → `staging` → `main`

- **Never commit directly to `dev`, `staging`, or `main`**
- All work must happen on a feature branch, then merged via PR into `dev`
- Always branch off `dev`, not `main`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-feature-name
```

- Branch naming: `feature/` for new features, `fix/` for bugs, `chore/` for maintenance
- After finishing work on a feature branch, push and open a PR targeting `dev`
- Releases flow: `dev` → `staging` (via PR) → `main` (via PR)

## Commands

```bash
npm run dev       # Start Next.js dev server
npm run build     # Production build
npm run lint      # ESLint (Next.js core web vitals)
npx prisma studio # Browse database
npx prisma db push # Sync schema to database
npx prisma generate # Regenerate Prisma client (also runs on postinstall)
```

There is no test suite configured yet.

## Environment Setup

Copy `.env.example` to `.env.local` and populate:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` — for auth (not yet implemented)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + API keys — property photo uploads
- `NEXT_PUBLIC_MAPBOX_TOKEN` — map integration

## Architecture

**UNO** is a Next.js 14 (App Router) rental property platform targeting the Nigerian market. It serves two user roles: **Renters** (browse/save properties) and **Landlords** (list/manage properties).

### Route Groups

```
src/app/
├── (auth)/        # /login, /signup — public
├── (landlord)/    # /landlord/... — protected landlord flows
├── (renter)/      # /renter/... — protected renter flows
└── api/           # REST endpoints: auth, properties, contacts, search
```

Auth middleware (`src/middleware.ts`) is fully enforced: NextAuth JWT gates all non-public routes, with role gating for `/admin/*` (ADMIN only) and `/agent/*` staff console (VERIFIED + IN_HOUSE agents, or ADMIN). Public surfaces listed in `publicRoutes`. The `(renter)` layout no longer mocks a user.

### Layout & Chrome

Each route group has its own layout that composes the chrome:
- `(renter)/layout.tsx` renders `Header` + `Sidebar` (desktop) + `MobileNav` (mobile)
- Route-aware exceptions: on `/property/*`, the renter layout **hides** `Sidebar` and `MobileNav`, and `<main>` drops its `overflow-y-auto` so the document is the scroll container (required for the property page's `sticky top-16` sub-nav to sit flush under `Header`)
- `Header` is also route-aware: on `/property/*` mobile, the `uno` logo is replaced with a back chevron (`router.back()` with `/find` fallback)

`Header` is `h-16` (64px), `sticky top-0`. Page-level sticky bars should use `top-16` and ensure no ancestor between them and the viewport creates a new scroll context.

### State Management

- **Zustand** stores in `src/stores/`: `filterStore` (search/filter state), `userStore` (current user), `headerStore` (controls whether `Header` renders its search input)
- **Custom hooks** in `src/hooks/`: `useAuth`, `useFavourites`, `useProperties`, `useSavedSearches` — these wrap API calls and store interactions

**Header search handoff pattern**: Pages that render their own search bar (e.g. `/find`, `/feed`) should hide the header's search while their page-level search is in view and reveal it once scrolled past. Implementation: call `useHeaderStore.setShowSearch(false)` on mount, place a sentinel `<div>` just below the page search, and wire an `IntersectionObserver` with `rootMargin: "-64px 0px 0px 0px"` (matches the 64px sticky header) to toggle `setShowSearch`. Restore to `true` in the cleanup. See `src/app/(renter)/find/page.tsx` and `src/app/(renter)/feed/page.tsx` for the canonical implementation.

### Data Layer

- **Prisma** with PostgreSQL (`prisma/schema.prisma`)
- 8 models: `User`, `LandlordProfile`, `Property`, `PropertyPhoto`, `Favourite`, `SavedSearch`, `ContactRequest` + enums
- User roles: `RENTER | LANDLORD | AGENT | ADMIN`
- Prisma singleton in `src/lib/db.ts`
- Mock data in `src/lib/mock-data.ts` for development without a live DB

### Design System

The design system is CSS-variable-based:
- `src/styles/tokens.css` — 112 custom properties (colors, spacing, typography, shadows, border-radius)
- `src/styles/globals.css` — global styles built on those tokens
- `tailwind.config.ts` — Tailwind extended with the same token values (colors, spacing, screens, animations)
- Brand color: `#af2525` (red); primary font: Manrope
- Custom breakpoints: `xs` 375px, `sm` 430px, `md` 768px, `lg` 1024px, `xl` 1280px
- Touch targets minimum 48px (enforced via Tailwind utility)

### Component Library

- **shadcn/ui** + **Radix UI** primitives (`components.json` configured)
- **Lucide React** for icons
- Local components organized by domain: `src/components/layout/`, `src/components/property/`, `src/components/shared/`

### Path Alias

`@/*` resolves to `./src/*` (configured in `tsconfig.json`).

### Image Handling

`next.config.mjs` allows remote images from `res.cloudinary.com` and `images.unsplash.com`.

### Validation

Zod schemas live in `src/lib/validators/`. React Hook Form is used on the frontend with Zod resolvers.

### App Constants

`config/constants.ts` — amenity lists, location data, nav items. `config/site.ts` — site metadata.
