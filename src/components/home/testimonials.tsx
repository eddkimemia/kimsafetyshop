import { Quote, Star } from "lucide-react";
import { testimonials } from "@/lib/data/content";

export function Testimonials() {
  return (
    <section className="bg-surface py-16 lg:py-20" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-shell px-4 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-safety-600">Client stories</span>
          <h2 id="testimonials-heading" className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-900 lg:text-4xl">
            Trusted by teams across Kenya
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            From county hospitals to national construction firms — 1,200+ organizations rely on KimSafety.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-50 text-safety-500">
                  <Quote className="h-4.5 w-4.5" />
                </span>
                <div className="flex gap-0.5" aria-label="5 star rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <blockquote className="flex-1 text-[13px] leading-relaxed text-gray-600">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-900 text-xs font-bold text-white">
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-bold text-navy-900">{t.name}</span>
                  <span className="block text-[11px] text-gray-400">
                    {t.role} · {t.company}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
