"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { FiverrHeader } from "./fiverr-header";
import { FiverrTrendingBar } from "./fiverr-trending-bar";
import { FiverrHero } from "./fiverr-hero";
import { FiverrCategoryGrid } from "./fiverr-category-grid";
import { FiverrPopularServices } from "./fiverr-popular-services";
import { FiverrValueProps } from "./fiverr-value-props";
import { FiverrFeaturePanels } from "./fiverr-feature-panels";
import { FiverrGuides } from "./fiverr-guides";
import { FiverrTestimonials } from "./fiverr-testimonials";
import { FiverrCtaBanner } from "./fiverr-cta-banner";
import { FiverrFooter } from "./fiverr-footer";

export interface FiverrLandingProps {
  locale: string;
}

/**
 * FiverrLanding — the marketplace marketing shell.
 *
 * Light-only by design (`bg-white text-[#222325]`): the reference homepage has
 * no dark mode, so this subtree pins its own measured palette and ignores the
 * app theme tokens. The ThemeToggle in the header keeps working for the rest of
 * the product, and the theme dock in `ascend-landing-view.tsx` still renders
 * above this shell.
 */
export function FiverrLanding({ locale }: FiverrLandingProps): React.JSX.Element {
  const t = useTranslations("landing.fiverr");

  return (
    <div
      id="fiverr-main"
      className="w-full overflow-x-hidden bg-white text-[#222325]"
    >
      <FiverrHeader locale={locale} />
      <FiverrTrendingBar locale={locale} regionLabel={t("trending.regionLabel")} />
      <FiverrHero locale={locale} />
      <FiverrCategoryGrid
        locale={locale}
        regionLabel={t("categories.regionLabel")}
        toggleMoreLabel={t("categories.toggleMoreLabel")}
      />
      <FiverrPopularServices
        locale={locale}
        regionLabel={t("popular.regionLabel")}
        prevLabel={t("carousel.prevLabel")}
        nextLabel={t("carousel.nextLabel")}
      />
      <FiverrValueProps locale={locale} regionLabel={t("valueProps.regionLabel")} />
      <FiverrFeaturePanels
        locale={locale}
        regionLabel={t("panels.regionLabel")}
        imageAlt={t("panels.imageAlt")}
      />
      <FiverrGuides
        locale={locale}
        regionLabel={t("guides.regionLabel")}
        imageAlt={t("guides.imageAlt")}
      />
      <FiverrTestimonials
        locale={locale}
        regionLabel={t("testimonials.regionLabel")}
      />
      <FiverrCtaBanner locale={locale} regionLabel={t("cta.regionLabel")} />
      <FiverrFooter locale={locale} regionLabel={t("footer.regionLabel")} />
    </div>
  );
}

export default FiverrLanding;