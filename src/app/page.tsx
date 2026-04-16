"use client";

import DefaultPage from "@/components/layout/DefaultPage";
import HeroSlider from "@/components/store/home/HeroSlider";
import FeaturedProducts from "@/components/store/home/FeaturedProducts";
import CategoryShowcase from "@/components/store/home/CategoryShowcase";
import BlogCarousel from "@/components/store/home/BlogCarousel";
import PromoSection from "@/components/store/home/PromoSection";

export default function HomePage() {
  return (
    <DefaultPage>
      <HeroSlider />
      <CategoryShowcase />
      <FeaturedProducts />
      <PromoSection />
      <BlogCarousel />
    </DefaultPage>
  );
}
