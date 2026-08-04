import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";

export const metadata: Metadata = {
  title: "Deals & Discounts",
  description:
    "Limited-time deals on safety equipment in Kenya. Up to 35% off helmets, gloves, boots, respirators, fire extinguishers and first aid kits.",
};

export default function DealsPage() {
  return (
    <Suspense fallback={null}>
      <CatalogView
        title="Deals & Discounts"
        subtitle="Limited-time offers on certified safety equipment — while stock lasts."
        deals
      />
    </Suspense>
  );
}
