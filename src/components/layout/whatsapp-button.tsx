import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useSettings } from "@/lib/settings";

export function WhatsAppButton() {
  const { whatsapp, site_name } = useSettings();
  return (
    <a
      href={`https://wa.me/${whatsapp}?text=Hello%20${encodeURIComponent(site_name)}%2C%20I%20need%20help%20with%20a%20safety%20equipment%20order.`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-transform hover:scale-110 lg:bottom-8"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
      </span>
    </a>
  );
}
