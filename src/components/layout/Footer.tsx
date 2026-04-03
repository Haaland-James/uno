import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

const findUsLinks = [
  { label: "Contact us", href: "/contact" },
  { label: "Help Center", href: "/help" },
  { label: "FAQ", href: "/faq" },
  { label: "Feedback", href: "/feedback" },
  { label: "Submit a Ticket", href: "/support" },
  { label: "Terms & Conditions", href: "/terms" },
];

const aboutUsLinks = [
  { label: "About", href: "/about" },
  { label: "Why chose us", href: "/about" },
  { label: "Email Us", href: "mailto:support@uno.ng" },
];

const listingsLinks = [
  { label: "Rent", href: "/search?purpose=rent" },
  { label: "Buy", href: "/search?purpose=buy" },
  { label: "Commercialize", href: "/search?purpose=commercial" },
];

const legalParagraphs = [
  "By using UNO, you agree to our Terms of Use and Privacy Policy. We do not sell or share your personal information. UNO and all UNO variants and logos are trademarks of UNO Nigeria, registered or pending with the Corporate Affairs Commission (CAC).",
  "All property listings are subject to verification. UNO acts as a platform connecting property seekers with verified landlords and agents. Users should conduct due diligence before entering rental agreements.",
  "For support: support@uno.ng | WhatsApp: [Phone Number] | Mon-Sat, 9AM-6PM WAT",
];

function LinkColumn({
  heading,
  links,
  className,
}: {
  heading?: string;
  links: { label: string; href: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {heading && (
        <span className="text-[20px] font-medium text-[rgba(22,21,21,0.63)] mb-[8px]">
          {heading}
        </span>
      )}
      <div className="flex flex-col gap-[8px]">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[17px] font-semibold text-[#161515] hover:text-[#af2525] transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="w-full bg-[#faf9f9] font-sans">
      {/* Desktop layout */}
      <div className="hidden md:block px-[42px] py-[25px]">
        <div className="grid grid-cols-[auto_auto_auto_1fr] gap-[103px] items-start">
          {/* Column 1 — Find us */}
          <LinkColumn heading="Find us" links={findUsLinks} />

          {/* Column 2 — About Us */}
          <LinkColumn heading="About Us" links={aboutUsLinks} />

          {/* Column 3 — Listings (no heading) */}
          <LinkColumn links={listingsLinks} />

          {/* Column 4 — Legal text */}
          <div className="flex flex-col gap-[12px] w-full max-w-[611px]">
            {legalParagraphs.map((para, i) => (
              <p key={i} className="text-[15px] font-normal text-black leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Logo row */}
        <div className="flex items-center gap-[8px] mt-[32px] mb-[20px]">
          <div className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-[#f5d0d0]">
            <Home size={18} className="text-[#af2525]" />
          </div>
          <span className="text-[28px] font-normal text-[#af2525] leading-none">
            uno
          </span>
        </div>

        {/* Divider + copyright */}
        <hr className="border-t border-[rgba(0,0,0,0.1)] mb-[14px]" />
        <p className="text-[15px] font-normal text-black">
          © 2025 UNO. All rights reserved.
        </p>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden px-[10px] py-[25px]">
        {/* Row 1: Find us + About Us side by side */}
        <div className="flex flex-row gap-[50px] mb-[24px]">
          <LinkColumn heading="Find us" links={findUsLinks} />
          <LinkColumn heading="About Us" links={aboutUsLinks} />
        </div>

        {/* Row 2: Listings */}
        <div className="mb-[24px]">
          <LinkColumn links={listingsLinks} />
        </div>

        {/* Row 3: Legal text */}
        <div className="flex flex-col gap-[12px] mb-[24px]">
          {legalParagraphs.map((para, i) => (
            <p key={i} className="text-[15px] font-normal text-black leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {/* Logo row */}
        <div className="flex items-center gap-[8px] mb-[20px]">
          <div className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-[#f5d0d0]">
            <Home size={18} className="text-[#af2525]" />
          </div>
          <span className="text-[28px] font-normal text-[#af2525] leading-none">
            uno
          </span>
        </div>

        {/* Divider + copyright */}
        <hr className="border-t border-[rgba(0,0,0,0.1)] mb-[14px]" />
        <p className="text-[15px] font-normal text-black">
          © 2025 UNO. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
