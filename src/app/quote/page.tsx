import type { Metadata } from "next";
import { Suspense } from "react";
import { QuoteForm } from "@/components/quote/quote-form";

export const metadata: Metadata = {
  title: "Request a Quotation",
  description:
    "Request a corporate or bulk quotation from KimSafety — tiered pricing, negotiated rates, tender documentation and dedicated account managers for safety equipment in Kenya.",
};

export default function QuotePage() {
  return (
    <Suspense>
      <QuoteForm />
    </Suspense>
  );
}
