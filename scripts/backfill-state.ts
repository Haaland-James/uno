/**
 * Backfill Property.state for existing rows that were created before the
 * state column was added.
 *
 * Strategy (in order):
 *   1. Reverse-lookup LGA → state from LGAS_BY_STATE (most reliable)
 *   2. Match city directly against NIGERIAN_STATES list
 *   3. Leave NULL — agent will need to re-save the listing
 *
 * Usage:
 *   npx tsx scripts/backfill-state.ts
 *   npx tsx scripts/backfill-state.ts --dry-run   (preview without writing)
 */

import { PrismaClient } from "@prisma/client";
import { LGAS_BY_STATE, NIGERIAN_STATES } from "../config/constants";

const db = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

// Build reverse map: LGA name (lowercase) → state
const lgaToState = new Map<string, string>();
for (const [state, lgas] of Object.entries(LGAS_BY_STATE)) {
	for (const lga of lgas) {
		lgaToState.set(lga.toLowerCase(), state);
	}
}

// State names set for city fallback (lowercase)
const stateNames = new Set(NIGERIAN_STATES.map((s) => s.toLowerCase()));

function inferState(lga: string | null, city: string): string | null {
	// 1. LGA match
	if (lga) {
		const byLga = lgaToState.get(lga.toLowerCase());
		if (byLga) return byLga;
		// Partial LGA match (handles slight variations)
		for (const [lgaKey, state] of lgaToState) {
			if (lga.toLowerCase().includes(lgaKey) || lgaKey.includes(lga.toLowerCase())) {
				return state;
			}
		}
	}

	// 2. City matches a state name exactly (e.g. city="Lagos")
	if (stateNames.has(city.toLowerCase())) {
		const match = NIGERIAN_STATES.find((s) => s.toLowerCase() === city.toLowerCase());
		if (match) return match;
	}

	// 3. City is inside a state name (e.g. city="Uyo" is the capital of Akwa Ibom)
	// Map well-known capitals/cities to their states
	const cityToState: Record<string, string> = {
		"uyo": "Akwa Ibom",
		"ikot ekpene": "Akwa Ibom",
		"eket": "Akwa Ibom",
		"oron": "Akwa Ibom",
		"lagos": "Lagos",
		"ikeja": "Lagos",
		"abuja": "Abuja (FCT)",
		"port harcourt": "Rivers",
		"ph": "Rivers",
		"calabar": "Cross River",
		"benin": "Edo",
		"benin city": "Edo",
		"warri": "Delta",
		"asaba": "Delta",
		"ibadan": "Oyo",
		"kano": "Kano",
		"enugu": "Enugu",
	};
	const byCity = cityToState[city.toLowerCase()];
	if (byCity) return byCity;

	return null;
}

async function main() {
	const properties = await db.property.findMany({
		where: { state: null },
		select: { id: true, city: true, lga: true },
	});

	console.log(`Found ${properties.length} properties without a state.`);
	if (dryRun) console.log("DRY RUN — no writes will be made.\n");

	let matched = 0;
	let unmatched = 0;

	for (const p of properties) {
		const inferred = inferState(p.lga, p.city);

		if (inferred) {
			matched++;
			console.log(`✓ [${p.id.slice(-6)}] city="${p.city}" lga="${p.lga}" → ${inferred}`);
			if (!dryRun) {
				await db.property.update({ where: { id: p.id }, data: { state: inferred } });
			}
		} else {
			unmatched++;
			console.log(`✗ [${p.id.slice(-6)}] city="${p.city}" lga="${p.lga}" → could not infer`);
		}
	}

	console.log(`\nSummary: ${matched} matched, ${unmatched} unmatched out of ${properties.length} total.`);
	if (unmatched > 0) {
		console.log("Unmatched properties will have state=NULL until the agent re-saves them.");
	}
	if (dryRun) console.log("\nRe-run without --dry-run to apply.");
}

main()
	.catch((e) => { console.error(e); process.exit(1); })
	.finally(() => db.$disconnect());
