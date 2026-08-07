import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporate Accounts — KimSafety",
  description:
    "Corporate procurement, bulk pricing and tenders for safety equipment in Kenya. KimSafety supports organizations across construction, manufacturing, healthcare and hospitality.",
  robots: { index: true, follow: true },
};

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
