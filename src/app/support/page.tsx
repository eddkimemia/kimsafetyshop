import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export const metadata: Metadata = {
  title: "Help & Support",
  description:
    "Delivery, payment, returns and product FAQs from KimSafety. Same-day Nairobi delivery, M-Pesa & card payments, 7-day returns.",
};

const faqs = [
  {
    q: "How fast is delivery?",
    a: "Orders confirmed before 3 PM are dispatched the same day from our Industrial Area warehouse. Nairobi delivery is same-day; major towns 24–48 hours; all other counties within 72 hours.",
  },
  {
    q: "When is delivery free?",
    a: "All orders above KES 10,000 within Nairobi enjoy free delivery. Countrywide shipping is calculated at checkout and bulk orders qualify for discounted logistics rates.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "M-Pesa (STK push), Visa/Mastercard via Paystack, bank transfer (Easypay/PesaLink) and purchase orders for approved corporate accounts with 30-day terms.",
  },
  {
    q: "Are your products genuine and certified?",
    a: "Yes. Every product is sourced through authorized channels and comes with a certificate of conformance. We inspect every batch before dispatch and destroy any stock that fails inspection.",
  },
  {
    q: "Can I return a product?",
    a: "Unopened products in original packaging can be returned within 7 days for a full refund. Faulty or damaged items are replaced free of charge — contact us within 48 hours of delivery.",
  },
  {
    q: "Do you support tenders and corporate orders?",
    a: "Yes — quotations, negotiated pricing, tax invoices and tender documentation are part of our corporate service. Request a quotation from any product page or visit the Corporate Portal.",
  },
  {
    q: "Can I get training or site audits?",
    a: "Our HSE team offers PPE selection guidance and safety documentation support. For larger projects, contact us for a site assessment and outfitting plan.",
  },
  {
    q: "How do I track my order?",
    a: "You'll receive SMS updates at each stage — confirmed, dispatched and delivered. Corporate clients also see full history in the Corporate Portal.",
  },
];

export default function SupportPage() {
  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero2.jpg"
        title="Help & Support"
        subtitle="Everything you need to know about delivery, payment, returns and product quality."
      />

      <div className="mx-auto max-w-shell px-4 pt-8 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-navy-900">
                <LifeBuoy className="h-5 w-5 text-safety-500" /> Still need help?
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Our support team replies within the hour, Monday to Saturday.
              </p>
              <a
                href="https://wa.me/254715135141"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white"
              >
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp Support
              </a>
              <Link
                href="/contact"
                className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm font-bold text-navy-900 hover:bg-surface"
              >
                Contact Form
              </Link>
            </div>
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-base font-extrabold text-navy-900">Quick policies</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/privacy" className="text-safety-600 hover:underline">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-safety-600 hover:underline">Terms & Conditions</Link></li>
                <li><Link href="/about" className="text-safety-600 hover:underline">Quality Guarantee</Link></li>
              </ul>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-white shadow-card open:bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-bold text-navy-900">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
