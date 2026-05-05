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
        <span className="text-[20px] font-medium text-[rgba(22,21,21,0.63)] mb-[10px]">
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
                <LinkColumn heading="Find us" links={findUsLinks} className="w-[163px] shrink-0" />

                {/* Column 2 — About Us */}
                <LinkColumn heading="About Us" links={aboutUsLinks} className="w-[115px] shrink-0" />

                {/* Column 3 — Listings (no heading) */}
                <LinkColumn links={listingsLinks} className="w-[127px] shrink-0" />

                {/* Column 4 — Legal text */}
                <div className="flex flex-col gap-0 max-w-[611px]">
                  <p className="text-[15px] font-normal text-black leading-normal">
                    By using UNO, you agree to our{" "}
                    <Link href="/terms" className="underline">Terms of Use</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="underline">Privacy Policy</Link>
                    . We do not sell or share your personal information. UNO and all UNO variants and logos are trademarks of UNO Nigeria, registered or pending with the Corporate Affairs Commission (CAC).
                  </p>
                  <p className="text-[15px] font-normal text-black leading-normal">
                    All property listings are subject to verification. UNO acts as a platform connecting property seekers with verified property listings. Users should conduct due diligence before entering rental agreements.
                  </p>
                  <p className="text-[15px] font-normal text-black leading-normal">
                    For support:{" "}
                    <a href="mailto:support@uno.ng" className="underline">support@uno.ng</a>
                    {" "}| WhatsApp: [Phone Number] | Mon-Sat, 9AM-6PM WAT
                  </p>
                </div>
              </div>

              {/* House illustration */}
              <div className="ml-auto flex items-end justify-end self-end">
                <Home size={160} strokeWidth={0.8} className="text-[#af2525]/20" />
              </div>
            </div>

            {/* Logo row */}
            <div className="flex items-center gap-[6px]">
              <div className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-[#f5d0d0]">
                <Home size={18} className="text-[#af2525]" />
              </div>
              <span className="text-[28px] font-normal text-[#af2525] leading-none">
                uno
              </span>
            </div>
          </div>

          {/* Divider + copyright */}
          <div className="flex flex-col gap-[16px]">
            <hr className="border-t border-[rgba(0,0,0,0.1)]" />
            <p className="text-[15px] font-normal text-black">
              © 2025 UNO. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden px-[16px] py-[25px]">
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
        <div className="flex flex-col gap-[8px] mb-[24px]">
          <p className="text-[14px] font-normal text-black leading-relaxed">
            By using UNO, you agree to our{" "}
            <Link href="/terms" className="underline">Terms of Use</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
            . We do not sell or share your personal information.
          </p>
          <p className="text-[14px] font-normal text-black leading-relaxed">
            All property listings are subject to verification. UNO acts as a platform connecting property seekers with verified property listings.
          </p>
          <p className="text-[14px] font-normal text-black leading-relaxed">
            For support:{" "}
            <a href="mailto:support@uno.ng" className="underline">support@uno.ng</a>
            {" "}| Mon-Sat, 9AM-6PM WAT
          </p>
        </div>

        {/* Logo row */}
        <div className="flex items-center gap-[6px] mb-[20px]">
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
