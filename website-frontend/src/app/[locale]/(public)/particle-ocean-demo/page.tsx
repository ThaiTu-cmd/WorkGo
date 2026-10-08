import type { Metadata } from "next";
import { ParticleOceanHero } from "@/components/landing/particle-ocean-hero";

export const metadata: Metadata = {
  title: "Particle Ocean Demo — WorkGo High-Tech Animated Background",
  description:
    "Interactive showcase of Particle Ocean: A bright-tone WebGL animated background with bokeh depth-of-field and smooth wave kinematics.",
};

export default async function ParticleOceanDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="w-full min-h-screen">
      <ParticleOceanHero
        locale={locale}
        headline="Particle Ocean — High-Tech WebGL Background"
        sub="A cinematic, light-tone animated ocean of glowing particles with optical bokeh depth of field, optimized for high-conversion SaaS landing pages."
        ctaPrimary={{
          label: "Trải nghiệm Nền tảng",
          href: `/${locale}/posts`,
        }}
        ctaSecondary={{
          label: "Đăng nhập ngay",
          href: `/${locale}/login`,
        }}
      />
    </main>
  );
}
