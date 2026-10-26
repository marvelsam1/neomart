import { CategorySection } from "@/components/storefront/category-section";
import { HeroSection } from "@/components/storefront/hero-section";
import { ProductSection } from "@/components/storefront/product-section";
import { StorySection } from "@/components/storefront/story-section";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { StoreBenefits } from "@/components/storefront/store-benefits";

export default function Home() {
  return (
    <>
      <div className="announcement-bar">
        <span>Free delivery on orders over ₦50,000</span>
        <span className="announcement-divider">|</span>
        <span>Thoughtfully made. Always with care.</span>
        <a href="#featured">Shop the collection <span aria-hidden="true">→</span></a>
      </div>
      <SiteHeader />
      <main>
        <HeroSection />
        <CategorySection />
        <ProductSection />
        <StorySection />
        <StoreBenefits />
      </main>
      <SiteFooter />
    </>
  );
}
