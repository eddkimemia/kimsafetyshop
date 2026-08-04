import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center", className)} aria-label="KimSafety home">
      <Image
        src="/images/logo/logoy.jpg"
        alt="KimSafety — Safety Equipment Kenya"
        width={1708}
        height={571}
        className={cn("h-10 w-auto object-contain lg:h-12", light && "rounded-lg bg-white px-2 py-1 shadow-sm")}
        priority
      />
    </Link>
  );
}
