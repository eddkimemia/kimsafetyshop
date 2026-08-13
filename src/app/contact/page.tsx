import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ContactForm } from "@/components/contact/contact-form";
import { getAllSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Contact KimSafety",
  description:
    "Reach KimSafety — Nairobi warehouse in Industrial Area. Sales, quotes, support and technical advice via phone, email or WhatsApp.",
};

export default async function ContactPage() {
  const s = await getAllSettings();
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
            [MapPin, "Visit our showroom & warehouse", s.address, s.hours],
            [Phone, "Call us", s.phone, `tel:${s.phone.replace(/[^\d+]/g, "")}`],
            [Mail, "Email us", s.email, `mailto:${s.email}`],
            [WhatsAppIcon, "WhatsApp", s.phone, `https://wa.me/${s.whatsapp}`],
            [Clock, "Order deadline", "3:00 PM Nairobi", "for same-day delivery"],
          ] as const).map(([Icon, title, a, b]) => (
            <div key={title as string} className="flex gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-safety-50 text-safety-600">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-navy-900">{title}</h2>
                {b.startsWith("tel:") || b.startsWith("mailto:") || b.startsWith("https://") ? (
                  <a
                    href={b}
                    target={b.startsWith("https://") ? "_blank" : undefined}
                    rel={b.startsWith("https://") ? "noopener noreferrer" : undefined}
                    className="mt-0.5 block text-sm font-semibold text-safety-600 hover:underline"
                  >
                    {a}
                  </a>
                ) : (
                  <p className="mt-0.5 text-sm font-semibold text-safety-600">{a}</p>
                )}
                {!b.startsWith("tel:") && !b.startsWith("mailto:") && !b.startsWith("https://") && (
                  <p className="text-xs text-gray-400">{b}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-line bg-white p-7 shadow-card lg:col-span-2">
          <h2 className="font-display text-xl font-extrabold text-navy-900">Send us a message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
