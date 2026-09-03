import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Truck, BadgeCheck, HeartHandshake, Target, Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { siteUrl } from "@/lib/site";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "About KimSafety — Certified Safety Equipment Supplier Since 2019 | Kenya",
  description:
    "KimSafety is Kenya's leading supplier of certified industrial PPE, medical safety, fire safety and laboratory equipment — serving 1,200+ organizations across 47 counties since 2019. Industrial Area, Nairobi.",
  keywords: ["about KimSafety", "safety supplier Nairobi", "industrial Area KimSafety", "KimSafety Kenya history"],
  alternates: { canonical: `${siteUrl}/about` },
  openGraph: {
    title: "About KimSafety — Certified Safety Equipment Since 2019",
    description: "Kenya's leading supplier of certified safety equipment — 1,200+ organizations across 47 counties.",
    type: "website",
    url: `${siteUrl}/about`,
    siteName: "KimSafety",
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "About KimSafety" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About KimSafety — Kenya's Safety Supplier Since 2019",
    description: "1,200+ organizations across 47 counties trust KimSafety.",
    images: [`${siteUrl}/og-image.jpg`],
  },
};

const values = [
  { icon: ShieldCheck, title: "Genuine, always", text: "We stock only certified, authorized products and destroy any that fail inspection." },
  { icon: Eye, title: "Radical transparency", text: "Every product page shows certifications, standards, stock levels and honest pricing." },
  { icon: Truck, title: "Speed as a standard", text: "Same-day Nairobi dispatch, 24–72 hours countrywide, with live order tracking." },
  { icon: HeartHandshake, title: "Partners, not customers", text: "Corporate clients get account managers who learn their sites, standards and deadlines." },
  { icon: Target, title: "Zero-harm mission", text: "Our north star: every Kenyan worker goes home safe, every shift." },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      <PageHeader
        bg="/images/hero/hero1.jpg"
        eyebrow="About KimSafety"
        title="Safety equipment Kenya can rely on — since 2019"
        subtitle="KimSafety was founded in Nairobi by HSE professionals who were tired of counterfeit PPE on Kenyan worksites. Today we supply 1,200+ hospitals, factories, contractors, schools and NGOs across all 47 counties — with genuine, certified equipment and procurement support built for African businesses."
      />

      <section className="bg-surface py-16 lg:py-20">
        <div className="mx-auto max-w-shell px-4 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy-900">Our story</h2>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-gray-600">
                <p>
                  In 2019, our founders were auditing construction sites when they found helmets that
                  collapsed under thumb pressure and &quot;3M&quot; respirators with no traceable batch numbers.
                  The audit report — and the supplier — is what KimSafety was built to fix.
                </p>
                <p>
                  We started with a warehouse in Industrial Area and a simple promise:{" "}
                  <strong className="text-navy-900">
                    every product we sell is genuine, certified and quality-inspected
                  </strong>
                  . That promise now covers 15 categories, 40+ brands and thousands of products in stock.
                </p>
                <p>
                  Today, our corporate division manages framework supply for hospitals, county
                  governments and national contractors — delivering not just equipment, but the
                  documentation, pricing and accountability that procurement teams demand.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  ["1,200+", "Organizations served"],
                  ["47", "Counties reached"],
                  ["40+", "Authorized brands"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-line bg-white p-5 text-center shadow-card">
                    <p className="font-display text-2xl font-extrabold text-safety-600">{value}</p>
                    <p className="mt-1 text-[11px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {values.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-extrabold text-navy-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-shell px-4 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-navy-800 to-navy-900 p-10 text-white lg:p-14">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-safety-500">
                  <BadgeCheck className="h-6 w-6" />
                </span>
                <h2 className="mt-4 font-display text-2xl font-extrabold lg:text-3xl">
                  The KimSafety Quality Promise
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/65">
                  Every batch is verified against certificates of conformance. If a product ever fails to
                  meet its stated certification, we replace it — free, no questions asked.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["5-step", "batch inspection process"],
                  ["100%", "certificates on file"],
                  ["7 days", "free easy returns"],
                  ["24/7", "WhatsApp support"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="font-display text-2xl font-extrabold text-safety-400">{value}</p>
                    <p className="mt-1 text-xs text-white/55">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-shell px-4 lg:px-8">
          <h2 className="text-center font-display text-2xl font-extrabold text-navy-900">What we supply</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Medical Safety", "medical-safety"], ["Industrial Safety", "industrial-safety"], ["PPE", "ppe"], ["Fire Safety", "fire-safety"], ["Road Safety", "road-safety"],
              ["Construction Safety", "construction-safety"], ["Electrical Safety", "electrical-safety"], ["Laboratory Equipment", "laboratory-equipment"], ["Cleaning & Hygiene", "cleaning-hygiene"], ["Emergency Response", "emergency-response"],
              ["Marine Safety", "marine-safety"], ["Security Equipment", "security-equipment"], ["Food Safety", "food-safety"], ["Signs & Labels", "signs-labels"], ["Tools", "tools"],
            ].map(([name, slug]) => (
              <Link
                key={slug}
                href={`/category/${slug}`}
                className="rounded-xl border border-line bg-white px-4 py-3 text-center text-sm font-semibold text-navy-900 transition-colors hover:border-safety-300 hover:bg-safety-50"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
