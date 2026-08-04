import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function PageHeader({
  bg,
  eyebrow,
  title,
  subtitle,
  breadcrumb,
  children,
  className,
}: {
  bg: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumb?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-navy-900", className)}>
      <Image
        src={bg}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/80 to-navy-900/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-transparent to-navy-900/30" />
      <div className="relative mx-auto max-w-shell px-4 py-14 lg:px-8 lg:py-16">
        {breadcrumb && (
          <nav className="mb-4 text-xs text-white/60" aria-label="Breadcrumb">
            {breadcrumb}
          </nav>
        )}
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full border border-safety-500/40 bg-safety-500/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-safety-300">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-white lg:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">{subtitle}</p>
        )}
        {children}
      </div>
    </section>
  );
}
