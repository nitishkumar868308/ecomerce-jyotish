"use client";

import React from "react";
import { HeroSection } from "@/components/jyotish/home/HeroSection";
import { FeaturedAstrologers } from "@/components/jyotish/home/FeaturedAstrologers";
import { ServiceCategories } from "@/components/jyotish/home/ServiceCategories";
import { FreeMinutesBanner } from "@/components/jyotish/home/FreeMinutesBanner";
import { useAstrologers } from "@/services/jyotish/profile";

export default function JyotishHomePage() {
  const { data: astrologers } = useAstrologers();
  const freeAstrologerCount = (astrologers ?? []).filter(
    (a: any) => a.freeOfferActive,
  ).length;

  return (
    <>
      <HeroSection />
      <FreeMinutesBanner freeAstrologerCount={freeAstrologerCount} />
      <FeaturedAstrologers />
      <ServiceCategories />
    </>
  );
}
