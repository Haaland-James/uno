import { afterEach, expect, it, vi } from "vitest";

const { findUnique, update, disconnect, sendAgentCreatedEmail } = vi.hoisted(() => ({
	findUnique: vi.fn(),
	update: vi.fn(),
	disconnect: vi.fn(),
	sendAgentCreatedEmail: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
	PrismaClient: class {
		user = { findUnique, update };
		$disconnect = disconnect;
	},
}));
vi.mock("./index", async () => ({
	sendBestEffort: (await import("./render")).sendBestEffort,
	sendAgentCreatedEmail,
}));

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("keeps a committed promotion successful when the welcome email fails", async () => {
	const user = { id: "agent-test", email: "agent@example.test", name: "Test Agent" };
	findUnique.mockResolvedValueOnce(user).mockResolvedValueOnce(null);
	update.mockResolvedValue({ ...user, agentSlug: "test-agent", agentTerritory: [] });
	disconnect.mockResolvedValue(undefined);
	sendAgentCreatedEmail.mockRejectedValue(new Error("Resend unavailable"));
	const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
	const log = vi.spyOn(console, "log").mockImplementation(() => {});
	const error = vi.spyOn(console, "error").mockImplementation(() => {});
	vi.spyOn(process, "argv", "get").mockReturnValue(["node", "make-agent.ts", user.email]);

	await import("../../../scripts/make-agent");
	await vi.waitFor(() => expect(disconnect).toHaveBeenCalledOnce());

	expect(update).toHaveBeenCalledWith(expect.objectContaining({
		data: expect.objectContaining({ agentStatus: "VERIFIED", agentEmployment: "IN_HOUSE" }),
	}));
	expect(exit).not.toHaveBeenCalled();
	expect(error).toHaveBeenCalledWith("[email] agent-created failed", expect.any(Error));
	expect(log.mock.calls.flat().join("\n")).not.toMatch(/Welcome email (sent|queued)/);
}, 60_000);
