import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LegalSection {
	/** Anchor target. Stable — these get linked to from elsewhere. */
	id: string;
	heading: string;
	content: ReactNode;
}

interface LegalPageProps {
	title: string;
	/** ISO date; rendered in long form. */
	lastUpdated: string;
	/**
	 * Plain-language summary shown above the formal sections. Not a substitute
	 * for the document, and the page says so.
	 */
	summary: ReactNode;
	sections: LegalSection[];
}

/**
 * Shared shell for Terms, Privacy and Cookies.
 *
 * Sections are passed as data rather than children so the table of contents
 * can be generated from the same source as the body — a ToC that's maintained
 * by hand goes stale the first time a section is renamed.
 *
 * @tailwindcss/typography isn't installed (and isn't worth adding for three
 * pages), so `legalProse` below styles bare <p>/<ul>/<a>/<strong> via child
 * selectors. That keeps the page files readable as prose instead of as a wall
 * of utility classes.
 */

export const legalProse = cn(
	"text-[15px] leading-[1.75] text-content-secondary",
	"[&_p]:mb-4",
	"[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
	"[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5",
	"[&_strong]:font-semibold [&_strong]:text-content-primary",
	"[&_a]:font-medium [&_a]:text-uno-red [&_a]:underline [&_a]:underline-offset-2",
	"[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-content-primary",
	"[&_table]:mb-4 [&_table]:w-full [&_table]:text-left [&_table]:text-[14px]",
	"[&_th]:border-b [&_th]:border-black/10 [&_th]:pb-2 [&_th]:pr-4 [&_th]:font-semibold [&_th]:text-content-primary",
	"[&_td]:border-b [&_td]:border-black/5 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top"
);

function formatDate(iso: string): string {
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) return iso;
	return parsed.toLocaleDateString("en-NG", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function LegalPage({ title, lastUpdated, summary, sections }: LegalPageProps) {
	return (
		<div className="page-container py-8 md:py-14">
			<header className="max-w-[72ch]">
				<h1 className="text-[28px] font-semibold leading-tight text-content-primary md:text-[40px]">
					{title}
				</h1>
				<p className="mt-2 text-[13px] text-content-secondary">
					Last updated {formatDate(lastUpdated)}
				</p>

				<div className="mt-6 rounded-card-sm border border-black/10 bg-bg-subtle p-4 md:p-5">
					<h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-content-secondary">
						In short
					</h2>
					<div className={legalProse}>{summary}</div>
					<p className="mt-3 text-[13px] italic text-content-secondary">
						This summary is for orientation only. The numbered sections below are
						the terms that actually apply.
					</p>
				</div>
			</header>

			<div className="mt-10 gap-12 lg:flex lg:items-start">
				{/* Table of contents — desktop only. On mobile the document is
				    short enough to scroll, and a collapsed accordion here would
				    just be another thing to tap past. */}
				<nav
					aria-label="On this page"
					className="hidden w-[240px] shrink-0 lg:sticky lg:top-24 lg:block"
				>
					<h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-content-secondary">
						On this page
					</h2>
					<ol className="space-y-2 text-[13px]">
						{sections.map((section, i) => (
							<li key={section.id}>
								<a
									href={`#${section.id}`}
									className="text-content-secondary transition-colors hover:text-uno-red"
								>
									<span className="tabular-nums">{i + 1}.</span> {section.heading}
								</a>
							</li>
						))}
					</ol>
				</nav>

				<article className="min-w-0 max-w-[72ch]">
					{sections.map((section, i) => (
						<section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
							<h2 className="mb-3 text-[18px] font-semibold text-content-primary md:text-[20px]">
								<span className="tabular-nums text-content-secondary">{i + 1}.</span>{" "}
								{section.heading}
							</h2>
							<div className={legalProse}>{section.content}</div>
						</section>
					))}
				</article>
			</div>
		</div>
	);
}
