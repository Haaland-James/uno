# API Hardening Notes

Last audited: 2026-07-03 (branch `fix/api-hardening`).

## Rate limits (Upstash, `src/lib/ratelimit.ts`)

| Limiter | Key | Limit | Applied in |
|---|---|---|---|
| `otpRequestLimiter` | email | 3 / 1h | `POST /api/auth/request-otp` |
| `otpVerifyLimiter` | email | 5 / 10m | NextAuth `otp` provider `authorize()` (`src/lib/auth.ts`) |
| `authIpLimiter` | IP | 10 / 1m | `request-otp`, `has-password` |
| `geocodeLimiter` | IP | 30 / 1m | `/api/geocode`, `/api/reverse-geocode` |
| `contactRequestLimiter` | user | 10 / 1h | `POST /api/contacts` |
| `uploadSignLimiter` | user | 60 / 1h | `POST /api/uploads/sign` |
| `listingCreateLimiter` | user | 20 / 1h | `POST /api/properties` |
| `reportLimiter` | IP | 5 / 1h | `POST /api/properties/[id]/report` |

OTP brute-force is double-covered: the Upstash window (per email, survives
code rotation) plus the per-code DB attempts counter in `src/lib/otp.ts`
(5 attempts, 10-minute TTL).

Public search (`GET /api/properties`) is intentionally not rate-limited:
queries are Zod-capped (`pageSize` ≤ 50) and adding a limiter would add
Upstash latency to every browse request. Revisit if abuse shows up.

### IP extraction caveat

`getClientIp()` (`src/lib/api.ts`) trusts `x-forwarded-for`. Safe on Vercel
(platform overwrites the header). **Before the VPS migration**, the reverse
proxy must strip and re-set `x-forwarded-for`, or all per-IP limits become
spoofable.

## Image uploads

Uploads go browser → Cloudinary directly; file bytes never touch our server,
so validation lives in three places:

1. **Signature** — `/api/uploads/sign` signs `allowed_formats`
   (`jpg,jpeg,png,webp,avif,heic`) into the upload params. Cloudinary
   enforces this by decoding the file bytes (real mime sniffing), not by
   extension. Clients must send the param verbatim or the signature fails.
2. **Client** — image-type and 5 MB checks in `PhotosStep.tsx` / `AvatarRow.tsx`
   (UX only, not a security boundary).
3. **Server** — `propertyWizardSubmitSchema` / `propertyUpdateSchema` pin photo
   URLs to `res.cloudinary.com/<our-cloud>/` (or `images.unsplash.com` for
   seeded listings), so the upload flow can't be bypassed by POSTing foreign
   URLs. Max 30 photos per listing.

**Dashboard task (one-time):** in Cloudinary → Settings → Security, set the
max image file size (5 MB) so oversized files are rejected account-wide even
if a client skips compression.

## CORS / CSRF posture

No `Access-Control-Allow-Origin` headers are set anywhere — intentional.
The API is same-origin only: browsers block cross-origin reads by default,
and NextAuth's `SameSite=Lax` session cookie is not sent on cross-site
POSTs, which covers CSRF for the JSON mutation routes. **Do not add
permissive CORS headers**; if a partner API is ever needed, expose a
separate, token-authenticated surface instead.

## Auth guards

`src/middleware.ts` matcher **excludes `/api`** — every API route self-guards
via `getServerSession` / `requireAdmin` (`src/lib/admin.ts`) /
`requireAgent` (`src/lib/agent.ts`). Deliberately public endpoints:
property/search GETs, `request-otp`, `has-password` (throttled),
`properties/[id]/report` (throttled + per-user dedup).

## Mapbox tokens

- `NEXT_PUBLIC_MAPBOX_TOKEN` — client bundle; tiles/styles scopes only.
  **Dashboard task (one-time):** Mapbox dashboard → token → URL restrictions;
  allowlist the prod domain and `*.vercel.app` previews.
- `MAPBOX_SERVER_TOKEN` — geocoding scopes, server-only, no URL restriction;
  used by the rate-limited `/api/geocode` + `/api/reverse-geocode` proxies.
