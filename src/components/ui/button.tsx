import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "success" | "dark" | "white";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary:
    "bg-safety-500 text-white hover:bg-safety-600 shadow-[0_4px_14px_rgba(245,124,0,0.35)]",
  secondary:
    "bg-navy-900 text-white hover:bg-navy-800 shadow-[0_4px_14px_rgba(15,40,71,0.35)]",
  outline:
    "border border-line bg-white text-navy-900 hover:border-navy-300 hover:bg-navy-50",
  ghost: "text-navy-900 hover:bg-navy-50",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  dark: "bg-ink text-white hover:bg-navy-800",
  white: "bg-white text-navy-900 hover:bg-safety-50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
  xl: "h-14 px-8 text-base gap-2.5",
};

const base =
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-safety-500 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "safety" | "navy";
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-navy-50 text-navy-700",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-red-50 text-red-600 border-red-100",
    safety: "bg-safety-50 text-safety-700 border-safety-100",
    navy: "bg-navy-900 text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none border",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
