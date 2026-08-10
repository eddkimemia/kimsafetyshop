import { ShieldCheck, Truck, Lock, Building2 } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Genuine Products",
    text: "100% authentic, certified stock from authorized distributors — never counterfeits.",
    accent: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Truck,
    title: "Fast Nationwide Delivery",
    text: "Same-day in Nairobi, 24–72 hours to all 47 counties via our logistics partners.",
    accent: "text-safety-600 bg-safety-50",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    text: "M-Pesa, cards and purchase orders — protected transactions.",
    accent: "text-navy-700 bg-navy-50",
  },
  {
    icon: Building2,
    title: "Corporate Procurement Support",
    text: "Quotations, negotiated pricing, tax invoices and tender documentation.",
    accent: "text-safety-600 bg-safety-50",
  },
];

export function TrustBar() {
  return (
    <section className="border-b border-line bg-white" aria-label="Why shop with KimSafety">
      <div className="mx-auto grid max-w-shell grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, title, text, accent }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-safety-200 hover:bg-white hover:shadow-card"
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-display text-sm font-extrabold text-navy-900">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
