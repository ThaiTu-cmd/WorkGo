"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  Award,
  Scale,
  Clock,
  Lock,
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export interface WorkgoLandingSectionsProps {
  locale: string;
}

export function WorkgoLandingSections({ locale }: WorkgoLandingSectionsProps) {
  const t = useTranslations("landing");

  const featureCards = [
    {
      icon: ShieldCheck,
      title: t("features.feature1Title"),
      desc: t("features.feature1Desc"),
      badge: locale === "en" ? "100% Escrow" : "Ký quỹ 100%",
    },
    {
      icon: Award,
      title: t("features.feature2Title"),
      desc: t("features.feature2Desc"),
      badge: locale === "en" ? "3-Tier Verified" : "Xác thực 3 lớp",
    },
    {
      icon: Scale,
      title: t("features.feature3Title"),
      desc: t("features.feature3Desc"),
      badge: locale === "en" ? "Transparent" : "Minh bạch",
    },
    {
      icon: Clock,
      title: t("features.feature4Title"),
      desc: t("features.feature4Desc"),
      badge: "Real-time",
    },
    {
      icon: Lock,
      title: t("features.feature5Title"),
      desc: t("features.feature5Desc"),
      badge: locale === "en" ? "Enterprise Grade" : "Chuẩn Enterprise",
    },
    {
      icon: Zap,
      title: t("features.feature6Title"),
      desc: t("features.feature6Desc"),
      badge: locale === "en" ? "Instant" : "Tức thì",
    },
  ];

  const featuredJobs = [
    {
      title:
        locale === "en"
          ? "Build Go/gRPC Microservices & Micro-frontend Architecture"
          : "Xây dựng Hệ thống Vi dịch vụ Go/gRPC & Micro-frontend",
      category:
        locale === "en"
          ? "Backend & System Architecture"
          : "Backend & Kiến trúc hệ thống",
      budget: "25,000,000 - 40,000,000 VND",
      skills: ["Golang", "gRPC", "Docker", "PostgreSQL"],
      proposals: locale === "en" ? "12 proposals" : "12 báo giá",
      verified: true,
    },
    {
      title:
        locale === "en"
          ? "Design & Deploy UI/UX Design System for FinTech SaaS"
          : "Thiết kế & Triển khai UI/UX Design System cho FinTech SaaS",
      category: "UI/UX & Product Design",
      budget: "18,000,000 - 30,000,000 VND",
      skills: ["Figma", "Design Tokens", "Tailwind CSS"],
      proposals: locale === "en" ? "8 proposals" : "8 báo giá",
      verified: true,
    },
    {
      title:
        locale === "en"
          ? "Optimize WebGL Three.js & Shader Performance"
          : "Tối ưu hóa Hiệu năng WebGL Three.js & Shader Simulation",
      category: "Creative Technology / WebGL",
      budget: "30,000,000 - 55,000,000 VND",
      skills: ["Three.js", "GLSL", "React 19", "Next.js"],
      proposals: locale === "en" ? "6 proposals" : "6 báo giá",
      verified: true,
    },
  ];

  return (
    <div className="relative z-10 w-full bg-app text-fg">
      {/* SECTION 1: FEATURES */}
      <section id="features" className="scroll-mt-20 relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Subtle background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
            {t("features.sectionBadge")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-fg">
            {t("features.sectionTitle")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-fg-secondary leading-relaxed">
            {t("features.sectionDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featureCards.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-[20px] p-7 bg-surface/70 border border-border hover:border-primary/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1677FF]/20 to-[#0B4DBB]/40 border border-[#1677FF]/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted border border-border text-fg-tertiary">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-fg group-hover:text-primary transition-colors mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-fg-secondary leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: SHOWCASE */}
      <section id="showcase" className="scroll-mt-20 relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
              {t("showcase.sectionBadge")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">
              {t("showcase.sectionTitle")}
            </h2>
            <p className="mt-3 text-base text-fg-secondary">
              {t("showcase.sectionDesc")}
            </p>
          </div>
          <Link
            href={`/${locale}/posts`}
            className="pressable inline-flex items-center gap-2 text-sm font-semibold text-primary hover:brightness-110 transition-colors shrink-0"
          >
            <span>{t("showcase.viewAll")}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredJobs.map((job, idx) => (
            <div
              key={idx}
              className="rounded-[18px] p-6 bg-surface/60 border border-border hover:border-primary/40 backdrop-blur-md flex flex-col justify-between transition-all hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-fg-tertiary mb-3">
                  <span>{job.category}</span>
                  <span className="flex items-center gap-1 text-[#34D399]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {locale === "en" ? "Escrow Protected" : "Bảo chứng Escrow"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-fg line-clamp-2 mb-3">
                  {job.title}
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {job.skills.map((s, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted text-fg-secondary border border-border"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase text-fg-tertiary">
                    {locale === "en" ? "Budget" : "Ngân sách"}
                  </div>
                  <div className="text-sm font-bold text-primary">{job.budget}</div>
                </div>
                <Link
                  href={`/${locale}/posts`}
                  className="pressable px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:brightness-110 transition-colors"
                >
                  {locale === "en" ? "Apply" : "Ứng tuyển"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: CTA PANEL */}
      <section id="pricing" className="scroll-mt-20 relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="landing-cta-panel relative rounded-[24px] overflow-hidden p-8 sm:p-14 bg-gradient-to-br from-[#0A1F4D] via-[#06142F] to-[#0B4DBB] border border-[#38BDF8]/30 glow-blue shadow-2xl">
          <div
            className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#1677FF]/20 rounded-full blur-[100px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              {t("cta.title")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#B8CCF0] max-w-2xl leading-relaxed">
              {t("cta.desc")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/register`}
                className="pressable inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold text-white bg-gradient-to-r from-[#1677FF] to-[#2EA8FF] hover:brightness-110 shadow-lg shadow-[#1677FF]/40 cursor-pointer"
              >
                <span>{t("cta.primaryBtn")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/posts`}
                className="pressable inline-flex items-center px-7 py-3.5 rounded-full text-base font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md cursor-pointer"
              >
                {t("cta.secondaryBtn")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-surface text-fg-tertiary py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0B4DBB] flex items-center justify-center text-white font-black text-sm">
                W
              </div>
              <span className="text-fg font-bold text-lg tracking-tight">
                WorkGo
              </span>
            </div>
            <p className="text-xs leading-relaxed text-fg-tertiary">
              {t("footer.description")}
            </p>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-fg mb-4">
              {t("footer.solutions")}
            </div>
            <ul className="space-y-2.5 text-xs">
              <li><Link href={`/${locale}/posts`} className="pressable hover:text-fg transition-colors">{locale === "en" ? "Developer Hiring" : "Tuyển dụng lập trình"}</Link></li>
              <li><Link href={`/${locale}/posts`} className="pressable hover:text-fg transition-colors">{locale === "en" ? "Escrow Contracts" : "Hợp đồng Escrow"}</Link></li>
              <li><Link href={`/${locale}/posts`} className="pressable hover:text-fg transition-colors">{locale === "en" ? "Milestone Protection" : "Bảo chứng mốc bàn giao"}</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-fg mb-4">
              {t("footer.company")}
            </div>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#features" className="pressable hover:text-fg transition-colors">{locale === "en" ? "About Us" : "Về chúng tôi"}</a></li>
              <li><a href="#showcase" className="pressable hover:text-fg transition-colors">{locale === "en" ? "Featured Projects" : "Dự án tiêu biểu"}</a></li>
              <li><a href="#pricing" className="pressable hover:text-fg transition-colors">{locale === "en" ? "Platform Fees" : "Biểu phí nền tảng"}</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-fg mb-4">
              {t("footer.legal")}
            </div>
            <ul className="space-y-2.5 text-xs">
              <li><span className="pressable hover:text-fg cursor-pointer">{locale === "en" ? "Terms of Service" : "Điều khoản dịch vụ"}</span></li>
              <li><span className="pressable hover:text-fg cursor-pointer">{locale === "en" ? "Privacy Policy" : "Chính sách bảo mật"}</span></li>
              <li><span className="pressable hover:text-fg cursor-pointer">{locale === "en" ? "Dispute Resolution" : "Quy chế giải quyết tranh chấp"}</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-fg-tertiary">
          <p>© {new Date().getFullYear()} WorkGo Platform. {t("footer.rights")}</p>
          <p className="mt-2 sm:mt-0">Premium Professional Marketplace</p>
        </div>
      </footer>
    </div>
  );
}

export default WorkgoLandingSections;
