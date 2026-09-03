# UNO — Completion TODOs

Two-week plan to drive Phase 1 (Akwa Ibom, in-house agents) to launch-ready.
Ordered by launch-blocking impact. Updated 2026-09-03.

## This week — launch blockers & core polish

### P0 — must fix before any real users
- [ ] **Remove/gate the mock-data fallback.** `/api/properties` and
      `/api/properties/featured` return `mockProperties` when the DB query is
      empty. Gate behind `USE_MOCK_DATA` env (default off) or delete. Ensure
      empty-state UI shows instead of fake listings.
- [ ] **Contact-lead notification to landlord/agent.** On `POST /api/contacts`,
      email (and later push) the lister that a renter reached out. Right now
      leads sit silently in the inbox. Respect contact prefs.
- [ ] **Verification decision emails.** When admin approves/rejects a listing,
      email the owner (approved → live link; rejected → reason from
      `rejectionReason`).

### P1 — completeness gaps that users will hit
- [ ] **Wire the landlord analytics page.** `(listing)/listing/analytics` is a
      static "No data yet" placeholder. Port the working agent analytics page
      (views/contacts totals, 6-month charts, top listings, conversion %).
- [ ] **Basic test + CI setup.** Add Vitest + a GitHub Actions workflow running
      `lint`, `tsc --noEmit`, and unit tests on PRs. Cover the highest-risk pure
      logic first: `gate.ts`, `property-mappers.ts`, `search` query builder,
      fee/price formatting.
- [ ] **Root README.** Setup, env vars, scripts, architecture pointer to
      `docs/PROJECT_SUMMARY.md`.

## Next week — the notification engine & pre-launch hardening

### P1 — saved-search / notifications engine (biggest missing subsystem)
- [ ] **Saved-search matching job.** A scheduled task that, per active
      `SavedSearch`, finds new `ACTIVE` properties since `lastCheckedAt`,
      updates `newResultsCount`, and stamps `lastCheckedAt`.
- [ ] **Deliver notifications.** For matches, send instant email
      (`notifyEmail`) and surface in-app badge (`notifyInstant`). Honor
      `User.notifyNewProperties`.
- [ ] **Weekly digest + price-drop alerts.** Batch email for
      `notifyWeeklyDigest`; on rent change, alert favouriters with
      `notifyPriceDrops`.
- [ ] Decide the scheduler: Vercel Cron vs. external. Add the endpoint(s) with a
      shared-secret guard.

### P2 — pre-launch hardening
- [ ] **Security pass.** Run `/security-review`; confirm authz on every
      `/api/admin/*` and `/api/agent/*` route, Mapbox server token never in
      client bundle, Cloudinary signed uploads locked down, rate limits on
      auth + contact + report.
- [ ] **SEO/meta + OG images** for property detail and search pages.
- [ ] **Error + empty + loading states** audit across renter pages.
- [ ] **Seed a realistic Akwa Ibom dataset** for staging (replaces mock
      fallback as the "looks populated" solution).
- [ ] **Analytics/observability**: pageview + event tracking, error monitoring
      (e.g. Sentry).

## Backlog / Phase 2 (not this sprint)
- Agent reviews write API + UI (`AgentReview` table already exists).
- Monetization: `subscriptionTier`, `listingCredits`, listing packages.
- External/self-serve agents (`AgentEmployment.EXTERNAL`, `AgentBusinessType`).
- Multi-state expansion beyond Akwa Ibom.
