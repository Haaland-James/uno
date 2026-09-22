/**
 * Regenerate every non-deleted property's title (including pending/rented rows).
 * Preview first: npx tsx scripts/backfill-titles.ts --dry-run
 * Apply only with explicit approval: npx tsx scripts/backfill-titles.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { generateListingTitle } from "../src/lib/listing-title";

const db = new PrismaClient();

export async function main(args = process.argv.slice(2)) {
  if (args.length !== 1 || !["--dry-run", "--apply"].includes(args[0])) {
    throw new Error("Usage: npx tsx scripts/backfill-titles.ts --dry-run|--apply");
  }
  const dryRun = args[0] === "--dry-run";
  let cursor: string | undefined;
  let scanned = 0;
  let changed = 0;
  let conflicts = 0;
  for (;;) {
    const rows = await db.property.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true, propertyKind: true, propertyType: true, listingType: true, bedrooms: true, area: true, city: true, updatedAt: true },
      orderBy: { id: "asc" }, take: 200,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (!rows.length) break;
    for (const row of rows) {
      scanned++;
      const title = generateListingTitle(row);
      if (title === row.title) continue;
      console.log(`${row.id}: ${JSON.stringify(row.title)} → ${JSON.stringify(title)}`);
      if (dryRun) {
        changed++;
      } else {
        // Avoid overwriting a concurrent edit or reviving a deleted listing.
        const result = await db.property.updateMany({
          where: { id: row.id, deletedAt: null, updatedAt: row.updatedAt }, data: { title },
        });
        changed += result.count;
        if (!result.count) conflicts++;
      }
    }
    cursor = rows[rows.length - 1].id;
  }
  console.log(`${dryRun ? "Dry run" : "Applied"}: ${scanned} scanned, ${changed} ${dryRun ? "would change" : "changed"}, ${conflicts} concurrent edits skipped.`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    // Do not dump Prisma connection details into operator logs.
    console.error(error instanceof Error && error.message.startsWith("Usage:")
      ? error.message : "Title backfill failed; check database connectivity and permissions. No further rows were processed.");
    process.exitCode = 1;
  }).finally(() => db.$disconnect());
}
