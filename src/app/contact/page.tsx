import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export const metadata: Metadata = {
  title: "Contact KimSafety",
  description:
    "Reach KimSafety — Nairobi warehouse in Industrial Area. Sales, quotes, support and technical advice via phone, email or WhatsApp.",
};

export default function ContactPage() {
  const field =
    "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";
  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero2.jpg"
        title="Contact us"
        subtitle="Sales, quotations, order support or technical advice — a real human replies within the hour."
      />

      <div className="mx-auto grid max-w-shell grid-cols-1 gap-8 px-4 pt-8 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4">
          {([
            [MapPin, "Visit our showroom & warehouse", "KimSafety House, Enterprise Road, Industrial Area, Nairobi", "Mon–Sat 8:00 AM – 6:00 PM"],
            [Phone, "Call us", "+254 712 345 678", "Toll-free order line"],
            [Mail, "Email us", "sales@kimsafety.co.ke", "support@kimsafety.co.ke"],
            [WhatsAppIcon, "WhatsApp", "+254 712 345 678", "Fastest response — 24/7"],
            [Clock, "Order deadline", "3:00 PM Nairobi", "for same-day delivery"],
          ] as const).map(([Icon, title, a, b]) => (
            <div key={title as string} className="flex gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-safety-50 text-safety-600">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-navy-900">{title}</h2>
                <p className="mt-0.5 text-sm font-semibold text-safety-600">{a}</p>
                <p className="text-xs text-gray-400">{b}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-line bg-white p-7 shadow-card lg:col-span-2">
          <h2 className="font-display text-xl font-extrabold text-navy-900">Send us a message</h2>
          <form className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input required placeholder="Full name *" className={field} />
            <input required type="email" placeholder="Email address *" className={field} />
            <input type="tel" placeholder="Phone number" className={field} />
            <select required className={field} defaultValue="">
              <option value="" disabled>Topic *</option>
              {["Sales & quotations", "Order status", "Bulk / corporate", "Technical advice", "Returns", "Other"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <textarea
              required
              rows={5}
              placeholder="How can we help? *"
              className={`${field} sm:col-span-2`}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-safety-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(245,124,0,0.35)] transition-colors hover:bg-safety-600 sm:col-span-2"
            >
              <Send className="h-4 w-4" /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
