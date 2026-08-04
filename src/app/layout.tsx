import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { StorefrontChrome } from "@/components/layout/storefront-chrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const siteUrl = "https://kimsafety.co.ke";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KimSafety — Industrial & Medical Safety Equipment Supplier in Kenya",
    template: "%s | KimSafety",
  },
  description:
    "Kenya's trusted marketplace for certified industrial PPE, medical safety, fire safety, road safety and laboratory equipment. Bulk discounts, same-day Nairobi delivery, corporate procurement support.",
  keywords: [
    "safety equipment Kenya",
    "PPE Kenya",
    "industrial safety Nairobi",
    "fire extinguishers Kenya",
    "medical gloves Kenya",
    "safety helmets",
    "lab equipment Kenya",
    "KimSafety",
  ],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: siteUrl,
    siteName: "KimSafety",
    title: "KimSafety — Industrial & Medical Safety Equipment Supplier in Kenya",
    description:
      "Certified PPE, medical, fire, road and lab safety equipment. Bulk discounts, same-day Nairobi delivery, corporate procurement support.",
  },
  icons: {
    icon: "/images/logo/fav.jpeg",
    apple: "/images/logo/fav.jpeg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: siteUrl },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F2847",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        <StoreProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
          >
            Skip to main content
          </a>
          <StorefrontChrome>{children}</StorefrontChrome>
        </StoreProvider>
      </body>
    </html>
  );
}
