# uno — Project Summary

`uno` is a property rental / listing marketplace built with Next.js 14 (App
Router). It supports four user roles — **Renter, Landlord, Agent, Admin** —
each with its own authentication flow, route group, and console.

## Tech stack
- **Framework:** Next.js 14.2 (App Router), React 18, TypeScript
- **Database:** PostgreSQL (Supabase, with PostGIS) via Prisma 6
- **Auth:** NextAuth 4 — email OTP + Google OAuth + password credentials
- **Media:** Cloudinary (signed uploads)
- **Maps/geo:** Mapbox GL + server-side geocoding proxies
- **Infra:** Upstash Redis (rate limiting), Resend (transactional email)
- **UI:** Tailwind CSS + Radix UI + `lucide-react`, Zustand for client state
- **Validation:** Zod + react-hook-form
- **Deploy:** Vercel (`prisma generate && prisma migrate deploy && next build`)

## Data model (Prisma)
Core models: `User`, `Account`, `OtpCode`, `LandlordProfile`, `Property`,
`PropertyDraft`, `PropertyPhoto`, `Favourite`, `SavedSearch`, `ContactRequest`,
`AgentReview`, `Report`.

Key enums: `Role` (RENTER/LANDLORD/AGENT/ADMIN), `PropertyKind`
(RESIDENTIAL/COMMERCIAL/LAND), `PropertyStatus`
(DRAFT/PENDING/ACTIVE/PAUSED/RENTED/REJECTED), plus `PropertyType`,
`Furnishing`, `RentPeriod`, `ListingType`, `FeeMode`, agent status /
employment / business-type / specialization enums, and report reason/status.

18 migrations from `20260423_init` onward (auth, listing types, PostGIS map
polish, agent fields, property kind, drafts, indexes, badges, reports,
property state).

## App structure (route groups)
- `(auth)` — renter login / signup / OTP verify
- `(renter)` — feed, find/search, agents directory, favourites,
  saved-searches, property detail, profile, settings
- `(listing)` — landlord console: dashboard, properties (new / edit-by-section),
  contacts inbox, analytics
- `(agent)` / `(agent-auth)` — agent console: listings, owners, analytics
  (stub), profile
- `(admin)` / `(admin-auth)` — admin panel: agents, listings, users, reports

### API surface (`src/app/api`)
Auth (`[...nextauth]`, request-otp, has-password), `me/*` (profile, dashboard,
listings, drafts, notifications, password, social-accounts, deactivate),
`properties/*` (featured, map, `[id]` status/report/similar/request-verification),
`search`, `favourites`, `saved-searches`, `contacts`, `agent/*`, `admin/*`
(agents, properties, users, reports, stats), `geocode` + `reverse-geocode`,
`uploads/sign`.

## Build timeline (from git history)
| Date | Milestone |
|------|-----------|
| 2026-02-28 | Initial Next.js setup + Figma tokens |
| 2026-04-03/20 | Reusable UI components, guest pages, auth pages |
| 2026-04-23 | Stage 1 — DB setup, migrations, seed |
| 2026-04-24 | Stage 2 — email-OTP auth; Stage 3 enrichment (ListingType) |
| 2026-04-25/29 | Stage 3 close-out — search, favourites, saved searches, toasts, cross-tab auth |
| 2026-05-03/05 | Mapbox search integration; listing wizard rebuild (kind-aware); drafts |
| 2026-05-10 | Admin panel, property verification flow |
| 2026-05-24/27 | Listing edit-by-section, dashboard API, PostGIS map APIs, agent role scaffold |
| 2026-06-24/27 | Vercel deploy fixes, profile→settings, Google OAuth, password auth, deactivation, indexes, badges, featured, agent specializations, property state |
| (head) | Admin agents console, reports system, listing reassignment |

## Known gaps / next steps
- No repo-root README (docs live under `docs/`).
- Agent analytics page is a stub.
- Fallback to mock properties when DB has no active listings (dev aid).
