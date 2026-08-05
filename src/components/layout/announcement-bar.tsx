import { Mail, Phone, Truck, BadgePercent, Zap } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useSettings } from "@/lib/settings";

export function AnnouncementBar() {
  const { phone, email, whatsapp } = useSettings();
  return (
    <div className="bg-navy-900 text-white">
      <div className="mx-auto flex h-9 max-w-shell items-center justify-between gap-4 px-4 text-[11px] font-medium lg:px-8">
        <div className="flex items-center gap-5 overflow-hidden">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Truck className="h-3.5 w-3.5 text-safety-400" />
            Free delivery within Nairobi over KES 10,000
          </span>
          <span className="hidden items-center gap-1.5 whitespace-nowrap md:flex">
            <Zap className="h-3.5 w-3.5 text-safety-400" />
            Same-day delivery in Nairobi
          </span>
          <span className="hidden items-center gap-1.5 whitespace-nowrap lg:flex">
            <BadgePercent className="h-3.5 w-3.5 text-safety-400" />
            Bulk order discounts up to 30%
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hidden items-center gap-1.5 transition-colors hover:text-safety-400 sm:flex">
            <Phone className="h-3.5 w-3.5" /> {phone}
          </a>
          <a href={`mailto:${email}`} className="hidden items-center gap-1.5 transition-colors hover:text-safety-400 lg:flex">
            <Mail className="h-3.5 w-3.5" /> {email}
          </a>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-2.5 py-0.5 transition-colors hover:bg-[#25D366]/30"
          >
            <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
