/* eslint-disable @next/next/no-img-element -- decorative full-bleed poster, no optimisation benefit */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Pause, Play, Search } from "lucide-react";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { FiverrReveal } from "./fiverr-reveal";
import { Fiverr3dAccent } from "./fiverr-3d-accent";


const WEBM_SRC = "/assets/particle-ocean.webm";
const MP4_SRC = "/assets/particle-ocean.mp4";
const POSTER_SRC = "/assets/particle-ocean-fallback.webp";

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export interface FiverrHeroProps {
  locale: string;
}

/**
 * FiverrHero — full-bleed video hero, 680px on desktop / min 450px on mobile.
 *
 * Guards:
 *  - E8: `prefers-reduced-motion: reduce` swaps the <video> for the still poster.
 *  - R5: the pause control renders only after mount (hydration safety).
 *  - R8: mobile uses min-height so short viewports never clip the content.
 *  - E9: Vietnamese runs ~20% longer, so the VI headline steps down one size to
 *        hold two lines inside the measured 613px measure.
 */
export function FiverrHero({ locale }: FiverrHeroProps): React.JSX.Element {
  const t = useTranslations("landing.fiverr");
  const content = getFiverrContent(locale);
  const router = useRouter();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [query, setQuery] = React.useState("");
  const [paused, setPaused] = React.useState(false);

  const reducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => undefined);
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  const submitSearch = (event: React.SyntheticEvent) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/${locale}/posts?q=${encodeURIComponent(q)}` : `/${locale}/posts`);
  };

  const h1SizeClass =
    locale === "en" ? "md:text-[72px]" : "md:text-[64px]";

  return (
    <section className="relative w-full overflow-hidden bg-black md:h-[680px] md:min-h-[680px] min-h-[450px]">
      {/* Background media — static poster under reduced motion (E8). */}
      {reducedMotion ? (
        <img
          src={POSTER_SRC}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover select-none"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER_SRC}
          aria-label={t("hero.backgroundAlt")}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover select-none"
        >
          <source src={WEBM_SRC} type="video/webm" />
          <source src={MP4_SRC} type="video/mp4" />
        </video>
      )}

      {/* Contrast scrim */}
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" />

      {/* 3D WebGL particle accent behind content */}
      <Fiverr3dAccent locale={locale} className="absolute inset-0 opacity-40 pointer-events-none" />

      {/* Content column: measured flex-column, gap 28, align start */}
      <div className="relative mx-auto flex min-h-[450px] w-full max-w-[1400px] flex-col items-center gap-6 px-6 pt-14 text-center md:h-[680px] md:min-h-[680px] md:items-start md:gap-7 md:px-8 md:pt-[176px] md:text-left">
        <FiverrReveal delay={0}>
          <h1
            className={`max-w-[613px] text-[28px] font-extralight leading-[1.2] tracking-[-0.06em] text-white min-[360px]:text-[32px] md:min-h-0 ${h1SizeClass}`}
          >
            {content.hero.headline}
          </h1>
        </FiverrReveal>

        {/* Search: measured max 1078px, h 60 @1440 / 52 @mobile, radius 12 */}
        <FiverrReveal delay={80} className="w-full max-w-[1078px]">
          <form
            onSubmit={submitSearch}
            role="search"
            className="flex h-[52px] w-full items-center rounded-xl border bg-white md:h-[60px]"
            style={{ borderColor: "#C5C6C9" }}
          >
            <label className="sr-only" htmlFor="fiverr-hero-search">
              {t("hero.searchLabel")}
            </label>
            <input
              id="fiverr-hero-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={content.hero.searchPlaceholder}
              className="min-w-0 flex-1 rounded-l-xl px-4 text-base outline-none md:px-6"
              style={{ color: "#404145" }}
            />
            <button
              type="submit"
              aria-label={t("hero.searchSubmitLabel")}
              title={t("hero.searchSubmitLabel")}
              className="pressable fiverr-press m-[4px] flex h-[44px] w-[52px] shrink-0 items-center justify-center rounded-lg bg-[#222325] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:h-[52px]"
            >
              <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
            </button>
          </form>
        </FiverrReveal>

        {/* Suggestion chips */}
        <FiverrReveal delay={160} className="w-full">
          <ul aria-label={t("hero.chipsLabel")} className="flex w-full flex-wrap justify-center gap-3 md:justify-start md:gap-4">
            {content.hero.chips.map((chip) => (
              <li key={chip}>
                <Link
                  href={`/${locale}/posts?q=${encodeURIComponent(chip)}`}
                  className="fiverr-press inline-flex h-[42px] items-center gap-2 rounded-lg border border-white bg-white/10 px-4 text-base font-semibold text-white backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {chip}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </FiverrReveal>

        {/* Social proof */}
        <FiverrReveal delay={240} className="w-full">
          <div className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
            <span className="text-sm text-white">{content.hero.trustedBy}</span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {content.hero.trustedLogos.map((logo) => (
                <span
                  key={logo}
                  className="select-none text-base font-bold tracking-tight text-white/85"
                >
                  {logo}
                </span>
              ))}
            </span>
          </div>
        </FiverrReveal>
      </div>

      {/* Pause control — gated on mount (R5). */}
      {mounted && !reducedMotion && (
        <button
          type="button"
          onClick={togglePlayback}
          aria-pressed={paused}
          aria-label={paused ? t("hero.playLabel") : t("hero.pauseLabel")}
          title={paused ? t("hero.playLabel") : t("hero.pauseLabel")}
          className="fiverr-pause-ring pressable absolute bottom-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {paused ? (
            <Play className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Pause className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
        </button>
      )}
    </section>
  );
}

export default FiverrHero;