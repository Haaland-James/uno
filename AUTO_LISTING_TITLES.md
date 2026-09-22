# Auto-generated listing titles (Group B / item 12)

Titles are now server-derived from property type, listing objective, residential
bedrooms, area and city. There is no title input in the wizard or edit flow.
POST and PATCH strip client-provided titles. PATCH merges changed title facts
with the existing property; price-only changes leave the title alone. The edit
UI still disables kind/objective changes. The API accepts validated listingType
patches and regenerates their title too.

The generator uses the shared type labels, dropping ` / ` alternatives. It
ignores bedroom counts for commercial/land types, treats zero residential
bedrooms as Studio, deduplicates area/city, and truncates only the location tail
to keep titles within 100 characters. Legacy types remain supported. Type-derived
kind takes precedence over stale default propertyKind values on old rows.

Draft title hints are generated once the draft has a valid type, objective,
location, and (for residential) bedroom count. Incomplete drafts keep the
existing “Untitled draft” fallback. A stale title key in an older Zustand draft
is ignored by validation and stripped by the submission schema; it is never
used to derive a title. The review step no longer reads this removed field.

## Accepted trade-offs / PR notes

- Identical properties in the same area have identical titles. Enquiry email
  subjects become ambiguous and admin title search becomes less selective.
  Inbox cards already include area/city and lead emails include the property
  location. Property URLs remain ID-based.
- The title is FTS weight A: standardising titles makes type and location terms
  dominate ranking. Check `?q=flat` pages 1–5 for distinct, stable IDs **after**
  applying the staging backfill, not just before it.
- WhatsApp prefills and Web Share text remain accurate but less distinctive.
- The residential basics step now contains only room counts and optional brief
  description. No redesign was made; visual density needs the normal UI review.
- Generated titles reflect stored facts, not old marketing copy. A misleading
  legacy title does not justify rewriting its structured fields during backfill.

## Backfill / rollout

```sh
npx tsx scripts/backfill-titles.ts --dry-run
```

This reads every non-deleted property in ID-ordered batches of 200 and prints
old → new titles without writing. The script requires exactly `--dry-run` or
`--apply`; absent/unknown flags fail closed. Only after explicit staging approval:

```sh
npx tsx scripts/backfill-titles.ts --apply
```

Apply mode uses an updatedAt guard to skip concurrent edits/deletes. Re-run a dry
run after application, review any skipped rows, and then do the pagination check.
Seeds use the same generator. Neither seeds nor apply mode were executed here.

## Verification recorded for this worktree

- `npx vitest run`: 17 files / 340 tests passed, including all three create kinds,
  PATCH regeneration, forged-title stripping, draft hints, all Prisma types,
  location edge cases, and a mocked no-write dry-run test.
- `npx tsc --noEmit`: passed.
- `npm run lint`: no errors; existing React-hook warnings in the edit page,
  renter feed and useProperties remain.
- Real `--dry-run`: 72 scanned, 72 would change, 0 concurrent edits skipped.
  The specific old title “Ekpiri Nsukarra Self Contain” becomes
  “Warehouse for Sale in Ewet Housing Estate, Ikot Ekpene”, following the stored
  WAREHOUSE/SALE/zero-bedroom facts and stored location.
- No build, commits, pushes, merges, seed execution or database mutations.

Still required on staging with explicit write permission: authenticated wizard
and edit browser walkthroughs, detail/dashboard/draft visual confirmation,
actual backfill, and the post-backfill search pagination check. Mocked route
tests exercise handlers but do not replace those browser/DB acceptance checks.
