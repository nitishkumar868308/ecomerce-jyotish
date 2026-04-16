"use client";

import DefaultPage from "@/components/layout/DefaultPage";
import { PageHeader } from "@/components/shared/PageHeader";

const SECTIONS = [
  {
    title: "Our Story",
    text: "Founded with a passion for quality and authenticity, we set out to bring the finest products to your doorstep. From humble beginnings, our journey has been driven by a deep respect for tradition and a commitment to excellence. Every piece in our collection is thoughtfully curated, ensuring it meets the highest standards of craftsmanship.",
    image: "/images/about/story.jpg",
  },
  {
    title: "Our Mission",
    text: "We believe that everyone deserves access to genuine, high-quality products at fair prices. Our mission is to bridge the gap between artisans and customers, preserving traditional craftsmanship while embracing modern convenience. We work directly with skilled artisans and trusted suppliers to eliminate middlemen and deliver exceptional value.",
    image: "/images/about/mission.jpg",
  },
  {
    title: "Quality Promise",
    text: "Every product undergoes rigorous quality checks before reaching you. We stand behind our offerings with a commitment to transparency, authenticity, and customer satisfaction. Our dedicated quality team inspects each item, ensuring it meets our exacting standards before it ships.",
    image: "/images/about/quality.jpg",
  },
  {
    title: "Community & Impact",
    text: "Beyond commerce, we are committed to making a positive impact. Through our donation initiatives and partnerships with local artisans, we support sustainable livelihoods and cultural preservation. We believe business should be a force for good, uplifting communities and preserving heritage for future generations.",
    image: "/images/about/community.jpg",
  },
];

export default function AboutPage() {
  return (
    <DefaultPage>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="About Us"
          description="Discover who we are and what drives us"
        />

        <div className="mt-12 space-y-20">
          {SECTIONS.map((section, idx) => {
            const isReversed = idx % 2 === 1;
            return (
              <div
                key={section.title}
                className={`flex flex-col items-center gap-8 lg:gap-16 ${
                  isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
                }`}
              >
                {/* Image */}
                <div className="w-full lg:w-1/2">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--bg-secondary)]">
                    <img
                      src={section.image}
                      alt={section.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Text */}
                <div className="w-full lg:w-1/2">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                    {section.title}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                    {section.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DefaultPage>
  );
}
