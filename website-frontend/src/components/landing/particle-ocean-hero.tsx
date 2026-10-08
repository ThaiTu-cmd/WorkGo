"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ParticleOceanHeroProps {
  locale?: string;
  headline?: React.ReactNode;
  sub?: React.ReactNode;
  /** @deprecated tone ignored — static background is theme-aware */
  tone?: "dark" | "light";
  align?: "center" | "left";
  /** @deprecated showOcean ignored — static background replaced WebGL */
  showOcean?: boolean;
  ctaPrimary?: {
    label: string;
    href: string;
  };
  ctaSecondary?: {
    label: string;
    href: string;
  };
  navbarSlot?: React.ReactNode;
  stats?: Array<{ label: string; value: string }>;
}

/**
 * Reusable hero section for WorkGo landing page
 * Theme-aware layout with static background overlay and pressable CTAs.
 */
export function ParticleOceanHero({
  locale = "vi",
  headline,
  sub,
  tone = "dark",
  align = "center",
  showOcean = false,
  ctaPrimary,
  ctaSecondary,
  navbarSlot,
  stats,
}: ParticleOceanHeroProps): React.JSX.Element {
  // Suppress unused deprecated props warnings
  void tone;
  void showOcean;

  return (
    <section className="relative min-h-[100svh] overflow-hidden flex flex-col justify-between bg-transparent text-fg">
      {/* Atmospheric gradient overlay for contrast and seamless section transition */}
      <div
        className="absolute inset-0 pointer-events-none -z-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-app)]"
        aria-hidden="true"
      />

      {/* Optional top navbar slot */}
      {navbarSlot ? (
        <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {navbarSlot}
        </header>
      ) : (
        <div className="h-6" />
      )}

      {/* Hero Content */}
      <div
        className={cn(
          "relative z-10 mx-auto max-w-5xl px-6 pt-[10vh] pb-16 flex flex-col pointer-events-auto",
          align === "center" ? "items-center text-center" : "items-start text-left"
        )}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-6 border border-[#38BDF8]/30 bg-[#1677FF]/10 text-primary backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
          <span>
            {locale === "en"
              ? "Digital Talent & Escrow-Backed Marketplace WorkGo"
              : "Thị trường nhân lực số & công việc bảo chứng WorkGo"}
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.12] text-fg">
          {headline || (
            locale === "en" ? (
              <>
                Premier Marketplace for Tech Talent{" "}
                <span className="bg-gradient-to-r from-[#67D8FF] via-[#2EA8FF] to-[#1677FF] bg-clip-text text-transparent">
                  Professional Standard
                </span>
              </>
            ) : (
              <>
                Sàn giao dịch nhân lực công nghệ{" "}
                <span className="bg-gradient-to-r from-[#67D8FF] via-[#2EA8FF] to-[#1677FF] bg-clip-text text-transparent">
                  Chuẩn Chuyên Nghiệp
                </span>
              </>
            )
          )}
        </h1>

        <p className="mt-6 text-lg md:text-xl max-w-2xl font-normal leading-relaxed text-fg-secondary">
          {sub || (
            locale === "en"
              ? "Connect enterprises with verified top-tier specialists. Transparent escrow milestones, legally binding contracts, and instant settlements."
              : "Kết nối doanh nghiệp cùng các chuyên gia hàng đầu. Hệ thống ký quỹ minh bạch, tiến độ bảo chứng bằng hợp đồng điện tử và thanh toán tức thì."
          )}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={ctaPrimary?.href || `/${locale}/posts`}
            className="pressable inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-semibold text-white bg-gradient-to-b from-[#1677FF] to-[#0B4DBB] hover:brightness-110 shadow-lg shadow-[#1677FF]/30 cursor-pointer pointer-events-auto"
          >
            {ctaPrimary?.label || (locale === "en" ? "Explore Jobs" : "Khám phá việc làm")}
          </Link>
          <Link
            href={ctaSecondary?.href || `/${locale}/login`}
            className="pressable inline-flex items-center justify-center px-8 py-3.5 rounded-full text-base font-semibold text-fg bg-surface/80 hover:bg-surface border border-border shadow-sm backdrop-blur-sm cursor-pointer pointer-events-auto"
          >
            {ctaSecondary?.label || (locale === "en" ? "Sign In" : "Đăng nhập ngay")}
          </Link>
        </div>

        {/* Stats Row */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-border max-w-2xl w-full">
          {(stats || [
            { label: locale === "en" ? "Completed Projects" : "Dự án hoàn thành", value: "10,000+" },
            { label: locale === "en" ? "Verified Experts" : "Chuyên gia xác thực", value: "5,000+" },
            { label: locale === "en" ? "Satisfaction Rate" : "Tỷ lệ hài lòng", value: "99.4%" },
          ]).map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-2xl font-bold tracking-tight text-fg">
                {stat.value}
              </span>
              <span className="text-xs text-fg-tertiary mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-4" />
    </section>
  );
}

export default ParticleOceanHero;
