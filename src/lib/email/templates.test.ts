import { beforeEach, expect, it, vi } from "vitest";
import { sendContactLeadEmail } from "./templates";
import { sendEmail } from "./render";

// Keep the real HTML/text renderers; replace only the network boundary.
vi.mock("./render", async (importOriginal) => ({
	...(await importOriginal<typeof import("./render")>()),
	sendEmail: vi.fn().mockResolvedValue({ id: "test-email" }),
}));

beforeEach(() => vi.clearAllMocks());

it.each(["PHONE", "WHATSAPP", "EMAIL"] as const)(
	"renders only the inbox CTA when a %s lead has no contact details",
	async (contactMethod) => {
		await sendContactLeadEmail({
			to: "lister@example.test",
			tenantName: "Test Renter",
			tenantPhone: "",
			tenantEmail: null,
			contactMethod,
			propertyTitle: "Flat for Rent in Uyo",
			propertyLocation: "Uyo",
		});
		const { html, text } = vi.mocked(sendEmail).mock.calls[0][0];
		expect(html).not.toContain('href="tel:"');
		expect(html).not.toContain('href="mailto:"');
		expect(html.match(/<a\s/g)).toHaveLength(1);
		expect(html).toContain("View full enquiry</a>");
		expect(text).not.toContain("tel:");
		expect(text.match(/View full enquiry:/g)).toHaveLength(1);
	}
);
