"use client";

import Link from "next/link";
import { ArrowRight, Building2, Factory, HardHat, GraduationCap, Landmark, HeartHandshake, Hotel, FileText } from "lucide-react";

const industries = [
  { icon: Hospital, label: "Hospitals", desc: "Medical consumables, PPE & clinical supplies" },
  { icon: Factory, label: "Factories", desc: "Full industrial PPE & machine guarding" },
  { icon: HardHat, label: "Construction", desc: "Site compliance kits & fall protection" },
  { icon: GraduationCap, label: "Schools", desc: "Lab equipment & safety supplies" },
  { icon: Landmark, label: "Government", desc: "Tender-ready supply & frameworks" },
  { icon: HeartHandshake, label: "NGOs", desc: "Field kits, first aid & emergency gear" },
  { icon: Hotel, label: "Hotels", desc: "Fire safety & hygiene solutions" },
  { icon: Building2, label: "Corporates", desc: "Managed procurement & negotiated rates" },
];

function Hospital(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21h18M5 21V7l7-4 7 4v14M12 9v6M9 12h6" />
    </svg>
  );
}

export function CorporateSolutions() {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-16 lg:py-24" aria-labelledby="corporate-heading">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute -right-40 top-0 h-[28rem] w-[28rem] rounded-full bg-safety-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-shell px-4 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-safety-400">
              KimSafety Corporate
            </span>
            <h2
              id="corporate-heading"
              className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-white lg:text-[2.6rem]"
            >
              One supplier for your entire organization
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/65">
              Dedicated account managers, negotiated pricing, tax invoices, purchase order support and
              approval workflows — built for procurement teams across Kenya.
            </p>
            <ul className="mt-7 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                "Tiered bulk pricing — up to 30% off",
                "Tender & quotation documentation",
                "Monthly credit terms for approved firms",
                "Dedicated account manager",
                "Stock reservation for projects",
                "Compliance & certification files",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <CorporateCTA />
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2">
            {industries.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-safety-500/50 hover:bg-white/10"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-safety-500/20 text-safety-400">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-sm font-extrabold text-white">{label}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CorporateCTA() {
  return (
    <div className="mt-9 flex flex-wrap items-center gap-3">
      <Link
        href="/quote"
        className="inline-flex items-center gap-2 rounded-xl bg-safety-500 px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(245,124,0,0.4)] transition-colors hover:bg-safety-600"
      >
        <FileText className="h-4 w-4" /> Request Corporate Quotation
      </Link>
      <Link
        href="/corporate"
        className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
      >
        Explore the Portal <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
