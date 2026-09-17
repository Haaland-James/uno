import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/../config/site";
import { resolve } from "@/lib/site";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
	title: "Terms of Service",
	description: `The terms that govern your use of ${siteConfig.name}, Nigeria's rental property platform.`,
};

const BRAND = siteConfig.name;
const SUPPORT_EMAIL = resolve(siteConfig.support.email);

const sections: LegalSection[] = [
	{
		id: "about",
		heading: `About ${BRAND}`,
		content: (
			<>
				<p>
					{BRAND} is operated by {siteConfig.legalName} (RC {siteConfig.rcNumber}
					), a company registered in Nigeria with its registered office at{" "}
					{siteConfig.registeredAddress}. These Terms of Service (the
					&ldquo;Terms&rdquo;) form a binding agreement between you and us. By
					using {BRAND} you accept them. If you do not accept them, please do not
					use the platform.
				</p>
				<p>
					<strong>What we are.</strong> {BRAND} is a property discovery platform.
					We publish rental and sale listings, let you search and compare them,
					and put you in direct contact with the person or agent responsible for a
					listing.
				</p>
				<p>
					<strong>What we are not.</strong> We do not own, manage, let, sell,
					survey or hold keys to any property on the platform. We are not an
					estate agent acting for you, we are not a party to any tenancy or sale
					agreement you enter into, and we are not a payment processor or escrow
					service. Once we have introduced you to a lister, whatever you agree
					with them is between you and them.
				</p>
			</>
		),
	},
	{
		id: "official-channels",
		heading: "Our brand and official channels",
		content: (
			<>
				<p>
					Property fraud in Nigeria frequently begins with an impersonated brand.
					These are our only official channels. Anything else claiming to be{" "}
					{BRAND} &mdash; another domain, a lookalike app, an unlisted social
					account, or a &ldquo;support agent&rdquo; who contacts you first &mdash;
					is not us.
				</p>
				<ul>
					<li>
						Our website, at the domain shown in your browser&rsquo;s address bar
						when you view this page.
					</li>
					<li>
						Our social accounts and support channels, listed on our{" "}
						<Link href="/contact">Contact page</Link>.
					</li>
					<li>
						Email from our own domain. We will never email you from a free webmail
						address.
					</li>
				</ul>
				<p>
					<strong>
						We will never ask you to send money to a personal bank account, and no
						member of our staff will ever ask you for your password or one-time
						code.
					</strong>{" "}
					If someone does, it is not us. Please report it to{" "}
					<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
				</p>
			</>
		),
	},
	{
		id: "eligibility",
		heading: "Eligibility",
		content: (
			<>
				<p>To use {BRAND} you must:</p>
				<ul>
					<li>be at least 18 years old;</li>
					<li>
						have the legal capacity to enter into a binding agreement under
						Nigerian law;
					</li>
					<li>provide accurate information about yourself; and</li>
					<li>use the platform only for lawful purposes.</li>
				</ul>
				<p>
					We may suspend or close any account that does not meet these
					requirements.
				</p>
			</>
		),
	},
	{
		id: "your-account",
		heading: "Your account",
		content: (
			<>
				<p>
					You can browse {BRAND} without an account. You need one to save
					properties, save searches, contact a lister, or publish a listing.
				</p>
				<p>
					We sign you in with a one-time code sent to your email or phone, or
					through your Google account. That code is the key to your account: keep
					it to yourself, and do not let anyone else use your account. Tell us
					promptly if you think someone else has access.
				</p>
				<p>
					You may deactivate your account at any time from your settings. Your
					listings and saved data are retained so that you can reactivate &mdash;
					see our <Link href="/privacy">Privacy Policy</Link> for how long, and how
					to request permanent deletion.
				</p>
			</>
		),
	},
	{
		id: "contacting-listers",
		heading: "Finding and contacting listers",
		content: (
			<>
				<p>
					When you choose to reveal a lister&rsquo;s contact details, two things
					happen, and we want them stated plainly:
				</p>
				<ul>
					<li>
						We show you that lister&rsquo;s phone or WhatsApp number so you can
						contact them directly, outside the platform.
					</li>
					<li>
						<strong>
							We share your name and phone number, and your email address if you
							provided one, with that lister
						</strong>{" "}
						so they can respond to you, and we record that the introduction
						happened.
					</li>
				</ul>
				<p>
					There is no in-app messaging on {BRAND}. Conversations, viewings,
					negotiations and agreements all happen directly between you and the
					lister. We are not a party to them, we do not monitor them, and we
					cannot verify what is said in them.
				</p>
				<p>
					Please carry out your own due diligence before committing to anything:
					inspect the property in person, verify the lister&rsquo;s authority to
					let or sell it, and see original documents.
				</p>
			</>
		),
	},
	{
		id: "listing-rules",
		heading: "Rules for listing a property",
		content: (
			<>
				<p>If you publish a listing on {BRAND}, you confirm that:</p>
				<ul>
					<li>
						the property is real, available, and described accurately &mdash;
						including its price, fees, location, size, condition and amenities;
					</li>
					<li>
						you own it or are authorised by the owner to advertise it, and you can
						evidence that authority if we ask;
					</li>
					<li>
						the photographs are of that property, are current, and are yours to
						publish;
					</li>
					<li>
						you will update or remove the listing promptly once the property is no
						longer available; and
					</li>
					<li>
						you will not publish the same property multiple times to gain
						prominence in search results.
					</li>
				</ul>
				<p>
					We may edit, unpublish or remove any listing, at any time, without
					notice, where we believe it breaches these Terms or may mislead or harm
					someone.
				</p>
			</>
		),
	},
	{
		id: "badges",
		heading: "What our badges mean",
		content: (
			<>
				<p>
					Some listings carry a <strong>&ldquo;Listed by {BRAND}&rdquo;</strong>{" "}
					badge. That means the listing was created by one of our own agents, who
					has visited the property. Some agents carry a{" "}
					<strong>&ldquo;{BRAND} Verified Agent&rdquo;</strong> badge, meaning we
					have checked their identity and their authority to act.
				</p>
				<p>
					These badges describe checks we carried out at a point in time. They are
					not a guarantee, endorsement, warranty or certification of:
				</p>
				<ul>
					<li>the condition of the property, now or later;</li>
					<li>
						the title to the property or the lister&rsquo;s right to deal in it;
					</li>
					<li>the accuracy of every detail in the listing; or</li>
					<li>the conduct of the lister or agent in dealing with you.</li>
				</ul>
				<p>
					A badge is a reason to have more confidence. It is not a substitute for
					inspecting the property and checking the documents yourself.
				</p>
			</>
		),
	},
	{
		id: "acceptable-use",
		heading: "Acceptable use",
		content: (
			<>
				<p>You must not:</p>
				<ul>
					<li>
						post false, misleading, fraudulent or fictitious listings, or listings
						for properties you have no right to advertise;
					</li>
					<li>impersonate anyone, or misrepresent your identity or affiliation;</li>
					<li>
						harass, threaten, defraud or discriminate against other users, whether
						on the platform or in the contact that follows;
					</li>
					<li>
						scrape, crawl, bulk-download or systematically extract listings, user
						details or any other data from the platform;
					</li>
					<li>
						attempt to gain unauthorised access to the platform, interfere with
						its operation, or circumvent any security measure or rate limit;
					</li>
					<li>
						use contact details obtained through {BRAND} for marketing, spam, or
						any purpose other than the property enquiry they relate to; or
					</li>
					<li>use the platform for anything unlawful under Nigerian law.</li>
				</ul>
			</>
		),
	},
	{
		id: "no-payments",
		heading: `${BRAND} never handles your money`,
		content: (
			<>
				<p>
					<strong>
						We do not collect rent, agency fees, caution deposits, inspection fees
						or any other payment. We do not hold funds in escrow, and we have no
						payment facility of any kind.
					</strong>{" "}
					Any payment you make in connection with a property is made directly to
					the lister, at your own risk.
				</p>
				<p>Because of that, please:</p>
				<ul>
					<li>
						<strong>
							never pay anyone before inspecting the property in person
						</strong>{" "}
						and confirming it is genuinely available;
					</li>
					<li>
						be sceptical of any price far below the market, of pressure to pay
						immediately, and of any reason given for why you cannot view the
						property first;
					</li>
					<li>
						verify the lister&rsquo;s identity and their authority over the
						property, and insist on seeing original documents; and
					</li>
					<li>get a written agreement and a receipt for every payment you make.</li>
				</ul>
				<p>
					If someone asks you to pay through {BRAND}, or claims that we guarantee
					or hold your payment, it is a scam. Report it to us at{" "}
					<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and to the
					Nigeria Police Force.
				</p>
			</>
		),
	},
	{
		id: "your-content",
		heading: "Content you upload",
		content: (
			<>
				<p>
					You keep ownership of the photographs, descriptions and other content you
					upload. By uploading it, you grant us a non-exclusive, royalty-free,
					worldwide licence to host, store, resize, display and distribute that
					content for the purpose of operating and promoting {BRAND}. That licence
					ends when you delete the content, except for copies retained in backups
					or where we must keep them by law.
				</p>
				<p>
					You confirm that you own the content or have permission to use it, and
					that publishing it does not infringe anyone&rsquo;s rights. If you
					believe content on {BRAND} infringes your copyright, contact us at{" "}
					<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
				</p>
			</>
		),
	},
	{
		id: "reports",
		heading: "Reports and moderation",
		content: (
			<>
				<p>
					Any listing can be reported, including by people who are not signed in.
					We review reports and may unpublish a listing, ask the lister for
					evidence, or suspend an account while we look into it.
				</p>
				<p>
					We moderate in good faith, but we do not pre-screen every listing and we
					cannot promise to detect every problem. Reporting something to us does
					not create a legal obligation on us to act in any particular way or
					within any particular time.
				</p>
			</>
		),
	},
	{
		id: "intellectual-property",
		heading: "Intellectual property",
		content: (
			<p>
				The {BRAND} name, logo, design, software and database are owned by us or our
				licensors and are protected by Nigerian and international law. You may not
				copy, adapt, reproduce or create derivative works from them without our
				written permission. Nothing in these Terms transfers any of those rights to
				you.
			</p>
		),
	},
	{
		id: "disclaimers",
		heading: "Disclaimers and limitation of liability",
		content: (
			<>
				<p>
					{BRAND} is provided &ldquo;as is&rdquo;. To the fullest extent permitted
					by Nigerian law, we exclude all warranties, whether express or implied,
					including as to accuracy, availability, merchantability and fitness for a
					particular purpose.
				</p>
				<p>In particular, we are not responsible for:</p>
				<ul>
					<li>
						the accuracy, completeness or legality of any listing, or the condition
						or title of any property;
					</li>
					<li>the conduct of any user, lister or agent, on or off the platform;</li>
					<li>
						any agreement you enter into, any payment you make, or any loss you
						suffer as a result; or
					</li>
					<li>interruptions, errors or unavailability of the platform.</li>
				</ul>
				<p>
					We are not liable for indirect, incidental, special or consequential
					loss, or for loss of profit, income, data or opportunity. Where we are
					found liable despite the above, our total liability to you is limited to
					the greater of the amount you have paid us in the twelve months before
					the claim, or &#8358;50,000.
				</p>
				<p>
					Nothing in these Terms excludes liability that cannot lawfully be
					excluded, including liability for death or personal injury caused by our
					negligence, or for our own fraud.
				</p>
			</>
		),
	},
	{
		id: "indemnity",
		heading: "Indemnity",
		content: (
			<p>
				You agree to indemnify us against any claim, loss, liability or reasonable
				cost (including legal fees) arising from your breach of these Terms, your
				misuse of the platform, any listing or content you publish, or any dispute
				between you and another user.
			</p>
		),
	},
	{
		id: "termination",
		heading: "Suspension and termination",
		content: (
			<>
				<p>
					You may stop using {BRAND} at any time and deactivate your account from
					your settings.
				</p>
				<p>
					We may suspend or terminate your access, remove your listings, or
					restrict features, where we reasonably believe you have breached these
					Terms, where we are required to by law, or where it is necessary to
					protect other users. Where it is appropriate and lawful to do so, we will
					tell you why.
				</p>
			</>
		),
	},
	{
		id: "changes",
		heading: "Changes to these Terms",
		content: (
			<p>
				We may update these Terms as the platform changes or as the law requires. We
				will update the &ldquo;last updated&rdquo; date at the top of this page, and
				for significant changes we will give you notice in the app or by email.
				Continuing to use {BRAND} after a change means you accept the updated Terms.
			</p>
		),
	},
	{
		id: "governing-law",
		heading: "Governing law and disputes",
		content: (
			<>
				<p>
					These Terms are governed by the laws of the{" "}
					{siteConfig.legal.governingLaw}.
				</p>
				<p>
					If you have a complaint, please contact us first at{" "}
					<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> &mdash; most
					issues are resolved quickly that way. If we cannot resolve it between us
					within 30 days, the dispute will be submitted to the courts of competent
					jurisdiction in Nigeria.
				</p>
			</>
		),
	},
	{
		id: "contact",
		heading: "Contact us",
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
					All our support channels are listed on the{" "}
					<Link href="/contact">Contact page</Link>.
				</p>
			</>
		),
	},
];

export default function TermsPage() {
	return (
		<LegalPage
			title="Terms of Service"
			lastUpdated={siteConfig.legal.lastUpdated}
			summary={
				<p>
					{BRAND} helps you find a property and puts you in touch with whoever is
					letting or selling it. We do not own or manage those properties, we are
					not a party to your agreement with the lister, and{" "}
					<strong>we never take or hold your money</strong>. Inspect a property in
					person before you pay anyone anything.
				</p>
			}
			sections={sections}
		/>
	);
}
