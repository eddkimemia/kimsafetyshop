"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export function BlogNewsletter() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-navy-900">
        <Send className="h-4.5 w-4.5 text-safety-500" /> Stay updated
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        Safety news, product updates and compliance tips — straight to your inbox.
      </p>
      {subscribed ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700">
          You&apos;re on the list — welcome aboard!
        </p>
      ) : (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSubscribed(true);
          }}
        >
          <input
            type="email"
            required
            placeholder="Your email"
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10"
          />
          <button
            type="submit"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 text-xs font-bold text-white transition-colors hover:bg-safety-500"
          >
            Join
          </button>
        </form>
      )}
      <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-gray-400">
        <WhatsAppIcon className="h-3 w-3" /> No spam — unsubscribe anytime.
      </p>
    </div>
  );
}
