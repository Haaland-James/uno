import { redirect } from "next/navigation";

/**
 * Legacy redirect — /search now lives at /properties (state-first hierarchy).
 * Preserves any query params on the way through.
 */
export default function SearchRedirect({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((vv) => sp.append(k, vv));
    else sp.set(k, v);
  }
  const qs = sp.toString();
  redirect(`/properties${qs ? `?${qs}` : ""}`);
}
