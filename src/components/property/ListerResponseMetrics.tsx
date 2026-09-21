import React from "react";
import { formatResponseTime } from "@/lib/response-metrics-format";
import type { PropertyDetailData } from "@/types/property";

/** Both detail-page placements share wording and suppression rules. */
export function ListerResponseMetrics({ listedBy, listedByAgent, placement }: {
  listedBy: PropertyDetailData["listedBy"];
  listedByAgent?: boolean;
  placement: "mobile" | "desktop";
}) {
  if (listedByAgent || listedBy.responseRate == null) return null;
  const time = listedBy.avgResponseTime;
  return (
    <p data-response-metrics={placement} className={placement === "mobile"
      ? "md:hidden text-[13px] text-black/70"
      : "px-3 text-center text-[13px] text-black/70"}>
      Responds to {Math.round(listedBy.responseRate)}% of enquiries
      {time !== null && ` · usually ${time < 60 || (time >= 720 && time < 1440) ? "responds " : "takes "}${formatResponseTime(time)}`}
    </p>
  );
}
