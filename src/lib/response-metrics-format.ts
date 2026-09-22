/** Client-safe formatting; keep database imports out of the detail page bundle. */
export function formatResponseTime(minutes: number): string {
  if (minutes < 60) return "under an hour";
  if (minutes < 720) {
    const hours = Math.round(minutes / 60);
    return `about ${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  if (minutes < 1440) return "within a day";
  const days = Math.round(minutes / 1440);
  return `about ${days} ${days === 1 ? "day" : "days"}`;
}
