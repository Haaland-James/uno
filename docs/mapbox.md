# Mapbox setup

UNO uses two Mapbox tokens. Splitting them lets us URL-restrict the public one
without breaking server-side geocoding, and keeps geocoding-scoped credentials
out of the client bundle.

## Tokens

| env var | exposed to browser? | scopes | restriction |
|---|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | yes (tiles load from the browser) | `styles:read`, `fonts:read`, `tiles:read` | URL allowlist: prod + preview domains |
| `MAPBOX_SERVER_TOKEN` | no | `geocoding:read` | none (server-only) |

### Generate them

1. https://account.mapbox.com/access-tokens → **Create a token**.
2. **Public token** — name it `uno-public-<env>`. Tick only the three `*:read`
   scopes above. Under *URL restrictions*, add:
   - `http://localhost:3000/*` (dev)
   - `https://*.vercel.app/*` (preview)
   - `https://<prod-domain>/*`
3. **Server token** — name it `uno-server-<env>`. Tick `geocoding:read`. Leave
   URL restrictions empty.

### Wire up

Copy the values into `.env.local` (and the equivalent in Vercel project
settings). Rotating the public token requires only a redeploy; the server token
never appears in client bundles.

## What hits which token

- Map tiles + style (browser) → `NEXT_PUBLIC_MAPBOX_TOKEN`
- Listing-wizard address autocomplete → `/api/geocode` → `MAPBOX_SERVER_TOKEN`
- Pin-drag reverse geocode → `/api/reverse-geocode` → `MAPBOX_SERVER_TOKEN`

Both proxies are rate-limited to 30 req/min/IP (see `geocodeLimiter` in
`src/lib/ratelimit.ts`).
