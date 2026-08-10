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

export const revalidate = 60;

export default async function Home() {
  const bannerSlides: HeroSlide[] = (await getActiveBanners()).map((b) => ({
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
  const campaigns = await getActiveCampaigns();

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
      />
      <CategoryGrid />
      <DealsBanner />
      <ProductCarousel
        kicker="Most ordered"
        title="Best Sellers"
        filter="bestSeller"
        href="/search?sort=popular"
      />
      <CorporateSolutions />
      <BrandStrip />
      <ProductCarousel
        kicker="Deals & discounts"
        title="Deals & Discounts"
        filter="deals"
        href="/search?discount=1"
      />
      <KnowledgeCenter />
      <Testimonials />
      <Newsletter />
    </>
  );
}
