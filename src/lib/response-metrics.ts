type ResponseSample = { createdAt: Date; respondedAt: Date | null };

/** Recompute from source rows, not denormalized Property.contactCount. */
export async function recomputeResponseMetrics(landlordId: string): Promise<void> {
  // Lazy import keeps the arithmetic independently usable without a database.
  const { db } = await import("@/lib/db");
  await db.$transaction(async (tx) => {
    // Transaction-scoped, cross-process lock also works before a profile exists.
    // ReadCommitted gives the source query a fresh snapshot AFTER any lock wait.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${landlordId}, 0))`;
    const rows = await tx.contactRequest.findMany({
      where: { property: { landlordId, deletedAt: null } },
      select: { createdAt: true, respondedAt: true },
    });
    const { responseRate, avgResponseTime } = calculateResponseMetrics(rows);
    await tx.landlordProfile.upsert({
      where: { userId: landlordId },
      create: { userId: landlordId, responseRate, avgResponseTime },
      update: { responseRate, avgResponseTime },
    });
  }, { isolationLevel: "ReadCommitted" });
}

/** Await the attempt (safe in serverless), but never undo a successful source write. */
export async function refreshResponseMetrics(landlordId: string): Promise<void> {
  try {
    await recomputeResponseMetrics(landlordId);
  } catch (error) {
    console.error("[metrics] Response metrics refresh failed", error);
  }
}

/** Rate uses all enquiries; the average uses responses only. Stored minutes are integers. */
export function calculateResponseMetrics(rows: ResponseSample[]) {
  const responses = rows.filter((row) => row.respondedAt !== null);
  return {
    responseRate: rows.length ? (responses.length / rows.length) * 100 : 0,
    avgResponseTime: responses.length ? Math.round(responses.reduce((sum, row) =>
      sum + (row.respondedAt!.getTime() - row.createdAt.getTime()) / 60_000, 0) / responses.length) : null,
    sampleSize: rows.length,
  };
}
