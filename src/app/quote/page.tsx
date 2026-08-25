import type { Metadata } from "next";
import { Suspense } from "react";
import { QuoteForm } from "@/components/quote/quote-form";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request a Quotation — Bulk & Corporate Pricing | KimSafety Kenya",
  description:
    "Request a corporate or bulk quotation from KimSafety — tiered pricing, negotiated rates, tender documentation and dedicated account managers for safety equipment in Kenya. 4-hour response.",
  keywords: ["KimSafety quotation", "bulk pricing Kenya", "corporate safety equipment quote", "tender quotation Nairobi"],
  alternates: { canonical: `${siteUrl}/quote` },
  openGraph: {
    title: "Request a Quotation — KimSafety Kenya",
    description: "Bulk & corporate quotations — tiered pricing, negotiated rates & tender docs. 4-hour response.",
    type: "website",
    url: `${siteUrl}/quote`,
    siteName: "KimSafety",
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "Request a Quotation — KimSafety" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Request a Quotation — KimSafety Kenya",
    description: "Bulk & corporate pricing — 4-hour response.",
    images: [`${siteUrl}/og-image.jpg`],
  },
};

export default function QuotePage() {
  return (
    <Suspense>
      <QuoteForm />
    </Suspense>
  );
}
