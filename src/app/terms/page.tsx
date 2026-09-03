import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { siteUrl } from "@/lib/site";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Terms & Conditions — KimSafety Kenya",
  description: "Terms & Conditions for KimSafety — orders, pricing in KES, payment, delivery, returns, warranty & governing law (Kenya).",
  alternates: { canonical: `${siteUrl}/terms` },
  robots: { index: true, follow: true },
};

const sections: [string, string][] = [
  [
    "1. Agreement",
    "By accessing kimsafety.co.ke or placing an order, you agree to these Terms & Conditions. KimSafety Limited is a company registered in the Republic of Kenya (RC: PVT-2024-8871) with its principal place of business at KimSafety House, Enterprise Road, Industrial Area, Nairobi.",
  ],
  [
    "2. Products & pricing",
    "All prices are displayed in Kenyan Shillings (KES) inclusive of 16% VAT unless stated otherwise. We make every effort to keep prices and stock accurate; where an error occurs, we will contact you before processing the order and offer a refund or revised price.",
  ],
  [
    "3. Orders & acceptance",
    "An order is accepted when we send order confirmation. Corporate and purchase-order transactions require prior account approval. We reserve the right to decline orders that fail our fraud checks.",
  ],
  [
    "4. Payment",
    "Payment is due at checkout unless credit terms have been granted in writing. Accepted methods: M-Pesa (STK push), card (Paystack) and approved purchase orders. Title transfers upon full payment.",
  ],
  [
    "5. Delivery",
    "Delivery estimates are 24 hours (Nairobi), 24–48 hours (major towns) and up to 72 hours (other counties). Risk of loss passes on delivery to the address provided; please verify goods on receipt.",
  ],
  [
    "6. Returns & refunds",
    "Unopened products may be returned within 7 days for a full refund. Faulty or non-conforming goods are replaced free of charge. Safety-critical items (respirators, harnesses) once opened may not be returnable for hygiene reasons, as stated on each product.",
  ],
  [
    "7. Warranty",
    "Products carry the warranties stated on their product pages (typically 12 months). The KimSafety Quality Guarantee: any product failing to meet its stated certification is replaced free of charge.",
  ],
  [
    "8. Limitation of liability",
    "To the maximum extent permitted by law, KimSafety's liability for any claim shall not exceed the amount paid for the products giving rise to the claim. Nothing in these terms limits liability for death, personal injury or fraud.",
  ],
  [
    "9. Intellectual property",
    "All content on this site — branding, text, imagery and design — is the property of KimSafety Limited and may not be reproduced without written permission.",
  ],
  [
    "10. Governing law",
    "These terms are governed by the laws of the Republic of Kenya. Disputes are subject to the exclusive jurisdiction of the courts of Kenya.",
  ],
  [
    "11. Contact",
    "Questions about these terms: legal@kimsafety.co.ke or +254 715135141.",
  ],
];

export default function TermsPage() {
  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero4.jpg"
        title="Terms & Conditions"
        subtitle="Last updated: July 2026 · KimSafety Limited, Nairobi, Kenya"
      />
      <div className="mx-auto max-w-3xl px-4 pt-8 lg:px-0">
        <div className="space-y-8 rounded-2xl border border-line bg-white p-8 shadow-card">
          {sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="font-display text-lg font-extrabold text-navy-900">{heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
