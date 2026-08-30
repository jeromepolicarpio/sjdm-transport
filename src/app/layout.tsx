import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SJDM Transport",
  description: "Offline-first PUV route and fare-zone map for San Jose del Monte, Bulacan.",
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
          not hydration errors from this app's own code. */}
      <body className="h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
