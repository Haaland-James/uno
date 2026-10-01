import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ status: "unauthenticated" as "authenticated" | "unauthenticated" | "loading" }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ status: session.status }) }));
import { logoHref } from "./logo-href";
import { LogoLink } from "@/components/shared/LogoLink";

// The unit-test config has no automatic JSX runtime; the component only needs React when it renders.
(globalThis as Record<string, unknown>).React = React;

describe("logoHref", () => {
	it("sends signed-in users to their feed", () => expect(logoHref(true)).toBe("/feed"));
	it("sends guests to the homepage", () => expect(logoHref(false)).toBe("/"));
});

describe("LogoLink", () => {
	beforeEach(() => { session.status = "unauthenticated"; });
	const html = () => renderToStaticMarkup(createElement(LogoLink, null, createElement("span", null, "logo")));

	it("links a guest's logo to /", () => expect(html()).toContain('href="/"'));
	it("links a signed-in user's logo to /feed", () => {
		session.status = "authenticated";
		expect(html()).toContain('href="/feed"');
	});
	it("treats a session that is still loading like a guest (the homepage is a safe default)", () => {
		session.status = "loading";
		expect(html()).toContain('href="/"');
	});
	it("renders the logo markup it wraps, unchanged", () => expect(html()).toContain("<span>logo</span>"));
});
