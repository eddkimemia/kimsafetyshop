import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { liveCatalog } from "@/lib/catalog";

// ISR with on-demand busting from admin product saves.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Deals & Discounts",
  description:
    "Limited-time deals on safety equipment in Kenya. Up to 35% off helmets, gloves, boots, respirators, fire extinguishers and first aid kits.",
};

export default async function DealsPage() {
  const catalog = await liveCatalog();
  return (
    <Suspense fallback={null}>
      <CatalogView
        title="Deals & Discounts"
        subtitle="Limited-time offers on certified safety equipment — while stock lasts."
        deals
        initialProducts={catalog}
      />
    </Suspense>
  );
}
