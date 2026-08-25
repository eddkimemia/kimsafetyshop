import { HeroSlider, type HeroSlide } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductCarousel } from "@/components/home/product-carousel";
import { CorporateSolutions } from "@/components/home/corporate";
import { BrandStrip } from "@/components/home/brand-strip";
import { KnowledgeCenter } from "@/components/home/knowledge";
import { Testimonials } from "@/components/home/testimonials";
import { Newsletter } from "@/components/home/newsletter";
import { DealsBanner } from "@/components/home/deals-banner";
import { CampaignStrip } from "@/components/home/campaign-strip";
import { getActiveBanners, getActiveCampaigns } from "@/lib/db";
import { liveCatalog, getProductCount } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const count = await getProductCount();
  return {
    title: {
      // absolute — bypasses the layout's "%s | KimSafety" template (already branded)
      absolute: `KimSafety — Buy ${count}+ Industrial & Medical Safety Equipment Online in Kenya | PPE, Fire Safety, Lab Equipment`,
    },
    description: `Shop ${count} certified safety products in Kenya — PPE, helmets, boots, gloves, fire extinguishers, medical supplies & lab equipment. Bulk discounts, same-day Nairobi delivery, 1,200+ organizations served across 47 counties.`,
    keywords: [
      "buy safety equipment Kenya",
      "PPE Nairobi",
      "industrial safety equipment Kenya",
      "safety helmet Kenya",
      "safety boots Kenya",
      "fire extinguisher Kenya",
    ],
    alternates: { canonical: siteUrl },
    openGraph: {
      title: "KimSafety — Industrial & Medical Safety Equipment Supplier in Kenya",
      description: `${count} certified safety products — PPE, helmets, boots, gloves, fire extinguishers & lab equipment. Bulk discounts, same-day Nairobi delivery.`,
      type: "website",
      url: siteUrl,
      siteName: "KimSafety",
      images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "KimSafety — Industrial & Medical Safety Equipment Supplier in Kenya" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "KimSafety — Industrial & Medical Safety Equipment in Kenya",
      description: `${count} certified safety products — PPE, fire safety, medical & lab equipment with bulk discounts & same-day delivery.`,
      images: [`${siteUrl}/og-image.jpg`],
    },
  };
}

export default async function Home() {
  let bannerSlides: HeroSlide[] = [];
  let campaigns: Awaited<ReturnType<typeof getActiveCampaigns>> = [];
  let catalog: Awaited<ReturnType<typeof liveCatalog>> = [];
  try {
    bannerSlides = (await getActiveBanners()).map((b) => ({
      kicker: b.kicker,
      title: b.title,
      subtitle: b.subtitle,
      cta: b.cta,
      cta_href: b.cta_href,
      cta2: b.cta2,
      card_kicker: b.card_kicker,
      card_title: b.card_title,
      card_subtitle: b.card_subtitle,
      stat1_label: b.stat1_label,
      stat1_value: b.stat1_value,
      stat2_label: b.stat2_label,
      stat2_value: b.stat2_value,
      bg: b.image,
    }));
  } catch (err) {
    console.error("[home] getActiveBanners failed during build:", (err as Error).message);
  }
  try {
    campaigns = await getActiveCampaigns();
  } catch (err) {
    console.error("[home] getActiveCampaigns failed during build:", (err as Error).message);
  }
  // Server-rendered live catalog so carousels show current prices/images on
  // first paint instead of flashing the static seed data.
  try {
    catalog = await liveCatalog();
  } catch (err) {
    console.error("[home] liveCatalog failed during build, using seed fallback:", (err as Error).message);
    const { products } = await import("@/lib/data/products");
    const { productImages } = await import("@/lib/data/product-images");
    catalog = products.map((p) => ({ ...p, image: productImages[p.sku] ?? `/images/products/${p.sku}.jpg` })) as typeof catalog;
  }

  return (
    <>
      <HeroSlider slides={bannerSlides} />
      <TrustBar />
      <CampaignStrip campaigns={campaigns} />
      <ProductCarousel
        kicker="Handpicked for you"
        title="Featured Products"
        filter="featured"
        href="/search?sort=featured"
        showTabs
        items={catalog}
      />
      <CategoryGrid />
      <DealsBanner />
      <ProductCarousel
        kicker="Most ordered"
        title="Best Sellers"
        filter="bestSeller"
        href="/search?sort=popular"
        items={catalog}
      />
      <CorporateSolutions />
      <BrandStrip />
      <ProductCarousel
        kicker="Deals & discounts"
        title="Deals & Discounts"
        filter="deals"
        href="/search?discount=1"
        items={catalog}
      />
      <KnowledgeCenter />
      <Testimonials />
      <Newsletter />
    </>
  );
}
