import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/sjdm-transport-logo.png",
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/sjdm-transport-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "TravelApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "PHP",
  },
  spatialCoverage: {
    "@type": "City",
    name: "San Jose del Monte",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions like Grammarly inject
          attributes (data-gr-ext-installed, etc.) into <body> before React
          hydrates, which otherwise logs a false-positive mismatch warning —
          this only suppresses the attribute-diff warning on this element,
          not hydration errors from this app's own code.

          Deliberately NOT h-full/flex-col here: this body is shared by the
          fixed-viewport map tool (AppShell, which now sizes itself via its
          own `fixed inset-0` instead of inheriting height from this
          ancestor chain) and the landing page, which needs to be a normal
          scrolling document. Constraining body to 100dvh used to clamp the
          landing page's content box to one viewport tall — overflow was
          still visible, but position:sticky's containing block was that
          clamped box, so the nav unstuck itself past the first screen. */}
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
