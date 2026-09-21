import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ListerResponseMetrics } from "@/components/property/ListerResponseMetrics";

const listedBy = { name: "Owner", company: "", responseRate: 91.6, avgResponseTime: 180 };
describe("detail response metrics UI", () => {
  it.each(["mobile", "desktop"] as const)("renders the %s stats with human-readable time", (placement) => {
    const html = renderToStaticMarkup(createElement(ListerResponseMetrics, { listedBy, listedByAgent: false, placement }));
    expect(html).toContain("Responds to 92% of enquiries");
    expect(html).toContain("usually takes about 3 hours");
    expect(html).toContain(`data-response-metrics="${placement}"`);
    if (placement === "mobile") expect(html).toContain("md:hidden");
  });
  it.each(["mobile", "desktop"] as const)("hides agent and low-sample stats on %s", (placement) => {
    expect(renderToStaticMarkup(createElement(ListerResponseMetrics, { listedBy, listedByAgent: true, placement }))).toBe("");
    expect(renderToStaticMarkup(createElement(ListerResponseMetrics, { listedBy: { ...listedBy, responseRate: null, avgResponseTime: null }, listedByAgent: false, placement }))).toBe("");
  });
  it("shows an honest zero rate for an adequate unanswered sample, with no invented time", () => {
    const html = renderToStaticMarkup(createElement(ListerResponseMetrics, { listedBy: { ...listedBy, responseRate: 0, avgResponseTime: null }, listedByAgent: false, placement: "desktop" }));
    expect(html).toContain("Responds to 0% of enquiries");
    expect(html).not.toContain("usually");
  });
  it("wires both placements to the real detail page and agent flag", () => {
    const page = readFileSync(new URL("../app/(renter)/property/[id]/page.tsx", import.meta.url), "utf8");
    for (const placement of ["mobile", "desktop"]) {
      expect(page).toContain(`<ListerResponseMetrics listedBy={property.listedBy} listedByAgent={property.listedByAgent} placement="${placement}" />`);
    }
  });
});
