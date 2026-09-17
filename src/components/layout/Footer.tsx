import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { siteConfig } from "@/../config/site";
import { isPlaceholder, resolve, supportWhatsAppLink } from "@/lib/site";
import { PERIPHERY_LINKS, LISTINGS_LINKS, type NavLink } from "@/lib/nav-links";

const BRAND = siteConfig.name;
const SUPPORT_EMAIL = resolve(siteConfig.support.email);

const contactLinks: NavLink[] = [{ label: "Email Us", href: `mailto:${SUPPORT_EMAIL}` }];

function LinkColumn({
  heading,
  links,
  className,
}: {
  heading?: string;
  links: NavLink[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {heading && (
        <span className="text-[20px] font-medium text-[rgba(22,21,21,0.63)] mb-[10px]">
          {heading}
        </span>
      )}
      <div className="flex flex-col gap-[8px]">
        {links.map((link) =>
          link.href.startsWith("mailto:") ? (
            <a
              key={link.label}
              href={link.href}
              className="text-[17px] font-semibold text-[#161515] hover:text-[#af2525] transition-colors"
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.label}
              href={link.href}
              className="text-[17px] font-semibold text-[#161515] hover:text-[#af2525] transition-colors"
            >
              {link.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

/** Support line. Omits channels whose config value is still a TODO placeholder. */
function SupportLine({ compact = false }: { compact?: boolean }) {
  const hasWhatsApp = !isPlaceholder(siteConfig.support.whatsapp);
  return (
    <>
      For support:{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
        {SUPPORT_EMAIL}
      </a>
      {!compact && hasWhatsApp && (
        <>
          {" "}
          |{" "}
          <a href={supportWhatsAppLink()} className="underline">
            WhatsApp
          </a>
        </>
      )}{" "}
      | {siteConfig.support.hours}
    </>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#faf9f9]">
      {/* Desktop layout */}
      <div className="hidden md:flex flex-col justify-end mx-auto max-w-[1440px] px-[42px] py-[25px]">
        <div className="flex flex-col gap-[16px]">
          {/* Main content */}
          <div className="flex flex-col gap-[50px] pb-[5px]">
            {/* Columns row */}
            <div className="flex items-start">
              <div className="flex gap-[103px] items-start">
                {/* Column 1 — Find us */}
                <LinkColumn
                  heading="Find us"
                  links={PERIPHERY_LINKS}
                  className="w-[163px] shrink-0"
                />

                {/* Column 2 — Contact */}
                <LinkColumn
                  heading="Contact"
                  links={contactLinks}
                  className="w-[115px] shrink-0"
                />

                {/* Column 3 — Listings (no heading) */}
                <LinkColumn links={LISTINGS_LINKS} className="w-[127px] shrink-0" />

                {/* Column 4 — Legal text */}
                <div className="flex flex-col gap-0 max-w-[611px]">
                  <p className="text-[15px] font-normal text-black leading-normal">
                    By using {BRAND}, you agree to our{" "}
                    <Link href="/terms" className="underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline">
                      Privacy Policy
                    </Link>
                    . We do not sell or share your personal information. {BRAND} and
                    all {BRAND} variants and logos are trademarks of{" "}
                    {siteConfig.legalName}, registered or pending with the Corporate
                    Affairs Commission (CAC).
                  </p>
                  <p className="text-[15px] font-normal text-black leading-normal">
                    All property listings are subject to verification. {BRAND} acts as a
                    platform connecting property seekers with verified property listings.
                    Users should conduct due diligence before entering rental agreements.
                  </p>
                  <p className="text-[15px] font-normal text-black leading-normal">
                    <SupportLine />
                  </p>
                </div>
              </div>

              {/* House illustration */}
              <div className="ml-auto flex items-end justify-end self-end">
                <Home size={160} strokeWidth={0.8} className="text-[#af2525]/20" />
              </div>
            </div>

            {/* Logo row */}
            <Logo className="h-8 w-auto" />
          </div>

          {/* Divider + copyright */}
          <div className="flex flex-col gap-[16px]">
            <hr className="border-t border-[rgba(0,0,0,0.1)]" />
            <p className="text-[15px] font-normal text-black">
              © {year} {BRAND}. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden px-[16px] py-[25px]">
        {/* Row 1: Find us + Contact side by side */}
        <div className="flex flex-row gap-[50px] mb-[24px]">
          <LinkColumn heading="Find us" links={PERIPHERY_LINKS} />
          <LinkColumn heading="Contact" links={contactLinks} />
        </div>

        {/* Row 2: Listings */}
        <div className="mb-[24px]">
          <LinkColumn links={LISTINGS_LINKS} />
        </div>

        {/* Row 3: Legal text */}
        <div className="flex flex-col gap-[8px] mb-[24px]">
          <p className="text-[14px] font-normal text-black leading-relaxed">
            By using {BRAND}, you agree to our{" "}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            . We do not sell or share your personal information.
          </p>
          <p className="text-[14px] font-normal text-black leading-relaxed">
            All property listings are subject to verification. {BRAND} acts as a platform
            connecting property seekers with verified property listings.
          </p>
          <p className="text-[14px] font-normal text-black leading-relaxed">
            <SupportLine compact />
          </p>
        </div>

        {/* Logo row */}
        <Logo className="mb-[20px] h-8 w-auto" />

        {/* Divider + copyright */}
        <hr className="border-t border-[rgba(0,0,0,0.1)] mb-[14px]" />
        <p className="text-[15px] font-normal text-black">
          © {year} {BRAND}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
