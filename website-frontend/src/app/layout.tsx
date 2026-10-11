import type { Metadata } from "next";
import { Be_Vietnam_Pro, Instrument_Serif } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

// Instrument Serif (SIL OFL 1.1) — open-licence stand-in for the reference
// site's proprietary display serif. Used only for the CTA accent word.
// NOTE: Instrument Serif exposes no `vietnamese` subset; Vietnamese diacritics
// arrive via `latin-ext` and fall back to Georgia via `.fiverr-display`.
const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-fiverr-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WorkGo - Nền tảng kết nối việc làm và dịch vụ uy tín",
  description: "WorkGo kết nối khách hàng và đối tác dịch vụ chuyên nghiệp, an toàn, minh bạch.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${instrumentSerif.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('workgo_theme')||'dark';document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(t);document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-app text-fg flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
