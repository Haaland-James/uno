"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SeeAllCardProps {
  href: string;
  images?: string[];
  className?: string;
}

export function SeeAllCard({
  href,
  images = [],
  className,
}: SeeAllCardProps) {
  const img1 = images[0] ?? "";
  const img2 = images[1] ?? images[0] ?? "";
  const img3 = images[2] ?? images[0] ?? "";

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-[28px]",
        "bg-[#fbfbfb] border border-[rgba(0,0,0,0.09)] rounded-[20px]",
        "w-[234px] md:w-[325px] self-stretch",
        "transition-shadow duration-200 hover:shadow-lg",
        className
      )}
    >
      {/* 3 overlapping rotated photos — matches Figma node 340:12610 */}
      <div className="relative w-[170px] h-[162px]">
        {/* Photo 1 — bottom-left, rotated left */}
        {img1 && (
          <div className="absolute left-0 top-[34px] flex items-center justify-center w-[123px] h-[119px]">
            <div className="w-[97px] h-[91px] rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.15)] rotate-[-20deg]">
              <Image src={img1} alt="" fill className="object-cover" sizes="97px" />
            </div>
          </div>
        )}
        {/* Photo 2 — top-right, rotated right */}
        {img2 && (
          <div className="absolute left-[44px] top-0 flex items-center justify-center w-[130px] h-[129px]">
            <div className="w-[97px] h-[91px] rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.15)] rotate-[32deg]">
              <Image src={img2} alt="" fill className="object-cover" sizes="97px" />
            </div>
          </div>
        )}
        {/* Photo 3 — bottom-right, slight rotation */}
        {img3 && (
          <div className="absolute left-[63px] top-[60px] flex items-center justify-center w-[107px] h-[102px]">
            <div className="w-[97px] h-[91px] rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.15)] rotate-[7deg]">
              <Image src={img3} alt="" fill className="object-cover" sizes="97px" />
            </div>
          </div>
        )}
      </div>

      {/* See All button — solid red */}
      <span className="flex items-center justify-center h-[30px] md:h-[41px] px-[30px] md:px-[40px] rounded-[50px] bg-[#af2525] text-[14px] md:text-[15px] font-normal text-white tracking-[-0.3px] transition-opacity hover:opacity-90">
        See All
      </span>
    </Link>
  );
}
