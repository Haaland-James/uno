# Hoomefynda / UNO

Property rental and listing marketplace for Akwa Ibom, built with Next.js App Router.

The codebase is still named `uno`, but the user-facing brand is **Hoomefynda**. Keep infrastructure, package names, Prisma enums and internal docs as UNO unless a dedicated migration is planned.

## What this app does

- Renter-facing property search, feeds, favourites and saved searches.
- Lister dashboard for creating, editing and managing listings.
- Agent tools for in-house agent workflows.
- Admin tools for property verification, agents, users, reports and stats.
- Contact-request flow: renters reveal interest and listers receive email/dashboard leads.
- Map/search stack with PostGIS, Mapbox, full-text search and ranked pagination.

## Tech stack

- Next.js 14 App Router, React 18, TypeScript
- PostgreSQL + PostGIS, Prisma 6
- NextAuth 4: email OTP, Google OAuth and credentials/password support
- Cloudinary signed uploads
- Mapbox GL and server-side geocoding proxies
- Upstash Redis rate limiting
- Resend transactional email
- Tailwind CSS, Radix UI, Zustand, Zod, Vitest

## Repository layout

```text
src/app/                 Next.js route groups and API routes
src/components/          Shared UI and feature components
src/lib/                 Server/client utilities, mappers, email, search, tests
src/stores/              Zustand stores
src/types/               Shared TypeScript DTOs
prisma/                  Prisma schema, migrations and seed script
config/                  App constants and site config
deploy/                  VPS Docker Compose, deploy and backup scripts
docs/                    Ops records; planning markdown here is local-only (see below)
```

## Prerequisites

- Node.js 22 (matches the `node:22` base image in the `Dockerfile`)
- npm
- PostgreSQL with PostGIS for local/staging/prod database work
- Runtime services for full functionality:
  - Cloudinary
  - Mapbox
  - Upstash Redis
  - Resend
  - Google OAuth credentials, if Google login is enabled

Do not commit real environment files or secrets.

## Environment

Copy the local template and fill it in:

```bash
cp .env.example .env
```

`deploy/env.example` is the separate template for the VPS deployment — don't use it for local setup.

The app reads these variables:

```text
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
NEXT_PUBLIC_SITE_URL=          # public origin; builds email links, sitemap and OG URLs
NEXT_PUBLIC_APP_ENV=           # DEV / STAGING / PROD label in the admin + agent headers; defaults to DEV
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MAPBOX_SERVER_TOKEN=
NEXT_PUBLIC_MAPBOX_TOKEN=
RESEND_API_KEY=
EMAIL_FROM=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Development

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Run the dev server:

```bash
npm run dev
```

Seed the database when needed:

```bash
npm run db:seed
```

Open Prisma Studio when needed:

```bash
npm run db:studio
```

## Verification

Run the main checks before merging code:

```bash
npm run test
npm run lint
npx tsc --noEmit
```

The production build command also runs Prisma generation and deploy migrations:

```bash
npm run build
```

Do not run `next build` while a dev server is using `.next`; it can cause phantom route/build issues.

## Database and migrations

- Prisma migrations live in `prisma/migrations/`.
- Do not use `prisma db push` for normal development; PostGIS/generated-column details are migration-managed.
- The `geom` and `search_vector` fields rely on SQL migrations and unsupported Prisma column types/indexes.
- `npm run build` runs `prisma migrate deploy` before `next build`, so any host that uses it (including Vercel) migrates on deploy. On the VPS, `deploy/deploy.sh` also runs it before restarting the service.

## Deployment

> **Current state (2026-09-22):** the VPS is down, so the app is being served from **Vercel** for now. The VPS pipeline below is the standard setup and resumes when the servers are back. Note that `.github/workflows/deploy.yml` still targets the VPS, so it fails on pushes while the servers are down.

The VPS deploys are GitHub Actions driven:

- `dev` → staging
- `main` → production

The workflow builds and pushes a GHCR image, syncs `deploy/` files to `/opt/uno`, runs migrations and restarts the target service. Docker services bind only to `127.0.0.1`; Hestia/nginx owns public 80/443 and proxies to the app ports.

## Planning docs (local only)

The team keeps its sprint order (`docs/TODO.md`), backend status checklist (`vision/BACKEND_CHECKLIST.md`), daily logs (`docs/daily-log/`) and project summary (`docs/PROJECT_SUMMARY.md`) as markdown that is **gitignored** — `/docs/**/*.md` and `/vision/**/*.md` in `.gitignore`. A fresh clone won't contain them; ask the team for current status.
