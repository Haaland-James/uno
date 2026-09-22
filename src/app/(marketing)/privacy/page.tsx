import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/../config/site";
import { resolve } from "@/lib/site";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
	title: "Privacy Policy",
	description: `How ${siteConfig.name} collects, uses, shares and protects your personal data, in line with the Nigeria Data Protection Act 2023.`,
};

const BRAND = siteConfig.name;
const SUPPORT_EMAIL = resolve(siteConfig.support.email);

const sections: LegalSection[] = [
	{
		id: "who-we-are",
		heading: "Who we are",
		content: (
			<>
				<p>
					{BRAND} is operated by {siteConfig.legalName} (RC {siteConfig.rcNumber}
					), of {siteConfig.registeredAddress}. For the personal data described in
					this policy, we are the <strong>data controller</strong> under the
					Nigeria Data Protection Act 2023 (the &ldquo;NDPA&rdquo;).
				</p>
				<p>
					For anything relating to your data &mdash; a question, a request, or a
					complaint &mdash; contact us at{" "}
					<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
				</p>
			</>
		),
	},
	{
		id: "scope",
		heading: "What this policy covers",
		content: (
			<>
				<p>
					This policy covers the personal data we handle when you use {BRAND},
					whether you are browsing without an account, signed in as a renter or
					buyer, or listing a property.
				</p>
				<p>
					It does not cover what a lister or agent does with your details after we
					introduce you to them. Once you reveal a lister&rsquo;s contact details
					and we pass on yours, that lister handles your data as their own
					controller, under their own obligations. Nor does it cover other
					websites we link to.
				</p>
			</>
		),
	},
	{
		id: "what-we-collect",
		heading: "The personal data we collect",
		content: (
			<>
				<h3>Account data</h3>
				<p>
					Your name, email address and phone number; and, if you choose to add
					them, your profile photo, gender and address. If you set a password we
					store only a cryptographic hash of it, never the password itself.
				</p>

				<h3>Verification data</h3>
				<p>
					One-time codes we send to your email or phone to sign you in, together
					with whether and when each was used. Codes are short-lived.
				</p>

				<h3>Agent and lister data</h3>
				<p>
					If you list on {BRAND} or work as one of our agents: your public profile
					(biography, photo, territory, specialisations), your verification status,
					and the properties assigned to you. Agents acting for an owner who is not
					on the platform also record that owner&rsquo;s name and phone number.
					Those owner details are private to the agent and are never shown to
					renters.
				</p>

				<h3>Listing content</h3>
				<p>
					Property details, descriptions, pricing and photographs you upload.
					Published listings are public and are indexed by search engines.
				</p>

				<h3>Contact requests</h3>
				<p>
					When you reveal a lister&rsquo;s contact details, we record your name,
					phone number, email address if you gave one, any message you sent, which
					property it concerned, which method you used, and when. This is the
					record of the introduction, and it is shared with the lister.
				</p>

				<h3>Activity data</h3>
				<p>
					The properties you favourite, the searches you save, and the listings you
					report. Reports can also be submitted without signing in.
				</p>

				<h3>Preferences</h3>
				<p>
					Your notification settings (new properties, price drops, weekly digest)
					and your language preference.
				</p>

				<h3>Technical data</h3>
				<p>
					Your IP address, browser and device type, and server log data generated
					as you use the platform, including data used to enforce rate limits and
					detect abuse. See our <Link href="/cookies">Cookie Policy</Link> for what
					we store in your browser.
				</p>
			</>
		),
	},
	{
		id: "how-we-collect",
		heading: "How we collect it",
		content: (
			<ul>
				<li>
					<strong>Directly from you</strong> &mdash; when you create an account,
					complete your profile, publish a listing, contact a lister, or email us.
				</li>
				<li>
					<strong>Automatically</strong> &mdash; technical and activity data
					generated as you use the platform.
				</li>
				<li>
					<strong>From Google</strong> &mdash; if you sign in with Google, we
					receive your name, email address and profile picture from your Google
					account. We do not receive your Google password.
				</li>
			</ul>
		),
	},
	{
		id: "why-we-process",
		heading: "Why we process it, and our lawful basis",
		content: (
			<>
				<p>
					Section 25 of the NDPA requires a lawful basis for each purpose. Ours
					are:
				</p>
				<table>
					<thead>
						<tr>
							<th>Purpose</th>
							<th>Lawful basis</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								Creating and running your account; signing you in; showing you
								listings you saved
							</td>
							<td>Performance of a contract</td>
						</tr>
						<tr>
							<td>
								Introducing you to a lister and passing them your contact details
								at your request
							</td>
							<td>Performance of a contract, at your request</td>
						</tr>
						<tr>
							<td>Publishing your listing and making it searchable</td>
							<td>Performance of a contract</td>
						</tr>
						<tr>
							<td>
								Sending you service emails &mdash; sign-in codes, lead
								notifications, account changes
							</td>
							<td>Performance of a contract</td>
						</tr>
						<tr>
							<td>
								Marketing emails, new-property alerts, price-drop alerts and the
								weekly digest
							</td>
							<td>Consent &mdash; withdrawable at any time in your settings</td>
						</tr>
						<tr>
							<td>
								Preventing fraud and abuse, moderating listings, enforcing rate
								limits, keeping the platform secure
							</td>
							<td>Legitimate interests</td>
						</tr>
						<tr>
							<td>Improving the platform and understanding how it is used</td>
							<td>Legitimate interests</td>
						</tr>
						<tr>
							<td>
								Meeting our legal obligations and responding to lawful requests
							</td>
							<td>Legal obligation</td>
						</tr>
					</tbody>
				</table>
				<p>
					Where we rely on legitimate interests, we have considered whether those
					interests are overridden by your rights. You can object to that
					processing &mdash; see <a href="#your-rights">your rights</a> below.
				</p>
			</>
		),
	},
	{
		id: "sharing",
		heading: "Who we share it with",
		content: (
			<>
				<h3>With listers, when you ask us to</h3>
				<p>
					This is the most consequential sharing we do, so we want it clear: when
					you reveal a lister&rsquo;s contact details,{" "}
					<strong>
						we give that lister your name and phone number, your email address if
						you provided one, and any message you sent
					</strong>
					, along with which property you enquired about. We do this so they can
					reply to you. It is the point of the platform, and it cannot be undone
					once it has happened.
				</p>

				<h3>What other users can see</h3>
				<p>
					If you publish a listing, your listing content is public. If you are one
					of our agents, your public profile is visible to anyone. Your email
					address, phone number and saved activity are never shown publicly.
				</p>

				<h3>Service providers</h3>
				<p>
					We use the following processors, each handling data only on our
					instructions and only for the purpose shown:
				</p>
				<table>
					<thead>
						<tr>
							<th>Provider</th>
							<th>What it handles</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Resend</td>
							<td>Sending transactional email, including sign-in codes</td>
						</tr>
						<tr>
							<td>Termii</td>
							<td>Sending one-time codes by SMS</td>
						</tr>
						<tr>
							<td>Cloudinary</td>
							<td>Storing and delivering listing and profile images</td>
						</tr>
						<tr>
							<td>Mapbox</td>
							<td>Maps, geocoding and location search</td>
						</tr>
						<tr>
							<td>Upstash</td>
							<td>Rate limiting and abuse prevention</td>
						</tr>
						<tr>
							<td>Google</td>
							<td>Sign-in, if you choose to use it</td>
						</tr>
						<tr>
							<td>Our hosting and database providers</td>
							<td>Running the platform and storing its data</td>
						</tr>
					</tbody>
				</table>

				<h3>Others</h3>
				<p>
					We may disclose personal data to law enforcement, regulators or courts
					where we are legally required to, or where it is necessary to establish
					or defend legal claims or to protect someone&rsquo;s safety. If our
					business is sold or reorganised, data may transfer to the acquirer under
					the same protections.
				</p>
				<p>
					<strong>We do not sell your personal data</strong>, and we do not share
					it with advertising networks.
				</p>
			</>
		),
	},
	{
		id: "transfers",
		heading: "Transfers outside Nigeria",
		content: (
			<p>
				Some of the providers listed above store or process data outside Nigeria.
				Where that happens, we transfer the data under Part VIII of the NDPA
				&mdash; either to a country the {siteConfig.legal.regulator} recognises as
				providing adequate protection, or under contractual safeguards that require
				the provider to protect it to an equivalent standard. You can ask us for
				details of the safeguards that apply to a particular transfer.
			</p>
		),
	},
	{
		id: "retention",
		heading: "How long we keep it",
		content: (
			<>
				<p>
					We keep personal data for as long as we need it for the purpose we
					collected it, and then delete or anonymise it.
				</p>
				<ul>
					<li>
						<strong>Active accounts</strong> &mdash; for as long as your account is
						open.
					</li>
					<li>
						<strong>Deactivated accounts</strong> &mdash; your data is retained so
						you can reactivate. Ask us to delete it permanently and we will,
						subject to the exceptions below.
					</li>
					<li>
						<strong>One-time codes</strong> &mdash; minutes; they expire quickly by
						design.
					</li>
					<li>
						<strong>Contact requests</strong> &mdash; retained as the record of an
						introduction, so that both sides have a record and so we can
						investigate disputes and fraud.
					</li>
					<li>
						<strong>Reports about listings</strong> &mdash; retained after the
						reporter&rsquo;s account is deleted, but detached from them so they are
						no longer attributable to you. Deleting a report along with its author
						would let a bad actor erase the evidence against them.
					</li>
					<li>
						<strong>Logs and security data</strong> &mdash; a short period, then
						deleted.
					</li>
				</ul>
				<p>
					We may keep data longer where the law requires it, or where it is needed
					for a legal claim that is under way.
				</p>
			</>
		),
	},
	{
		id: "your-rights",
		heading: "Your rights under the NDPA",
		content: (
			<>
				<p>You have the right to:</p>
				<ul>
					<li>
						<strong>Access</strong> &mdash; ask what personal data we hold about
						you and get a copy.
					</li>
					<li>
						<strong>Rectification</strong> &mdash; have inaccurate or incomplete
						data corrected.
					</li>
					<li>
						<strong>Erasure</strong> &mdash; ask us to delete your data, where we
						have no overriding reason to keep it.
					</li>
					<li>
						<strong>Restriction</strong> &mdash; ask us to pause processing while a
						dispute about accuracy or legitimate interests is resolved.
					</li>
					<li>
						<strong>Portability</strong> &mdash; receive the data you gave us in a
						structured, commonly used, machine-readable format.
					</li>
					<li>
						<strong>Objection</strong> &mdash; object to processing based on our
						legitimate interests, and to direct marketing at any time.
					</li>
					<li>
						<strong>Withdraw consent</strong> &mdash; where we rely on consent,
						withdraw it at any time. This does not affect processing that already
						happened.
					</li>
					<li>
						<strong>Complain</strong> &mdash; lodge a complaint with the
						supervisory authority.
					</li>
				</ul>
				<p>
					Exercising these rights is free, and we will respond within the period
					the NDPA requires. We may need to verify your identity first.
				</p>
			</>
		),
	},
	{
		id: "exercising-rights",
		heading: "How to exercise your rights",
		content: (
			<>
				<p>Many of these you can do yourself, immediately:</p>
				<ul>
					<li>
						Correct your name, email, phone and profile details in your account
						settings.
					</li>
					<li>Turn marketing and alert emails on or off in your settings.</li>
					<li>Deactivate your account from your settings.</li>
				</ul>
				<p>
					For anything else &mdash; a copy of your data, permanent deletion, an
					objection, or a portability request &mdash; email{" "}
					<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and tell us what
					you need.
				</p>
			</>
		),
	},
	{
		id: "security",
		heading: "How we protect it",
		content: (
			<>
				<p>
					We use technical and organisational measures appropriate to the risk:
					encryption in transit, hashed passwords, access controls limiting staff
					access to what their role requires, rate limiting and abuse detection,
					and vetted service providers bound by contract.
				</p>
				<p>
					No system is completely secure. You can help by keeping your one-time
					codes private, never sharing your account, and telling us promptly at{" "}
					<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you think
					something is wrong. If a breach occurs that is likely to result in a risk
					to your rights, we will notify you and the{" "}
					{siteConfig.legal.regulator} as the NDPA requires.
				</p>
			</>
		),
	},
	{
		id: "children",
		heading: "Children",
		content: (
			<p>
				{BRAND} is not for anyone under 18. We do not knowingly collect personal
				data from children. If you believe a child has given us their data, contact{" "}
				<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we will delete
				it.
			</p>
		),
	},
	{
		id: "cookies",
		heading: "Cookies",
		content: (
			<p>
				We use a small number of cookies, and today they are all strictly necessary
				to sign you in and keep the platform secure. Our{" "}
				<Link href="/cookies">Cookie Policy</Link> names each one and explains how
				to manage them.
			</p>
		),
	},
	{
		id: "changes",
		heading: "Changes to this policy",
		content: (
			<p>
				We will update this policy as the platform changes or the law requires. The
				&ldquo;last updated&rdquo; date at the top always reflects the current
				version, and we will give you notice of significant changes in the app or by
				email.
			</p>
		),
	},
	{
		id: "contact",
		heading: "Contact us and your right to complain",
		content: (
			<>
				<p>
					{siteConfig.legalName} (RC {siteConfig.rcNumber})
					<br />
					{siteConfig.registeredAddress}
					<br />
					<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
				</p>
				<p>
					Please come to us first &mdash; we would rather fix a problem than have
					you escalate it. But you always have the right to complain directly to
					the {siteConfig.legal.regulator}, whose contact details are at{" "}
					<a
						href={siteConfig.legal.regulatorUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						{siteConfig.legal.regulatorUrl.replace(/^https?:\/\//, "")}
					</a>
					.
				</p>
			</>
		),
	},
];

export default function PrivacyPage() {
	return (
		<LegalPage
			title="Privacy Policy"
			lastUpdated={siteConfig.legal.lastUpdated}
			summary={
				<>
					<p>
						We collect what we need to run {BRAND}: your contact details to make
						an account, your searches and favourites to make it useful, and your
						listings to publish them. We do not sell your data and we do not
						advertise to you.
					</p>
					<p>
						The one thing worth knowing before you use the platform:{" "}
						<strong>
							when you reveal a lister&rsquo;s contact details, we give that
							lister your name and phone number
						</strong>{" "}
						so they can reply to you.
					</p>
				</>
			}
			sections={sections}
		/>
	);
}
