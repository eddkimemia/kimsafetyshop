import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { siteUrl } from "@/lib/site";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Privacy Policy — KimSafety Kenya",
  description: "KimSafety privacy policy — how we collect, use and protect your personal data under Kenya's Data Protection Act, 2019.",
  alternates: { canonical: `${siteUrl}/privacy` },
  robots: { index: true, follow: true },
};

const sections: [string, string][] = [
  [
    "1. Who we are",
    "KimSafety Limited ('KimSafety', 'we', 'us') operates kimsafety.co.ke, an e-commerce marketplace for safety equipment based in Nairobi, Kenya. This policy explains how we collect, use and protect your personal data.",
  ],
  [
    "2. Data we collect",
    "We collect information you provide directly — name, contact details, delivery address, company details and payment information — plus technical data such as device, browser and usage patterns, and cookies for improving your shopping experience.",
  ],
  [
    "3. How we use your data",
    "Your data is used to process and deliver orders, manage accounts and quotations, provide support, send service messages and — only with consent — marketing updates. Corporate data may be used to prepare tax invoices and tender documentation.",
  ],
  [
    "4. Payments & security",
    "Payment information is processed by PCI-DSS compliant providers (M-Pesa Daraja, Paystack). We never store full card numbers. All account and personal data is encrypted in transit and at rest, and access is restricted by role.",
  ],
  [
    "5. Sharing & disclosure",
    "We share data only with logistics partners (for delivery), payment processors (for transactions) and — where required — Kenyan authorities under the Data Protection Act, 2019. We never sell personal data.",
  ],
  [
    "6. Your rights",
    "Under Kenya's Data Protection Act, 2019, you may request access to, correction of, or deletion of your personal data, and may withdraw marketing consent at any time via support@kimsafety.co.ke.",
  ],
  [
    "7. Retention",
    "Order and invoice records are retained for the period required by Kenyan tax law (at least 7 years). Marketing data is retained until consent is withdrawn.",
  ],
  [
    "8. Contact",
    "For any privacy request, contact our Data Protection Officer at privacy@kimsafety.co.ke or KimSafety House, Enterprise Road, Industrial Area, Nairobi.",
  ],
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated="July 2026" sections={sections} />;
}

function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: [string, string][];
}) {
  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero4.jpg"
        title={title}
        subtitle={`Last updated: ${updated} · KimSafety Limited, Nairobi, Kenya`}
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
