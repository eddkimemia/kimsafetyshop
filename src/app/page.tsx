import { HeroSlider } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductCarousel } from "@/components/home/product-carousel";
import { CorporateSolutions } from "@/components/home/corporate";
import { BrandStrip } from "@/components/home/brand-strip";
import { KnowledgeCenter } from "@/components/home/knowledge";
import { Testimonials } from "@/components/home/testimonials";
import { Newsletter } from "@/components/home/newsletter";
import { DealsBanner } from "@/components/home/deals-banner";

export default function Home() {
  return (
    <>
      <HeroSlider />
      <TrustBar />
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
