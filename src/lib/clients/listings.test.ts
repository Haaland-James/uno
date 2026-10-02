import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiValidationError, listingsClient, validationErrorFrom } from "./listings";

const respond = (status: number, body: unknown, raw = false) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(raw ? (body as string) : JSON.stringify(body), { status })));

const validation = (fieldErrors: Record<string, string[]>, formErrors: string[] = []) => ({
  error: { code: "validation_error", message: "Invalid request", details: { formErrors, fieldErrors } },
});

afterEach(() => vi.unstubAllGlobals());

describe("a refused save", () => {
  it("throws an ApiValidationError that carries the server's field messages", async () => {
    respond(400, validation({ salePrice: ["Maximum price is ₦1,000,000,000,000"] }));
    const error = await listingsClient.create({}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiValidationError);
    expect(error.fieldErrors).toEqual({ salePrice: ["Maximum price is ₦1,000,000,000,000"] });
  });

  it("keeps .message useful for callers that only show e.message, never a bare 'Invalid request'", async () => {
    respond(400, validation({ salePrice: ["Maximum price is ₦1,000,000,000,000"] }));
    const one = await listingsClient.create({}).catch((e) => e);
    expect(one.message).toBe("Maximum price is ₦1,000,000,000,000");

    respond(400, validation({ salePrice: ["Maximum price is ₦1,000,000,000,000"], contactEmail: ["Enter a valid contact email"] }));
    const two = await listingsClient.update("p1", {}).catch((e) => e);
    expect(two.message).toBe("Maximum price is ₦1,000,000,000,000 and 1 more");
    expect(two.message).not.toMatch(/invalid request/i);
  });

  it("falls back to a plain sentence when there are no field messages at all", () => {
    expect(new ApiValidationError({}).message).toMatch(/need fixing/);
  });

  it("counts form-level errors too", () => {
    expect(new ApiValidationError({}, ["Something at the top level"]).message).toBe("Something at the top level");
  });

  it("ignores non-string noise in details", () => {
    const e = validationErrorFrom({ error: { code: "validation_error", details: { fieldErrors: { a: [1, "Real message"], b: "nope", c: [] } } } });
    expect(e?.fieldErrors).toEqual({ a: ["Real message"] });
  });

  it("returns null when it isn't a validation error with details", () => {
    expect(validationErrorFrom(null)).toBeNull();
    expect(validationErrorFrom({ error: { code: "forbidden", message: "No" } })).toBeNull();
    expect(validationErrorFrom({ error: { code: "validation_error", message: "Invalid request" } })).toBeNull();
  });
});

describe("other failures keep today's messages", () => {
  it("403 forbidden", async () => {
    respond(403, { error: { code: "forbidden", message: "Listing is currently limited to Hoomefynda agents." } });
    const e = await listingsClient.create({}).catch((x) => x);
    expect(e).not.toBeInstanceOf(ApiValidationError);
    expect(e.message).toBe("Listing is currently limited to Hoomefynda agents.");
  });

  it("500 server error", async () => {
    respond(500, { error: { code: "server_error", message: "Could not create listing: boom" } });
    expect((await listingsClient.create({}).catch((x) => x)).message).toBe("Could not create listing: boom");
  });

  it("a non-JSON failure", async () => {
    respond(502, "<html>Bad gateway</html>", true);
    expect((await listingsClient.create({}).catch((x) => x)).message).toMatch(/Request failed \(502\)/);
  });

  it("a network failure is passed through untouched", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    expect((await listingsClient.create({}).catch((x) => x)).message).toBe("Failed to fetch");
  });
});
