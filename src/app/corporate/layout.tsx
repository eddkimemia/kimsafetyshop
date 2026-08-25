import type { Metadata } from "next";

import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Corporate Accounts — Bulk Procurement & Tenders | KimSafety Kenya",
  description:
    "Corporate procurement, bulk pricing and tenders for safety equipment in Kenya. 1,200+ organizations trust KimSafety for negotiated rates, credit terms & scheduled delivery across 47 counties.",
  keywords: ["corporate PPE Kenya", "bulk safety equipment Kenya", "tender safety equipment Nairobi", "corporate procurement Kenya"],
  alternates: { canonical: `${siteUrl}/corporate` },
  openGraph: {
    title: "Corporate Accounts — KimSafety Kenya",
    description: "Bulk procurement, negotiated pricing & tender support for 1,200+ organizations across 47 counties.",
    type: "website",
    url: `${siteUrl}/corporate`,
    siteName: "KimSafety",
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "Corporate Accounts — KimSafety" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corporate Accounts — KimSafety Kenya",
    description: "Bulk procurement & tenders for safety equipment across Kenya.",
    images: [`${siteUrl}/og-image.jpg`],
  },
  robots: { index: true, follow: true },
};

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
