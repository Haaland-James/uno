import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/../config/site";
import { resolve } from "@/lib/site";
import { CONSENT_COOKIE } from "@/lib/consent";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { ReopenCookiePreferences } from "@/components/legal/ReopenCookiePreferences";

export const metadata: Metadata = {
	title: "Cookie Policy",
	description: `The cookies ${siteConfig.name} sets, what each one does, and how to manage them.`,
};

const BRAND = siteConfig.name;
const SUPPORT_EMAIL = resolve(siteConfig.support.email);

const sections: LegalSection[] = [
	{
		id: "what-are-cookies",
		heading: "What cookies are",
		content: (
			<>
				<p>
					A cookie is a small text file a website asks your browser to store. On
					later visits the browser sends it back, which is how a site can recognise
					that you are still signed in.
				</p>
				<p>
					Cookies set by the site you are visiting are called{" "}
					<strong>first-party</strong> cookies. Cookies set by someone else, often
					to track you across different sites, are called{" "}
					<strong>third-party</strong> cookies. Every cookie {BRAND} sets is
					first-party.
				</p>
			</>
		),
	},
	{
		id: "what-we-use",
		heading: "The cookies we use",
		content: (
			<>
				<h3>Strictly necessary &mdash; in use</h3>
				<p>
					These make the platform work. Without them you could not sign in and we
					could not keep your session secure. They cannot be switched off, and
					under the NDPA they do not require your consent.
				</p>
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Purpose</th>
							<th>Duration</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<code>next-auth.session-token</code>
							</td>
							<td>Keeps you signed in between page loads</td>
							<td>Session, or up to 30 days if you stay signed in</td>
						</tr>
						<tr>
							<td>
								<code>next-auth.csrf-token</code>
							</td>
							<td>
								Protects sign-in and account forms against cross-site request
								forgery
							</td>
							<td>Session</td>
						</tr>
						<tr>
							<td>
								<code>next-auth.callback-url</code>
							</td>
							<td>
								Returns you to the page you were on after you finish signing in
							</td>
							<td>Session</td>
						</tr>
						<tr>
							<td>
								<code>{CONSENT_COOKIE}</code>
							</td>
							<td>
								Remembers your cookie choice, so we do not ask again on every
								visit
							</td>
							<td>12 months</td>
						</tr>
					</tbody>
				</table>

				<h3>Analytics &mdash; not currently in use</h3>
				<p>
					We do not currently run any analytics or measurement tool, and no
					analytics cookie is set. We may add one so we can understand which
					features people actually use. If we do, it will only ever be set after
					you have accepted non-essential cookies, and this page will be updated to
					name it before it goes live.
				</p>

				<h3>Advertising &mdash; none</h3>
				<p>
					We do not run advertising, we set no advertising or retargeting cookies,
					and we do not share your data with ad networks. We have no plans to
					change this.
				</p>
			</>
		),
	},
	{
		id: "your-choices",
		heading: "Managing your choices",
		content: (
			<>
				<p>
					The first time you visit, we ask whether to allow non-essential cookies.
					You can change that decision whenever you like:
				</p>
				<ReopenCookiePreferences />
				<p>
					Because we set no non-essential cookies today, choosing &ldquo;Essential
					only&rdquo; and choosing &ldquo;Accept all&rdquo; currently result in
					exactly the same cookies being stored. The difference matters from the
					moment we add analytics &mdash; at which point your stored choice is
					already recorded and will be respected.
				</p>
			</>
		),
	},
	{
		id: "browser-controls",
		heading: "Browser-level controls",
		content: (
			<>
				<p>
					You can also block or delete cookies in your browser settings, usually
					under Privacy or Site settings. Most browsers let you clear cookies for a
					single site, block third-party cookies, or refuse all cookies.
				</p>
				<p>
					Blocking our strictly necessary cookies will stop you being able to sign
					in, save a property or contact a lister &mdash; browsing will still work.
				</p>
			</>
		),
	},
	{
		id: "changes",
		heading: "Changes and contact",
		content: (
			<>
				<p>
					We will update this page whenever the cookies we set change, and always
					before a new category is introduced. The &ldquo;last updated&rdquo; date
					at the top reflects the current version.
				</p>
				<p>
					Questions? Email{" "}
					<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. See also our{" "}
					<Link href="/privacy">Privacy Policy</Link> and{" "}
					<Link href="/terms">Terms of Service</Link>.
				</p>
			</>
		),
	},
];

export default function CookiesPage() {
	return (
		<LegalPage
			title="Cookie Policy"
			lastUpdated={siteConfig.legal.lastUpdated}
			summary={
				<p>
					{BRAND} sets four cookies, all of them first-party, and all of them
					needed to sign you in and keep your session secure.{" "}
					<strong>
						We run no analytics and no advertising cookies, and we do not track you
						across other websites.
					</strong>
				</p>
			}
			sections={sections}
		/>
	);
}
