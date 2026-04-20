"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useBanners } from "@/services/banners";
import { useCountryStore } from "@/stores/useCountryStore";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { filterBannersForStorefront } from "@/lib/storefrontFilters";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export function HeroSlider() {
  const { data: banners, isLoading } = useBanners();
  const { code: countryCode } = useCountryStore();

  const activeBanners = useMemo(
    () =>
      filterBannersForStorefront(banners, {
        // Default falls back to the store's "IND" when nothing is picked yet.
        country: countryCode || "IND",
      }),
    [banners, countryCode],
  );

  if (isLoading) {
    return (
      <section className="relative w-full bg-[var(--bg-secondary)]">
        <div className="w-full" style={{ paddingBottom: "31.25%" }} />
      </section>
    );
  }

  if (!activeBanners?.length) return null;

  return (
    <section className="relative w-full overflow-hidden bg-[var(--bg-secondary)]">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          bulletClass:
            "inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white/50 mx-0.5 sm:mx-1 cursor-pointer transition-all duration-300",
          bulletActiveClass: "!bg-white !w-5 sm:!w-7 !rounded-full",
        }}
        navigation={{
          prevEl: ".hero-prev",
          nextEl: ".hero-next",
        }}
        loop={activeBanners.length > 1}
        speed={700}
        className="w-full"
      >
        {activeBanners.map((banner, index) => (
          <SwiperSlide key={banner.id}>
            {banner.link ? (
              <Link href={banner.link} className="block relative w-full">
                <SlideContent banner={banner} index={index} />
              </Link>
            ) : (
              <div className="relative w-full">
                <SlideContent banner={banner} index={index} />
              </div>
            )}
          </SwiperSlide>
        ))}

        {/* Navigation arrows */}
        {activeBanners.length > 1 && (
          <>
            <button
              className={cn(
                "hero-prev absolute left-1 sm:left-2 lg:left-4 top-1/2 z-10 -translate-y-1/2",
                "flex h-7 w-7 sm:h-9 sm:w-9 lg:h-11 lg:w-11 items-center justify-center rounded-full",
                "bg-black/20 text-white backdrop-blur-sm",
                "transition-all duration-300 hover:bg-black/40 hover:scale-110"
              )}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            </button>
            <button
              className={cn(
                "hero-next absolute right-1 sm:right-2 lg:right-4 top-1/2 z-10 -translate-y-1/2",
                "flex h-7 w-7 sm:h-9 sm:w-9 lg:h-11 lg:w-11 items-center justify-center rounded-full",
                "bg-black/20 text-white backdrop-blur-sm",
                "transition-all duration-300 hover:bg-black/40 hover:scale-110"
              )}
              aria-label="Next slide"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            </button>
          </>
        )}
      </Swiper>
    </section>
  );
}

function SlideContent({
  banner,
  index,
}: {
  banner: { id: number; text?: string; image?: string; link?: string };
  index: number;
}) {
  return (
    <div className="relative w-full">
      {/* Image fills full width */}
      <div className="relative w-full">
        <Image
          src={banner.image ? resolveAssetUrl(banner.image) : "/image/placeholder.jpg"}
          alt={banner.text || `Banner ${index + 1}`}
          width={1920}
          height={600}
          className="w-full h-auto object-contain"
          priority={index === 0}
          sizes="100vw"
        />
      </div>

      {/* Title overlay */}
      {banner.text && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full px-3 pb-6 sm:px-8 sm:pb-10 lg:px-14 lg:pb-16"
          >
            <h2 className="max-w-2xl text-sm font-bold text-white drop-shadow-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl leading-tight">
              {banner.text}
            </h2>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default HeroSlider;
