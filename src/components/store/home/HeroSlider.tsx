"use client";

import { cn } from "@/lib/utils";
import { useBanners } from "@/services/banners";
import { Skeleton } from "@/components/ui/loader/Skeleton";
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

  const activeBanners = banners
    ?.filter((b) => b.isActive)
    .sort((a, b) => a.order - b.order);

  if (isLoading) {
    return (
      <section className="relative w-full">
        <Skeleton
          className="h-[300px] w-full sm:h-[400px] lg:h-[500px] rounded-none"
        />
      </section>
    );
  }

  if (!activeBanners?.length) return null;

  return (
    <section className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          bulletClass:
            "inline-block w-2.5 h-2.5 rounded-full bg-white/50 mx-1 cursor-pointer transition-all duration-300",
          bulletActiveClass: "!bg-white !w-7 !rounded-full",
        }}
        navigation={{
          prevEl: ".hero-prev",
          nextEl: ".hero-next",
        }}
        loop={activeBanners.length > 1}
        speed={700}
        className="h-[300px] sm:h-[400px] lg:h-[500px]"
      >
        {activeBanners.map((banner, index) => (
          <SwiperSlide key={banner.id}>
            {banner.link ? (
              <Link href={banner.link} className="block relative w-full h-full">
                <SlideContent banner={banner} index={index} />
              </Link>
            ) : (
              <div className="relative w-full h-full">
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
                "hero-prev absolute left-3 top-1/2 z-10 -translate-y-1/2",
                "flex h-10 w-10 items-center justify-center rounded-full",
                "bg-black/20 text-white backdrop-blur-sm",
                "transition-all duration-300 hover:bg-black/40 hover:scale-110",
                "sm:left-4 sm:h-12 sm:w-12"
              )}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              className={cn(
                "hero-next absolute right-3 top-1/2 z-10 -translate-y-1/2",
                "flex h-10 w-10 items-center justify-center rounded-full",
                "bg-black/20 text-white backdrop-blur-sm",
                "transition-all duration-300 hover:bg-black/40 hover:scale-110",
                "sm:right-4 sm:h-12 sm:w-12"
              )}
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
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
  banner: { id: number; title?: string; image: string; mobileImage?: string };
  index: number;
}) {
  return (
    <>
      {/* Desktop image */}
      <Image
        src={banner.image}
        alt={banner.title || `Banner ${index + 1}`}
        fill
        className={cn(
          "object-cover",
          banner.mobileImage ? "hidden sm:block" : ""
        )}
        priority={index === 0}
        sizes="100vw"
      />

      {/* Mobile image (if available) */}
      {banner.mobileImage && (
        <Image
          src={banner.mobileImage}
          alt={banner.title || `Banner ${index + 1}`}
          fill
          className="object-cover sm:hidden"
          priority={index === 0}
          sizes="100vw"
        />
      )}

      {/* Title overlay */}
      {banner.title && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full px-6 pb-12 sm:px-10 sm:pb-16 lg:px-16 lg:pb-20"
          >
            <h2 className="max-w-2xl text-2xl font-bold text-white drop-shadow-lg sm:text-3xl lg:text-5xl">
              {banner.title}
            </h2>
          </motion.div>
        </div>
      )}
    </>
  );
}

export default HeroSlider;
