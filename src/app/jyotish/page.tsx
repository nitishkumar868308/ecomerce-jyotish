"use client";

import React from "react";
import { HeroSection } from "@/components/jyotish/home/HeroSection";
import { FeaturedAstrologers } from "@/components/jyotish/home/FeaturedAstrologers";
import { ServiceCategories } from "@/components/jyotish/home/ServiceCategories";

export default function JyotishHomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedAstrologers />
      <ServiceCategories />
    </>
  );
}
