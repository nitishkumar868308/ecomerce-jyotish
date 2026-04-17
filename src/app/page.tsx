"use client";

import DefaultPage from "@/components/layout/DefaultPage";
import HeroSlider from "@/components/store/home/HeroSlider";
import VideoStories from "@/components/store/home/VideoStories";
import FeaturedProducts from "@/components/store/home/FeaturedProducts";
import Testimonials from "@/components/store/home/Testimonials";
import TheMall from "@/components/store/home/TheMall";
import QuickGoBranding from "@/components/store/home/QuickGoBranding";
import JyotishBranding from "@/components/store/home/JyotishBranding";

export default function HomePage() {
  return (
    <DefaultPage>
      {/* 1. Hero Banner Slider - fully responsive, no gaps */}
      <HeroSlider />

      {/* 2. Our Stories - auto-scrolling video thumbnails */}
      <VideoStories />

      {/* 3. The Mall - Categories & Subcategories browser */}
      <TheMall />

      {/* 4. Featured Products - Category → Subcategory → Product Slider */}
      <FeaturedProducts />

      {/* 5. Hecate QuickGo CTA - with logo and animations */}
      <QuickGoBranding />

      {/* 6. Jyotish CTA - interactive with animations */}
      <JyotishBranding />

      {/* 7. Customer Testimonials - uniform cards */}
      <Testimonials />
    </DefaultPage>
  );
}
