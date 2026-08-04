"use client";

import { useState } from "react";
import { Mail, Check, Send } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
  };

  return (
    <section className="bg-gradient-to-br from-safety-500 to-safety-600 py-16 lg:py-20" aria-labelledby="newsletter-heading">
      <div className="mx-auto max-w-shell px-4 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
              <Mail className="h-3.5 w-3.5" /> Safety updates, monthly
            </span>
            <h2 id="newsletter-heading" className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-white lg:text-4xl">
              Safety intelligence for your inbox
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
              New arrivals, standards changes, recall alerts and exclusive bulk deals — one email a
              month, no spam.
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-6 backdrop-blur-sm sm:p-8">
            {done ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center text-white">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-7 w-7" />
                </span>
                <p className="font-display text-lg font-extrabold">You&apos;re subscribed!</p>
                <p className="max-w-xs text-sm text-white/75">
                  Welcome to the KimSafety community. Your first briefing arrives at the end of this month.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  className="h-13 flex-1 rounded-xl border border-white/20 bg-white px-4 py-3.5 text-sm text-navy-900 outline-none placeholder:text-gray-400 focus:ring-4 focus:ring-white/30"
                />
                <button
                  type="submit"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-navy-900 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-navy-800"
                >
                  <Send className="h-4 w-4" /> Subscribe
                </button>
              </form>
            )}
            <p className="mt-3 text-center text-[11px] text-white/60 sm:text-left">
              Join 8,500+ safety officers, procurement leads and facility managers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
