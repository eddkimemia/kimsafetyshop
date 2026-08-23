import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { StorefrontChrome } from "@/components/layout/storefront-chrome";
import { siteUrl } from "@/lib/site";
import { getAllSettings } from "@/lib/db";
import { resolveLogoUrl, DEFAULT_LOGO } from "@/lib/logo";

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

// Branding comes from the `settings` table (Admin -> Settings) so a logo or
// site-name change reflects everywhere, including structured data. The DB call
// is guarded so a static build without a live database still falls back to the
// bundled defaults instead of failing.
async function loadBrand(): Promise<{ site_name: string; logo: string; email: string; phone: string }> {
  try {
    const s = await getAllSettings();
    return {
      site_name: (s.site_name || "KimSafety").trim(),
      logo: resolveLogoUrl(s),
      email: s.email || "sales@kimsafety.co.ke",
      phone: s.phone || "+254 715135141",
    };
  } catch {
    return {
      site_name: "KimSafety",
      logo: DEFAULT_LOGO,
      email: "sales@kimsafety.co.ke",
      phone: "+254 715135141",
    };
  }
}

const absoluteUrl = (p: string) => (p.startsWith("http") ? p : `${siteUrl}${p}`);

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
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "KimSafety — Industrial & Medical Safety Equipment Supplier in Kenya" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KimSafety — Industrial & Medical Safety Equipment Supplier in Kenya",
    description:
      "Certified PPE, medical, fire, road and lab safety equipment. Bulk discounts, same-day Nairobi delivery, corporate procurement support.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/images/logo/fav.jpeg",
    apple: "/images/logo/fav.jpeg",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F2847",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await loadBrand();

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: brand.site_name,
    url: siteUrl,
    logo: absoluteUrl(brand.logo),
    description:
      "Kenya's trusted marketplace for certified industrial PPE, medical safety, fire safety, road safety and laboratory equipment.",
    email: brand.email,
    telephone: brand.phone,
    address: { "@type": "PostalAddress", addressLocality: "Nairobi", addressCountry: "KE" },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: brand.phone,
      contactType: "sales",
      availableLanguage: ["en"],
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: brand.site_name,
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        ) : null}
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